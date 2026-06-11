import * as compilerApi from '../src/index.js';

const semanticTransformIdentity = compilerApi.createSemanticTransformIdentityRecord({
  sourceLanguage: 'typescript',
  targetLanguage: 'rust',
  sourcePath: 'src/example.ts',
  targetPath: 'src/example.rs',
  semanticKey: 'semantic-edit:function:run',
  editContentHash: 'edit_hash'
});
const typedSemanticTransformIdentity: compilerApi.SemanticTransformIdentityRecord = semanticTransformIdentity;
const semanticTransformFields: compilerApi.SemanticTransformIdentityRecord =
  compilerApi.semanticTransformIdentityFields(typedSemanticTransformIdentity);
const semanticPatchBundleWithTransform = compilerApi.createSemanticPatchBundleRecord({
  language: 'typescript',
  sourcePath: 'src/example.ts',
  baseHash: 'base_hash',
  targetHash: 'target_hash',
  semanticTransformIdentities: [typedSemanticTransformIdentity]
});
const queriedSemanticTransformBundles: readonly compilerApi.SemanticPatchBundleRecord[] =
  compilerApi.querySemanticPatchBundleRecords([semanticPatchBundleWithTransform], {
    semanticTransformKey: semanticTransformFields.transformKey,
    transformTargetLanguage: 'rust'
  });

void queriedSemanticTransformBundles;
