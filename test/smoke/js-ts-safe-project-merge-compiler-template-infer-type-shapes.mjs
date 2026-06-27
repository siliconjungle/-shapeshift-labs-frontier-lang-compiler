import { assert } from './helpers.mjs';
import { publicCompilerTypeDeltaConflicts } from '../../src/js-ts-safe-project-merge-graph-delta-compiler-conflicts.js';
import {
  createTypeScriptCompilerNativeImporterAdapter,
  runNativeImporterAdapter,
  safeMergeJsTsProject
} from './compiler-api.mjs';
import { typeScriptProgramForFiles } from './js-ts-compiler-program-helpers.mjs';

const tsModule = await import('typescript');
const typescript = tsModule.default ?? tsModule;

const templateBaseGraph = await compilerGraph({ 'src/template.ts': templateLiteralSource('string') }, 'template_base');
const templateChangedGraph = await compilerGraph({ 'src/template.ts': templateLiteralSource('number') }, 'template_changed');
const templateRecord = publicType(templateChangedGraph, 'Route');
assert.equal(templateRecord?.templateLiteralTypeCount, 1);
assert.equal(templateRecord?.typeEquivalenceStatus, 'compiler-backed-equivalent');
assert.equal(templateRecord?.typeEquivalenceProof?.kind, 'typescript-checker-public-api-template-literal-type-shape-equivalence');
assert.equal(templateRecord?.typeEquivalenceProof?.status, 'passed');
assert.equal(templateRecord?.typeEquivalenceProof?.semanticEquivalenceClaim, false);
assert.equal(typeof templateRecord?.typeEquivalenceTemplateLiteralTypeSetHash, 'string');
assert.equal(templateRecord?.typeEquivalenceProof?.templateLiteralTypeSetHash, templateRecord?.typeEquivalenceTemplateLiteralTypeSetHash);
assert.equal(templateRecord?.typeEquivalenceCheckerEvidence?.templateLiteralTypeSpanTypeTexts?.length, 1);
assert.equal(templateRecord?.typeEquivalenceCheckerEvidence?.templateLiteralTypeLiteralTexts?.[0]?.[0], 'route:');
assert.equal(templateRecord?.advancedTypeSourceBoundProof?.status, 'passed');
assert.equal(templateRecord?.advancedTypeSourceBoundProof?.sourcePath, 'src/template.ts');
assert.equal(templateRecord?.advancedTypeSourceBoundProof?.sourceHash, templateRecord?.sourceHash);
assert.equal(templateRecord?.advancedTypeSourceBoundProof?.semanticEquivalenceClaim, false);
assert.equal(publicCompilerTypeDeltaConflicts(templateBaseGraph, templateChangedGraph, templateChangedGraph, templateChangedGraph).length, 0);

const templateMissingProofGraph = await compilerGraph(
  { 'src/template.ts': templateLiteralSource('number') },
  'template_missing_span_type',
  (imports) => importsWithoutShapeKey(imports, 'template-literal-type', 'templateSpanTypeTexts')
);
assertMissingSignal(
  publicCompilerTypeDeltaConflicts(templateBaseGraph, templateMissingProofGraph, templateMissingProofGraph, templateMissingProofGraph),
  'compiler-template-literal-type-span-type-texts'
);

const inferBaseGraph = await compilerGraph({ 'src/infer.ts': inferSource('Promise') }, 'infer_base');
const inferChangedGraph = await compilerGraph({ 'src/infer.ts': inferSource('Array') }, 'infer_changed');
const inferRecord = publicType(inferChangedGraph, 'Unwrap');
assert.equal(inferRecord?.inferTypeCount, 1);
assert.equal(inferRecord?.conditionalTypeCount, 1);
assert.equal(inferRecord?.typeEquivalenceStatus, 'compiler-backed-equivalent');
assert.equal(inferRecord?.typeEquivalenceProof?.kind, 'typescript-checker-public-api-advanced-type-shape-set-equivalence');
assert.equal(inferRecord?.typeEquivalenceProof?.status, 'passed');
assert.equal(typeof inferRecord?.typeEquivalenceInferTypeSetHash, 'string');
assert.equal(inferRecord?.typeEquivalenceProof?.inferTypeSetHash, inferRecord?.typeEquivalenceInferTypeSetHash);
assert.equal(inferRecord?.typeEquivalenceCheckerEvidence?.inferTypeTypeParameterNames?.[0], 'Value');
assert.equal(publicCompilerTypeDeltaConflicts(inferBaseGraph, inferChangedGraph, inferChangedGraph, inferChangedGraph).length, 0);

