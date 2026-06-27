import { readFileSync } from 'node:fs';
import { RealRepoCorpusOracleCoverage } from '../../bench/real-repo-corpus-suite.mjs';

function assertReadmeRealRepoBenchmarkSuiteRow(assert) {
  const readmeRow = readReadmeMatrixRows().get('Real-repo benchmark suite');
  assert.ok(readmeRow, 'README missing Real-repo benchmark suite row');
  assert.equal(readmeRow.status, 'Partial', 'README real-repo benchmark status');
  assert.match(
    readmeRow.evidence,
    new RegExp(`${RealRepoCorpusOracleCoverage.oracleCases} oracle cases across ${RealRepoCorpusOracleCoverage.matrixRows.length} matrix rows`),
    'README real-repo oracle coverage count'
  );
  for (const rowId of RealRepoCorpusOracleCoverage.matrixRows) {
    assert.equal(readmeRow.evidence.includes(`\`${rowId}\``), true, `README real-repo matrix row ${rowId}`);
  }
  assert.equal(readmeRow.evidence.includes('realRepoCorpusOracleCoverageRatio'), true, 'README real-repo coverage ratio metric');
  assert.equal(readmeRow.evidence.includes(RealRepoCorpusOracleCoverage.coverageRatioBasis), true, 'README real-repo coverage ratio basis');
  for (const surface of RealRepoCorpusOracleCoverage.unmappedSurfaces) {
    assert.equal(readmeRow.evidence.includes(`\`${surface}\``), true, `README real-repo known non-matrix surface ${surface}`);
  }
}

function readReadmeMatrixRows() {
  const readme = readFileSync(new URL('../../README.md', import.meta.url), 'utf8');
  const rows = new Map();
  for (const line of readme.split('\n')) {
    if (!line.startsWith('| ')) continue;
    const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|');
    if (cells.length < 3) continue;
    const [surface, status, ...evidenceParts] = cells.map((cell) => cell.trim());
    if (surface !== 'Surface' && surface !== '---') rows.set(surface, { status, evidence: evidenceParts.join('|').trim() });
  }
  return rows;
}

export { assertReadmeRealRepoBenchmarkSuiteRow };
