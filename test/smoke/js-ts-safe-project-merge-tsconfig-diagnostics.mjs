import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { assert } from './helpers.mjs';
import { createJsTsProjectReferenceCompositeProof, safeMergeJsTsProject } from './compiler-api.mjs';

const tsModule = await import('typescript');
const typescript = tsModule.default ?? tsModule;

const strictOptionBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_output_diagnostics_strict_option_blocked',
  language: 'typescript',
  requireOutputDiagnostics: true,
  typescript,
  tsconfig: {
    compilerOptions: {
      strict: true
    }
  },
  baseFiles: {},
  workerFiles: {
    'src/value.ts': 'const maybe: string | undefined = undefined;\nexport const value: string = maybe;\n'
  },
  headFiles: {}
});
assert.equal(strictOptionBlockedProject.status, 'blocked');
assert.equal(strictOptionBlockedProject.outputDiagnosticsGate.diagnostics.some((diagnostic) => diagnostic.code === 'TS2322'), true);
assert.equal(strictOptionBlockedProject.outputDiagnosticsGate.metadata.compilerOptions.strict, true);
assert.equal(strictOptionBlockedProject.metadata.outputCompilerOptions.strict, true);
assert.equal(strictOptionBlockedProject.outputDiagnosticsGate.metadata.compilerOptionSources.some((source) => (
  source.source === 'tsconfig.compilerOptions' && source.compilerOptions.strict === true
)), true);

const jsxBundlerSource = 'export {};\ndeclare global { namespace JSX { interface IntrinsicElements { div: {}; } } }\nexport const view = <div />;\n';
const jsxBundlerOptionProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_output_diagnostics_jsx_bundler_options_clean',
  language: 'typescript',
  requireOutputDiagnostics: true,
  typescript,
  tsconfig: {
    compilerOptions: {
      jsx: 'preserve',
      module: 'esnext',
      moduleResolution: 'bundler'
    }
  },
  baseFiles: {},
  workerFiles: {
    'src/view.tsx': jsxBundlerSource
  },
  headFiles: {},
  globalAugmentationCompatibilityProof: globalProof('src/view.tsx', jsxBundlerSource)
});
assert.equal(jsxBundlerOptionProject.status, 'merged');
assert.equal(jsxBundlerOptionProject.outputDiagnosticsGate.status, 'passed');
assert.equal(jsxBundlerOptionProject.outputDiagnosticsGate.metadata.compilerOptions.jsx, typescript.JsxEmit.Preserve);
assert.equal(jsxBundlerOptionProject.outputDiagnosticsGate.metadata.compilerOptions.moduleResolution, typescript.ModuleResolutionKind.Bundler);
assert.equal(jsxBundlerOptionProject.outputDiagnosticsGate.metadata.compilerOptionSources.some((source) => (
  source.source === 'tsconfig.compilerOptions'
    && source.compilerOptions.jsx === 'preserve'
    && source.compilerOptions.moduleResolution === 'bundler'
)), true);

const verbatimModuleSyntaxBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_output_diagnostics_verbatim_module_syntax_blocked',
  language: 'typescript',
  requireOutputDiagnostics: true,
  typescript,
  tsconfig: {
    compilerOptions: {
      module: 'esnext',
      moduleResolution: 'bundler',
      verbatimModuleSyntax: true
    }
  },
  baseFiles: {
    'src/types.ts': 'export interface Token { id: string }\n',
    'src/consumer.ts': "import { Token } from './types.js';\nexport type Box = Token;\n"
  },
  workerFiles: {
    'src/types.ts': 'export interface Token { id: string }\n',
    'src/consumer.ts': "import { Token } from './types.js';\nexport type Box = Token;\nexport type WorkerBox = { token: Token };\n"
  },
  headFiles: {
    'src/types.ts': 'export interface Token { id: string }\n',
    'src/consumer.ts': "import { Token } from './types.js';\nexport type Box = Token;\n"
  }
});
assert.equal(verbatimModuleSyntaxBlockedProject.status, 'blocked');
assert.equal(verbatimModuleSyntaxBlockedProject.outputDiagnosticsGate.diagnostics.some((diagnostic) => diagnostic.code === 'TS1484'), true);
assert.equal(verbatimModuleSyntaxBlockedProject.outputDiagnosticsGate.metadata.compilerOptions.verbatimModuleSyntax, true);

const checkJsBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_output_diagnostics_check_js_blocked',
  language: 'javascript',
  requireOutputDiagnostics: true,
  typescript,
  tsconfig: {
    compilerOptions: {
      allowJs: true,
      checkJs: true
    }
  },
  baseFiles: {},
  workerFiles: {
    'src/value.js': '/** @type {number} */\nexport const value = "not a number";\n'
  },
  headFiles: {}
});
assert.equal(checkJsBlockedProject.status, 'blocked');
assert.equal(checkJsBlockedProject.outputDiagnosticsGate.diagnostics.some((diagnostic) => diagnostic.code === 'TS2322'), true);
assert.equal(checkJsBlockedProject.outputDiagnosticsGate.metadata.compilerOptions.allowJs, true);
assert.equal(checkJsBlockedProject.outputDiagnosticsGate.metadata.compilerOptions.checkJs, true);

