use crate::{escape as encoder, unescape as decoder};
use core::{arch::wasm32, mem::MaybeUninit};

const ERROR: u32 = u32::MAX;
const PAGE: usize = 65536;
// Keep every slice and pointer offset below Rust's isize::MAX limit.
const MAX_END: usize = i32::MAX as usize;

unsafe extern "C" {
    static __heap_base: u8;
}

// Each non-shared Wasm instance has one synchronous caller. No host callbacks.
static mut RESERVED: Option<usize> = None;

fn base() -> usize {
    (core::ptr::addr_of!(__heap_base) as usize + 1) & !1
}

fn ensure(end: usize) -> bool {
    if end > MAX_END {
        return false;
    }
    let pages = end.div_ceil(PAGE);
    let current = wasm32::memory_size::<0>();
    pages <= current || wasm32::memory_grow::<0>(pages - current) != usize::MAX
}

/// Reserves UTF-16 input space. The caller must write `length` units before escape().
#[unsafe(no_mangle)]
pub extern "C" fn reserve_input(length: u32) -> u32 {
    // SAFETY: This module has no threads or imports that can reenter it.
    unsafe { RESERVED = None };
    let Some(end) = (length as usize)
        .checked_mul(2)
        .and_then(|n| base().checked_add(n))
    else {
        return ERROR;
    };
    if !ensure(end) {
        return ERROR;
    }
    // SAFETY: See above; memory for the full input is now available.
    unsafe { RESERVED = Some(length as usize) };
    base() as u32
}

/// Returns output length, or ERROR. Output begins immediately after the input.
#[unsafe(no_mangle)]
pub extern "C" fn escape(length: u32) -> u32 {
    transform(length, Some(encoder::Mode::Html))
}

/// Escapes HTML text without changing quotes or line endings.
#[unsafe(no_mangle)]
pub extern "C" fn escape_text(length: u32) -> u32 {
    transform(length, Some(encoder::Mode::Text))
}

/// Escapes quoted attributes, including CR/LF references.
#[unsafe(no_mangle)]
pub extern "C" fn escape_attribute(length: u32) -> u32 {
    transform(length, Some(encoder::Mode::Attribute))
}

/// Decodes one layer of supported references into the memory following the input.
#[unsafe(no_mangle)]
pub extern "C" fn unescape(length: u32) -> u32 {
    transform(length, None)
}

fn transform(length: u32, mode: Option<encoder::Mode>) -> u32 {
    let length = length as usize;
    // SAFETY: Single caller, with no host callbacks; consume the reservation.
    let reserved = unsafe {
        let value = RESERVED;
        RESERVED = None;
        value
    };
    if reserved != Some(length) {
        return ERROR;
    }
    // SAFETY: reserve_input checked this range. Wasm memory starts zeroed, and
    // all possible u16 bit patterns are valid. The caller wrote the input units.
    let input = unsafe { core::slice::from_raw_parts(base() as *const u16, length) };
    let Some(output_length) = (match mode {
        Some(mode) => encoder::escaped_length(input, mode),
        None => Some(length),
    }) else {
        return ERROR;
    };
    let output_start = base() + length * 2;
    let Some(end) = output_length
        .checked_mul(2)
        .and_then(|n| output_start.checked_add(n))
    else {
        return ERROR;
    };
    if !ensure(end) {
        return ERROR;
    }
    // SAFETY: Output is disjoint from input, wholly within grown linear memory,
    // and below isize::MAX. memory.grow preserves Wasm addresses and input data.
    let output = unsafe {
        core::slice::from_raw_parts_mut(output_start as *mut MaybeUninit<u16>, output_length)
    };
    match mode {
        Some(mode) => encoder::write(input, output, mode).len() as u32,
        None => decoder::write(input, output) as u32,
    }
}

#[panic_handler]
fn panic(_: &core::panic::PanicInfo<'_>) -> ! {
    wasm32::unreachable()
}
