import{rustSynColumnToOneBased}from'./rustSynColumnToOneBased.js';
export function spanFromRustSynNode(node, input) {
  const span = node.span ?? node.ident?.span ?? node.sig?.ident?.span ?? node.name?.span;
  if (!span || typeof span !== 'object') return undefined;
  const start = span.start ?? span.lo ?? span.begin;
  const end = span.end ?? span.hi;
  const startLine = span.startLine ?? span.line ?? start?.line;
  const startColumn = span.startColumn ?? span.column ?? start?.column;
  const endLine = span.endLine ?? end?.line;
  const endColumn = span.endColumn ?? end?.column;
  if (typeof startLine !== 'number') return undefined;
  return {
    sourceId: input.sourceHash,
    path: input.sourcePath,
    startLine,
    startColumn: typeof startColumn === 'number' ? rustSynColumnToOneBased(startColumn, span) : undefined,
    endLine: typeof endLine === 'number' ? endLine : undefined,
    endColumn: typeof endColumn === 'number' ? rustSynColumnToOneBased(endColumn, span) : undefined
  };
}
