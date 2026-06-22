function canonicalizeSourceBodies(sourceText, preparedRegions, side) {
  let output = sourceText;
  const replacements = preparedRegions
    .map((region) => ({ range: region[side], replacement: region.base.body }))
    .sort((left, right) => right.range.bodyStart - left.range.bodyStart);
  for (const { range, replacement } of replacements) {
    output = `${output.slice(0, range.bodyStart)}${replacement}${output.slice(range.bodyEnd)}`;
  }
  return output;
}

function applyMemberAdditions(headSourceText, preparedRegions) {
  let output = headSourceText;
  const replacements = preparedRegions
    .filter((region) => region.workerAddedMembers.length)
    .map((region) => ({ range: region.head, replacement: appendMembersToBody(region.head.body, region.workerAddedMembers) }))
    .sort((left, right) => right.range.bodyStart - left.range.bodyStart);
  for (const { range, replacement } of replacements) {
    output = `${output.slice(0, range.bodyStart)}${replacement}${output.slice(range.bodyEnd)}`;
  }
  return output;
}

function appendMembersToBody(body, members) {
  if (!members.length) return body;
  const indent = inferMemberIndent(body) ?? inferMemberIndent(members.map((member) => member.text).join('\n')) ?? '  ';
  const addedText = members.map((member) => normalizeMemberForInsertion(member.text, indent)).join('\n');
  const trailing = body.match(/\s*$/)?.[0] ?? '';
  const before = body.slice(0, body.length - trailing.length);
  if (!before.trim()) {
    const closingIndent = trailing.includes('\n') ? trailing.slice(trailing.lastIndexOf('\n') + 1) : '';
    return `\n${addedText}\n${closingIndent}`;
  }
  return `${before}${before.endsWith('\n') ? '' : '\n'}${addedText}${trailing.includes('\n') ? trailing : `\n${trailing}`}`;
}

function inferMemberIndent(text) {
  return String(text ?? '').match(/\n([ \t]*)\S/)?.[1];
}

function normalizeMemberForInsertion(text, indent) {
  const lines = String(text ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  const commonIndent = minimumIndent(lines);
  return lines.map((line) => {
    const normalized = commonIndent ? line.slice(Math.min(commonIndent, leadingWhitespace(line))) : line;
    return normalized.trim() ? `${indent}${normalized}` : normalized;
  }).join('\n');
}

function minimumIndent(lines) {
  const indents = lines.filter((line) => line.trim()).map(leadingWhitespace);
  return indents.length ? Math.min(...indents) : 0;
}

function leadingWhitespace(line) {
  return line.match(/^[ \t]*/)?.[0].length ?? 0;
}

export {
  applyMemberAdditions,
  canonicalizeSourceBodies
};
