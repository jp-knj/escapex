"""Verify downloaded SSG artifacts and generate a cross-environment report.

python3 bench/ssg/collect.py ZIP_DIRECTORY OUTPUT_DIRECTORY SOURCE_COMMITS RUN_IDS
Multiple source commits or run IDs can be comma-separated for setup-only retries.
The download step uses the connected GitHub tool; this script needs no token.
"""
from pathlib import Path, PurePosixPath
import hashlib
import json
import math
import statistics
import sys
import zipfile

source, destination = map(Path, sys.argv[1:3])
commits, run_ids = [value.split(',') for value in sys.argv[3:5]]
destination.mkdir(parents=True, exist_ok=True)
records = []
artifact_manifest = source / 'artifacts.json'
artifacts = json.loads(artifact_manifest.read_text()) if artifact_manifest.exists() else []
if artifacts:
    (destination / 'artifacts.json').write_text(json.dumps(artifacts, indent=2) + '\n')
variants = ['native', 'wasm', 'escape-html', 'fast-escape-html', 'html-escaper']
competitors = variants[2:]
scenarios = ['articles', 'catalog', 'props']
page_counts = {'articles': 1000, 'catalog': 250, 'props': 64}
reference_inputs = {}
reference_sources = {}
expected_environments = {f'{target}-node{node}' for target in [
    'darwin-arm64', 'darwin-x64', 'linux-arm64-gnu', 'linux-x64-gnu',
    'linux-arm64-musl', 'linux-x64-musl', 'win32-arm64-msvc', 'win32-x64-msvc'
] for node in ['22', '24', '26']}
for archive in sorted(source.glob('ssg-*-node*.zip')):
    if artifacts:
        artifact = next(a for a in artifacts if a['name'] == archive.stem and not a.get('failedAttempt'))
        assert 'sha256:' + hashlib.sha256(archive.read_bytes()).hexdigest() == artifact['digest']
    target = destination / archive.stem.removeprefix('ssg-')
    assert target.name in expected_environments
    target.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(archive) as z:
        for item in z.infolist():
            path = PurePosixPath(item.filename)
            assert not path.is_absolute() and '..' not in path.parts
            assert not ((item.external_attr >> 16) & 0o170000) == 0o120000
        z.extractall(target)
    logs = list(target.rglob('*.log'))
    log_index = {str(p.relative_to(target)): p.stat().st_size for p in logs}
    for path in logs:
        if path.stat().st_size == 0:
            path.unlink()
    (target / 'build-log-sizes.json').write_text(json.dumps(log_index, indent=2) + '\n')
    env = json.loads((target / 'native-environment.json').read_text())
    result_path = target / 'ssg-results/results.json'
    r = json.loads(result_path.read_text())
    assert env['commit'] == r['sourceCommit'] and env['commit'] in commits
    assert env['runUrl'].rsplit('/', 1)[-1] in run_ids
    assert env['platform'] == r['environment']['platform']
    assert env['arch'] == r['environment']['arch']
    assert env['node'] == r['environment']['node']
    assert env['target'] + '-node' + env['node'].lstrip('v').split('.')[0] == target.name
    assert r['completedAt'] and not r['smoke']
    assert r['protocol']['rounds'] == 5
    assert r['protocol']['variants'] == variants
    assert r['protocol']['scenarios'] == scenarios
    assert r['protocol']['workers'] == [0, 2]
    assert r['protocol']['pageCounts'] == page_counts
    assert len(r['runs']) == 150 and len(r['profiles']) == 6
    assert len({x['id'] for x in r['runs'] + r['profiles']}) == 156
    for filename, digest in r['sourceHashes'].items():
        if filename.startswith('bench/'):
            content = Path(filename).read_bytes().replace(b'\r\n', b'\n')
            canonical = hashlib.sha256(content).hexdigest()
            permitted = {canonical}
            if env['platform'] == 'win32':
                # Git checkout on Windows converts tracked text to CRLF.
                permitted.add(hashlib.sha256(content.replace(b'\n', b'\r\n')).hexdigest())
            assert digest in permitted, filename
            assert reference_sources.setdefault(filename, canonical) == canonical
    for scenario in scenarios:
        runs = [x for x in r['runs'] + r['profiles'] if x['scenario'] == scenario]
        assert len({x['output']['sha256'] for x in runs}) == 1
        assert all(x['pages'] == x['output']['htmlFiles'] == page_counts[scenario] for x in runs)
    for profile in r['profiles']:
        assert profile['input']['calls'] > 0
        assert reference_inputs.setdefault(profile['scenario'], profile['input']) == profile['input']
    for group in r['summary']:
        for v in group['variants']:
            samples = [x for x in r['runs'] if (x['scenario'], x['workerCount'], x['variant']) ==
                       (group['scenario'], group['workerCount'], v['variant'])]
            assert len(samples) == 5 and {x['round'] for x in samples} == set(range(5))
            values = [x['wallMs'] for x in samples]
            assert all(math.isfinite(n) and n > 0 for n in values)
            assert v['medianMs'] == statistics.median(values)
            assert v['minMs'] == min(values) and v['maxMs'] == max(values)
            assert v['medianRssMiB'] == statistics.median(x['maxRssMiB'] for x in samples)
            assert all(len(x['adapters']) == (x['workerCount'] or 1) for x in samples)
            assert all(a['variant'] == v['variant'] for x in samples for a in x['adapters'])
    records.append((target.name, r, env))
    print('Verified', target.name)

