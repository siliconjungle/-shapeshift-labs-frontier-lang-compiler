import assert from 'node:assert/strict';
import {
  compileNativeSource,
  compileFrontierSource,
  createEstreeNativeImporterAdapter,
  createNativeImportCoverageMatrix,
  createProjectionTargetLossMatrix,
  createSemanticImportSidecar,
  importExternalSemanticIndex,
  importNativeProject,
  importNativeSource,
  projectNativeImportToSource,
  runNativeImporterAdapter,
  summarizeNativeImportFeatureEvidence
} from '../dist/index.js';

const targets = ['typescript', 'javascript', 'rust', 'python', 'c'];
for (let index = 0; index < 100; index += 1) {
  const source = `
module Fuzz${index} @id("mod_${index}")
type ItemInput @id("type_input_${index}") {
  value: Text
}
entity Item @id("ent_${index}") {
  value @id("field_value_${index}"): Text
}
action updateItem @id("action_${index}") {
  input ItemInput
  writes field_value_${index}
  returns Patch
}
`;
  const result = compileFrontierSource(source, { target: targets[index % targets.length] });
  assert.equal(result.ok, true);
  assert.ok(result.output.length > 0);
}

for (let index = 0; index < 40; index += 1) {
  const external = importExternalSemanticIndex({
    format: index % 2 === 0 ? 'lsp' : 'scip',
    language: index % 2 === 0 ? 'javascript' : 'rust',
    payload: index % 2 === 0
      ? {
        uri: `file:///repo/src/external-${index}.js`,
        languageId: 'javascript',
        documentSymbols: [{
          name: `external${index}`,
          kind: 12,
          range: { start: { line: index % 7, character: 0 }, end: { line: index % 7, character: 20 } }
        }],
        diagnostics: index % 9 === 0 ? [{ severity: 2, message: 'fuzz warning' }] : []
      }
      : {
        metadata: { project_root: '/repo' },
        documents: [{
          relative_path: `src/external-${index}.rs`,
          language: 'rust',
          occurrences: [{
            symbol: `scip-rust cargo fuzz 1.0.0 src/external-${index}.rs/ external${index}().`,
            range: [index % 5, 4, 12],
            symbol_roles: 1
          }]
        }]
      }
  });
  assert.equal(external.kind, 'frontier.lang.externalSemanticIndexImport');
  assert.ok(external.semanticIndex.documents.length >= 1);
  assert.ok(external.semanticIndex.symbols.length >= 1);
  assert.ok(external.summary.sourceMapMappings >= 1);
  assert.ok(['ready-with-losses', 'needs-review'].includes(external.readiness.readiness));
}

const estreeAdapter = createEstreeNativeImporterAdapter();
for (let index = 0; index < 50; index += 1) {
  const name = `fuzzImport${index}`;
  const sourcePath = `src/fuzz-${index}.js`;
  const imported = await runNativeImporterAdapter(estreeAdapter, {
    sourcePath,
    sourceText: `export function ${name}() { return ${index}; }\n`,
    adapterOptions: {
      ast: {
        type: 'Program',
        loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 48 } },
        body: [{
          type: 'FunctionDeclaration',
          id: { type: 'Identifier', name },
          loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 48 } }
        }]
      }
    }
  });
  assert.equal(imported.nativeAst.rootId.startsWith('native_program'), true);
  assert.equal(imported.semanticIndex.symbols.some((symbol) => symbol.name === name), true);
  assert.ok(imported.sourceMaps[0].mappings.length >= 1);
  assert.equal(imported.adapter.coverage.capabilityEvidence.declared.exactAst, true);
  assert.equal(imported.adapter.coverage.capabilityEvidence.observed.sourceRanges, true);
  assert.equal(imported.adapter.coverage.capabilityEvidence.gaps.includes('tokens'), true);

  const lightweight = importNativeSource({
    language: index % 2 === 0 ? 'javascript' : 'python',
    sourcePath: index % 2 === 0 ? `src/light-${index}.js` : `light-${index}.py`,
    sourceText: index % 2 === 0
      ? `export function light${index}() { return true; }\n`
      : `def light_${index}():\n    return True\n`
  });
  assert.ok(lightweight.semanticIndex.symbols.length >= 1);
  assert.ok(lightweight.mergeCandidates.length >= 1);
  assert.equal(lightweight.metadata.sourcePreservation.sourceHash, lightweight.nativeSource.sourceHash);
  assert.equal(lightweight.metadata.sourcePreservation.summary.exactSourceAvailable, true);
  const sidecar = createSemanticImportSidecar(lightweight);
  assert.equal(sidecar.summary.emptySemanticIndex, false);
  assert.ok(sidecar.ownershipRegions.length >= 1);
  assert.ok(sidecar.patchHints.length >= 1);
  const featureEvidence = summarizeNativeImportFeatureEvidence(lightweight.losses, {
    evidence: lightweight.evidence
  });
  assert.equal(featureEvidence.total, 0);
  const projection = projectNativeImportToSource(lightweight, {
    ...(index % 4 === 0 ? { sourceText: lightweight.nativeSource.ast.metadata.sourceBytes ? (index % 2 === 0 ? `export function light${index}() { return true; }\n` : `def light_${index}():\n    return True\n`) : undefined } : {})
  });
  assert.equal(projection.kind, 'frontier.lang.nativeSourceProjection');
  assert.equal(projection.mode, 'preserved-source');
  assert.ok(projection.sourceText.length > 0);
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
  const blockedNativeCompile = compileNativeSource(lightweight, {
    target: index % 2 === 0 ? 'rust' : 'javascript'
  });
  assert.equal(blockedNativeCompile.readiness.readiness, 'blocked');
  assert.equal(blockedNativeCompile.ok, false);
  assert.equal(blockedNativeCompile.sourceMaps.length, 1);
  assert.ok(blockedNativeCompile.sourceMap.mappings.length >= 1);
  if (index % 5 === 0) {
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
  }
}

const project = await importNativeProject({
  sources: [{
    language: 'javascript',
    sourcePath: 'src/project-fuzz.js',
    sourceText: 'export function projectFuzz() {}\n'
  }, {
    language: 'python',
    sourcePath: 'project_fuzz.py',
    sourceText: 'def project_fuzz():\n    return True\n'
  }]
});
assert.equal(project.kind, 'frontier.lang.projectImportResult');
assert.equal(project.imports.length, 2);
assert.ok(project.semanticIndex.symbols.length >= 2);
const matrix = createNativeImportCoverageMatrix({ imports: project.imports });
assert.equal(matrix.summary.imports, 2);
assert.ok(matrix.languages.find((entry) => entry.language === 'javascript').imports.symbols >= 1);
assert.ok(matrix.languages.find((entry) => entry.language === 'python').imports.symbols >= 1);
const projectionMatrix = createProjectionTargetLossMatrix({ imports: project.imports });
assert.equal(projectionMatrix.summary.languages, matrix.summary.languages);
assert.ok(projectionMatrix.summary.sourceProjectionByLossClass.exactSourceProjection >= 2);
assert.ok(projectionMatrix.summary.byLossClass.missingAdapter > 0);
const projectSidecar = createSemanticImportSidecar(project);
assert.equal(projectSidecar.summary.imports, 2);
assert.equal(projectSidecar.summary.emptySemanticIndex, false);
