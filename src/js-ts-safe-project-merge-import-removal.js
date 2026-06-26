import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { JsTsSafeMergeConflictCodes, JsTsSafeMergeStatuses, jsTsSafeMergeGateOrder } from './js-ts-safe-merge-constants.js';
import { compactRecord, createMergeContext, sameStatementText, uniqueStrings } from './js-ts-safe-merge-context.js';
import { scanJsTsTopLevelLedger } from './js-ts-safe-merge-ledger.js';
import { analyzeImportRemovalUseDefEvidence, LexicalUseDefReasonCodes } from './js-ts-semantic-scope-use-def.js';

const ImportRemovalUsageProofConflictCode = 'project-import-removal-usage-proof-unavailable';
const ImportRemovalUsageProofGateId = 'project-import-removal-usage-proof';
const ImportRemovalUsageProofOperation = 'merged-import-removal-usage-proof';
const ImportRemovalLexicalUseDefConflictCode = 'project-import-removal-lexical-use-def-blocked';
const ImportRemovalLexicalUseDefGateId = 'project-import-removal-lexical-use-def';

function maybeMergeImportSpecifierRemovalFile(file, context, result, input) {
  const usageProof = analyzeNarrowImportSpecifierRemoval(file, context, result);
  if (!usageProof) return undefined;
  if (usageProof.lexicalUseDefEvidence?.status === 'blocked') {
    return blockedImportRemovalLexicalUseDefFile(file, context, result, usageProof);
  }
  if (!hasImportRemovalUsageProofInput(input)) return blockedImportRemovalUsageProofFile(file, context, result, usageProof);
  const admission = admittedImportRemovalUsageProofAdmission();
  const mergeResult = importRemovalUsageProofMergeResult(context, result, usageProof, input, admission);
  return compactRecord({
    kind: 'frontier.lang.jsTsProjectSafeMergeFile',
    version: 1,
    sourcePath: file.sourcePath,
    language: context.language,
    status: 'merged',
    operation: ImportRemovalUsageProofOperation,
    outputSourceText: usageProof.outputSourceText,
    outputHash: hashText(usageProof.outputSourceText),
    baseHash: hashText(file.baseSourceText),
    workerHash: hashText(usageProof.outputSourceText),
    headHash: hashText(file.headSourceText ?? file.baseSourceText),
    result: mergeResult,
    conflicts: [],
    admission,
    summary: mergeResult.summary,
    conflictKeys: [`source#${file.sourcePath}`],
    metadata: mergeResult.metadata
  });
}

function analyzeNarrowImportSpecifierRemoval(file, context, result) {
  const conflicts = result.conflicts ?? [];
  const removalConflicts = conflicts.filter((conflict) => conflict.code === JsTsSafeMergeConflictCodes.importSpecifierRemoved);
  if (result.status !== JsTsSafeMergeStatuses.blocked || conflicts.length !== 1 || removalConflicts.length !== 1) return undefined;
  const conflict = removalConflicts[0];
  const missing = Array.isArray(conflict.details?.missing) ? conflict.details.missing : [];
  if (conflict.side !== 'worker' || missing.length !== 1) return undefined;
  const baseSourceText = file.baseSourceText;
  const workerSourceText = file.workerDeleted ? undefined : file.workerSourceText ?? baseSourceText;
  const headSourceText = file.headDeleted ? undefined : file.headSourceText ?? baseSourceText;
  if (typeof baseSourceText !== 'string' || typeof workerSourceText !== 'string' || typeof headSourceText !== 'string') return undefined;
  if (headSourceText !== baseSourceText) return undefined;
  return analyzeLedgers(file, context, result, baseSourceText, workerSourceText, headSourceText, conflict, missing[0]);
}

