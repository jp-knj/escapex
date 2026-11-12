//! UTF-16 scanning: each vector is loaded once and every matching lane is used.
use std::sync::OnceLock;

use crate::escape::{Mode, entity};

#[derive(Clone, Copy)]
struct PackedEntity {
    units: [u16; 8],
    length: usize,
}

// Derive the padded stores from the shared table, including every attribute
// entity. The scanner selects which characters each mode permits.
const fn packed_entities() -> [PackedEntity; 63] {
    let mut table = [PackedEntity {
        units: [0; 8],
        length: 0,
    }; 63];
    let mut code = 0;
    while code < table.len() {
        if let Some(value) = entity(code as u16, Mode::Attribute) {
            table[code].length = value.len();
            let mut index = 0;
            while index < value.len() {
                table[code].units[index] = value[index];
                index += 1;
            }
        }
        code += 1;
    }
    table
}
const PACKED_ENTITIES: [PackedEntity; 63] = packed_entities();

type Escape = unsafe fn(&[u16], Mode, Vec<u16>) -> Vec<u16>;

pub fn escape(input: &[u16], mode: Mode, output: Vec<u16>) -> Vec<u16> {
    static IMPLEMENTATION: OnceLock<Escape> = OnceLock::new();
    let implementation = IMPLEMENTATION.get_or_init(select);
    // SAFETY: select checks CPU support before returning a target-feature function.
    unsafe { implementation(input, mode, output) }
}

fn select() -> Escape {
    if cfg!(feature = "native-scalar") {
        return scalar;
    }
    #[cfg(target_arch = "x86_64")]
    {
        if std::arch::is_x86_feature_detected!("avx2") {
            return avx2;
        }
        if std::arch::is_x86_feature_detected!("sse2") {
            return sse2;
        }
    }
    #[cfg(target_arch = "aarch64")]
    if std::arch::is_aarch64_feature_detected!("neon") {
        return neon;
    }
    scalar
}

#[inline(always)]
fn append_match(
    input: &[u16],
    position: usize,
    last: &mut usize,
    output: &mut Vec<u16>,
    replacement: &PackedEntity,
) {
    let plain = &input[*last..position];
    let added = plain.len() + replacement.length;
    // Every unvisited input unit still needs at least one output unit. Reserve
    // that lower bound plus seven spare units for the padded entity store.
    // A single capacity check covers both the clean span and the entity.
    output.reserve(input.len() - *last + 7);
    let written = output.len();
    // SAFETY: position < input.len(), so the reservation covers plain.len() + 8
    // units. The immutable input/table cannot overlap this independently owned
    // Vec. The copies initialize all of the prefix published by set_len below;
    // the padded store also initializes spare capacity that remains unpublished.
    unsafe {
        let destination = output.as_mut_ptr().add(written);
        if !plain.is_empty() {
            core::ptr::copy_nonoverlapping(plain.as_ptr(), destination, plain.len());
        }
        let destination = destination.add(plain.len());
        // The padded eight-unit store stays inside the reserved allocation.
        // Only the entity's actual length is published; subsequent writes
        // replace the spare units before those units become part of the Vec.
        core::ptr::copy_nonoverlapping(replacement.units.as_ptr(), destination, 8);
        output.set_len(written + added);
    }
    *last = position + 1;
}

fn scalar_tail(input: &[u16], start: usize, last: &mut usize, output: &mut Vec<u16>, mode: Mode) {
    for index in start..input.len() {
        if entity(input[index], mode).is_some() {
            append_match(
                input,
                index,
                last,
                output,
                &PACKED_ENTITIES[input[index] as usize],
            );
        }
    }
}

pub fn scalar(input: &[u16], mode: Mode, mut output: Vec<u16>) -> Vec<u16> {
    output.clear();
    output.reserve(input.len());
    let mut last = 0;
    scalar_tail(input, 0, &mut last, &mut output, mode);
    output.extend_from_slice(&input[last..]);
    output
}

/// A mask has one bit per matching lane at offsets lane * STRIDE. Keeping gaps
/// between bits avoids an extra mask-compaction step on SSE2, AVX2 and NEON.
#[inline(always)]
fn scan<const LANES: usize, const STRIDE: u32>(
    input: &[u16],
    mode: Mode,
    mask: impl Fn(*const u16, Mode) -> u64,
    mut output: Vec<u16>,
) -> Vec<u16> {
    output.clear();
    output.reserve(input.len());
    let mut index = 0;
    let mut last = 0;
    while input.len() - index >= LANES {
        // The mask callback may read exactly LANES valid, unaligned code units.
        let mut matches = mask(input[index..].as_ptr(), mode);
        while matches != 0 {
            let position = index + (matches.trailing_zeros() / STRIDE) as usize;
            append_match(
                input,
                position,
                &mut last,
                &mut output,
                &PACKED_ENTITIES[input[position] as usize],
            );
            matches &= matches - 1;
        }
        index += LANES;
    }
    scalar_tail(input, index, &mut last, &mut output, mode);
    output.extend_from_slice(&input[last..]);
    output
}

