#![cfg_attr(not(any(test, feature = "native")), no_std)]
#![deny(unsafe_op_in_unsafe_fn)]

mod escape;
mod unescape;

#[cfg(any(test, feature = "native"))]
mod native_escape;

#[cfg(all(feature = "native", not(test)))]
mod napi_bindings;

#[cfg(target_arch = "wasm32")]
mod wasm_bindings;
