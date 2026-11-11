"""Validate downloaded tuning artifacts and write the comparison report.

python3 bench/ssg/collect-tuning.py ZIP_DIRECTORY OUTPUT_DIRECTORY
ZIP_DIRECTORY must also contain artifacts.json and jobs.json from GitHub.
"""
from pathlib import Path, PurePosixPath
import hashlib
import json
import math
import shutil
import statistics
import sys
import zipfile

source, destination = map(Path, sys.argv[1:3])
commit = 'cf51cdce642d3a45d044d0e5eb61f89dab48319e'
before = '79c0f63ea166dceabebb79279cb3c560cb3c1fc0'
run_id = 42836932107
targets = ['darwin-arm64', 'darwin-x64', 'linux-arm64-gnu', 'linux-x64-gnu',
           'linux-arm64-musl', 'linux-x64-musl', 'win32-arm64-msvc', 'win32-x64-msvc']
expected = {f'{t}-node{n}' for t in targets for n in [22, 24, 26]}
variants = ['before', 'native', 'escape-html', 'fast-escape-html', 'html-escaper']
competitors = variants[2:]
scenarios = {'articles': 1000, 'catalog': 250, 'props': 64}
artifacts = json.loads((source / 'artifacts.json').read_text())
jobs = json.loads((source / 'jobs.json').read_text())
assert len(jobs) == 25 and all(j['conclusion'] == 'success' for j in jobs)
destination.mkdir(parents=True, exist_ok=True)
for name in ['artifacts.json', 'jobs.json']:
    shutil.copyfile(source / name, destination / name)
records, seen = {}, set()
expected_inputs = json.loads(Path('bench/ssg/expected-inputs.json').read_text())

def positive(values):
    assert all(math.isfinite(x) and x > 0 for x in values)

for archive in sorted(source.glob('tuning-*-node*.zip')):
    artifact = next(a for a in artifacts if a['name'] == archive.stem)
    assert artifact['digest'] == 'sha256:' + hashlib.sha256(archive.read_bytes()).hexdigest()
    assert artifact['workflow_run']['id'] == run_id
    assert artifact['workflow_run']['head_sha'] == commit
    name = archive.stem.removeprefix('tuning-')
    assert name in expected and name not in seen
    seen.add(name)
    folder = destination / name
    folder.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(archive) as z:
        for item in z.infolist():
            path = PurePosixPath(item.filename)
            assert not path.is_absolute() and '..' not in path.parts
            assert ((item.external_attr >> 16) & 0o170000) != 0o120000
        z.extractall(folder)
    env = json.loads((folder / 'native-environment.json').read_text())
    assert env['commit'] == commit and env['runUrl'].endswith('/' + str(run_id))
    assert env['target'] + '-node' + env['node'].lstrip('v').split('.')[0] == name
    rust = (folder / 'tuning-rust-tests.log').read_text()
    assert '6 passed; 0 failed' in rust
    assert '"neon"' in rust if env['arch'] == 'arm64' else '"sse2"' in rust and '"avx2"' in rust
    if not name.endswith('node24'):
        continue
    root = folder / 'ssg-tuning'
    assert json.loads((root / 'before-api/source.json').read_text())['commit'] == before
    suites = {kind: json.loads((root / 'results' / f'{kind}.json').read_text()) for kind in ['cost', 'ssg', 'micro']}
    hashes = suites['cost']['sourceHashes']
    for r in suites.values():
        assert r['completedAt'] and r['commit'] == commit and r['baselineCommit'] == before
        assert r['node'] == env['node'] and r['platform'] == env['platform'] and r['arch'] == env['arch']
        assert r['sourceHashes'] == hashes
    for file, digest in hashes.items():
        if file.startswith(('bench/', 'rust/')):
            content = Path(file).read_bytes().replace(b'\r\n', b'\n')
            permitted = {hashlib.sha256(content).hexdigest()}
            if env['platform'] == 'win32':
                permitted.add(hashlib.sha256(content.replace(b'\n', b'\r\n')).hexdigest())
            assert digest in permitted, (name, file)
    for file in ['native.mjs', 'escape-core.mjs']:
        assert hashes['dist/' + file] == hashes['target/ssg-tuning/before-api/' + file]
    binary = f'native/escape_html.{env["target"]}.node'
    assert hashes['dist/' + binary] != hashes['target/ssg-tuning/before-api/' + binary]
    for kind in ['cost', 'ssg']:
        r = suites[kind]
        assert len(r['runs']) == 75 and len(r['summary']) == 15
        assert len({(x['scenario'], x['variant'], x['round']) for x in r['runs']}) == 75
        for summary in r['summary']:
            rows = [x for x in r['runs'] if (x['scenario'], x['variant']) == (summary['scenario'], summary['variant'])]
            assert len(rows) == 5 and {x['round'] for x in rows} == set(range(5))
            assert summary['scenario'] in scenarios and summary['variant'] in variants
            values = [x['msPerCorpus' if kind == 'cost' else 'wallMs'] for x in rows]
            positive(values)
            assert summary['medianMs'] == statistics.median(values)
            assert summary['minMs'] == min(values) and summary['maxMs'] == max(values)
            if kind == 'ssg':
                assert summary['medianRssMiB'] == statistics.median(x['maxRssMiB'] for x in rows)
                assert summary['medianLoadMs'] == statistics.median(x['loadMs'] for x in rows)
        if kind == 'ssg':
            assert r['protocol']['rounds'] == 5 and r['protocol']['workers'] == 0
            for scenario, pages in scenarios.items():
                rows = [x for x in r['runs'] if x['scenario'] == scenario]
                assert len({x['output']['sha256'] for x in rows}) == 1
                assert all(x['pages'] == x['output']['htmlFiles'] == pages for x in rows)
        else:
            assert r['rounds'] == 5 and r['variants'] == variants
            for entry in r['inputs']:
                expected_input = next(x for x in expected_inputs if x['scenario'] == entry['scenario'])
                assert entry['profile'] == expected_input['input'] and entry['pages'] == expected_input['pages']
    r = suites['micro']
    assert len(r['runs']) == 15 and len(r['summary']) == 25
    assert len({(x['variant'], x['round']) for x in r['runs']}) == 15
    for summary in r['summary']:
        for variant in variants:
            rows = [x for x in r['runs'] if x['variant'] == variant]
            assert len(rows) == 3 and {x['round'] for x in rows} == {0, 1, 2}
            values = [next(m['nsPerCall'] for m in x['measurements'] if m['name'] == summary['name']) for x in rows]
            positive(values)
            assert summary[variant] == {'medianNs': statistics.median(values), 'minNs': min(values), 'maxNs': max(values)}
    logs = list((root / 'results').glob('*.log'))
    assert len(logs) == 75
    (folder / 'build-log-sizes.json').write_text(json.dumps({p.name: p.stat().st_size for p in logs}, indent=2) + '\n')
    for p in logs:
        if p.stat().st_size == 0:
            p.unlink()
    records[env['target']] = suites
    print('Verified', name)
