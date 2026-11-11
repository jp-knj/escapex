fn main() {
    #[cfg(feature = "native")]
    napi_build::setup();
}