def group(r, scenario, workers=0):
    return {v['variant']: v for g in r['summary'] if g['scenario'] == scenario and g['workerCount'] == workers for v in g['variants']}

def comparison(r, scenario, workers=0):
    vs = group(r, scenario, workers)
    fastest = min(competitors, key=lambda v: vs[v]['medianMs'])
    return 100 * (vs['native']['medianMs'] / vs[fastest]['medianMs'] - 1), fastest

lines = ['# Full static-site builds across native environments', '',
         'Source commits: ' + ', '.join(f'`{commit}`' for commit in commits) + '.', '',
         'Workflow runs: ' + ', '.join(f'[{run}](https://github.com/jp-knj/html-escape/actions/runs/{run})' for run in run_ids) + '.', '',
         f'Verified {len(records)} environments, {len(records) * 150} timed builds, and {len(records) * 6} independent diagnostic builds. '
         'Each environment uses five fresh processes per library, site, and Worker count. All static outputs match byte-for-byte within each environment; actual escape input profiles match across all collected environments.', '',
         'These are synthetic fixtures with clean Astro build caches and uncontrolled OS filesystem caches. Wall time includes startup, compilation, API initialization, rendering, and HTML writes. Dependency installation and verification are excluded. See the [protocol](../../ssg/README.md).', '',
         'A lower median is descriptive, not a significance test. Check the individual reports for ranges and all samples. Hosted runner types have different CPUs and resources; compare libraries within each environment, not OS or architecture speeds against each other.', '',
         '## Node 24, main rendering thread', '',
         'Seconds, median of five complete builds.', '',
         '| Target | Site | native | Wasm | escape-html | fast-escape-html | html-escaper |',
         '|---|---|---:|---:|---:|---:|---:|']
if (destination / 'failures.md').exists():
    lines[2:2] = ['See the [interpretation](interpretation.md) and [initial setup failure with recovery](failures.md).', '']
node24 = [(name, r, env) for name, r, env in records if name.endswith('-node24')]
for name, r, env in node24:
    for scenario in scenarios:
        vs = group(r, scenario)
        lines.append('| ' + env['target'] + ' | ' + scenario + ' | ' + ' | '.join(f"{vs[v]['medianMs'] / 1000:.3f}" for v in variants) + ' |')
lines += ['', '## Native relative to the fastest JavaScript competitor', '',
          'Percent change in median wall time. Negative means less time. The baseline is the lowest median among the three competitors for that environment, site, and Worker count.', '',
          '| Environment | Articles, main | Catalog, main | Props, main | Articles, 2 Workers | Catalog, 2 Workers | Props, 2 Workers |',
          '|---|---:|---:|---:|---:|---:|---:|']
for name, r, env in records:
    changes = [comparison(r, scenario, workers)[0] for workers in [0, 2] for scenario in scenarios]
    lines.append(f'| [{name}]({name}/ssg-results/README.md) | ' + ' | '.join(f'{x:+.2f}%' for x in changes) + ' |')
lines += ['', '## Native parallelism and memory, Node 24', '',
          'Two-Worker versus main-thread native wall-time change, with median process peak RSS in MiB. Workers share a process; RSS includes all threads. Separately spawned processes are excluded.', '',
          '| Target | Site | Wall-time change | Main-thread peak MiB | Two-Worker peak MiB |',
          '|---|---|---:|---:|---:|']
for name, r, env in node24:
    for scenario in scenarios:
        a, b = group(r, scenario)['native'], group(r, scenario, 2)['native']
        lines.append(f"| {env['target']} | {scenario} | {100*(b['medianMs']/a['medianMs']-1):+.2f}% | {a['medianRssMiB']:.1f} | {b['medianRssMiB']:.1f} |")
lines += ['', '## Interpretation limits', '',
          '- Article inputs are at most 30 UTF-16 units; catalog inputs at most 49. Static article body size does not imply a long escape call.',
          '- Props pages each make one escape call for JSON of up to 162,559 UTF-16 units. Astro uses its separate attribute implementation for the duplicate JSON attribute; that implementation is unchanged.',
          '- API import times and full input distributions are in every per-environment report. GC data comes from separate instrumented builds and is diagnostic only, not an unbiased timing comparison.',
          '- These measurements do not establish the original Container benchmark gate, installation-time performance, incremental-build performance, or results for an unspecified production site.', '',
          'Raw source hashes are verified against the local source bytes, allowing only Git checkout conversion from LF to CRLF on Windows.', '',
          'Every environment folder includes all raw samples, output hashes, source hashes, runtime versions, and its own report. Empty build logs are represented by build-log-sizes.json; nonempty logs are retained. No speed-based samples are removed or retried.', '']
(destination / 'README.md').write_text('\n'.join(lines))
(destination / 'collection.json').write_text(json.dumps({'sourceCommits': commits, 'runIds': run_ids,
    'environments': [name for name, _, _ in records], 'expectedEnvironmentCount': 24,
    'complete': {name for name, _, _ in records} == expected_environments}, indent=2) + '\n')
print('Collected', len(records), 'of 24 environments')
