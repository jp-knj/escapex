# Native selection evaluation

Decision: **before**.

All 64 cases use five fresh Node 24 processes per candidate and baseline. Any candidate with an initial regression above 5% receives five more processes with a matching baseline. The table uses each candidate's final five- or ten-process medians. Negative changes mean less time.

| Platform | Tail: terminal case | Tail: cases >+5% | Sampling: four-case geometric mean | Sampling: cases >+5% | Combined: four-case geometric mean | Combined: cases >+5% |
|---|---:|---:|---:|---:|---:|---:|
| [darwin-arm64](darwin-arm64.json) | -58.09% | 11 | -38.21% | 25 | -35.52% | 18 |
| [darwin-x64](darwin-x64.json) | -53.15% | 8 | -59.96% | 5 | -58.67% | 6 |
| [linux-arm64-gnu](linux-arm64-gnu.json) | -57.86% | 0 | -50.78% | 0 | -49.89% | 0 |
| [linux-arm64-musl](linux-arm64-musl.json) | -54.19% | 0 | -10.63% | 4 | -11.02% | 4 |
| [linux-x64-gnu](linux-x64-gnu.json) | -51.69% | 0 | -60.59% | 0 | -60.28% | 1 |
| [linux-x64-musl](linux-x64-musl.json) | -50.99% | 0 | -6.85% | 8 | -8.38% | 8 |
| [local-darwin-arm64](local.json) | -61.33% | 0 | -42.98% | 2 | -42.61% | 3 |
| [win32-arm64-msvc](win32-arm64-msvc.json) | -46.84% | 0 | -55.42% | 1 | -56.09% | 1 |
| [win32-x64-msvc](win32-x64-msvc.json) | -35.60% | 0 | -48.52% | 0 | -48.18% | 0 |

## Regressions after the required repeat

All values and process samples, including the initial five and additional five, are retained in the linked JSON files. The cases below exceed +5% in the final median comparison.

### darwin-arm64

- tail (10 processes): quoted-json +6.19%; dense-32 +8.28%; dense-255 +8.81%; sparse-8192 +5.50%; mixed-short +5.63%; spread-4095-16 +9.39%; spread-4095-33 +6.19%; spread-4096-16 +8.58%; spread-4096-48 +11.62%; cluster-middle-7 +15.18%; spread-emoji +7.81%.
- expanded (10 processes): quoted-json +13.73%; japanese-emoji +5.62%; first-24 +5.57%; last-31 +7.37%; first-255 +15.83%; first-256 +18.31%; spaced-8 +11.40%; sparse-8192 +15.47%; mixed-short +6.30%; spread-4095-24 +5.57%; spread-4095-32 +6.02%; spread-4095-33 +9.26%; spread-4096-16 +10.24%; spread-4096-33 +17.32%; spread-4096-48 +32.78%; cluster-head-7 +6.32%; cluster-middle-7 +7.02%; cluster-head-8 +9.88%; cluster-tail-8 +9.44%; cluster-tail-9 +5.35%; head-only-33 +9.26%; samples-only +5.44%; head-and-samples-only +33.25%; failed-sample-then-dense +9.97%; tail-japanese +10.39%.
- combined (10 processes): first-256 +6.15%; spaced-8 +8.83%; mixed-short +11.49%; spread-4095-32 +10.62%; spread-4095-33 +8.88%; spread-4096-16 +7.96%; spread-4096-33 +7.96%; spread-4096-48 +29.40%; spread-4097-16 +9.81%; spread-4097-33 +7.65%; spread-4097-48 +19.81%; cluster-middle-7 +12.85%; cluster-tail-7 +19.04%; cluster-head-8 +28.82%; cluster-middle-8 +10.61%; cluster-head-9 +5.40%; head-and-samples-only +18.92%; failed-sample-then-dense +9.84%.

### darwin-x64

- tail (10 processes): short +7.68%; unchanged-short +6.00%; unchanged-long +5.46%; long-body +6.37%; dense-255 +5.71%; first-255 +7.29%; spaced-8 +9.72%; head-and-samples-only +7.30%.
- expanded (10 processes): short +6.71%; first-31 +5.12%; spread-4096-48 +6.57%; cluster-tail-9 +8.36%; head-only-33 +7.03%.
- combined (10 processes): first-31 +15.20%; spaced-32 +5.01%; spread-4097-16 +6.40%; spread-4097-48 +7.04%; cluster-middle-7 +7.48%; failed-sample-then-dense +7.86%.

### linux-arm64-gnu

- tail (5 processes): no case above +5%.
- expanded (5 processes): no case above +5%.
- combined (5 processes): no case above +5%.

### linux-arm64-musl

- tail (5 processes): no case above +5%.
- expanded (10 processes): spread-8192-24 +12.12%; spread-8192-32 +31.27%; head-and-samples-only +155.04%; irregular-spread +15.33%.
- combined (10 processes): spread-8192-24 +11.29%; spread-8192-32 +29.42%; head-and-samples-only +153.03%; irregular-spread +15.02%.

### linux-x64-gnu

- tail (10 processes): no case above +5%.
- expanded (10 processes): no case above +5%.
- combined (10 processes): first-31 +6.84%.

### linux-x64-musl

- tail (10 processes): no case above +5%.
- expanded (10 processes): mixed-long +9.73%; spread-8192-24 +36.55%; spread-8192-32 +58.57%; head-and-samples-only +190.38%; irregular-spread +37.87%; spread-japanese +31.29%; spread-emoji +31.80%; spread-surrogate +32.32%.
- combined (10 processes): mixed-long +9.66%; spread-8192-24 +34.81%; spread-8192-32 +57.15%; head-and-samples-only +188.54%; irregular-spread +39.09%; spread-japanese +30.53%; spread-emoji +29.86%; spread-surrogate +30.38%.

### local-darwin-arm64

- tail (10 processes): no case above +5%.
- expanded (10 processes): spread-4097-48 +7.46%; head-and-samples-only +23.76%.
- combined (10 processes): spread-4096-48 +6.79%; spread-4097-48 +7.54%; head-and-samples-only +26.60%.

### win32-arm64-msvc

- tail (5 processes): no case above +5%.
- expanded (10 processes): head-and-samples-only +11.02%.
- combined (10 processes): head-and-samples-only +11.07%.

### win32-x64-msvc

- tail (5 processes): no case above +5%.
- expanded (10 processes): no case above +5%.
- combined (5 processes): no case above +5%.

