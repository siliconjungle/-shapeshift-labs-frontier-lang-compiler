import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment } from '../../native-import-utils.js';
import { spanFromTypeScriptNode } from './spanFromTypeScriptNode.js';
import { typeScriptCompilerSymbolRecordForNode } from './typeScriptCompilerSymbolIdentity.js';
import { typeScriptKindName } from './typeScriptKindName.js';

function createTypeScriptCompilerReferenceGraph(sourceFile, input, options = {}, context, semanticIndex) {
  const checker = options.typeChecker ?? options.checker ?? options.program?.getTypeChecker?.();
  if (!checker || !sourceFile) return emptyReferenceGraph();
  const documentId = semanticIndex?.documents?.[0]?.id ?? `doc_${idFragment(input.sourcePath ?? input.language)}_${idFragment(input.sourceHash)}`;
  const evidenceId = `evidence_${idFragment(input.sourcePath ?? input.language)}_${idFragment(options.astFormat ?? options.parser)}_compiler_references`;
  const records = [];
  visitCompilerReferenceNodes(sourceFile, undefined, options.ts, (node, parent) => {
    if (isDeclarationName(node, parent, options.ts)) return;
    const spanNode = compilerReferenceSpanNode(node, parent, options.ts);
    const compiler = typeScriptCompilerSymbolRecordForNode(node, input, options);
    if (!compiler) return;
    const nativeAstNodeId = context?.objectIds?.get?.(spanNode) ?? context?.objectIds?.get?.(node);
    const span = spanFromTypeScriptNode(spanNode, sourceFile);
    const key = `${compiler.symbolId}\0${nativeAstNodeId ?? spanKey(span)}`;
    if (records.some((record) => record.key === key)) return;
    records.push({ key, node, nativeAstNodeId, span, compiler });
  });
  if (!records.length) return emptyReferenceGraph();
  const occurrences = records.map((record, index) => referenceOccurrence(record, documentId, index));
  const relations = records.map((record, index) => referenceRelation(record, documentId, occurrences[index], evidenceId));
  const facts = records.map((record, index) => referenceFact(record, occurrences[index], relations[index], evidenceId));
  const semanticSymbolIds = new Set((semanticIndex?.symbols ?? []).map((symbol) => symbol.id));
  const mappings = records
    .map((record, index) => referenceMapping(record, occurrences[index], evidenceId, index, semanticSymbolIds))
    .filter(Boolean);
  const evidence = [referenceEvidence(evidenceId, input, options, records)];
  return {
    occurrences,
    relations,
    facts,
    mappings,
    evidence,
    summary: {
      references: records.length,
      symbols: new Set(records.map((record) => record.compiler.symbolId)).size,
      evidenceId
    }
  };
}

function attachTypeScriptCompilerReferenceGraph(semanticIndex, graph) {
  if (!graph?.summary?.references) return semanticIndex;
  return {
    ...semanticIndex,
    occurrences: [...(semanticIndex.occurrences ?? []), ...graph.occurrences],
    relations: [...(semanticIndex.relations ?? []), ...graph.relations],
    facts: [...(semanticIndex.facts ?? []), ...graph.facts],
    evidence: [...(semanticIndex.evidence ?? []), ...graph.evidence],
    metadata: {
      ...(semanticIndex.metadata ?? {}),
      graphCoverage: 'module-edge-declarations+compiler-references',
      compilerReferenceGraph: graph.summary
    }
  };
}

function visitCompilerReferenceNodes(node, parent, ts, visit) {
  if (!node || typeof node !== 'object') return;
  if (isCompilerReferenceNode(node, ts)) visit(node, parent);
  const each = (child) => visitCompilerReferenceNodes(child, node, ts, visit);
  if (ts && typeof ts.forEachChild === 'function') ts.forEachChild(node, each);
  else if (typeof node.forEachChild === 'function') node.forEachChild(each);
  else if (Array.isArray(node.children)) node.children.forEach(each);
}

function isCompilerReferenceNode(node, ts) {
  const kind = typeScriptKindName(node, ts);
  return kind === 'Identifier' || kind === 'PrivateIdentifier';
}

function compilerReferenceSpanNode(node, parent, ts) {
  return isReceiverMemberName(node, parent, ts) ? parent : node;
}

