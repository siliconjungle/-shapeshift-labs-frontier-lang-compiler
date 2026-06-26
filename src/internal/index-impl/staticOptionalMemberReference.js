function staticOptionalMemberReference(text) {
  const normalized = normalizedOptionalMemberExpression(text);
  if (!normalized.includes('?.')) return undefined;
  if (!/^(?:this|[A-Za-z_$][\w$]*)(?:(?:\?\.|\.)[A-Za-z_$][\w$]*)+$/.test(normalized)) return undefined;
  const path = normalized.split(/\?\.|\./);
  const operators = normalized.match(/\?\.|\./g) ?? [];
  const optionalSegmentIndexes = operators.flatMap((operator, index) => operator === '?.' ? [index + 1] : []);
  return {
    text: normalized,
    root: path[0],
    path,
    memberPath: path.slice(1),
    optionalSegments: optionalSegmentIndexes.map((index) => path[index]),
    optionalSegmentIndexes
  };
}

function normalizedOptionalMemberExpression(text) {
  return String(text ?? '').trim().replace(/\s+/g, ' ').replace(/\s*(\?\.|\.)\s*/g, '$1').replace(/\s+/g, '');
}

export { staticOptionalMemberReference };