#[cfg(target_arch = "aarch64")]
#[target_feature(enable = "neon")]
unsafe fn neon_mask(pointer: *const u16, mode: Mode) -> u64 {
    use std::arch::aarch64::*;
    // SAFETY: caller guarantees NEON support and eight readable code units.
    let value = unsafe { vld1q_u16(pointer) };
    let mut matches = vorrq_u16(
        vceqq_u16(value, vdupq_n_u16(38)),
        vorrq_u16(
            vceqq_u16(value, vdupq_n_u16(60)),
            vceqq_u16(value, vdupq_n_u16(62)),
        ),
    );
    if mode != Mode::Text {
        matches = vorrq_u16(
            matches,
            vorrq_u16(
                vceqq_u16(value, vdupq_n_u16(34)),
                vceqq_u16(value, vdupq_n_u16(39)),
            ),
        );
    }
    if mode == Mode::Attribute {
        matches = vorrq_u16(
            matches,
            vorrq_u16(
                vceqq_u16(value, vdupq_n_u16(10)),
                vceqq_u16(value, vdupq_n_u16(13)),
            ),
        );
    }
    vget_lane_u64(vreinterpret_u64_u8(vshrn_n_u16::<8>(matches)), 0) & 0x0101_0101_0101_0101
}

#[cfg(target_arch = "aarch64")]
#[target_feature(enable = "neon")]
unsafe fn neon(input: &[u16], mode: Mode, output: Vec<u16>) -> Vec<u16> {
    // SAFETY: this function requires NEON; scan bounds every eight-unit load.
    scan::<8, 8>(
        input,
        mode,
        |pointer, mode| unsafe { neon_mask(pointer, mode) },
        output,
    )
}

#[cfg(target_arch = "x86_64")]
#[target_feature(enable = "sse2")]
unsafe fn sse2_mask(pointer: *const u16, mode: Mode) -> u64 {
    use std::arch::x86_64::*;
    // SAFETY: caller guarantees SSE2 support and eight readable code units.
    let value = unsafe { _mm_loadu_si128(pointer.cast()) };
    let mut matches = _mm_or_si128(
        _mm_cmpeq_epi16(value, _mm_set1_epi16(38)),
        _mm_or_si128(
            _mm_cmpeq_epi16(value, _mm_set1_epi16(60)),
            _mm_cmpeq_epi16(value, _mm_set1_epi16(62)),
        ),
    );
    if mode != Mode::Text {
        matches = _mm_or_si128(
            matches,
            _mm_or_si128(
                _mm_cmpeq_epi16(value, _mm_set1_epi16(34)),
                _mm_cmpeq_epi16(value, _mm_set1_epi16(39)),
            ),
        );
    }
    if mode == Mode::Attribute {
        matches = _mm_or_si128(
            matches,
            _mm_or_si128(
                _mm_cmpeq_epi16(value, _mm_set1_epi16(10)),
                _mm_cmpeq_epi16(value, _mm_set1_epi16(13)),
            ),
        );
    }
    (_mm_movemask_epi8(matches) as u32 & 0x5555) as u64
}

#[cfg(target_arch = "x86_64")]
#[target_feature(enable = "sse2")]
unsafe fn sse2(input: &[u16], mode: Mode, output: Vec<u16>) -> Vec<u16> {
    // SAFETY: this function requires SSE2; scan bounds every eight-unit load.
    scan::<8, 2>(
        input,
        mode,
        |pointer, mode| unsafe { sse2_mask(pointer, mode) },
        output,
    )
}

#[cfg(target_arch = "x86_64")]
#[target_feature(enable = "avx2")]
unsafe fn avx2_mask(pointer: *const u16, mode: Mode) -> u64 {
    use std::arch::x86_64::*;
    // SAFETY: caller guarantees AVX2 support and sixteen readable code units.
    let value = unsafe { _mm256_loadu_si256(pointer.cast()) };
    let mut matches = _mm256_or_si256(
        _mm256_cmpeq_epi16(value, _mm256_set1_epi16(38)),
        _mm256_or_si256(
            _mm256_cmpeq_epi16(value, _mm256_set1_epi16(60)),
            _mm256_cmpeq_epi16(value, _mm256_set1_epi16(62)),
        ),
    );
    if mode != Mode::Text {
        matches = _mm256_or_si256(
            matches,
            _mm256_or_si256(
                _mm256_cmpeq_epi16(value, _mm256_set1_epi16(34)),
                _mm256_cmpeq_epi16(value, _mm256_set1_epi16(39)),
            ),
        );
    }
    if mode == Mode::Attribute {
        matches = _mm256_or_si256(
            matches,
            _mm256_or_si256(
                _mm256_cmpeq_epi16(value, _mm256_set1_epi16(10)),
                _mm256_cmpeq_epi16(value, _mm256_set1_epi16(13)),
            ),
        );
    }
    (_mm256_movemask_epi8(matches) as u32 & 0x5555_5555) as u64
}