const inferMissingProofGraph = await compilerGraph(
  { 'src/infer.ts': inferSource('Array') },
  'infer_missing_parameter_name',
  (imports) => importsWithoutShapeKey(imports, 'infer-type', 'typeParameterName')
);
assertMissingSignal(
  publicCompilerTypeDeltaConflicts(inferBaseGraph, inferMissingProofGraph, inferMissingProofGraph, inferMissingProofGraph),
  'compiler-infer-type-type-parameter-names'
);

function assertMissingSignal(conflicts, signal) {
  const conflict = conflicts.find((item) => item.details?.reasonCode === 'typescript-public-api-type-equivalence-proof-missing');
  assert.equal(Boolean(conflict), true);
  assert.equal(conflict.details.typeEquivalenceEvidence.missingRecords.some((record) => (
    record.missingSignals?.includes(signal)
  )), true);
  assert.equal(conflict.details.typeEquivalenceEvidence.missingRecords.some((record) => (
    record.advancedTypeSourceBoundProof?.status === 'failed'
      && record.advancedTypeSourceBoundProof?.missingSignals?.includes(signal)
  )), true);
}

function templateLiteralSource(spanType) {
  return [`export type Route = \`route:\${${spanType}}\`;`, ''].join('\n');
}

function inferSource(containerName) {
  return [`export type Unwrap<T> = T extends ${containerName}<infer Value> ? Value : T;`, ''].join('\n');
}

function publicType(graph, symbolName) {
  return graph.compilerTypeRecords.find((record) => record.publicContract && record.symbolName === symbolName);
}

async function compilerGraph(files, id, transformImports = (imports) => imports) {
  const project = safeMergeJsTsProject({
    id: `js_ts_project_safe_merge_compiler_template_infer_type_shapes_${id}`,
    language: 'typescript',
    includeOutputProjectSymbolGraph: true,
    outputProjectImports: transformImports(await importsForFiles(files)),
    baseFiles: {},
    workerFiles: {},
    headFiles: files
  });
  assert.equal(project.status, 'merged');
  assert.equal(project.admission.semanticEquivalenceClaim, false);
  return project.outputProjectSymbolGraph;
}

function importsWithoutShapeKey(imports, kind, key) {
  return imports.map((importResult) => ({
    ...importResult,
    semanticIndex: importResult.semanticIndex ? {
      ...importResult.semanticIndex,
      facts: (importResult.semanticIndex.facts ?? []).map((fact) => fact.predicate === 'compilerType'
        ? {
            ...fact,
            value: {
              ...fact.value,
              advancedTypeShapes: (fact.value?.advancedTypeShapes ?? []).map((shape) => shape.kind === kind
                ? omitKey(shape, key)
                : shape)
            }
          }
        : fact)
    } : importResult.semanticIndex
  }));
}

function omitKey(value, key) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const { [key]: _omitted, ...rest } = value;
  return rest;
}

async function importsForFiles(files) {
  const program = typeScriptProgramForFiles(typescript, files);
  const adapter = createTypeScriptCompilerNativeImporterAdapter({ typescript, program });
  return Promise.all(Object.entries(files).map(([sourcePath, sourceText]) => runNativeImporterAdapter(adapter, {
    language: 'typescript',
    sourcePath,
    sourceText,
    adapterOptions: { sourceFile: program.getSourceFile(sourcePath) }
  })));
}