function analyzeLedgers(file, context, result, baseSourceText, workerSourceText, headSourceText, conflict, removedSpecifier) {
  const scanContext = createMergeContext({
    id: `${result.id}_import_removal_usage_probe`,
    sourcePath: context.sourcePath,
    language: context.language
  });
  const baseLedger = scanJsTsTopLevelLedger(baseSourceText, 'base', scanContext);
  const workerLedger = scanJsTsTopLevelLedger(workerSourceText, 'worker', scanContext);
  const headLedger = scanJsTsTopLevelLedger(headSourceText, 'head', scanContext);
  if (scanContext.conflicts.length) return undefined;
  if (baseLedger.entries.length !== workerLedger.entries.length || baseLedger.entries.length !== headLedger.entries.length) return undefined;
  const importKey = conflict.details?.key;
  let removal;
  for (let index = 0; index < baseLedger.entries.length; index += 1) {
    const baseEntry = baseLedger.entries[index];
    const workerEntry = workerLedger.entries[index];
    const headEntry = headLedger.entries[index];
    if (!headEntryMatchesBase(baseEntry, headEntry) || baseEntry.kind !== workerEntry.kind || baseEntry.key !== workerEntry.key) return undefined;
    if (baseEntry.kind === 'import' && baseEntry.key === importKey) {
      removal = importSpecifierRemovalUsageProof(baseEntry, workerEntry, removedSpecifier);
      if (!removal) return undefined;
    } else if (!sameStatementText(baseEntry.text, workerEntry.text)) return undefined;
  }
  if (!removal) return undefined;
  const lexicalUseDefEvidence = analyzeImportRemovalUseDefEvidence({
    sourcePath: file.sourcePath,
    sourceText: workerSourceText,
    moduleSpecifier: removal.moduleSpecifier,
    removedSpecifier: removal.removedSpecifier,
    importedName: removal.importedName,
    localName: removal.localName,
    typeOnly: removal.typeOnly
  });
  return { ...removal, importKey, sourcePath: file.sourcePath, outputSourceText: workerSourceText, lexicalUseDefEvidence };
}

function importSpecifierRemovalUsageProof(baseEntry, workerEntry, removedSpecifier) {
  const baseImport = baseEntry.importInfo;
  const workerImport = workerEntry.importInfo;
  if (!baseImport || !workerImport || baseImport.sideEffectOnly || workerImport.sideEffectOnly) return undefined;
  if (baseImport.moduleSpecifier !== workerImport.moduleSpecifier
    || baseImport.typeOnly !== workerImport.typeOnly
    || baseImport.defaultLocalName !== workerImport.defaultLocalName
    || baseImport.namespaceLocalName !== workerImport.namespaceLocalName) {
    return undefined;
  }
  const baseSpecifiers = baseImport.specifiers.map((specifier) => specifier.canonical);
  const workerSpecifiers = workerImport.specifiers.map((specifier) => specifier.canonical);
  const expectedWorkerSpecifiers = baseSpecifiers.filter((specifier) => specifier !== removedSpecifier);
  if (expectedWorkerSpecifiers.length !== baseSpecifiers.length - 1) return undefined;
  if (!arraysEqual(workerSpecifiers, expectedWorkerSpecifiers)) return undefined;
  const removed = baseImport.specifiers.find((specifier) => specifier.canonical === removedSpecifier);
  if (!removed) return undefined;
  return {
    removedSpecifier,
    importedName: removed.importedName,
    localName: removed.localName,
    moduleSpecifier: baseImport.moduleSpecifier,
    typeOnly: baseImport.typeOnly || removed.typeOnly,
    remainingSpecifiers: workerSpecifiers
  };
}

function blockedImportRemovalLexicalUseDefFile(file, context, result, usageProof) {
  const reasonCodes = usageProof.lexicalUseDefEvidence.reasonCodes
    .filter((code) => code !== LexicalUseDefReasonCodes.noLiveReferences);
  const conflict = {
    code: ImportRemovalLexicalUseDefConflictCode,
    gateId: ImportRemovalLexicalUseDefGateId,
    message: 'Project import specifier removal has live lexical references or namespace conflicts.',
    sourcePath: file.sourcePath,
    details: compactRecord({
      sourcePath: file.sourcePath,
      importKey: usageProof.importKey,
      moduleSpecifier: usageProof.moduleSpecifier,
      removedSpecifier: usageProof.removedSpecifier,
      localName: usageProof.localName,
      reasonCodes,
      lexicalUseDefEvidence: usageProof.lexicalUseDefEvidence,
      originalReasonCodes: result.admission?.reasonCodes
    })
  };
  const conflicts = [...(result.conflicts ?? []), conflict];
  return compactRecord({
    kind: 'frontier.lang.jsTsProjectSafeMergeFile',
    version: 1,
    sourcePath: file.sourcePath,
    language: context.language,
    status: 'blocked',
    operation: 'blocked-import-removal-lexical-use-def',
    result,
    conflicts,
    admission: {
      status: 'blocked',
      action: 'human-review',
      reviewRequired: true,
      autoApplyCandidate: false,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes: uniqueStrings([...conflicts.map((item) => item.code), ...reasonCodes])
    },
    summary: importRemovalUsageProofSummary(usageProof, conflicts.length),
    conflictKeys: [`source#${file.sourcePath}`],
    metadata: importRemovalUsageProofMetadata({}, usageProof, 'blocked-lexical-use-def')
  });
}

