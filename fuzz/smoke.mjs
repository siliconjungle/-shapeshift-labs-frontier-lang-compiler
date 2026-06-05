import assert from 'node:assert/strict';
import {
  compileFrontierSource,
  createEstreeNativeImporterAdapter,
  createNativeImportCoverageMatrix,
  createSemanticImportSidecar,
  importNativeProject,
  importNativeSource,
  projectNativeImportToSource,
  runNativeImporterAdapter
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
  const projection = projectNativeImportToSource(lightweight, {
    ...(index % 4 === 0 ? { sourceText: lightweight.nativeSource.ast.metadata.sourceBytes ? (index % 2 === 0 ? `export function light${index}() { return true; }\n` : `def light_${index}():\n    return True\n`) : undefined } : {})
  });
  assert.equal(projection.kind, 'frontier.lang.nativeSourceProjection');
  assert.equal(projection.mode, 'preserved-source');
  assert.ok(projection.sourceText.length > 0);
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
const projectSidecar = createSemanticImportSidecar(project);
assert.equal(projectSidecar.summary.imports, 2);
assert.equal(projectSidecar.summary.emptySemanticIndex, false);