function globalProof(sourcePath, sourceText) {
  return {
    schema: 'frontier.lang.globalAugmentationCompatibilityProof.v1',
    version: 1,
    status: 'passed',
    surfaceKind: 'global-augmentation',
    sourcePath,
    sourceHash: hashSemanticValue(sourceText),
    moduleName: 'global',
    declarationOutputGateId: 'declaration-output',
    declarationOutputHash: 'declaration-boundary-hash',
    consumerDiagnosticsGateId: 'consumer-diagnostics',
    consumerDiagnosticsHash: 'consumer-diagnostics-hash',
    consumerEntrypoints: [sourcePath],
    consumerDiagnosticsPassed: true,
    globalCompatibilityClaim: 'declaration-boundary-consumer-diagnostics-only',
    hostRuntimeInteractionClaim: false,
    autoMergeClaim: false,
    runtimeEquivalenceClaim: false,
    semanticEquivalenceClaim: false
  };
}

const unresolvedProjectReferenceBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_output_diagnostics_unresolved_project_reference_blocked',
  language: 'typescript',
  requireOutputDiagnostics: true,
  typescript,
  tsconfig: {
    references: [{ path: '../pkg-a' }],
    compilerOptions: {
      module: 'esnext'
    }
  },
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
assert.equal(unresolvedProjectReferenceBlockedProject.status, 'blocked');
assert.equal(unresolvedProjectReferenceBlockedProject.outputDiagnosticsGate.diagnostics.some((diagnostic) => (
  diagnostic.code === 'TS6053' && diagnostic.source === 'typescript-project-references'
)), true);
assert.equal(unresolvedProjectReferenceBlockedProject.outputDiagnosticsGate.metadata.projectReferenceCount, 1);
assert.equal(unresolvedProjectReferenceBlockedProject.outputDiagnosticsGate.metadata.projectReferences[0].path, '../pkg-a');
assert.equal(unresolvedProjectReferenceBlockedProject.metadata.outputProjectReferenceCount, 1);

const referencedProject = {
  path: '../pkg-a',
  tsconfigPath: '../pkg-a/tsconfig.json',
  compilerOptions: {
    composite: true,
    declaration: true
  },
  sourceFiles: {
    '../pkg-a/src/index.ts': 'export interface Token { id: string }\n'
  },
  declarationFiles: {
    '../pkg-a/dist/index.d.ts': 'export interface Token { id: string }\n'
  }
};
const projectReferenceProof = createJsTsProjectReferenceCompositeProof({
  id: 'project_reference_composite_positive',
  tsconfig: {
    references: [{ path: '../pkg-a' }]
  },
  referencedProjects: [referencedProject]
});
assert.equal(projectReferenceProof.status, 'passed');
assert.equal(projectReferenceProof.sourceFileCount, 1);
assert.equal(projectReferenceProof.declarationFileCount, 1);
assert.equal(projectReferenceProof.autoMergeClaim, false);
assert.equal(projectReferenceProof.semanticEquivalenceClaim, false);
assert.equal(projectReferenceProof.buildModeEquivalenceClaim, false);

const provedProjectReferenceProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_output_diagnostics_project_reference_proof_admitted',
  language: 'typescript',
  requireOutputDiagnostics: true,
  typescript,
  tsconfig: {
    references: [{ path: '../pkg-a' }],
    compilerOptions: {
      module: 'esnext'
    }
  },
  referencedProjects: [referencedProject],
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
assert.equal(provedProjectReferenceProject.status, 'merged');
assert.equal(provedProjectReferenceProject.projectReferenceCompositeProof.status, 'passed');
assert.equal(provedProjectReferenceProject.outputDiagnosticsGate.status, 'passed');
assert.equal(provedProjectReferenceProject.outputDiagnosticsGate.diagnostics.some((diagnostic) => diagnostic.code === 'TS6053'), false);
assert.equal(provedProjectReferenceProject.outputDiagnosticsGate.metadata.projectReferenceCompositeProof.status, 'passed');
assert.equal(provedProjectReferenceProject.outputDiagnosticsGate.metadata.projectReferenceCompositeProof.suppressedDiagnostics >= 1, true);
assert.equal(provedProjectReferenceProject.proofEvidence.summary.passedLevels.includes('project-reference-composite-boundary'), true);
assert.equal(provedProjectReferenceProject.metadata.projectReferenceCompositeProofStatus, 'passed');

const staleReferencedProject = {
  ...referencedProject,
  sourceFiles: {
    '../pkg-a/src/index.ts': 'export interface Token { id: number }\n'
  }
};
const staleProjectReferenceProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_output_diagnostics_project_reference_stale_proof_blocked',
  language: 'typescript',
  requireOutputDiagnostics: true,
  typescript,
  tsconfig: {
    references: [{ path: '../pkg-a' }],
    compilerOptions: {
      module: 'esnext'
    }
  },
  projectReferenceCompositeProof: projectReferenceProof,
  referencedProjects: [staleReferencedProject],
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
assert.equal(staleProjectReferenceProject.status, 'blocked');
assert.equal(staleProjectReferenceProject.projectReferenceCompositeProof.status, 'failed');
assert.equal(staleProjectReferenceProject.projectReferenceCompositeProof.reasonCodes.includes('typescript-project-reference-boundary-hash-mismatch'), true);
assert.equal(staleProjectReferenceProject.outputDiagnosticsGate.diagnostics.some((diagnostic) => (
  diagnostic.code === 'TSFRP001' && diagnostic.source === 'typescript-project-reference-composite-proof'
)), true);
