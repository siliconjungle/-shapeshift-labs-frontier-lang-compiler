import * as compilerApi from '../src/index.js';

const semanticResourceGraph: compilerApi.SemanticResourceGraph = compilerApi.createSemanticResourceGraph({
  language: 'rust',
  sourcePath: 'src/lib.rs',
  resources: [{ id: 'resource_buffer', resourceKind: 'heap-buffer', ownerId: 'owner_parse' }],
  owners: [{ id: 'owner_parse', ownerKind: 'function' }],
  lifetimeRegions: [{ id: 'life_parse', lifetimeKind: 'lexical' }],
  loans: [{ id: 'loan_buffer', resourceId: 'resource_buffer', ownerId: 'owner_parse', lifetimeRegionId: 'life_parse', mode: 'shared' }],
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

void semanticResourceRecords;