function isReceiverMemberName(node, parent, ts) {
  if (parent?.name !== node) return false;
  if (typeScriptKindName(parent, ts) !== 'PropertyAccessExpression') return false;
  const receiverKind = typeScriptKindName(parent.expression, ts);
  return receiverKind === 'ThisKeyword' || receiverKind === 'SuperKeyword';
}

function referenceOccurrence(record, documentId, index) {
  return compactRecord({
    id: `occ_${idFragment(record.nativeAstNodeId ?? record.key)}_${index + 1}_compiler_reference`,
    documentId,
    symbolId: record.compiler.symbolId,
    role: 'reference',
    span: record.span,
    nativeAstNodeId: record.nativeAstNodeId,
    metadata: { compilerReference: true, compilerSymbol: record.compiler.compilerSymbol }
  });
}

function referenceRelation(record, documentId, occurrence, evidenceId) {
  return {
    id: `rel_${idFragment(hashSemanticValue([documentId, occurrence.id, record.compiler.symbolId, 'compiler-reference']))}`,
    sourceId: occurrence.id,
    predicate: 'references',
    targetId: record.compiler.symbolId,
    evidenceIds: [evidenceId],
    metadata: { compilerReference: true }
  };
}

function referenceFact(record, occurrence, relation, evidenceId) {
  return {
    id: `fact_${idFragment(hashSemanticValue([occurrence.id, relation.id, 'compiler-symbol-reference']))}_compiler_symbol_reference`,
    predicate: 'compilerSymbolReference',
    subjectId: occurrence.id,
    objectId: record.compiler.symbolId,
    value: { ...record.compiler.compilerSymbol, identityHash: record.compiler.compilerSymbolIdentityHash },
    evidenceIds: [evidenceId]
  };
}

function referenceMapping(record, occurrence, evidenceId, index, semanticSymbolIds) {
  if (!semanticSymbolIds.has(record.compiler.symbolId)) return undefined;
  return compactRecord({
    id: `map_${idFragment(record.nativeAstNodeId ?? occurrence.id)}_${index + 1}_compiler_reference`,
    nativeAstNodeId: record.nativeAstNodeId,
    semanticSymbolId: record.compiler.symbolId,
    semanticOccurrenceId: occurrence.id,
    sourceSpan: record.span,
    evidenceIds: [evidenceId],
    lossIds: [],
    precision: record.span ? 'reference' : 'unknown'
  });
}

function referenceEvidence(evidenceId, input, options, records) {
  return {
    id: evidenceId,
    kind: 'typescript-compiler-reference-graph',
    status: 'passed',
    path: input.sourcePath,
    summary: `Resolved ${records.length} TypeScript compiler reference(s).`,
    metadata: {
      parser: options.parser,
      astFormat: options.astFormat,
      language: input.language,
      references: records.length,
      symbols: new Set(records.map((record) => record.compiler.symbolId)).size
    }
  };
}

function isDeclarationName(node, parent, ts) {
  return parent?.name === node && DeclarationNameParentKinds.has(typeScriptKindName(parent, ts));
}
function spanKey(span) { return `${span?.path ?? ''}:${span?.startLine ?? ''}:${span?.startColumn ?? ''}:${span?.endLine ?? ''}:${span?.endColumn ?? ''}`; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }
function emptyReferenceGraph() { return { occurrences: [], relations: [], facts: [], mappings: [], evidence: [], summary: { references: 0, symbols: 0 } }; }

const DeclarationNameParentKinds = new Set([
  'BindingElement',
  'ClassDeclaration',
  'ClassExpression',
  'EnumDeclaration',
  'EnumMember',
  'FunctionDeclaration',
  'FunctionExpression',
  'GetAccessor',
  'ImportClause',
  'ImportEqualsDeclaration',
  'ImportSpecifier',
  'InterfaceDeclaration',
  'MethodDeclaration',
  'MethodSignature',
  'ModuleDeclaration',
  'NamespaceImport',
  'Parameter',
  'PropertyDeclaration',
  'PropertySignature',
  'SetAccessor',
  'TypeAliasDeclaration',
  'TypeParameter',
  'VariableDeclaration'
]);

export { attachTypeScriptCompilerReferenceGraph, createTypeScriptCompilerReferenceGraph };
