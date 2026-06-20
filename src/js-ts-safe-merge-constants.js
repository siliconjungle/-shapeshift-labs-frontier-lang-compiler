export const JsTsSafeMergeStatuses = Object.freeze({
  merged: 'merged',
  blocked: 'blocked'
});

export const JsTsSafeMergeGateIds = Object.freeze({
  parseLedger: 'parse-ledger',
  preserveBaseOrder: 'preserve-base-order',
  stableExistingDeclarations: 'stable-existing-declarations',
  independentImportSpecifiers: 'independent-import-specifiers',
  independentTopLevelDeclarations: 'independent-top-level-declarations',
  uniqueNames: 'unique-names',
  resolvedInsertionAnchors: 'resolved-insertion-anchors'
});

export const JsTsSafeMergeConflictCodes = Object.freeze({
  invalidInput: 'invalid-input',
  parserLedgerLoss: 'parser-ledger-loss',
  sideEffectImportReorder: 'side-effect-import-reorder',
  topLevelOrderChanged: 'top-level-order-changed',
  changedExistingDeclaration: 'changed-existing-declaration',
  importShapeChanged: 'import-shape-changed',
  importSpecifierRemoved: 'import-specifier-removed',
  importSpecifierReordered: 'import-specifier-reordered',
  importFormattingChanged: 'import-formatting-changed',
  newImportDeclaration: 'new-import-declaration',
  duplicateName: 'duplicate-name',
  ambiguousInsertionPoint: 'ambiguous-insertion-point',
  insertionAnchorMissing: 'insertion-anchor-missing'
});

export const jsTsSafeMergeGateOrder = Object.freeze([
  JsTsSafeMergeGateIds.parseLedger,
  JsTsSafeMergeGateIds.preserveBaseOrder,
  JsTsSafeMergeGateIds.stableExistingDeclarations,
  JsTsSafeMergeGateIds.independentImportSpecifiers,
  JsTsSafeMergeGateIds.independentTopLevelDeclarations,
  JsTsSafeMergeGateIds.uniqueNames,
  JsTsSafeMergeGateIds.resolvedInsertionAnchors
]);

const identifierPattern = '[A-Za-z_$][\\w$]*';
export const identifierRegExp = new RegExp(`^${identifierPattern}$`);
