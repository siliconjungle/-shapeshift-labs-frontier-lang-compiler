export function spanFromTypeScriptNode(node, sourceFile) {
  const start = typeof node.getStart === 'function' ? node.getStart(sourceFile) : node.pos;
  const end = typeof node.getEnd === 'function' ? node.getEnd() : node.end;
  if (typeof start !== 'number' || typeof sourceFile?.getLineAndCharacterOfPosition !== 'function') return undefined;
  const startPos = sourceFile.getLineAndCharacterOfPosition(start);
  const endPos = typeof end === 'number' ? sourceFile.getLineAndCharacterOfPosition(end) : undefined;
  return {
    sourceId: sourceFile.sourceHash,
    path: sourceFile.fileName,
    startLine: startPos.line + 1,
    startColumn: startPos.character + 1,
    endLine: endPos ? endPos.line + 1 : undefined,
    endColumn: endPos ? endPos.character + 1 : undefined
  };
}
