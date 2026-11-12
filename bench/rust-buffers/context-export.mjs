// Keep a checksum-verified copy in CI logs as well as the downloadable artifact.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';

const data = readFileSync('target/rust-buffers/contexts/local.json');
console.log(`CONTEXT_SHA256:${createHash('sha256').update(data).digest('hex')}`);
console.log(`CONTEXT_GZIP:${gzipSync(data).toString('base64')}`);
