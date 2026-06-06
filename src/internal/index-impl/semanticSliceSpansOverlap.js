export function semanticSliceSpansOverlap(left, right) {
  if (!left || !right) return false;
  const leftPath = left.path ?? left.sourceId;
  const rightPath = right.path ?? right.sourceId;
  if (leftPath && rightPath && leftPath !== rightPath) return false;
  if (typeof left.start === 'number' && typeof left.end === 'number' && typeof right.start === 'number' && typeof right.end === 'number') {
    return left.start <= right.end && right.start <= left.end;
  }
  if (typeof left.startLine === 'number' && typeof right.startLine === 'number') {
    const leftEnd = left.endLine ?? left.startLine;
    const rightEnd = right.endLine ?? right.startLine;
    return left.startLine <= rightEnd && right.startLine <= leftEnd;
  }
  return false;
}
