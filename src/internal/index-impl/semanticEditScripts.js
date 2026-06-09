import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment, uniqueStrings } from '../../native-import-utils.js';
import { createSemanticImportSidecar } from './createSemanticImportSidecar.js';
import { diffNativeSourceImports } from './diffNativeSourceImports.js';
import { inferSemanticLineageEvents } from './inferSemanticLineageEvents.js';
import { mapDiffSymbols } from './mapDiffSymbols.js';
import { nativeImportSourceText } from './nativeImportSourceText.js';
import { normalizeNativeDiffImport } from './normalizeNativeDiffImport.js';
import {
  classifySemanticEdit,
  SemanticEditScriptAdmissionStatuses,
  semanticEditAdmission,
  summarizeSemanticEditOperations
} from './semanticEditScriptClassification.js';
import { sourceTextForSpan } from './sourceTextForSpan.js';

export { SemanticEditScriptAdmissionStatuses };

export function createSemanticEditScript(input = {}, options = {}) {
  const language = input.language ?? input.worker?.language ?? input.after?.language ?? input.base?.language ?? input.before?.language;
  if (!language) throw new Error('createSemanticEditScript requires a language');
  const sourcePath = input.sourcePath ?? input.worker?.sourcePath ?? input.after?.sourcePath ?? input.base?.sourcePath ?? input.before?.sourcePath;
  const base = normalizeNativeDiffImport(sourceInput(input, 'base'), { ...input, language, sourcePath }, 'base');
  const worker = normalizeNativeDiffImport(sourceInput(input, 'worker'), { ...input, language, sourcePath }, 'worker');
  if (!base || !worker) throw new Error('createSemanticEditScript requires base and worker source inputs');
  const head = normalizeNativeDiffImport(sourceInput(input, 'head'), { ...input, language, sourcePath }, 'head');
  const workerChangeSet = diffNativeSourceImports({
    ...input,
    language,
    sourcePath,
    before: base,
    after: worker,
    id: input.workerChangeSetId ?? `${input.id ?? 'semantic_edit'}_worker`
  });
  const headChangeSet = head ? diffNativeSourceImports({
    ...input,
    language,
    sourcePath,
    before: base,
    after: head,
    id: input.headChangeSetId ?? `${input.id ?? 'semantic_edit'}_head`
  }) : undefined;
  const headLineage = head ? inferSemanticLineageEvents({
    before: base,
    after: head,
    id: input.lineageInferenceId ?? `${input.id ?? 'semantic_edit'}_head_lineage`,
    language,
    sourcePath,
    generatedAt: input.generatedAt,
    metadata: { source: 'createSemanticEditScript' }
  }) : undefined;
  const context = createEditContext({ base, worker, head, workerChangeSet, headChangeSet, headLineage });
  const operations = workerChangeSet.changedRegions.map((region, index) => semanticEditOperation(region, index, context, input));
  const summary = summarizeSemanticEditOperations(operations);
  const admission = semanticEditAdmission({ operations, summary, head, workerChangeSet, headChangeSet, input });
  const evidence = semanticEditEvidence({ input, language, sourcePath, workerChangeSet, headChangeSet, headLineage, summary, admission });
  const core = {
    kind: 'frontier.lang.semanticEditScript',
    version: 1,
    schema: 'frontier.lang.semanticEditScript.v1',
    language,
    sourcePath,
    baseHash: workerChangeSet.beforeHash,
    workerHash: workerChangeSet.afterHash,
    headHash: headChangeSet?.afterHash,
    workerChangeSetId: workerChangeSet.id,
    headChangeSetId: headChangeSet?.id,
    lineageInferenceId: headLineage?.id,
    operations,
    summary,
    admission,
    evidence,
    metadata: compactRecord({
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      workerReadiness: workerChangeSet.readiness,
      headReadiness: headChangeSet?.readiness,
      workerReasons: workerChangeSet.reasons,
      headReasons: headChangeSet?.reasons,
      ...input.metadata,
      ...options.metadata
    })
  };
  const hash = hashSemanticValue(core);
  const id = input.id ?? `semantic_edit_script_${idFragment(firstString(sourcePath, language, hash))}`;
  return { ...core, id, stableId: `semantic_edit_script_${idFragment(hash)}`, hash };
}

function sourceInput(input, side) {
  if (side === 'base') return input.base ?? input.before ?? sourceTextInput(input, 'base') ?? sourceTextInput(input, 'before');
  if (side === 'worker') return input.worker ?? input.after ?? sourceTextInput(input, 'worker') ?? sourceTextInput(input, 'after');
  return input.head ?? input.current ?? sourceTextInput(input, 'head') ?? sourceTextInput(input, 'current');
}

function sourceTextInput(input, side) {
  const sourceText = input[`${side}SourceText`];
  if (sourceText === undefined) return undefined;
  return {
    language: input.language,
    sourcePath: input[`${side}SourcePath`] ?? input.sourcePath,
    sourceText,
    sourceHash: input[`${side}SourceHash`],
    parser: input.parser,
    metadata: input[`${side}Metadata`]
  };
}

