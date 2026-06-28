import { assert } from './helpers.mjs';
import { createSemanticMergeProductionMatrixStatus } from '../../bench/semantic-merge-production-matrix-status.mjs';

const status = createSemanticMergeProductionMatrixStatus();

assert.equal(status.kind, 'frontier.lang.semanticMergeProductionMatrixStatus');
assert.equal(status.version, 1);
assert.equal(status.duplicateAreas.length, 0, 'production matrix areas must be unique');
assert.equal(status.unmappedMatrixRows.length, 0, 'production matrix rows must map to proof rows');
assert.equal(status.unmappedProofRows.length, 0, 'proof rows must map to production matrix rows');
assert.equal(status.unmappedSourceAnchors.length, 0, 'all source anchors must be linked');
assert.equal(status.unmappedRemainingWork.length, 0, 'all remaining-work rows must be linked');
assert.equal(status.rowCount, 20, 'production matrix row count');
assert.equal(status.remainingWorkCount, 0, 'remaining work row count');
assert.equal(status.statusCounts.high, 15, 'high matrix row count');
assert.equal(status.statusCounts.partial, 5, 'partial matrix row count');

for (const row of status.rows) {
  assert.equal(['high', 'partial', 'missing'].includes(row.status), true, `${row.area}: supported status`);
  assert.equal(row.mapped, true, `${row.area}: proof mapping`);
  assert.notEqual(row.currentExecutableEvidence, '', `${row.area}: executable evidence text`);
  assert.notEqual(row.remainingWorkText, '', `${row.area}: remaining work text`);
  assert.equal(row.sourceAnchors.length > 0, true, `${row.area}: source anchors`);
  assert.equal(row.evidenceFiles.length > 0, true, `${row.area}: evidence files`);
  assert.equal(row.sourceAnchorsPresent, true, `${row.area}: source anchors and URLs present`);
  assert.equal(row.evidenceFilesPresent, true, `${row.area}: evidence files present`);
  assert.equal(row.remainingWorkPresent, true, `${row.area}: remaining work rows present`);
  assert.equal(row.partialRowOverstatesCompletion, false, `${row.area}: partial row overstates completeness`);
}
