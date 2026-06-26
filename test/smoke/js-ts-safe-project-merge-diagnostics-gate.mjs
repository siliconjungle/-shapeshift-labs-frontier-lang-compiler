import { assert } from './helpers.mjs';
import {
  createJsTsProjectMergeDiagnosticsGate,
  safeMergeJsTsSource,
  safeMergeJsTsProject
} from './compiler-api.mjs';

const tsModule = await import('typescript');
const typescript = tsModule.default ?? tsModule;

const cleanProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_output_diagnostics_clean',
  language: 'typescript',
  requireOutputDiagnostics: true,
  typescript,
  baseFiles: {
    'src/value.ts': 'export const value: number = 1;\n'
  },
  workerFiles: {
    'src/value.ts': 'export const value: number = 1;\nexport const workerValue: number = value + 1;\n'
  },
  headFiles: {
    'src/value.ts': 'export const value: number = 1;\n'
  }
});
assert.equal(cleanProject.status, 'merged');
assert.equal(cleanProject.outputDiagnosticsGate.status, 'passed');
assert.equal(cleanProject.summary.outputDiagnosticErrors, 0);

const cleanSourceSyntaxGate = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_merged_output_syntax_clean',
  language: 'typescript',
  sourcePath: 'src/value.ts',
  requireOutputSyntaxDiagnostics: true,
  outputSyntaxDiagnostics: [],
  baseSourceText: 'export const value = 1;\n',
  workerSourceText: 'export const value = 1;\nexport const workerValue = value + 1;\n',
  headSourceText: 'export const value = 1;\n'
});
assert.equal(cleanSourceSyntaxGate.status, 'merged');
assert.equal(cleanSourceSyntaxGate.mergedSourceText, 'export const value = 1;\nexport const workerValue = value + 1;\n');

const sourceSyntaxMissing = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_merged_output_syntax_missing',
  language: 'typescript',
  sourcePath: 'src/value.ts',
  requireOutputSyntaxDiagnostics: true,
  baseSourceText: 'export const value = 1;\n',
  workerSourceText: 'export const value = 1;\nexport const workerValue = value + 1;\n',
  headSourceText: 'export const value = 1;\n'
});
assert.equal(sourceSyntaxMissing.status, 'blocked');
assert.equal(sourceSyntaxMissing.admission.reasonCodes.includes('merged-output-syntax-diagnostics-unavailable'), true);

const sourceSyntaxBlocked = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_merged_output_syntax_blocked',
  language: 'typescript',
  sourcePath: 'src/value.ts',
  outputSyntaxDiagnostics: [{
    code: 'BABEL_PARSE',
    severity: 'error',
    phase: 'syntax',
    source: 'babel-parser',
    message: 'Unexpected token',
    sourcePath: 'src/value.ts',
    line: 2,
    column: 28
  }],
  baseSourceText: 'export const value = 1;\n',
  workerSourceText: 'export const value = 1;\nexport const workerValue = value + 1;\n',
  headSourceText: 'export const value = 1;\n'
});
assert.equal(sourceSyntaxBlocked.status, 'blocked');
assert.equal(sourceSyntaxBlocked.admission.reasonCodes.includes('merged-output-syntax-diagnostic'), true);
assert.equal(sourceSyntaxBlocked.conflicts[0].side, 'merged');

const cleanCrossFileProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_output_diagnostics_clean_cross_file',
  language: 'typescript',
  requireOutputDiagnostics: true,
  typescript,
  baseFiles: {
    'src/value.ts': 'export const value: number = 1;\n',
    'src/consumer.ts': "import { value } from './value.js';\nexport const total = value + 1;\n"
  },
  workerFiles: {
    'src/value.ts': 'export const value: number = 1;\n',
    'src/consumer.ts': "import { value } from './value.js';\nexport const total = value + 2;\n"
  },
  headFiles: {
    'src/value.ts': 'export const value: number = 1;\n',
    'src/consumer.ts': "import { value } from './value.js';\nexport const total = value + 1;\n"
  }
});
assert.equal(cleanCrossFileProject.status, 'merged');
assert.equal(cleanCrossFileProject.outputDiagnosticsGate.status, 'passed');
assert.equal(cleanCrossFileProject.outputDiagnosticsGate.diagnostics.length, 0);

const missingCompilerProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_output_diagnostics_missing_compiler',
  language: 'typescript',
  requireOutputDiagnostics: true,
  baseFiles: {
    'src/value.ts': 'export const value = 1;\n'
  },
  workerFiles: {
    'src/value.ts': 'export const value = 1;\nexport const workerValue = value + 1;\n'
  },
  headFiles: {
    'src/value.ts': 'export const value = 1;\n'
  }
});
assert.equal(missingCompilerProject.status, 'blocked');
assert.equal(missingCompilerProject.outputDiagnosticsGate.status, 'blocked');
assert.equal(missingCompilerProject.admission.reasonCodes.includes('project-output-diagnostics-unavailable'), true);

const missingSyntaxCompilerProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_output_syntax_missing_compiler',
  language: 'typescript',
  requireOutputSyntaxDiagnostics: true,
  baseFiles: {
    'src/value.ts': 'export const value = 1;\n'
  },
  workerFiles: {
    'src/value.ts': 'export const value = 1;\nexport const workerValue = value + 1;\n'
  },
  headFiles: {
    'src/value.ts': 'export const value = 1;\n'
  }
});
assert.equal(missingSyntaxCompilerProject.status, 'blocked');
assert.equal(missingSyntaxCompilerProject.outputDiagnosticsGate.status, 'blocked');
assert.equal(missingSyntaxCompilerProject.admission.reasonCodes.includes('project-output-syntax-diagnostics-unavailable'), true);

const syntaxBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_output_diagnostics_syntax_blocked',
  language: 'typescript',
  requireOutputDiagnostics: true,
  typescript,
  baseFiles: {},
  workerFiles: {
    'src/broken.ts': 'export const broken = ;\n'
  },
  headFiles: {}
});
assert.equal(syntaxBlockedProject.status, 'blocked');
assert.equal(syntaxBlockedProject.admission.reasonCodes.includes('project-output-syntax-diagnostic'), true);
assert.equal(syntaxBlockedProject.outputDiagnosticsGate.diagnostics.some((diagnostic) => diagnostic.code === 'TS1109'), true);
assert.equal(syntaxBlockedProject.outputDiagnosticsGate.diagnostics.some((diagnostic) => diagnostic.phase === 'syntax'), true);
assert.equal(syntaxBlockedProject.outputDiagnosticsGate.conflicts[0].code, 'project-output-syntax-diagnostic');

const semanticBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_output_diagnostics_semantic_blocked',
  language: 'typescript',
  requireOutputDiagnostics: true,
  typescript,
  baseFiles: {
    'src/value.ts': 'export const value: number = 1;\n'
  },
  workerFiles: {
    'src/value.ts': 'export const value: number = 1;\nexport const workerValue: string = value;\n'
  },
  headFiles: {
    'src/value.ts': 'export const value: number = 1;\n'
  }
});
assert.equal(semanticBlockedProject.status, 'blocked');
assert.equal(semanticBlockedProject.outputDiagnosticsGate.diagnostics.some((diagnostic) => diagnostic.code === 'TS2322'), true);
assert.equal(semanticBlockedProject.summary.outputDiagnosticErrors >= 1, true);

const missingImportBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_output_diagnostics_missing_import_blocked',
  language: 'typescript',
  requireOutputDiagnostics: true,
  typescript,
  baseFiles: {},
  workerFiles: {
    'src/consumer.ts': "import { missing } from './missing.js';\nexport const total = missing + 1;\n"
  },
  headFiles: {}
});
assert.equal(missingImportBlockedProject.status, 'blocked');
assert.equal(missingImportBlockedProject.outputDiagnosticsGate.diagnostics.some((diagnostic) => diagnostic.code === 'TS2307'), true);
assert.equal(missingImportBlockedProject.admission.reasonCodes.includes('project-output-diagnostic'), true);

const movedExportBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_output_diagnostics_moved_export_blocked',
  language: 'typescript',
  requireOutputDiagnostics: true,
  typescript,
  baseFiles: {},
  workerFiles: {
    'src/api.ts': 'export const stableApi = 1;\n',
    'src/new-api.ts': 'export const moved = 1;\n',
    'src/consumer.ts': "import { moved } from './api.js';\nexport const total = moved + 1;\n"
  },
  headFiles: {}
});
assert.equal(movedExportBlockedProject.status, 'blocked');
assert.equal(movedExportBlockedProject.outputDiagnosticsGate.diagnostics.some((diagnostic) => diagnostic.code === 'TS2305'), true);
assert.equal(movedExportBlockedProject.admission.reasonCodes.includes('project-output-diagnostic'), true);

const typeValueNamespaceBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_output_diagnostics_type_value_namespace_blocked',
  language: 'typescript',
  requireOutputDiagnostics: true,
  typescript,
  baseFiles: {
    'src/types.ts': 'export interface Token { id: string }\n',
    'src/consumer.ts': "import type { Token } from './types.js';\nexport type Box = { token: Token };\n"
  },
  workerFiles: {
    'src/types.ts': 'export interface Token { id: string }\n',
    'src/consumer.ts': "import type { Token } from './types.js';\nexport type Box = { token: Token };\nexport const runtimeToken = Token;\n"
  },
  headFiles: {
    'src/types.ts': 'export interface Token { id: string }\n',
    'src/consumer.ts': "import type { Token } from './types.js';\nexport type Box = { token: Token };\n"
  }
});
assert.equal(typeValueNamespaceBlockedProject.status, 'blocked');
assert.equal(typeValueNamespaceBlockedProject.outputDiagnosticsGate.diagnostics.some((diagnostic) => diagnostic.code === 'TS1361' || diagnostic.code === 'TS2693'), true);
assert.equal(typeValueNamespaceBlockedProject.admission.reasonCodes.includes('project-output-diagnostic'), true);

const inferenceAffectingTypeSyntaxBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_output_diagnostics_type_syntax_blocked',
  language: 'typescript',
  requireOutputDiagnostics: true,
  typescript,
  baseFiles: {},
  workerFiles: {
    'src/type-syntax.ts': [
      'type Shape = { id: string };',
      'export const config = { id: 1 } satisfies Shape;',
      'export const asserted = "x" as number;',
      'export function read<T extends { id: string }>(value: T): string { return value.slug; }',
      'export type OnlyString<T> = T extends string ? T : never;',
      'export const only: OnlyString<number> = "x";',
      'export const tuple = ["red", "blue"] as const;',
      'export const first: "red" = tuple[1];',
      ''
    ].join('\n')
  },
  headFiles: {}
});
const inferenceTypeSyntaxDiagnosticCodes = inferenceAffectingTypeSyntaxBlockedProject.outputDiagnosticsGate.diagnostics.map((diagnostic) => diagnostic.code);
assert.equal(inferenceAffectingTypeSyntaxBlockedProject.status, 'blocked');
assert.equal(inferenceAffectingTypeSyntaxBlockedProject.outputDiagnosticsGate.metadata.diagnosticSource, 'typescript-compiler-api');
assert.equal(inferenceTypeSyntaxDiagnosticCodes.includes('TS2322'), true);
assert.equal(inferenceTypeSyntaxDiagnosticCodes.includes('TS2352'), true);
assert.equal(inferenceTypeSyntaxDiagnosticCodes.includes('TS2339'), true);
assert.equal(inferenceAffectingTypeSyntaxBlockedProject.admission.reasonCodes.includes('project-output-diagnostic'), true);

const suppliedDiagnosticsGate = createJsTsProjectMergeDiagnosticsGate({
  outputDiagnostics: [{
    code: 'CUSTOM001',
    severity: 'error',
    message: 'supplied gate error',
    sourcePath: 'src/value.ts'
  }]
}, [{
  sourcePath: 'src/value.ts',
  language: 'typescript',
  sourceText: 'export const value = 1;\n'
}], 'supplied_gate');
assert.equal(suppliedDiagnosticsGate.status, 'blocked');
assert.equal(suppliedDiagnosticsGate.admission.reasonCodes.includes('project-output-diagnostic'), true);

const suppliedSyntaxDiagnosticsGate = createJsTsProjectMergeDiagnosticsGate({
  outputSyntaxDiagnostics: [{
    code: 'BABEL_PARSE',
    severity: 'error',
    message: 'Unexpected token',
    sourcePath: 'src/value.ts'
  }]
}, [{
  sourcePath: 'src/value.ts',
  language: 'typescript',
  sourceText: 'export const value = ;\n'
}], 'supplied_syntax_gate');
assert.equal(suppliedSyntaxDiagnosticsGate.status, 'blocked');
assert.equal(suppliedSyntaxDiagnosticsGate.admission.reasonCodes.includes('project-output-syntax-diagnostic'), true);
assert.equal(suppliedSyntaxDiagnosticsGate.summary.syntaxErrors, 1);
