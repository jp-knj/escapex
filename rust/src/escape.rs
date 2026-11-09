use core::mem::MaybeUninit;

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum Mode {
    Html,
    Text,
    Attribute,
}

fn entity(code: u16, mode: Mode) -> Option<&'static [u16]> {
    match code {
        38 => Some(&[38, 97, 109, 112, 59]),
        60 => Some(&[38, 108, 116, 59]),
        62 => Some(&[38, 103, 116, 59]),
        39 if mode != Mode::Text => Some(&[38, 35, 51, 57, 59]),
        34 if mode != Mode::Text => Some(&[38, 113, 117, 111, 116, 59]),
        10 if mode == Mode::Attribute => Some(&[38, 35, 49, 48, 59]),
        13 if mode == Mode::Attribute => Some(&[38, 35, 49, 51, 59]),
        _ => None,
    }
}

/// Returns the first escapable UTF-16 code unit, or input.len().
pub fn first(input: &[u16], mode: Mode) -> usize {
    let mut index = 0;
    #[cfg(all(target_arch = "wasm32", target_feature = "simd128"))]
    {
        use core::arch::wasm32::*;
        while input.len() - index >= 8 {
            // SAFETY: SIMD128 is enabled; the unaligned load reads eight valid units.
            let value = unsafe { v128_load(input.as_ptr().add(index).cast()) };
            let mut matches = v128_or(
                u16x8_eq(value, u16x8_splat(38)),
                v128_or(
                    u16x8_eq(value, u16x8_splat(60)),
                    u16x8_eq(value, u16x8_splat(62)),
                ),
            );
            if mode != Mode::Text {
                matches = v128_or(
                    matches,
                    v128_or(
                        u16x8_eq(value, u16x8_splat(39)),
                        u16x8_eq(value, u16x8_splat(34)),
                    ),
                );
            }
            if mode == Mode::Attribute {
                matches = v128_or(
                    matches,
                    v128_or(
                        u16x8_eq(value, u16x8_splat(10)),
                        u16x8_eq(value, u16x8_splat(13)),
                    ),
                );
            }
            let mask = i16x8_bitmask(matches);
            if mask != 0 {
                return index + mask.trailing_zeros() as usize;
            }
            index += 8;
        }
    }
    while index < input.len() {
        if entity(input[index], mode).is_some() {
            return index;
        }
        index += 1;
    }
    input.len()
}

pub fn escaped_length(input: &[u16], mode: Mode) -> Option<usize> {
    let mut length = input.len();
    let mut index = 0;
    while index < input.len() {
        index += first(&input[index..], mode);
        while index < input.len() {
            let Some(replacement) = entity(input[index], mode) else {
                break;
            };
            length = length.checked_add(replacement.len() - 1)?;
            index += 1;
        }
    }
    Some(length)
}

fn copy(output: &mut [MaybeUninit<u16>], input: &[u16]) {
    let target = &mut output[..input.len()];
    // SAFETY: The slices cannot overlap under their borrow contracts. The checked target
    // slice has room for every input unit, and MaybeUninit has the same layout as u16.
    unsafe {
        core::ptr::copy_nonoverlapping(input.as_ptr(), target.as_mut_ptr().cast(), input.len())
    };
}

/// Writes to a buffer of at least escaped_length(input) code units.
pub fn write<'a>(input: &[u16], output: &'a mut [MaybeUninit<u16>], mode: Mode) -> &'a [u16] {
    let mut written = 0;
    let mut index = 0;
    while index < input.len() {
        let plain = first(&input[index..], mode);
        copy(&mut output[written..], &input[index..index + plain]);
        written += plain;
        index += plain;
        while index < input.len() {
            let Some(replacement) = entity(input[index], mode) else {
                break;
            };
            copy(&mut output[written..], replacement);
            written += replacement.len();
            index += 1;
        }
    }
    // SAFETY: Every element in this prefix was initialized by copy above.
    unsafe { core::slice::from_raw_parts(output.as_ptr().cast(), written) }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_code_unit_at_each_lane_and_tail_offset() {
        let mut input = [97; 25];
        for mode in [Mode::Html, Mode::Text, Mode::Attribute] {
            for code in 0..=u16::MAX {
                for index in 0..input.len() {
                    input[index] = code;
                    let escapable = matches!(code, 38 | 60 | 62)
                        || (mode != Mode::Text && matches!(code, 34 | 39))
                        || (mode == Mode::Attribute && matches!(code, 10 | 13));
                    let expected = if escapable { index } else { input.len() };
                    assert_eq!(first(&input, mode), expected);
                    input[index] = 97;
                }
            }
        }
    }

    #[test]
    fn preserves_nul_and_lone_surrogates() {
        let input = [0, 0xd800, 38, 60, 62, 39, 34, 0xdfff];
        let expected = [
            0, 0xd800, 38, 97, 109, 112, 59, 38, 108, 116, 59, 38, 103, 116, 59, 38, 35, 51, 57,
            59, 38, 113, 117, 111, 116, 59, 0xdfff,
        ];
        let mut output = vec![MaybeUninit::uninit(); escaped_length(&input, Mode::Html).unwrap()];
        assert_eq!(write(&input, &mut output, Mode::Html), &expected);
    }
}
