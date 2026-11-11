"""Run from the repository root with the Node executable as the first argument.

Requires the pre-cleanup dist snapshot at target/cleanup-20261111/before-api.
Uses the existing workers and their existing fixture sets unchanged.
"""
import hashlib
import json
import os
from pathlib import Path
import statistics
import subprocess
import sys

node = sys.argv[1]
root = Path.cwd()
output = root / 'target/cleanup-20261111'
apis = {
    'before': 'target/cleanup-20261111/before-api/native.mjs',
    'native': 'dist/native.mjs',
    'esm-before': 'target/cleanup-20261111/before-api/index.mjs',
    'esm': 'dist/index.mjs',
}
environment = dict(os.environ, LIBRARY_APIS=json.dumps(apis),
    LIBRARY_VARIANTS=','.join(apis), LIBRARY_ROUNDS='4',
    LIBRARY_OUTPUT='target/cleanup-20261111/html.json')
subprocess.run([node, 'bench/library/run.mjs'], env=environment, check=True)
html = json.loads((output / 'html.json').read_text())
result = {key: value for key, value in html.items() if key not in ['runs', 'summary', 'startedAt', 'completedAt', 'protocol']}
result['protocol'] = ('Existing bench/micro.mjs worker: all seven cases and four operations; '
    '30 ms warmup, 150 ms measured, Buffer.byteLength consumption. Four fresh processes '
    'per entry, rotating through all four positions. Initialization excluded from ns/call.')
result['protocolHashes']['bench/micro.mjs'] = hashlib.sha256(Path('bench/micro.mjs').read_bytes()).hexdigest()
result['protocolHashes']['bench/implementations.mjs'] = hashlib.sha256(Path('bench/implementations.mjs').read_bytes()).hexdigest()
result['runs'] = []
variants = list(apis)
for round in range(4):
    for offset in range(4):
        variant = variants[(round + offset) % 4]
        print(f'contexts {round + 1}/4 {variant}', flush=True)
        data = json.loads(subprocess.check_output([
            node, '--expose-gc', '--import', './bench/library/select.mjs',
            'bench/micro.mjs', 'native',
        ], env=dict(os.environ, LIBRARY_API=str(root / apis[variant])), text=True))
        result['runs'].append(dict(data, variant=variant, round=round))
result['summary'] = []
for measurement in result['runs'][0]['measurements']:
    name, operation = measurement['name'], measurement['operation']
    row = {'name': name, 'operation': operation}
    for variant in variants:
        values = [next(m['nsPerCall'] for m in run['measurements']
            if (m['name'], m['operation']) == (name, operation))
            for run in result['runs'] if run['variant'] == variant]
        row[variant] = {'medianNs': statistics.median(values), 'minNs': min(values), 'maxNs': max(values)}
    result['summary'].append(row)
(output / 'contexts.json').write_text(json.dumps(result, indent=2) + '\n')
