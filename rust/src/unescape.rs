use core::mem::MaybeUninit;

const ENTITIES: &[(&[u8], u16)] = &[
    (b"amp;", 38),
    (b"#38;", 38),
    (b"lt;", 60),
    (b"#60;", 60),
    (b"gt;", 62),
    (b"#62;", 62),
    (b"apos;", 39),
    (b"#39;", 39),
    (b"quot;", 34),
    (b"#34;", 34),
];

/// Decodes one layer of the supported references, preserving all other code units.
pub fn write(input: &[u16], output: &mut [MaybeUninit<u16>]) -> usize {
    let mut read = 0;
    let mut written = 0;
    while read < input.len() {
        let mut value = input[read];
        let mut consumed = 1;
        if value == 38 {
            for &(suffix, decoded) in ENTITIES {
                let rest = &input[read + 1..];
                if rest.len() >= suffix.len()
                    && rest
                        .iter()
                        .zip(suffix)
                        .all(|(&unit, &byte)| unit == u16::from(byte))
                {
                    value = decoded;
                    consumed += suffix.len();
                    break;
                }
            }
        }
        output[written].write(value);
        written += 1;
        read += consumed;
    }
    written
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decodes_once_and_preserves_unknown_references_and_surrogates() {
        let mut input: Vec<u16> =
            "&amp;lt;&#38;&lt;&#60;&gt;&#62;&apos;&#39;&quot;&#34;&AMP;&#x26;&amp"
                .encode_utf16()
                .collect();
        input.extend_from_slice(&[0, 0xd800, 0xdfff]);
        let mut expected: Vec<u16> = "&lt;&<<>>''\"\"&AMP;&#x26;&amp".encode_utf16().collect();
        expected.extend_from_slice(&[0, 0xd800, 0xdfff]);
        let mut output = vec![MaybeUninit::uninit(); input.len()];
        let length = write(&input, &mut output);
        // SAFETY: write initializes the returned prefix.
        let result = unsafe { core::slice::from_raw_parts(output.as_ptr().cast::<u16>(), length) };
        assert_eq!(result, expected);
    }
}