function blockedImportRemovalUsageProofFile(file, context, result, usageProof) {
  const conflict = {
    code: ImportRemovalUsageProofConflictCode,
    gateId: ImportRemovalUsageProofGateId,
    message: 'Project import specifier removal requires caller-supplied TypeScript output diagnostics before automatic merge.',
    sourcePath: file.sourcePath,
    details: compactRecord({
      sourcePath: file.sourcePath,
      importKey: usageProof.importKey,
      moduleSpecifier: usageProof.moduleSpecifier,
      removedSpecifier: usageProof.removedSpecifier,
      requiredEvidence: 'project-output-diagnostics',
      originalReasonCodes: result.admission?.reasonCodes
    })
  };
  const conflicts = [...(result.conflicts ?? []), conflict];
  return compactRecord({
    kind: 'frontier.lang.jsTsProjectSafeMergeFile',
    version: 1,
    sourcePath: file.sourcePath,
    language: context.language,
    status: 'blocked',
    operation: 'blocked-import-removal-usage-proof',
    result,
    conflicts,
    admission: {
      status: 'blocked',
      action: 'human-review',
      reviewRequired: true,
      autoApplyCandidate: false,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes: uniqueStrings(conflicts.map((item) => item.code))
    },
    summary: importRemovalUsageProofSummary(usageProof, conflicts.length),
    conflictKeys: [`source#${file.sourcePath}`],
    metadata: importRemovalUsageProofMetadata({}, usageProof, 'unavailable')
  });
}

function importRemovalUsageProofMergeResult(context, result, usageProof, input, admission) {
  return {
    kind: 'frontier.lang.jsTsSafeMerge',
    version: 1,
    schema: 'frontier.lang.jsTsSafeMerge.v1',
    id: result.id,
    status: JsTsSafeMergeStatuses.merged,
    sourcePath: context.sourcePath,
    language: context.language,
    mergedSourceText: usageProof.outputSourceText,
    outputSourceText: usageProof.outputSourceText,
    conflicts: [],
    gates: jsTsSafeMergeGateOrder.map((id) => ({ id, status: 'passed', reasonCodes: [] })),
    admission,
    summary: importRemovalUsageProofSummary(usageProof, 0),
    metadata: importRemovalUsageProofMetadata(input, usageProof, 'pending-project-output-diagnostics')
  };
}

function hasImportRemovalUsageProofInput(input) {
  if (input.outputDiagnostics !== undefined && input.outputDiagnostics !== null) return true;
  const diagnosticOptions = input.diagnosticOptions ?? input.typescriptDiagnosticOptions ?? {};
  if (diagnosticOptions.semantic === false) return false;
  const ts = input.typescript ?? input.ts ?? input.typescriptModule;
  return Boolean(ts?.createProgram && ts?.createSourceFile);
}

function admittedImportRemovalUsageProofAdmission() {
  return {
    status: 'auto-merge-candidate',
    action: 'apply',
    reviewRequired: false,
    autoApplyCandidate: true,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    reasonCodes: []
  };
}

function importRemovalUsageProofSummary(usageProof, conflicts) {
  return {
    importSpecifierAdditions: 0,
    importSpecifierRemovals: 1,
    importDeclarationAdditions: 0,
    topLevelDeclarationAdditions: 0,
    changedExistingDeclarations: 0,
    conflicts,
    gatesPassed: conflicts ? 0 : jsTsSafeMergeGateOrder.length,
    removedImportSpecifiers: [usageProof.removedSpecifier]
  };
}

function importRemovalUsageProofMetadata(input, usageProof, status) {
  return {
    importRemovalUsageProof: compactRecord({
      status,
      proof: 'project-output-diagnostics',
      diagnosticSource: diagnosticProofSource(input),
      sourcePath: usageProof.sourcePath,
      importKey: usageProof.importKey,
      moduleSpecifier: usageProof.moduleSpecifier,
      removedSpecifier: usageProof.removedSpecifier,
      localName: usageProof.localName,
      typeOnly: usageProof.typeOnly || undefined,
      lexicalUseDefEvidence: usageProof.lexicalUseDefEvidence,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    })
  };
}

function diagnosticProofSource(input) {
  if (input.outputDiagnostics !== undefined && input.outputDiagnostics !== null) return 'supplied';
  if (input.typescript || input.ts || input.typescriptModule) return 'typescript-compiler-api';
  return undefined;
}

function headEntryMatchesBase(baseEntry, headEntry) {
  return baseEntry.kind === headEntry.kind && baseEntry.key === headEntry.key && sameStatementText(baseEntry.text, headEntry.text);
}

function arraysEqual(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function hashText(text) { return typeof text === 'string' ? hashSemanticValue(text) : undefined; }

export { ImportRemovalUsageProofOperation, maybeMergeImportSpecifierRemovalFile };
