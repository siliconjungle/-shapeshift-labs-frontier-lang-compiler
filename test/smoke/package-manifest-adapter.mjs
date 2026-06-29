import assert from 'node:assert/strict';
import {
  createPackageManifestSemanticMergeEvidence,
  parsePackageManifestSemanticTree,
  queryPackageDependencyRecords
} from '../../dist/index.js';

const source = JSON.stringify({
  name: 'demo',
  scripts: { test: 'vitest', postinstall: 'node setup.js' },
  dependencies: { react: '^19.0.0' },
  peerDependencies: { typescript: '^5.9.0' },
  exports: { '.': './dist/index.js' }
}, null, 2);

const tree = parsePackageManifestSemanticTree(source, { sourcePath: 'package.json' });
assert.equal(tree.parser.status, 'ok');
assert.equal(tree.summary.dependencies, 2);
assert.equal(queryPackageDependencyRecords(tree, { name: 'react' })[0].identityKey, 'dependency:dependencies:react');

const evidence = createPackageManifestSemanticMergeEvidence(source, { sourcePath: 'package.json' });
assert.equal(evidence.kind, 'frontier.lang.packageManifestSemanticMergeEvidence');
assert.equal(evidence.status, 'needs-review');
assert.ok(evidence.proofGaps.some((gap) => gap.code === 'package-peer-compatibility-boundary'));
assert.ok(evidence.proofGaps.some((gap) => gap.code === 'package-script-runtime-boundary'));