#[cfg(target_arch = "x86_64")]
#[target_feature(enable = "avx2")]
unsafe fn avx2(input: &[u16], mode: Mode, output: Vec<u16>) -> Vec<u16> {
    // SAFETY: this function requires AVX2; scan bounds every sixteen-unit load.
    scan::<16, 2>(
        input,
        mode,
        |pointer, mode| unsafe { avx2_mask(pointer, mode) },
        output,
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use core::mem::MaybeUninit;

    fn implementations() -> Vec<(&'static str, Escape)> {
        let mut variants: Vec<(&str, Escape)> = vec![("scalar", scalar), ("dispatch", escape)];
        #[cfg(target_arch = "aarch64")]
        if std::arch::is_aarch64_feature_detected!("neon") {
            variants.push(("neon", neon));
        }
        #[cfg(target_arch = "x86_64")]
        {
            if std::arch::is_x86_feature_detected!("sse2") {
                variants.push(("sse2", sse2));
            }
            if std::arch::is_x86_feature_detected!("avx2") {
                variants.push(("avx2", avx2));
            }
        }
        eprintln!(
            "Testing native implementations: {:?}",
            variants.iter().map(|v| v.0).collect::<Vec<_>>()
        );
        variants
    }

    fn compare(input: &[u16], mode: Mode, variants: &[(&str, Escape)]) {
        let mut buffer =
            vec![MaybeUninit::uninit(); crate::escape::escaped_length(input, mode).unwrap()];
        let expected = crate::escape::write(input, &mut buffer, mode);
        let mut actual = vec![0xffff; 67];
        for &(name, implementation) in variants {
            // SAFETY: implementations includes only CPU-supported functions.
            actual = unsafe { implementation(input, mode, actual) };
            assert_eq!(actual, expected, "{name}, input length {}", input.len());
        }
    }

    #[test]
    fn every_utf16_value_in_every_lane() {
        let variants = implementations();
        let mut input = [97; 33];
        for mode in [Mode::Html, Mode::Text, Mode::Attribute] {
            for code in 0..=u16::MAX {
                for lane in 0..16 {
                    input[lane] = code;
                    // Also exercise a second block and the scalar tail.
                    input[16 + lane] = code;
                    input[32] = code;
                    compare(&input, mode, &variants);
                    input[lane] = 97;
                    input[16 + lane] = 97;
                }
            }
        }
    }

    #[test]
    fn every_match_mask_and_mode() {
        let variants = implementations();
        for mode in [Mode::Html, Mode::Text, Mode::Attribute] {
            let needles: &[u16] = match mode {
                Mode::Text => &[38, 60, 62],
                Mode::Html => &[38, 60, 62, 34, 39],
                Mode::Attribute => &[38, 60, 62, 34, 39, 10, 13],
            };
            for mask in 0..=u16::MAX {
                let input: Vec<u16> = (0..16)
                    .map(|lane| {
                        if mask & (1 << lane) != 0 {
                            needles[lane % needles.len()]
                        } else {
                            0xd800
                        }
                    })
                    .collect();
                compare(&input, mode, &variants);
            }
        }
    }

    #[test]
    fn unaligned_boundaries_dense_and_large_inputs() {
        let variants = implementations();
        let pattern = [
            0, 0xfeff, 0xd800, 0xdfff, 38, 60, 62, 34, 39, 10, 13, 0x263e, 0x223c,
        ];
        let input: Vec<u16> = pattern.into_iter().cycle().take(256).collect();
        for mode in [Mode::Html, Mode::Text, Mode::Attribute] {
            for start in 0..32 {
                for length in 0..128 {
                    compare(&input[start..start + length], mode, &variants);
                }
            }
            compare(&vec![34; 1024 * 1024 + 17], mode, &variants);
            compare(&vec![0xdfff; 1024 * 1024 + 7], mode, &variants);
            let all: Vec<u16> = (0..=u16::MAX).collect();
            compare(&all, mode, &variants);
        }
    }
}
