use napi::bindgen_prelude::Utf16String;
use napi_derive::napi;

use crate::{escape::Mode, native_escape, unescape};

#[napi]
pub fn escape_html(value: Utf16String) -> Utf16String {
    native_escape::escape(&value, Mode::Html).into()
}

#[napi]
pub fn escape_text(value: Utf16String) -> Utf16String {
    native_escape::escape(&value, Mode::Text).into()
}

#[napi]
pub fn escape_attribute(value: Utf16String) -> Utf16String {
    native_escape::escape(&value, Mode::Attribute).into()
}

#[napi]
pub fn unescape_html(value: Utf16String) -> Utf16String {
    let mut output = Vec::<u16>::with_capacity(value.len());
    let written = unescape::write(&value, output.spare_capacity_mut());
    // SAFETY: write initializes exactly this prefix, never exceeding input.len().
    unsafe { output.set_len(written) };
    output.into()
}
