#![cfg_attr(not(test), no_std)]
#![deny(unsafe_op_in_unsafe_fn)]

mod escape;
mod unescape;

#[cfg(target_arch = "wasm32")]
mod wasm;
