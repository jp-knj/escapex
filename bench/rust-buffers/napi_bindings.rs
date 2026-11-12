use napi::bindgen_prelude::{ToNapiValue, Utf16String};
use napi::{Result, check_status, sys};
use napi_derive::napi;

use crate::{escape::Mode, native_buffer::OutputBuffer, native_escape, unescape};

impl ToNapiValue for OutputBuffer {
    unsafe fn to_napi_value(env: sys::napi_env, value: Self) -> Result<sys::napi_value> {
        let units = value.as_slice();
        let mut result = std::ptr::null_mut();
        // SAFETY: units stays owned by value until the synchronous Node-API
        // copy finishes. Drop returns the allocation only after this call,
        // including on an error. The resulting JS string owns its own copy.
        check_status!(unsafe {
            sys::napi_create_string_utf16(env, units.as_ptr(), units.len() as isize, &mut result)
        })?;
        Ok(result)
    }
}

#[napi(ts_return_type = "string")]
pub fn escape_html(value: Utf16String) -> OutputBuffer {
    let mut output = OutputBuffer::take();
    native_escape::escape(&value, Mode::Html, output.as_mut_vec());
    output
}

#[napi(ts_return_type = "string")]
pub fn escape_text(value: Utf16String) -> OutputBuffer {
    let mut output = OutputBuffer::take();
    native_escape::escape(&value, Mode::Text, output.as_mut_vec());
    output
}

#[napi(ts_return_type = "string")]
pub fn escape_attribute(value: Utf16String) -> OutputBuffer {
    let mut output = OutputBuffer::take();
    native_escape::escape(&value, Mode::Attribute, output.as_mut_vec());
    output
}

#[napi]
pub fn unescape_html(value: Utf16String) -> Utf16String {
    let mut output = Vec::<u16>::with_capacity(value.len());
    let written = unescape::write(&value, output.spare_capacity_mut());
    // SAFETY: write initializes exactly this prefix, never exceeding input.len().
    unsafe { output.set_len(written) };
    output.into()
}
