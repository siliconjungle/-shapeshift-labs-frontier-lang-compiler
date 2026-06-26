import { assert } from './helpers.mjs';
import {
  createJsTsProjectMergeDeclarationGate,
  safeMergeJsTsProject
} from './compiler-api.mjs';

const tsModule = await import('typescript');
const typescript = tsModule.default ?? tsModule;

const declarationProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_declaration_output_clean',
  language: 'typescript',
  includeDeclarationOutput: true,
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
assert.equal(declarationProject.status, 'merged');
assert.equal(declarationProject.outputDeclarationGate.status, 'passed');
assert.equal(declarationProject.summary.outputDeclarations, 1);
assert.equal(declarationProject.outputDeclarationGate.declarationFiles[0].sourceText.includes('workerValue'), true);

const missingDeclarationCompilerProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_declaration_output_missing_compiler',
  language: 'typescript',
  requireDeclarationOutput: true,
  baseFiles: {
    'src/value.ts': 'export const value = 1;\n'
  },
  workerFiles: {
    'src/value.ts': 'export const value = 1;\n'
  },
  headFiles: {
    'src/value.ts': 'export const value = 1;\n'
  }
});
assert.equal(missingDeclarationCompilerProject.status, 'blocked');
assert.equal(missingDeclarationCompilerProject.outputDeclarationGate.status, 'blocked');
assert.equal(missingDeclarationCompilerProject.admission.reasonCodes.includes('project-declaration-output-unavailable'), true);

const syntaxDeclarationGate = createJsTsProjectMergeDeclarationGate({
  typescript,
  requireDeclarationOutput: true
}, [{
  sourcePath: 'src/broken.ts',
  sourceText: 'export const broken = ;\n'
}], 'syntax_declaration_gate');
assert.equal(syntaxDeclarationGate.status, 'blocked');
assert.equal(syntaxDeclarationGate.diagnostics.some((diagnostic) => diagnostic.code === 'TS1109'), true);
assert.equal(syntaxDeclarationGate.admission.reasonCodes.includes('project-declaration-diagnostic'), true);

const suppliedDeclarationGate = createJsTsProjectMergeDeclarationGate({
  outputDeclarations: {
    'src/value.d.ts': 'export declare const value = 1;\n'
  }
}, [{
  sourcePath: 'src/value.ts',
  language: 'typescript',
  sourceText: 'export const value = 1;\n'
}], 'supplied_declaration_gate');
assert.equal(suppliedDeclarationGate.status, 'passed');
assert.equal(suppliedDeclarationGate.summary.declarationFiles, 1);

const typeSyntaxDeclarationProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_declaration_output_type_syntax',
  language: 'typescript',
  includeDeclarationOutput: true,
  requireOutputDiagnostics: true,
  typescript,
  baseFiles: {},
  workerFiles: {
    'src/type-syntax.ts': [
      'export type Box<T extends string | number> = T extends string ? { kind: "s"; value: T } : { kind: "n"; value: T };',
      'export function tuple<const T extends readonly string[]>(value: T): T { return value; }',
      'export const palette = { tone: "blue", fixed: true } as const satisfies { tone: "blue" | "red"; fixed: boolean };',
      'export const coerced = "1" as unknown as number;',
      ''
    ].join('\n')
  },
  headFiles: {}
});
const typeSyntaxDeclarationText = typeSyntaxDeclarationProject.outputDeclarationGate.declarationFiles[0].sourceText;
assert.equal(typeSyntaxDeclarationProject.status, 'merged');
assert.equal(typeSyntaxDeclarationProject.outputDiagnosticsGate.status, 'passed');
assert.equal(typeSyntaxDeclarationProject.outputDeclarationGate.status, 'passed');
assert.equal(typeSyntaxDeclarationProject.outputDeclarationGate.evidence[0].kind, 'js-ts-project-declaration-output');
assert.equal(typeSyntaxDeclarationText.includes('export type Box<T extends string | number> = T extends string ?'), true);
assert.equal(typeSyntaxDeclarationText.includes('export declare function tuple<const T extends readonly string[]>(value: T): T;'), true);
assert.equal(typeSyntaxDeclarationText.includes('readonly tone: "blue";'), true);
assert.equal(typeSyntaxDeclarationText.includes('export declare const coerced: number;'), true);
