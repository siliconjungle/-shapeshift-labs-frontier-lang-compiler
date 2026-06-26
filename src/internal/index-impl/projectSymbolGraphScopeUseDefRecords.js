import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import {
  attachAliasMetadata,
  attachReferenceAliasMetadata,
  compactRecord,
  createScopeGraphContext,
  nativeImportSourceText
} from './projectSymbolGraphScopeUseDefAliases.js';
import { lexicalScopeRecordsForImport } from './projectSymbolGraphScopeUseDefLexical.js';
import { publicKey } from './projectSymbolGraphScopeUseDefRecordBuilders.js';
import { publicOwnerRanges } from './projectSymbolGraphScopeUseDefOwners.js';
import { structuralScopeRecordsForImport } from './projectSymbolGraphScopeUseDefStructural.js';
import { directUseHashesByBinding, finalizeBindingUseHashes } from './projectSymbolGraphScopeUseDefUseHashes.js';

const CompilerReferenceAmbiguousReason = 'typescript-compiler-reference-site-ambiguous';
const CompilerReferenceLexicalMismatchReason = 'typescript-compiler-reference-lexical-binding-mismatch';
const CompilerReferenceImportAliasTargetMismatchReason = 'typescript-compiler-reference-import-alias-target-mismatch';

function createProjectScopeUseDefRecords(semanticIndex, imports, publicContractRegions) {
  const publicKeys = publicScopeKeys(publicContractRegions, semanticIndex);
  const context = createScopeGraphContext(semanticIndex, imports, publicKeys);
  const records = imports.map((imported) => scopeRecordsForImport(imported, context)).filter(Boolean);
  const initialBindings = uniqueRecords(records.flatMap((record) => record.scopeBindingRecords));
  const initialReferences = uniqueRecords(records.flatMap((record) => record.scopeReferenceRecords));
  const directUseHashes = directUseHashesByBinding(initialBindings, initialReferences);
  const aliasBindings = attachAliasMetadata(initialBindings, directUseHashes, context);
  const aliasReferences = attachReferenceAliasMetadata(initialReferences, aliasBindings);
  const compilerReferences = attachCompilerReferenceSiteEvidence(aliasReferences, compilerReferenceSiteIndex(semanticIndex));
  return {
    scopeBindingRecords: finalizeBindingUseHashes(aliasBindings, compilerReferences),
    scopeReferenceRecords: compilerReferences
  };
}

function scopeRecordsForImport(imported, context) {
  const sourceText = nativeImportSourceText(imported);
  const sourcePath = imported?.sourcePath ?? imported?.nativeSource?.sourcePath;
  if (!sourceText || !sourcePath) return undefined;
  const sourceHash = imported?.nativeSource?.sourceHash ?? imported?.metadata?.sourceHash;
  const fileContext = {
    ...context,
    sourceText,
    sourcePath,
    sourceHash,
    publicOwners: publicOwnerRanges(context, sourcePath, sourceText)
  };
  return structuralScopeRecordsForImport(imported, fileContext) ?? lexicalScopeRecordsForImport(sourceText, fileContext);
}

function publicScopeKeys(publicContractRegions = [], semanticIndex) {
  const keys = new Set(publicContractRegions.flatMap((region) => [
    publicKey(region.sourcePath, region.symbolName),
    publicKey(region.sourcePath, region.exportedName)
  ]).filter(Boolean));
  for (const symbol of semanticIndex?.symbols ?? []) {
    if (symbol?.kind !== 'export') continue;
    const path = symbol.definitionSpan?.path;
    for (const name of [symbol.name, symbol.metadata?.localName, symbol.metadata?.exportedName]) {
      if (name && !String(name).startsWith('{')) keys.add(publicKey(path, name));
    }
  }
  return keys;
}

