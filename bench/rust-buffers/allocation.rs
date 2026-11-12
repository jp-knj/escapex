use std::alloc::{GlobalAlloc, Layout, System};
use std::sync::atomic::{AtomicUsize, Ordering::Relaxed};

#[path = "rust/src/escape.rs"]
mod escape;
#[path = "rust/src/native_escape.rs"]
mod native_escape;

#[cfg(reuse)]
#[path = "rust/src/native_buffer.rs"]
mod native_buffer;
struct Counted;
static ALLOCS: AtomicUsize = AtomicUsize::new(0);
static REALLOCS: AtomicUsize = AtomicUsize::new(0);
unsafe impl GlobalAlloc for Counted {
    unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
        ALLOCS.fetch_add(1, Relaxed);
        unsafe { System.alloc(layout) }
    }
    unsafe fn dealloc(&self, ptr: *mut u8, layout: Layout) {
        unsafe { System.dealloc(ptr, layout) }
    }
    unsafe fn realloc(&self, ptr: *mut u8, layout: Layout, size: usize) -> *mut u8 {
        REALLOCS.fetch_add(1, Relaxed);
        unsafe { System.realloc(ptr, layout, size) }
    }
}
#[global_allocator]
static ALLOCATOR: Counted = Counted;

fn main() {
    // Initialize instruction-set selection outside allocation counting.
    #[cfg(not(reuse))]
    drop(native_escape::escape(&[38], escape::Mode::Html));
    #[cfg(reuse)] {
        let mut warm = native_buffer::OutputBuffer::take();
        native_escape::escape(&[38], escape::Mode::Html, warm.as_mut_vec());
        drop(warm);
    }
    for (name, gap) in [("one-at-end", 8192), ("spaced-24", 24), ("dense", 1)] {
        let mut input = vec![97; 8192];
        for position in (gap - 1..input.len()).step_by(gap) {
            input[position] = 38;
        }
        let expected: Vec<u16> = input.iter().flat_map(|&code| {
            if code == 38 { vec![38, 97, 109, 112, 59] } else { vec![code] }
        }).collect();
        #[cfg(reuse)] {
            let mut warm = native_buffer::OutputBuffer::take();
            native_escape::escape(&input, escape::Mode::Html, warm.as_mut_vec());
            drop(warm);
        }
        ALLOCS.store(0, Relaxed);
        REALLOCS.store(0, Relaxed);
        #[cfg(not(reuse))]
        let mut owner = native_escape::escape(std::hint::black_box(&input), escape::Mode::Html);
        #[cfg(reuse)]
        let mut owner = {
            let mut owner = native_buffer::OutputBuffer::take();
            native_escape::escape(std::hint::black_box(&input), escape::Mode::Html, owner.as_mut_vec());
            owner
        };
        #[cfg(not(reuse))]
        let output = &mut owner;
        #[cfg(reuse)]
        let output = owner.as_mut_vec();
        let allocations = ALLOCS.load(Relaxed);
        let reallocations = REALLOCS.load(Relaxed);
        assert_eq!(*output, expected);
        println!("{{\"case\":\"{name}\",\"input_units\":{},\"output_units\":{},\"allocations\":{allocations},\"reallocations\":{reallocations},\"capacity\":{}}}", input.len(), output.len(), output.capacity());
    }
}