assert seen == expected and set(records) == set(targets)

def group(suite, scenario):
    return {x['variant']: x for x in suite['summary'] if x['scenario'] == scenario}

def delta(value, reference):
    return 100 * (value / reference - 1)

lines = ['# Packed native entity copies', '',
    f'Candidate `{commit}`, predecessor `{before}`.', '',
    f'[Workflow {run_id}](https://github.com/jp-knj/html-escape/actions/runs/{run_id}): all 24 platform/Node combinations passed native API, npm-package, Worker, ESM/Wasm and Rust checks. NEON, SSE2 and AVX2 were executed on supported hardware.', '',
    'The eight Node 24 environments each completed 75 full builds, 75 corpus-replay processes and 15 microbenchmark processes with 25 cases. All static output hashes match within each environment. Source, binary, artifact hashes and every sample were verified; no rounds were discarded.', '',
    '## Long JSON API comparison', '',
    'Change relative to the preceding native implementation. Negative means less time. The actual-props column replays all 384 calls from 64 SSG pages; the microbenchmark column is the existing quoted-JSON fixture.', '',
    '| Target | Actual props corpus | Quoted JSON | Dense quotes |', '|---|---:|---:|---:|']
for target in targets:
    r = records[target]
    v = group(r['cost'], 'props')
    micro = {x['name']: x for x in r['micro']['summary']}
    changes = [delta(v['native']['medianMs'], v['before']['medianMs'])] + [delta(micro[k]['native']['medianNs'], micro[k]['before']['medianNs']) for k in ['quoted-json', 'dense-quotes']]
    lines.append('| ' + target + ' | ' + ' | '.join(f'{x:+.2f}%' for x in changes) + ' |')
lines += ['', '## Complete SSG vs the fastest competitor', '',
    'For each cell, select the lowest five-run median among escape-html, fast-escape-html and html-escaper on that runner. This is a separate baseline from the preceding native implementation.', '',
    '| Target | Articles | Catalog | Large props |', '|---|---:|---:|---:|']
for target in targets:
    changes = []
    for scenario in scenarios:
        v = group(records[target]['ssg'], scenario)
        fastest = min(competitors, key=lambda c: v[c]['medianMs'])
        changes.append(f'{delta(v["native"]["medianMs"], v[fastest]["medianMs"]):+.2f}% ({fastest})')
    lines.append('| ' + target + ' | ' + ' | '.join(changes) + ' |')
lines += ['', '## Complete SSG before and after', '', '| Target | Articles | Catalog | Large props |', '|---|---:|---:|---:|']
for target in targets:
    changes = []
    for scenario in scenarios:
        v = group(records[target]['ssg'], scenario)
        changes.append(f'{delta(v["native"]["medianMs"], v["before"]["medianMs"]):+.2f}%')
    lines.append('| ' + target + ' | ' + ' | '.join(changes) + ' |')
lines += ['', '## Absolute complete-build medians', '', 'Milliseconds; five fresh processes per cell.', '',
          '| Target | Site | Before native | Native | escape-html | fast-escape-html | html-escaper |', '|---|---|---:|---:|---:|---:|---:|']
for target in targets:
    for scenario in scenarios:
        v = group(records[target]['ssg'], scenario)
        lines.append('| ' + target + ' | ' + scenario + ' | ' + ' | '.join(f'{v[k]["medianMs"]:.3f}' for k in variants) + ' |')
lines += ['', 'The all-environment 5% full-build goal is **not met**. None of the eight large-props full-build medians is 5% below its fastest competitor. Quoted-JSON API medians improve on all eight targets, exceeding 5% on six; that does not establish the full-build goal.', '',
    'Hosted macOS runs vary substantially, including short inputs that use identical JavaScript. The ARM64 actual-props replay median regressed 2.92% while its quoted-JSON microbenchmark improved 22.94%. Treat the medians as descriptive, not confidence intervals or proof that the copy change caused every observed difference. Musl allocation and string-conversion costs remain part of the API measurement.', '',
    'See [the protocol](../../ssg/TUNING.md). Raw cost, SSG and micro results are under each `*-node24/ssg-tuning/results/` directory; all Node environments retain Rust logs and machine metadata. Peak RSS and initial API import time are recorded in SSG JSON. No cross-host absolute-speed ranking or general 5% speedup is claimed.', '']
(destination / 'README.md').write_text('\n'.join(lines))
print('Verified 24 correctness environments and all eight benchmark environments')
