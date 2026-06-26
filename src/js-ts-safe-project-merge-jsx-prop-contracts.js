import { compactRecord, uniqueStrings } from './js-ts-safe-merge-context.js';

export function collectJsxComponentPropContractsFromFileResults(fileResults = []) {
  const contracts = [];
  for (const file of Array.isArray(fileResults) ? fileResults : []) {
    const fallback = file.result?.metadata?.composed?.jsxAttributeFallback;
    const candidates = fallback?.componentPropContracts ?? fallback?.jsxComponentPropContracts ?? [];
    for (const candidate of Array.isArray(candidates) ? candidates : []) {
      contracts.push({ ...candidate, sourcePath: candidate.sourcePath ?? file.sourcePath });
    }
  }
  return contracts;
}

export function normalizeJsxComponentPropContracts(value) {
  const values = Array.isArray(value) ? value : [];
  return values.map((contract, index) => {
    const attributes = uniqueStrings((Array.isArray(contract.attributes) ? contract.attributes : [])
      .map((attribute) => String(attribute))
      .filter(Boolean));
    return compactRecord({
      id: contract.id ?? `jsx_component_prop_contract_${index + 1}`,
      sourcePath: stringOrUndefined(contract.sourcePath),
      tagName: stringOrUndefined(contract.tagName),
      tagKey: stringOrUndefined(contract.tagKey),
      attributes: attributes.length ? attributes : undefined,
      attributeCount: numberOrUndefined(contract.attributeCount) ?? attributes.length
    });
  });
}

export function matchingJsxComponentPropContracts(diagnostic, jsxComponentPropContracts) {
  if (!jsxComponentPropContracts.length) return [];
  const sourcePath = diagnostic.sourcePath;
  if (!sourcePath) return jsxComponentPropContracts;
  return jsxComponentPropContracts.filter((contract) => contract.sourcePath === sourcePath);
}

export function jsxComponentPropContractConflict(jsxComponentPropContracts) {
  return {
    code: 'jsx-component-prop-contract-evidence-unavailable',
    gateId: 'jsx-component-prop-contract',
    message: 'JSX component prop changes require TypeScript diagnostics or supplied diagnostics before project admission.',
    sourcePath: jsxComponentPropContracts.length === 1 ? jsxComponentPropContracts[0].sourcePath : undefined,
    details: {
      required: true,
      candidates: jsxComponentPropContracts
    }
  };
}

export function jsxComponentPropContractEvidence(id, status, diagnostics, conflicts, diagnosticSource, jsxComponentPropContracts) {
  if (!jsxComponentPropContracts.length) return [];
  return [{
    id: `${id}_jsx_component_prop_contract_evidence`,
    kind: 'js-ts-jsx-component-prop-contract-evidence',
    status: status === 'passed' ? 'passed' : 'failed',
    summary: status === 'passed'
      ? `Validated ${jsxComponentPropContracts.length} JSX component prop contract candidate(s) with diagnostics evidence.`
      : `Blocked JSX component prop contract candidate(s) on ${conflicts.length} diagnostic or evidence conflict(s).`,
    metadata: {
      candidates: jsxComponentPropContracts.length,
      attributes: jsxComponentPropContracts.reduce((total, contract) => total + (contract.attributeCount ?? 0), 0),
      diagnosticSource,
      diagnostics: diagnostics.length,
      conflicts: conflicts.length,
      contracts: jsxComponentPropContracts
    }
  }];
}

export function jsxComponentPropContractSummary(jsxComponentPropContracts) {
  return {
    jsxComponentPropContractCandidates: jsxComponentPropContracts.length,
    jsxComponentPropContractFiles: uniqueStrings(jsxComponentPropContracts.map((contract) => contract.sourcePath)).length,
    jsxComponentPropContractAttributes: jsxComponentPropContracts.reduce((total, contract) => total + (contract.attributeCount ?? 0), 0)
  };
}

function stringOrUndefined(value) {
  return value === undefined || value === null ? undefined : String(value);
}

function numberOrUndefined(value) {
  return Number.isFinite(value) ? value : undefined;
}