function uniqueRecords(records) {
  const seen = new Set();
  return records.filter((record) => {
    const key = record.id ?? JSON.stringify(record);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function attachCompilerReferenceSiteEvidence(references, compilerSites) {
  if (!compilerSites.size) return references;
  return references.map((reference) => {
    const candidates = uniqueCompilerCandidates(compilerSites.get(compilerReferenceSiteKey(reference.sourceSpan)) ?? []);
    if (!candidates.length) return reference;
    if (candidates.length > 1) return blockedCompilerReference(reference, candidates, CompilerReferenceAmbiguousReason);
    const mismatchReason = compilerReferenceLexicalMismatchReason(reference, candidates[0]);
    if (mismatchReason) return blockedCompilerReference(reference, candidates, mismatchReason);
    return passedCompilerReference(reference, candidates[0]);
  });
}

function passedCompilerReference(reference, candidate) {
  const proofHash = compilerReferenceProofHash('frontier.lang.projectScopeCompilerReferenceSiteProof', reference, [candidate]);
  return compactRecord({
    ...reference,
    ...compilerReferenceFields(candidate),
    compilerReferenceStatus: 'passed',
    compilerReferenceProofHash: proofHash,
    signatureHash: hashSemanticValue({
      kind: 'frontier.lang.projectScopeReferenceSignatureCompilerProof',
      reference: reference.signatureHash,
      compilerReferenceProofHash: proofHash
    })
  });
}

function blockedCompilerReference(reference, candidates, reasonCode) {
  const reasonCodes = uniqueStrings([...(reference.reasonCodes ?? []), reasonCode]);
  const proofHash = compilerReferenceProofHash('frontier.lang.projectScopeCompilerReferenceSiteBlocker', reference, candidates, reasonCodes);
  return compactRecord({
    ...reference,
    ...(candidates.length === 1 ? compilerReferenceFields(candidates[0]) : {}),
    status: 'blocked',
    reasonCodes,
    compilerReferenceStatus: 'blocked',
    compilerReferenceReasonCodes: [reasonCode],
    compilerReferenceCandidates: candidates.slice(0, 6).map(compilerReferenceCandidateSummary),
    compilerReferenceProofHash: proofHash,
    signatureHash: hashSemanticValue({
      kind: 'frontier.lang.projectScopeReferenceSignatureCompilerBlocker',
      reference: reference.signatureHash,
      compilerReferenceProofHash: proofHash,
      reasonCodes
    })
  });
}

function compilerReferenceLexicalMismatchReason(reference, candidate) {
  if (candidate.compilerSymbol?.aliased === true && reference.importAlias !== true) {
    return CompilerReferenceLexicalMismatchReason;
  }
  if (candidate.compilerSymbol?.aliased === true && reference.importAlias === true) {
    const compilerTargetName = candidate.compilerSymbol?.targetName;
    const lexicalTargetNames = uniqueStrings([
      reference.resolvedBindingName,
      reference.resolvedExportName,
      reference.importedName
    ]);
    if (compilerTargetName && lexicalTargetNames.length && !lexicalTargetNames.includes(compilerTargetName)) {
      return CompilerReferenceImportAliasTargetMismatchReason;
    }
  }
  return undefined;
}

function compilerReferenceSiteIndex(semanticIndex) {
  const occurrences = new Map((semanticIndex?.occurrences ?? []).map((occurrence) => [occurrence.id, occurrence]));
  const relations = groupBy((semanticIndex?.relations ?? []).filter((relation) => relation?.predicate === 'references'), 'sourceId');
  const facts = groupBy((semanticIndex?.facts ?? []).filter((fact) => fact?.predicate === 'compilerSymbolReference'), 'subjectId');
  const result = new Map();
  for (const occurrence of occurrences.values()) {
    const occurrenceRelations = relations.get(occurrence.id) ?? [];
    const occurrenceFacts = facts.get(occurrence.id) ?? [];
    if (!occurrence.metadata?.compilerReference && !occurrenceFacts.length) continue;
    const key = compilerReferenceSiteKey(occurrence.span);
    if (!key) continue;
    const symbolIds = uniqueStrings([occurrence.symbolId, ...occurrenceRelations.map((relation) => relation.targetId), ...occurrenceFacts.map((fact) => fact.objectId)]);
    for (const symbolId of symbolIds) {
      const fact = occurrenceFacts.find((item) => item.objectId === symbolId) ?? occurrenceFacts[0];
      const relationEvidenceIds = occurrenceRelations.filter((relation) => relation.targetId === symbolId).flatMap((relation) => relation.evidenceIds ?? []);
      addCompilerReferenceSite(result, key, compactRecord({
        occurrenceId: occurrence.id,
        symbolId,
        compilerSymbol: objectValue(fact?.value ?? occurrence.metadata?.compilerSymbol),
        compilerSymbolIdentityHash: fact?.value?.identityHash,
        evidenceIds: uniqueStrings([...relationEvidenceIds, ...(fact?.evidenceIds ?? [])])
      }));
    }
  }
  return result;
}

function addCompilerReferenceSite(result, key, record) {
  if (!record.symbolId) return;
  result.set(key, [...(result.get(key) ?? []), record]);
}

function compilerReferenceFields(candidate) {
  return compactRecord({
    compilerReferenceSymbolId: candidate.symbolId,
    compilerReferenceIdentityHash: candidate.compilerSymbolIdentityHash,
    compilerReferenceFullyQualifiedName: candidate.compilerSymbol?.fullyQualifiedName,
    compilerReferenceLocalName: candidate.compilerSymbol?.localName,
    compilerReferenceTargetName: candidate.compilerSymbol?.targetName,
    compilerReferenceAliased: candidate.compilerSymbol?.aliased,
    compilerReferenceEvidenceIds: candidate.evidenceIds?.length ? candidate.evidenceIds : undefined
  });
}

function compilerReferenceCandidateSummary(candidate) {
  return compilerReferenceFields(candidate);
}

function compilerReferenceProofHash(kind, reference, candidates, reasonCodes = undefined) {
  return hashSemanticValue({
    kind,
    reference: reference.signatureHash,
    sourcePath: reference.sourcePath,
    sourceSpan: reference.sourceSpan ? {
      path: reference.sourceSpan.path,
      startLine: reference.sourceSpan.startLine,
      startColumn: reference.sourceSpan.startColumn,
      endLine: reference.sourceSpan.endLine,
      endColumn: reference.sourceSpan.endColumn
    } : undefined,
    candidates: candidates.map(compilerReferenceCandidateSummary),
    reasonCodes
  });
}

function compilerReferenceSiteKey(span) {
  if (!span?.path || !Number.isInteger(span.startLine) || !Number.isInteger(span.startColumn) || !Number.isInteger(span.endLine) || !Number.isInteger(span.endColumn)) return undefined;
  return [span.path, span.startLine, span.startColumn, span.endLine, span.endColumn].join('#');
}

function uniqueCompilerCandidates(candidates) {
  const seen = new Set();
  return candidates.filter((candidate) => {
    const key = `${candidate.symbolId}\0${candidate.compilerSymbolIdentityHash ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function groupBy(records, field) {
  const result = new Map();
  for (const record of records) {
    const key = record?.[field];
    if (key) result.set(key, [...(result.get(key) ?? []), record]);
  }
  return result;
}

function objectValue(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : undefined;
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))];
}

export { createProjectScopeUseDefRecords };
