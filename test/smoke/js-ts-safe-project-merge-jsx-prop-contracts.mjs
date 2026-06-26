import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';

const jsxPropContractBaseSource = 'type ButtonProps = { tone: "neutral" | "accent"; size: "m" | "l" };\nfunction Button(_props: ButtonProps) { return null; }\nexport function View() {\n  return <Button tone="neutral" size="m" />;\n}\n';
const jsxPropContractWorkerSource = jsxPropContractBaseSource.replace('tone="neutral"', 'tone="danger"');
const jsxPropContractHeadSource = jsxPropContractBaseSource.replace('size="m"', 'size="l"');

const jsxPropContractSuppliedDiagnosticProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_prop_contract_supplied_diagnostic_blocked',
  language: 'tsx',
  baseFiles: {
    'src/view.tsx': jsxPropContractBaseSource
  },
  workerFiles: {
    'src/view.tsx': jsxPropContractWorkerSource
  },
  headFiles: {
    'src/view.tsx': jsxPropContractHeadSource
  },
  outputDiagnostics: [{
    code: 'TS2322',
    severity: 'error',
    message: 'Type "danger" is not assignable to type "neutral" | "accent".',
    sourcePath: 'src/view.tsx'
  }]
});
assert.equal(jsxPropContractSuppliedDiagnosticProject.status, 'blocked');
assert.equal(jsxPropContractSuppliedDiagnosticProject.admission.reasonCodes.includes('project-output-diagnostic'), true);
assert.equal(jsxPropContractSuppliedDiagnosticProject.outputDiagnosticsGate.summary.jsxComponentPropContractCandidates, 1);
assert.equal(
  jsxPropContractSuppliedDiagnosticProject.outputDiagnosticsGate.conflicts[0].details.jsxComponentPropContracts[0].tagName,
  'Button'
);

const jsxPropContractCleanDiagnosticsProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_prop_contract_clean_diagnostics_admitted',
  language: 'tsx',
  baseFiles: {
    'src/view.tsx': jsxPropContractBaseSource
  },
  workerFiles: {
    'src/view.tsx': jsxPropContractWorkerSource
  },
  headFiles: {
    'src/view.tsx': jsxPropContractHeadSource
  },
  outputDiagnostics: []
});
const jsxPropContractCleanFile = jsxPropContractCleanDiagnosticsProject.files.find((file) => file.sourcePath === 'src/view.tsx');
assert.equal(jsxPropContractCleanDiagnosticsProject.status, 'merged');
assert.equal(jsxPropContractCleanDiagnosticsProject.outputDiagnosticsGate.status, 'passed');
assert.equal(jsxPropContractCleanDiagnosticsProject.outputDiagnosticsGate.summary.jsxComponentPropContractCandidates, 1);
assert.equal(jsxPropContractCleanFile.result.summary.jsxAttributeEdits, 1);

const jsxPropContractMissingEvidenceProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_prop_contract_missing_evidence_blocked',
  language: 'tsx',
  baseFiles: {
    'src/view.tsx': jsxPropContractBaseSource
  },
  workerFiles: {
    'src/view.tsx': jsxPropContractWorkerSource
  },
  headFiles: {
    'src/view.tsx': jsxPropContractHeadSource
  }
});
assert.equal(jsxPropContractMissingEvidenceProject.status, 'blocked');
assert.equal(jsxPropContractMissingEvidenceProject.outputDiagnosticsGate.status, 'blocked');
assert.equal(
  jsxPropContractMissingEvidenceProject.admission.reasonCodes.includes('jsx-component-prop-contract-evidence-unavailable'),
  true
);
assert.equal(jsxPropContractMissingEvidenceProject.outputDiagnosticsGate.conflicts[0].gateId, 'jsx-component-prop-contract');
