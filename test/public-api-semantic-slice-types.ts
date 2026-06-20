import * as compilerApi from '../src/index.js';

const typedSliceOptions: compilerApi.CreateSemanticSliceOptions = {
  expectedSymbols: ['typedSymbol'],
  expectedRegions: ['typedRegion'],
  expectedSourceHashes: { 'src/typed.ts': 'fnv1a32:typed' },
  expectedSymbolCount: 1,
  expectedRegionCount: 1,
  expectedSourceFileCount: 1
};
const typedSliceTestOptions: compilerApi.TestSemanticSliceOptions = {
  expectedSymbolRefs: ['typedSymbol'],
  expectedRegionRefs: ['typedRegion'],
  expectedSourceHashes: new Map<string, string>([['src/typed.ts', 'fnv1a32:typed']])
};
const typedSelectedSurface: compilerApi.SemanticSliceAdmissionSelectedSurface = {
  entryRefs: ['symbol:typedSymbol'],
  matchedEntryRefs: ['symbol:typedSymbol'],
  unresolvedEntryRefs: [],
  symbols: [{ id: 'typedSymbol', name: 'typedSymbol' }],
  ownershipRegions: [{ id: 'typedRegion', key: 'region:typedRegion' }],
  nativeNodes: [],
  relations: [],
  occurrences: [],
  sourceMapLinks: [],
  sourceSpans: [],
  sourceFiles: [{ path: 'src/typed.ts', sourceHash: 'fnv1a32:typed', spanCount: 1, excerptCount: 0, sourceTextAvailable: false }],
  sourceHashes: [{ path: 'src/typed.ts', sourceHash: 'fnv1a32:typed' }],
  conflictKeys: ['symbol:typedSymbol'],
  ownershipKeys: ['region:typedRegion']
};

void typedSliceOptions;
void typedSliceTestOptions;
void typedSelectedSurface;