function createEditContext(input) {
  return {
    ...input,
    baseSymbols: symbolsByAnchor(input.base),
    workerSymbols: symbolsByAnchor(input.worker),
    headSymbols: symbolsByAnchor(input.head),
    headChangedConflictKeys: new Set(input.headChangeSet?.conflictKeys ?? [])
  };
}

function symbolsByAnchor(imported) {
  if (!imported) return new Map();
  const sidecar = createSemanticImportSidecar(imported, { id: `semantic_edit_sidecar_${idFragment(imported.id ?? imported.sourcePath ?? 'source')}` });
  const result = new Map();
  for (const symbol of mapDiffSymbols(imported, sidecar).values()) {
    for (const key of uniqueStrings([symbol.ownershipKey, symbol.key, symbol.id])) {
      result.set(key, symbol);
    }
  }
  return result;
}

function semanticEditOperation(region, index, context, input) {
  const anchorKey = region.key ?? region.conflictKey ?? region.id;
  const baseSymbol = context.baseSymbols.get(anchorKey);
  const workerSymbol = context.workerSymbols.get(anchorKey);
  const headSymbol = context.headSymbols.get(anchorKey);
  const classification = classifySemanticEdit({ region, anchorKey, baseSymbol, workerSymbol, headSymbol, context });
  const kind = semanticEditOperationKind(region);
  const baseText = spanText(context.base, baseSymbol?.sourceSpan ?? region.metadata?.changedRegionProjection?.before?.sourceSpan ?? region.sourceSpan);
  const workerText = spanText(context.worker, workerSymbol?.sourceSpan ?? region.metadata?.changedRegionProjection?.after?.sourceSpan ?? region.sourceSpan);
  return compactRecord({
    id: `semantic_edit_op_${idFragment(firstString(input.id, anchorKey, index))}`,
    kind,
    changeKind: region.changeKind,
    anchor: compactRecord({
      key: anchorKey,
      conflictKey: region.conflictKey ?? `region:${anchorKey}`,
      regionId: region.id,
      regionKind: region.regionKind,
      granularity: region.granularity,
      language: region.language ?? context.workerChangeSet.language,
      sourcePath: region.sourcePath ?? context.workerChangeSet.sourcePath,
      symbolId: region.symbolId ?? workerSymbol?.id ?? baseSymbol?.id,
      symbolName: region.symbolName ?? workerSymbol?.name ?? baseSymbol?.name,
      symbolKind: region.symbolKind ?? workerSymbol?.kind ?? baseSymbol?.kind,
      sourceSpan: workerSymbol?.sourceSpan ?? region.sourceSpan
    }),
    hashes: compactRecord({
      baseSourceHash: context.workerChangeSet.beforeHash,
      workerSourceHash: context.workerChangeSet.afterHash,
      headSourceHash: context.headChangeSet?.afterHash,
      baseSpanHash: baseSymbol?.spanHash,
      workerSpanHash: workerSymbol?.spanHash,
      headSpanHash: headSymbol?.spanHash,
      baseTextHash: baseText === undefined ? undefined : hashSemanticValue(baseText),
      workerTextHash: workerText === undefined ? undefined : hashSemanticValue(workerText),
      beforeSignatureHash: workerSymbol?.beforeSignatureHash ?? baseSymbol?.signatureHash,
      afterSignatureHash: workerSymbol?.afterSignatureHash ?? workerSymbol?.signatureHash
    }),
    status: classification.status,
    reanchor: classification.reanchor,
    readiness: classification.readiness,
    confidence: classification.confidence,
    reasonCodes: classification.reasonCodes,
    evidenceIds: classification.evidenceIds,
    metadata: {
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    }
  });
}

function semanticEditOperationKind(region) {
  const prefix = region.changeKind === 'added' ? 'add' : region.changeKind === 'removed' ? 'remove' : 'replace';
  const kind = String(region.regionKind ?? region.granularity ?? 'region');
  if (kind === 'body') return `${prefix}Body`;
  if (kind === 'import') return `${prefix}Import`;
  if (kind === 'type') return `${prefix}TypeDeclaration`;
  if (kind === 'property') return `${prefix}Property`;
  return `${prefix}Region`;
}

function spanText(imported, span) {
  return sourceTextForSpan(nativeImportSourceText(imported), span);
}

function semanticEditEvidence(input) {
  return [{
    id: input.input.evidenceId ?? `evidence_${idFragment(input.input.id ?? input.sourcePath ?? 'semantic_edit')}_semantic_edit_script`,
    kind: 'semantic-edit-script',
    status: input.admission.status === 'blocked' || input.admission.status === 'conflict' ? 'needs-review' : 'passed',
    path: input.sourcePath,
    summary: `Created semantic edit script with ${input.summary.operations} operation(s): ${input.admission.status}.`,
    metadata: {
      workerChangeSetId: input.workerChangeSet.id,
      headChangeSetId: input.headChangeSet?.id,
      lineageInferenceId: input.headLineage?.id,
      summary: input.summary,
      admissionStatus: input.admission.status,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    }
  }];
}

function firstString(...values) {
  return values.map((value) => value === undefined || value === null ? '' : String(value)).find(Boolean);
}

function compactRecord(value) {
  return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0)));
}
