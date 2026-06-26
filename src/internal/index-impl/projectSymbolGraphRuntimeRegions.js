import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment, uniqueStrings } from '../../native-import-utils.js';
import { semanticEffectRegionRecordsForImport } from '../../semantic-import-effect-regions.js';
import { importMetaHostContextEvidence } from '../../semantic-import-runtime-import-meta-evidence.js';
import { resourceManagementRuntimeRegionRecordsForImport } from '../../semantic-import-runtime-resource-management-evidence.js';
import { classStaticBlockRuntimeRecordsForImport } from './projectSymbolGraphClassStaticBlocks.js';

function createProjectRuntimeRegionRecords(semanticIndex, imports, publicContractRegions) {
  const publicKeys = publicRuntimeSymbolKeys(publicContractRegions);
  return uniqueRecords(imports.flatMap((imported) => runtimeRegionsForImport(imported, publicKeys)));
}

function runtimeRegionsForImport(imported, publicKeys) {
  const semanticIndex = imported?.semanticIndex ?? imported?.universalAst?.semanticIndex;
  const symbolsById = new Map((semanticIndex?.symbols ?? []).map((symbol) => [symbol.id, symbol]));
  const publicNames = new Set((semanticIndex?.symbols ?? []).filter((symbol) => symbol?.kind === 'export').map((symbol) => symbol.name));
  const sourceText = nativeImportSourceText(imported);
  const semanticRuntimeRecords = semanticEffectRegionRecordsForImport(imported, semanticIndex).ownershipRegions.map((region) => {
    const subject = symbolsById.get(region.metadata?.subjectId);
    const expressionText = sourceTextForSpan(sourceText, region.sourceSpan);
    const runtimeOrderEvidence = importMetaHostContextEvidence(expressionText, region.metadata?.runtimeOrderEvidence);
    const signatureHash = hashSemanticValue({
      kind: 'frontier.lang.projectRuntimeRegionSignature',
      regionKind: region.regionKind,
      factKinds: region.metadata?.factKinds,
      spanKind: region.metadata?.spanKind,
      runtimeOrderEvidence,
      expressionText
    });
    const runtimeRecordId = `runtime_region_${idFragment(region.id)}_${idFragment(hashSemanticValue({
      kind: 'frontier.lang.projectRuntimeRegionRecordId',
      key: region.key,
      regionKind: region.regionKind,
      runtimeKinds: region.metadata?.factKinds,
      line: region.metadata?.factLine,
      ordinal: region.metadata?.occurrenceOrdinal
    }))}`;
    return compactRecord({
      id: runtimeRecordId,
      key: region.key,
      regionKind: region.regionKind,
      runtimeKind: region.metadata?.factKinds?.[0] ?? region.regionKind,
      runtimeKinds: region.metadata?.factKinds,
      sourcePath: region.sourcePath,
      sourceHash: region.sourceHash,
      sourceSpan: region.sourceSpan,
      precision: region.precision,
      spanKind: region.metadata?.spanKind,
      symbolId: region.metadata?.subjectId,
      symbolName: subject?.name ?? region.metadata?.subjectName,
      symbolKind: subject?.kind,
      line: region.metadata?.factLine,
      ordinal: region.metadata?.occurrenceOrdinal,
      runtimeOrderEvidence,
      signatureHash,
      publicContract: publicKeys.has(runtimePublicKey(region.sourcePath, subject?.name ?? region.metadata?.subjectName))
        || publicNames.has(subject?.name) || undefined,
      factIds: region.metadata?.factIds,
      evidenceIds: uniqueStrings((region.metadata?.factIds ?? []).map((id) => `fact:${id}`))
    });
  });
  return [
    ...semanticRuntimeRecords,
    ...resourceManagementRuntimeRegionRecordsForImport(imported, semanticIndex, publicKeys),
    ...classStaticBlockRuntimeRecordsForImport(imported, semanticIndex, publicKeys)
  ];
}

function publicRuntimeSymbolKeys(regions = []) {
  return new Set(regions.flatMap((region) => [
    runtimePublicKey(region.sourcePath, region.symbolName),
    runtimePublicKey(region.sourcePath, region.exportedName)
  ]).filter(Boolean));
}

function runtimePublicKey(sourcePath, symbolName) {
  return sourcePath && symbolName ? `${sourcePath}\0${symbolName}` : undefined;
}

function nativeImportSourceText(imported) {
  return imported?.metadata?.sourcePreservation?.sourceText
    ?? imported?.nativeSource?.metadata?.sourcePreservation?.sourceText
    ?? imported?.nativeAst?.metadata?.sourcePreservation?.sourceText
    ?? imported?.universalAst?.metadata?.sourcePreservation?.sourceText
    ?? imported?.sourceText;
}

function sourceTextForSpan(sourceText, span) {
  if (!sourceText || !span?.startLine || !span?.endLine) return undefined;
  const lines = String(sourceText).split(/\r\n|\n|\r/).slice(span.startLine - 1, span.endLine);
  if (!lines.length) return undefined;
  lines[0] = lines[0].slice(Math.max(0, (span.startColumn ?? 1) - 1));
  lines[lines.length - 1] = lines[lines.length - 1].slice(0, Math.max(0, (span.endColumn ?? 1) - 1));
  return lines.join('\n');
}

function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }
function uniqueRecords(records) {
  const seen = new Set();
  return records.filter((record) => {
    const key = record.id ?? JSON.stringify(record);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export { createProjectRuntimeRegionRecords };
