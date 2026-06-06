import{normalizeFrontierSemanticIndexPayload}from'./normalizeFrontierSemanticIndexPayload.js';import{normalizeGenericExternalSemanticIndexPayload}from'./normalizeGenericExternalSemanticIndexPayload.js';import{normalizeGleanPayload}from'./normalizeGleanPayload.js';import{normalizeLsifPayload}from'./normalizeLsifPayload.js';import{normalizeLspPayload}from'./normalizeLspPayload.js';import{normalizeScipPayload}from'./normalizeScipPayload.js';import{normalizeSemanticDbPayload}from'./normalizeSemanticDbPayload.js';
export function normalizeExternalSemanticIndexPayload(payload, context) {
  if (context.format === 'frontier-semantic-index') return normalizeFrontierSemanticIndexPayload(payload, context);
  if (context.format === 'scip') return normalizeScipPayload(payload, context);
  if (context.format === 'lsif') return normalizeLsifPayload(payload, context);
  if (context.format === 'lsp') return normalizeLspPayload(payload, context);
  if (context.format === 'semanticdb') return normalizeSemanticDbPayload(payload, context);
  if (context.format === 'glean') return normalizeGleanPayload(payload, context);
  return normalizeGenericExternalSemanticIndexPayload(payload, context);
}
