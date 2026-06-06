import assert from 'node:assert/strict';
import {
  compileNativeSource,
  createSemanticImportSidecar,
  diffNativeSources,
  importNativeSource,
  projectNativeImportToSource,
  summarizeNativeImportFeatureEvidence
} from '../dist/index.js';

export function runLightweightNativeCase(index) {
  const lightweight = importNativeSource({
    language: lightLanguage(index),
    sourcePath: lightSourcePath(index),
    sourceText: lightBeforeSource(index)
  });
  assert.ok(lightweight.semanticIndex.symbols.length >= 1);
  assert.ok(lightweight.mergeCandidates.length >= 1);
  assert.equal(lightweight.metadata.sourcePreservation.sourceHash, lightweight.nativeSource.sourceHash);
  assert.equal(lightweight.metadata.sourcePreservation.summary.exactSourceAvailable, true);

  const lightweightChange = diffNativeSources({
    language: lightLanguage(index),
    sourcePath: lightSourcePath(index),
    beforeSourceText: lightBeforeSource(index),
    afterSourceText: lightAfterSource(index)
  });
  assert.ok(lightweightChange.changedRegions.length >= 1);
  assert.equal(lightweightChange.metadata.changedRegionProjectionSummary.withProjection, lightweightChange.changedRegions.length);
  assert.equal(lightweightChange.metadata.changedRegionProjectionSummary.autoMergeClaims, 0);
  assert.equal(lightweightChange.changedRegions.every((region) => region.metadata.changedRegionProjection.reviewRequired === true), true);

  const sidecar = createSemanticImportSidecar(lightweight);
  assert.equal(sidecar.summary.emptySemanticIndex, false);
  assert.ok(sidecar.ownershipRegions.length >= 1);
  assert.ok(sidecar.patchHints.length >= 1);

  const featureEvidence = summarizeNativeImportFeatureEvidence(lightweight.losses, {
    evidence: lightweight.evidence
  });
  assert.equal(featureEvidence.total, 0);

  const projection = projectNativeImportToSource(lightweight, {
    ...(index % 4 === 0 ? { sourceText: lightweight.nativeSource.ast.metadata.sourceBytes ? lightBeforeSource(index) : undefined } : {})
  });
  assert.equal(projection.kind, 'frontier.lang.nativeSourceProjection');
  assert.equal(projection.mode, 'preserved-source');
  assert.ok(projection.sourceText.length > 0);

  assertNativeCompile(index, lightweight);
  assertTargetAdapterCompile(index, lightweight);
}

function assertNativeCompile(index, lightweight) {
  const nativeCompile = compileNativeSource(lightweight, {
    target: index % 2 === 0 ? 'javascript' : 'python'
  });
  assert.equal(nativeCompile.kind, 'frontier.lang.nativeSourceCompileResult');
  assert.equal(nativeCompile.outputMode, 'preserved-source');
  assert.equal(nativeCompile.targetCoverage.supported, true);
  assert.ok(nativeCompile.projectionMatrix.summary.sourceProjectionByLossClass.exactSourceProjection >= 1);
  assert.ok(nativeCompile.output.length > 0);
  assert.equal(nativeCompile.sourceMaps.length, 1);
  assert.ok(nativeCompile.sourceMap.mappings.length >= 1);
  assert.ok(nativeCompile.sourceMap.targetHash);
  assert.equal(nativeCompile.metadata.roundtripEvidence.status, 'preserved-source');
  assert.equal(nativeCompile.metadata.roundtripEvidence.output.sourceMaps.precision, 'exact');

  const blockedNativeCompile = compileNativeSource(lightweight, {
    target: index % 2 === 0 ? 'rust' : 'javascript'
  });
  assert.equal(blockedNativeCompile.readiness.readiness, 'blocked');
  assert.equal(blockedNativeCompile.ok, false);
  assert.equal(blockedNativeCompile.sourceMaps.length, 1);
  assert.ok(blockedNativeCompile.sourceMap.mappings.length >= 1);
  assert.equal(blockedNativeCompile.metadata.roundtripEvidence.status, 'blocked');
  assert.equal(blockedNativeCompile.metadata.roundtripEvidence.output.mode, 'target-stubs');
  assert.equal(blockedNativeCompile.metadata.roundtripEvidence.output.targetCoverageLossClass, 'missingAdapter');
}

function assertTargetAdapterCompile(index, lightweight) {
  if (index % 5 !== 0) return;
  const targetAdapter = {
    id: `fuzz-target-adapter-${index}`,
    sourceLanguage: lightweight.language,
    target: index % 2 === 0 ? 'rust' : 'javascript',
    coverage: {
      readiness: 'needs-review',
      handledLossKinds: ['dynamicRuntime', 'dynamicDispatch', 'typeInference', 'overloadResolution']
    },
    project() {
      return { output: `// fuzz target adapter ${index}\n`, readiness: 'needs-review' };
    }
  };
  const adapterNativeCompile = compileNativeSource(lightweight, {
    target: targetAdapter.target,
    targetAdapters: [targetAdapter]
  });
  assert.equal(adapterNativeCompile.outputMode, 'target-adapter');
  assert.equal(adapterNativeCompile.targetCoverage.lossClass, 'targetAdapterProjection');
  assert.ok(adapterNativeCompile.output.includes(`fuzz target adapter ${index}`));
  assert.equal(adapterNativeCompile.sourceMaps.length, 1);
  assert.ok(adapterNativeCompile.sourceMap.mappings.length >= 1);
  assert.equal(adapterNativeCompile.metadata.roundtripEvidence.status, 'target-adapter');
  assert.equal(adapterNativeCompile.metadata.roundtripEvidence.output.targetProjectionAdapterId, targetAdapter.id);
}

function lightLanguage(index) {
  return index % 2 === 0 ? 'javascript' : 'python';
}

function lightSourcePath(index) {
  return index % 2 === 0 ? `src/light-${index}.js` : `light-${index}.py`;
}

function lightBeforeSource(index) {
  return index % 2 === 0
    ? `export function light${index}() { return true; }\n`
    : `def light_${index}():\n    return True\n`;
}

function lightAfterSource(index) {
  return index % 2 === 0
    ? `export function light${index}() { return false; }\n`
    : `def light_${index}():\n    return False\n`;
}
