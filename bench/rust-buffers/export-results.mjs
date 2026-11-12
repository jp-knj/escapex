// Keep a checksum-verified copy in CI logs as well as the downloadable artifact.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';

const data = readFileSync('target/rust-buffers/results/local.json');
console.log(`BUFFER_SHA256:${createHash('sha256').update(data).digest('hex')}`);
console.log(`BUFFER_GZIP:${gzipSync(data).toString('base64')}`);
