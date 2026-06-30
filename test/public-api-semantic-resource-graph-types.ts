import * as compilerApi from '../src/index.js';

const semanticResourceGraph: compilerApi.SemanticResourceGraph = compilerApi.createSemanticResourceGraph({
  language: 'rust',
  sourcePath: 'src/lib.rs',
  resources: [{ id: 'resource_buffer', resourceKind: 'heap-buffer', ownerId: 'owner_parse' }],
  owners: [{ id: 'owner_parse', ownerKind: 'function' }],
  lifetimeRegions: [{ id: 'life_parse', lifetimeKind: 'lexical' }],
  loans: [{ id: 'loan_buffer', resourceId: 'resource_buffer', ownerId: 'owner_parse', lifetimeRegionId: 'life_parse', mode: 'shared' }],
  escapes: [{ id: 'escape_buffer', recordKind: 'escape', resourceId: 'resource_buffer', ownerId: 'owner_parse', lifetimeRegionId: 'life_parse', escapeKind: 'returned-borrow', status: 'needs-proof', evidenceIds: [] }],
  lifetimeRelations: [{ id: 'outlives_buffer', recordKind: 'lifetime-relation', relationKind: 'outlives', fromLifetimeId: 'life_parse', toLifetimeId: 'life_header', evidenceIds: [] }],
  unsafeBoundaries: [{ id: 'unsafe_buffer', recordKind: 'unsafe-boundary', unsafeBoundary: true, resourceId: 'resource_buffer', proofStatus: 'missing', evidenceIds: [] }]
});
const semanticResourceRecords: readonly compilerApi.SemanticResourceGraphRecord[] =
  compilerApi.querySemanticResourceGraph(semanticResourceGraph, { resourceId: 'resource_buffer' });
const semanticResourceSummary: compilerApi.SemanticResourceGraphSummary =
  compilerApi.summarizeSemanticResourceGraph(semanticResourceGraph);

semanticResourceGraph.claims.borrowCheckerClaim satisfies false;
semanticResourceGraph.claims.aliasSafetyClaim satisfies false;
semanticResourceGraph.claims.lifetimeSoundnessClaim satisfies false;
semanticResourceSummary.resources satisfies number;
semanticResourceSummary.escapes satisfies number;
semanticResourceSummary.lifetimeRelations satisfies number;

void semanticResourceRecords;
