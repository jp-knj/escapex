use std::cell::Cell;

// Keep at most 2 MiB per worker. A large one-off result is released instead.
const MAX_CACHED_UNITS: usize = 1024 * 1024;
thread_local! {
    static OUTPUT: Cell<Vec<u16>> = const { Cell::new(Vec::new()) };
}

pub struct OutputBuffer(Vec<u16>);

impl OutputBuffer {
    pub fn take() -> Self {
        // Move ownership out, so a nested call receives a different buffer.
        Self(OUTPUT.with(Cell::take))
    }

    pub fn as_slice(&self) -> &[u16] {
        &self.0
    }

    pub fn as_mut_vec(&mut self) -> &mut Vec<u16> {
        &mut self.0
    }
}

impl Drop for OutputBuffer {
    fn drop(&mut self) {
        let mut output = std::mem::take(&mut self.0);
        output.clear();
        if output.capacity() <= MAX_CACHED_UNITS {
            // An unavailable TLS slot simply drops the owned allocation.
            let _ = OUTPUT.try_with(|slot| slot.set(output));
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reuse_empty_buffer_after_last_borrow() {
        OUTPUT.with(|slot| slot.set(Vec::new()));
        let mut first = OutputBuffer::take();
        first.as_mut_vec().extend_from_slice(&[38, 0xd800, 0xdfff]);
        let pointer = first.as_slice().as_ptr();
        let capacity = first.as_mut_vec().capacity();
        drop(first);
        let mut next = OutputBuffer::take();
        assert!(next.as_slice().is_empty());
        assert_eq!(next.as_slice().as_ptr(), pointer);
        assert_eq!(next.as_mut_vec().capacity(), capacity);
    }

    #[test]
    fn nested_owners_never_alias_and_can_drop_out_of_order() {
        let mut first = OutputBuffer::take();
        first.as_mut_vec().extend_from_slice(&[1, 2]);
        let mut second = OutputBuffer::take();
        second.as_mut_vec().extend_from_slice(&[3, 4]);
        assert_ne!(first.as_slice().as_ptr(), second.as_slice().as_ptr());
        drop(first);
        assert_eq!(second.as_slice(), &[3, 4]);
        drop(second);
    }

    #[test]
    fn oversized_buffer_is_not_retained() {
        OUTPUT.with(|slot| slot.set(Vec::new()));
        let mut large = OutputBuffer::take();
        large.as_mut_vec().reserve(MAX_CACHED_UNITS + 1);
        drop(large);
        assert_eq!(OutputBuffer::take().as_mut_vec().capacity(), 0);
    }

    #[test]
    fn forgetting_an_owner_does_not_leave_borrowed_memory_in_tls() {
        let mut owner = OutputBuffer::take();
        owner.as_mut_vec().push(38);
        let pointer = owner.as_slice().as_ptr();
        std::mem::forget(owner);
        let mut next = OutputBuffer::take();
        next.as_mut_vec().push(60);
        assert_ne!(next.as_slice().as_ptr(), pointer);
    }
}
