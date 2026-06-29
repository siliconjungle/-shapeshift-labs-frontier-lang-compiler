import {
  createPackageManifestSemanticMergeEvidence,
  parsePackageManifestSemanticTree,
  queryPackageDependencyRecords,
  summarizePackageManifestSemanticTree
} from '../src/index.js';
import type {
  PackageManifestSemanticMergeEvidence,
  PackageManifestSemanticRecord,
  PackageManifestSemanticTree
} from '../src/index.js';

const tree: PackageManifestSemanticTree = parsePackageManifestSemanticTree('{"dependencies":{"react":"^19.0.0"}}');
const evidence: PackageManifestSemanticMergeEvidence = createPackageManifestSemanticMergeEvidence('{"scripts":{"test":"vitest"}}');
const record: PackageManifestSemanticRecord | undefined = queryPackageDependencyRecords(tree, { name: 'react' })[0];

summarizePackageManifestSemanticTree(tree).dependencies satisfies number;
evidence.installEquivalenceClaim satisfies false;
record?.identityKey satisfies string | undefined;

void tree;
void evidence;
void record;
