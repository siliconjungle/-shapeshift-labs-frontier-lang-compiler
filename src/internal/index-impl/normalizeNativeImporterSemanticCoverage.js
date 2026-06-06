import{inferredSemanticCoverageLevel}from'./inferredSemanticCoverageLevel.js';
export function normalizeNativeImporterSemanticCoverage(value = {}, context = {}) {
  const capabilities = context.capabilities ?? new Set();
  const hasCapability = (...names) => names.some((name) => capabilities.has(String(name).toLowerCase()));
  const declarations = Boolean(value.declarations ?? hasCapability('semanticIndex', 'declarations'));
  const symbols = Boolean(value.symbols ?? declarations);
  const references = Boolean(value.references ?? hasCapability('references', 'referenceIndex'));
  const types = Boolean(value.types ?? hasCapability('types', 'typeResolution', 'typeChecking'));
  const controlFlow = Boolean(value.controlFlow ?? hasCapability('controlFlow', 'cfg'));
  return Object.freeze({
    level: String(value.level ?? inferredSemanticCoverageLevel({ declarations, symbols, references, types, controlFlow })),
    declarations,
    symbols,
    references,
    types,
    controlFlow
  });
}
