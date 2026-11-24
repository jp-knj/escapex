# escapex-native

Install the native dependencies for `escapex/native`:

```sh
npm install escapex escapex-native
```

Use matching versions of both packages and keep optional dependencies enabled.
npm selects the binary for macOS, Linux (glibc or musl), or Windows on ARM64 or
x86-64. Import the synchronous API from `escapex/native`:

```js
import { escapeText } from 'escapex/native';

escapeText('Tea & <toast>'); // 'Tea &amp; &lt;toast&gt;'
```

This package contains only metadata, this README and the license. The API and
types belong to `escapex`; the binaries belong to its platform packages.
JavaScript and Wasm users need only `escapex`.
