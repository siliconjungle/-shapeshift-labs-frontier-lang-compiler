import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment } from '../../native-import-utils.js';

function createProjectModuleDeclarationShapeRecords(semanticIndex, exportEdges = []) {
  const documentsByPath = new Map((semanticIndex?.documents ?? []).filter((document) => document.path).map((document) => [document.path, document]));
  return {
    moduleDeclarationRecords: uniqueRecords((semanticIndex?.symbols ?? []).filter(isModuleDeclarationSymbol).map((symbol) => moduleDeclarationShapeRecord(symbol, documentsByPath))),
    exportAssignmentRecords: uniqueRecords((exportEdges ?? []).filter(isExportAssignmentEdge).map(exportAssignmentShapeRecord))
  };
}

function moduleDeclarationShapeRecord(symbol, documentsByPath) {
  const metadata = objectValue(symbol.metadata);
  const sourcePath = symbol.definitionSpan?.path;
  const moduleName = firstString(metadata.moduleName, metadata.namespace, symbol.name);
  const surfaceKind = moduleDeclarationSurfaceKind(moduleName);
  const document = documentsByPath.get(sourcePath);
  const shapeInput = { sourcePath, sourceHash: document?.sourceHash, sourceSpan: symbol.definitionSpan, moduleName, surfaceKind, symbolKind: symbol.kind, signatureHash: symbol.signatureHash };
  const shapeHash = hashSemanticValue({ kind: 'frontier.lang.moduleDeclarationShape', ...shapeInput });
  return compactRecord({
    kind: 'frontier.lang.projectModuleDeclarationShape',
    version: 1,
    id: `module_declaration_shape_${idFragment(symbol.id)}`,
    symbolId: symbol.id,
    language: symbol.language,
    sourcePath,
    sourceHash: document?.sourceHash,
    moduleName,
    namespace: firstString(metadata.namespace, moduleName),
    surfaceKind,
    declarationOnly: surfaceKind !== 'namespace-declaration',
    runtimeNamespace: surfaceKind === 'namespace-declaration',
    ambient: surfaceKind === 'ambient-module-declaration' || surfaceKind === 'global-augmentation',
    nativeAstNodeId: symbol.nativeAstNodeId,
    sourceSpan: symbol.definitionSpan,
    signatureHash: symbol.signatureHash,
    shapeHash,
    shapeProof: moduleDeclarationShapeProof(surfaceKind, shapeHash)
  });
}

function exportAssignmentShapeRecord(edge) {
  const shapeInput = { sourcePath: edge.sourcePath, exportedName: edge.exportedName, localName: edge.localName, exportKind: edge.exportKind };
  const shapeHash = hashSemanticValue({ kind: 'frontier.lang.exportAssignmentShape', ...shapeInput });
  return compactRecord({
    kind: 'frontier.lang.projectExportAssignmentShape',
    version: 1,
    id: `export_assignment_shape_${idFragment(edge.id)}`,
    edgeId: edge.id,
    sourcePath: edge.sourcePath,
    sourceHash: edge.sourceHash,
    exportedName: edge.exportedName,
    localName: edge.localName,
    exportKind: edge.exportKind,
    publicContract: edge.publicContract,
    commonJsShape: true,
    shapeHash,
    shapeProof: exportAssignmentShapeProof(shapeHash)
  });
}

function moduleDeclarationShapeProof(surfaceKind, shapeHash) {
  return {
    kind: 'frontier.lang.projectModuleDeclarationShapeProof',
    version: 1,
    status: 'static-shape-evidence',
    proofLevel: 'module-declaration-static-shape',
    shapeHash,
    requiredSignals: ['parser-module-declaration-symbol', 'source-span', 'static-shape-hash'],
    providedSignals: ['parser-module-declaration-symbol', 'source-span', 'static-shape-hash'],
    unsupportedSignals: moduleDeclarationUnsupportedSignals(surfaceKind),
    runtimeEquivalenceClaim: false,
    semanticEquivalenceClaim: false
  };
}

function exportAssignmentShapeProof(shapeHash) {
  return {
    kind: 'frontier.lang.projectExportAssignmentShapeProof',
    version: 1,
    status: 'static-shape-evidence',
    proofLevel: 'export-assignment-static-shape',
    shapeHash,
    requiredSignals: ['parser-export-assignment-edge', 'source-span', 'static-shape-hash'],
    providedSignals: ['parser-export-assignment-edge', 'source-span', 'static-shape-hash'],
    unsupportedSignals: ['commonjs-runtime-interop-equivalence-unproven', 'module-export-assignment-side-effects-unproven'],
    runtimeInteropEquivalenceClaim: false,
    semanticEquivalenceClaim: false
  };
}

function moduleDeclarationUnsupportedSignals(surfaceKind) {
  if (surfaceKind === 'global-augmentation') return ['global-augmentation-compatibility-unproven'];
  if (surfaceKind === 'ambient-module-declaration') return ['ambient-module-consumer-compatibility-unproven'];
  return ['namespace-runtime-evaluation-order-unproven'];
}

function isModuleDeclarationSymbol(symbol) {
  return symbol?.kind === 'module' && String(symbol.metadata?.scan ?? '').includes('module-declaration');
}

function isExportAssignmentEdge(edge) {
  return edge?.exportKind === 'assignment' || edge?.exportedName === 'module.exports';
}

function moduleDeclarationSurfaceKind(moduleName) {
  const name = String(moduleName ?? '');
  if (name === 'global') return 'global-augmentation';
  if (/^(?:\.|\.\.|@|#|[A-Za-z0-9_-]+\/)/.test(name)) return 'ambient-module-declaration';
  return 'namespace-declaration';
}

function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

function objectValue(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function firstString(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value)) return String(value);
  }
  return undefined;
}

function uniqueRecords(records) {
  const seen = new Set();
  return records.filter((record) => {
    const key = record?.id ?? hashSemanticValue(record);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export { createProjectModuleDeclarationShapeRecords };
