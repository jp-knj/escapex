"""Validate the library workflow's downloaded ZIPs and report API comparisons.

python3 bench/library/collect.py ZIP_DIRECTORY OUTPUT_DIRECTORY
The input directory also needs artifacts.json and jobs.json from GitHub.
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
commit = 'e093ab74a1b6c63573a9504a14e03482f2c41fe7'
baseline = 'cf51cdce642d3a45d044d0e5eb61f89dab48319e'
run_id = 42933340929
targets = ['darwin-arm64', 'darwin-x64', 'linux-arm64-gnu', 'linux-x64-gnu',
           'linux-arm64-musl', 'linux-x64-musl', 'win32-arm64-msvc', 'win32-x64-msvc']
expected = {f'{target}-node{node}' for target in targets for node in [22, 24, 26]}
variants = ['before', 'native', 'escape-html', 'fast-escape-html', 'html-escaper']
competitors = variants[2:]
artifacts = json.loads((source / 'artifacts.json').read_text())
jobs = json.loads((source / 'jobs.json').read_text())
assert len(jobs) == 25 and all(j['conclusion'] == 'success' for j in jobs)
destination.mkdir(parents=True, exist_ok=True)
for name in ['artifacts.json', 'jobs.json']:
    shutil.copyfile(source / name, destination / name)
records, esm_records, seen = {}, {}, set()

def change(value, reference):
    return 100 * (value / reference - 1)

for archive in sorted(source.glob('library-*-node*.zip')):
    artifact = next(a for a in artifacts if a['name'] == archive.stem)
    assert artifact['digest'] == 'sha256:' + hashlib.sha256(archive.read_bytes()).hexdigest()
    assert artifact['workflow_run']['id'] == run_id
    assert artifact['workflow_run']['head_sha'] == commit
    name = archive.stem.removeprefix('library-')
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
    rust = (folder / 'library-rust-tests.log').read_text()
    assert '6 passed; 0 failed' in rust
    assert '"neon"' in rust if env['arch'] == 'arm64' else '"sse2"' in rust and '"avx2"' in rust
    if not name.endswith('node24'):
        continue
    root = folder / 'library-tuning'
    before = json.loads((root / 'before-api/source.json').read_text())
    r = json.loads((root / 'results/api.json').read_text())
    assert r['completedAt'] and r['commit'] == commit and before['commit'] == baseline
    assert r['baseline'] == before
    assert r['node'] == env['node'] and r['platform'] == env['platform'] and r['arch'] == env['arch']
    assert r['variants'] == variants and r['rounds'] == 5
    assert len(r['runs']) == 25 and len(r['summary']) == 25
    for i, row in enumerate(r['runs']):
        assert row['round'] == i // 5
        assert row['variant'] == variants[(i // 5 + i % 5) % 5]
        assert len(row['measurements']) == 25
        assert row['compatibility']['preservesLoneSurrogates']
    for file, digest in (r['protocolHashes'] | r['implementationHashes']).items():
        content = Path(file).read_bytes().replace(b'\r\n', b'\n')
        permitted = {hashlib.sha256(content).hexdigest()}
        if env['platform'] == 'win32':
            permitted.add(hashlib.sha256(content.replace(b'\n', b'\r\n')).hexdigest())
        assert digest in permitted, (name, file)
    # The adopted change is JavaScript-only; the Rust sources match the baseline.
    for file in ['rust/src/native.rs', 'rust/src/native_escape.rs']:
        assert r['implementationHashes'][file] == before['sources'][file]
    assert r['sourceHashes']['before']['core'] != r['sourceHashes']['native']['core']
    assert r['sourceHashes']['before']['api'] != r['sourceHashes']['native']['api']
    for group in r['sourceHashes'].values():
        assert set(group['binaries']) == {f'escape_html.{env["target"]}.node'}
    for row in r['summary']:
        for variant in variants:
            runs = [x for x in r['runs'] if x['variant'] == variant]
            values = [next(m['nsPerCall'] for m in x['measurements'] if m['name'] == row['name']) for x in runs]
            assert len(values) == 5 and all(math.isfinite(x) and x > 0 for x in values)
            assert row[variant] == {'medianNs': statistics.median(values), 'minNs': min(values), 'maxNs': max(values)}
    rows = {x['name']: x for x in r['summary']}
    assert len(rows) == 25
    records[env['target']] = r
    esm = json.loads((root / 'results/esm.json').read_text())
    assert esm['completedAt'] and esm['commit'] == commit and esm['baseline'] == before
    assert esm['protocolHashes'] == r['protocolHashes']
    assert esm['implementationHashes'] == r['implementationHashes']
    assert esm['node'] == env['node'] and esm['platform'] == env['platform'] and esm['arch'] == env['arch']
    assert esm['variants'] == ['esm-before', 'esm'] and esm['rounds'] == 3
    assert len(esm['runs']) == 6 and len(esm['summary']) == 25
    for i, row in enumerate(esm['runs']):
        assert row['round'] == i // 2 and row['variant'] == esm['variants'][(i // 2 + i % 2) % 2]
        assert len(row['measurements']) == 25 and row['compatibility']['preservesLoneSurrogates']
    for row in esm['summary']:
        for variant in esm['variants']:
            runs = [x for x in esm['runs'] if x['variant'] == variant]
            values = [next(m['nsPerCall'] for m in x['measurements'] if m['name'] == row['name']) for x in runs]
            assert len(values) == 3 and all(math.isfinite(x) and x > 0 for x in values)
            assert row[variant] == {'medianNs': statistics.median(values), 'minNs': min(values), 'maxNs': max(values)}
    esm_records[env['target']] = esm
    lines = [f'# {env["target"]}, {env["node"]}', '', f'CPU: {env["cpu"]}.', '',
        'ns/call; median of five fresh processes. Negative percentages mean less time. The competitor column selects the fastest of the three JavaScript libraries per case.', '',
        '| Case | Before native | Native | escape-html | fast-escape-html | html-escaper | vs before | vs fastest competitor |',
        '|---|---:|---:|---:|---:|---:|---:|---:|']
    for row in r['summary']:
        best = min(competitors, key=lambda v: row[v]['medianNs'])
        values = ' | '.join(f'{row[v]["medianNs"]:.1f}' for v in variants)
        lines.append(f'| {row["name"]} | {values} | {change(row["native"]["medianNs"], row["before"]["medianNs"]):+.2f}% | {change(row["native"]["medianNs"], row[best]["medianNs"]):+.2f}% ({best}) |')
    lines += ['', '## Default ESM entry', '', 'ns/call; median of three fresh processes per version.', '',
              '| Case | Before ESM | ESM | Change |', '|---|---:|---:|---:|']
    for row in esm['summary']:
        lines.append(f'| {row["name"]} | {row["esm-before"]["medianNs"]:.1f} | {row["esm"]["medianNs"]:.1f} | {change(row["esm"]["medianNs"], row["esm-before"]["medianNs"]):+.2f}% |')
    lines += ['', 'All raw samples and ranges: [native API JSON](library-tuning/results/api.json), [default ESM JSON](library-tuning/results/esm.json). No rounds were discarded.', '']
    (folder / 'README.md').write_text('\n'.join(lines))
    print('Verified', name)
assert seen == expected and set(records) == set(targets)
assert len({tuple(x['name'] for x in r['summary']) for r in records.values()}) == 1

lines = ['# Library-only search evaluation', '', f'Candidate `{commit}`; packed-copy predecessor `{baseline}`.', '',
    f'[Workflow {run_id}](https://github.com/jp-knj/escapex/actions/runs/{run_id}) passed all 24 platform/Node correctness combinations. The eight Node 24 targets completed five fresh processes for each of five implementations, with all 25 existing cases: 200 processes and 5,000 timed case samples. The default ESM entry was separately compared with its predecessor in three processes per version: another 48 processes and 1,200 timed case samples. Artifact digests, source hashes and medians were verified; all samples are retained.', '',
    'Only html-escape JavaScript changed: for inputs shorter than 128 UTF-16 units, emit the first known match directly and classify following units with the ASCII entity table. Move the native long-input path into a private function. The long ESM scanner, Rust, native string conversion and CPU dispatch match the predecessor. See the [protocol](../../library/README.md).', '',
    '## Native API change vs the preceding native API', '',
    '| Target | Short | First match at 0, length 31 | Dense 31 | Last match, length 31 | Mixed short |',
    '|---|---:|---:|---:|---:|---:|']
selected = ['short', 'first-31', 'dense-31', 'last-31', 'mixed-short']
for target in targets:
    rows = {r['name']: r for r in records[target]['summary']}
    values = [change(rows[k]['native']['medianNs'], rows[k]['before']['medianNs']) for k in selected]
    lines.append(f'| [{target}]({target}-node24/README.md) | ' + ' | '.join(f'{x:+.2f}%' for x in values) + ' |')
lines += ['', '## Comparison with the three competing libraries', '',
    'For each case, the reference is the lowest median among escape-html 1.0.3, fast-escape-html 1.1.0 and html-escaper 3.0.3 on the same runner. Counts are descriptive comparisons of medians, not statistical significance tests.', '',
    '| Target | Native short ns | Fastest competitor short ns | Short change | Cases below all three | Cases at least 5% below all three |',
    '|---|---:|---:|---:|---:|---:|']
for target in targets:
    r = records[target]
    row = next(x for x in r['summary'] if x['name'] == 'short')
    best = min(competitors, key=lambda v: row[v]['medianNs'])
    changes = [change(x['native']['medianNs'], min(x[v]['medianNs'] for v in competitors)) for x in r['summary']]
    lines.append(f'| {target} | {row["native"]["medianNs"]:.1f} | {row[best]["medianNs"]:.1f} ({best}) | {change(row["native"]["medianNs"], row[best]["medianNs"]):+.2f}% | {sum(x < 0 for x in changes)}/25 | {sum(x <= -5 for x in changes)}/25 |')
lines += ['', '## Default ESM before and after', '',
    '| Target | Short | Quoted JSON | Japanese/emoji | Long body | Mixed short |', '|---|---:|---:|---:|---:|---:|']
for target in targets:
    rows = {r['name']: r for r in esm_records[target]['summary']}
    values = [change(rows[k]['esm']['medianNs'], rows[k]['esm-before']['medianNs']) for k in ['short', 'quoted-json', 'japanese-emoji', 'long-body', 'mixed-short']]
    lines.append('| ' + target + ' | ' + ' | '.join(f'{x:+.2f}%' for x in values) + ' |')
lines += ['', '## Largest measured increases vs the predecessor', '',
    'Each cell selects the largest median increase among all 25 cases. These observations are retained even where the executed long-input scanner is unchanged; this evaluation alone does not distinguish host variation from a repeatable regression.', '',
    '| Target | Native API | Default ESM API |', '|---|---:|---:|']
for target in targets:
    cells = []
    for record, old, new in [(records[target], 'before', 'native'), (esm_records[target], 'esm-before', 'esm')]:
        value, name = max((change(row[new]['medianNs'], row[old]['medianNs']), row['name']) for row in record['summary'])
        cells.append(f'{value:+.2f}% ({name})')
    lines.append('| ' + target + ' | ' + ' | '.join(cells) + ' |')
lines += ['', 'These measurements time the public escapeHTML API and output consumption, excluding imports. They do not establish a static-site build speedup. Per-target reports link all ranges and raw samples. No universal 5% improvement, absence of regressions, or all-case competitor win is claimed.', '',
    'The initial candidate in [run 42932077586](https://github.com/jp-knj/escapex/actions/runs/42932077586) also changed the long ESM scanner. That part was reverted after the local ESM comparison; those native-only timings are not used as final-source validation here.', '']
(destination / 'README.md').write_text('\n'.join(lines))
print('Verified 24 correctness environments and eight API benchmark environments')
