import { findContainer } from './js-ts-semantic-merge-member-containers.js';
import { uniqueStrings } from './js-ts-semantic-merge-member-utils.js';

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

function removePreparedMemberAdditions(sourceText, preparedRegions, side) {
  let output = sourceText;
  const replacements = preparedRegions
    .map((region) => ({
      range: region[side],
      replacement: removeMembersFromBody(region[side].body, region[`${side}AddedMembers`] ?? [], region.kind, region.base.body)
    }))
    .sort((left, right) => right.range.bodyStart - left.range.bodyStart);
  for (const { range, replacement } of replacements) {
    output = `${output.slice(0, range.bodyStart)}${replacement}${output.slice(range.bodyEnd)}`;
  }
  return output;
}

function applyMemberAdditions(headSourceText, preparedRegions) {
  return applyPreparedMemberAdditions(headSourceText, preparedRegions, ['worker']).sourceText;
}

function applyPreparedMemberAdditions(sourceText, preparedRegions, sides = ['worker']) {
  let output = sourceText;
  const reasonCodes = [];
  const replacements = preparedRegions
    .map((region) => {
      const match = findContainer(sourceText, region.policy);
      if (match.reasonCodes.length) {
        reasonCodes.push(...match.reasonCodes.map((reason) => `target-${reason}:${region.kind}:${region.name}`));
        return undefined;
      }
      const members = sides.flatMap((side) => region[`${side}AddedMembers`] ?? []);
      if (!members.length) return undefined;
      return { range: match.value, replacement: appendMembersToBody(match.value.body, members, region.kind) };
    })
    .filter(Boolean)
    .sort((left, right) => right.range.bodyStart - left.range.bodyStart);
  for (const { range, replacement } of replacements) {
    output = `${output.slice(0, range.bodyStart)}${replacement}${output.slice(range.bodyEnd)}`;
  }
  return { sourceText: output, reasonCodes: uniqueStrings(reasonCodes) };
}

function appendMembersToBody(body, members, kind) {
  if (!members.length) return body;
  const indent = inferMemberIndent(body) ?? inferMemberIndent(members.map((member) => member.text).join('\n')) ?? '  ';
  const addedText = members.map((member, index) => normalizeMemberForInsertion(member.text, indent, kind, index < members.length - 1)).join('\n');
  const trailing = body.match(/\s*$/)?.[0] ?? '';
  const before = body.slice(0, body.length - trailing.length);
  if (!before.trim()) {
    const closingIndent = trailing.includes('\n') ? trailing.slice(trailing.lastIndexOf('\n') + 1) : '';
    return `\n${addedText}\n${closingIndent}`;
  }
  const appendableBefore = appendReadyBody(before, kind);
  return `${appendableBefore}${appendableBefore.endsWith('\n') ? '' : '\n'}${addedText}${trailing.includes('\n') ? trailing : `\n${trailing}`}`;
}

function inferMemberIndent(text) {
  return String(text ?? '').match(/\n([ \t]*)\S/)?.[1];
}

function normalizeMemberForInsertion(text, indent, kind, needsDelimiter) {
  const lines = String(text ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  const commonIndent = minimumIndent(lines);
  const normalized = lines.map((line) => {
    const normalized = commonIndent ? line.slice(Math.min(commonIndent, leadingWhitespace(line))) : line;
    return normalized.trim() ? `${indent}${normalized}` : normalized;
  }).join('\n');
  if (kind !== 'object' || !needsDelimiter || /,\s*$/.test(normalized)) return normalized;
  return `${normalized},`;
}

function appendReadyBody(before, kind) {
  if (kind !== 'object' || !before.trim() || /,\s*$/.test(before)) return before;
  return `${before.replace(/\s*$/, '')},`;
}

function removeMembersFromBody(body, members, kind, baseBody) {
  let output = body;
  for (const member of [...members].sort((left, right) => right.start - left.start || right.end - left.end)) {
    output = `${output.slice(0, member.start)}${output.slice(member.end)}`;
  }
  if (kind !== 'object') return output;
  if (typeof baseBody === 'string' && sameObjectBodyIgnoringTrailingDelimiter(output, baseBody)) return baseBody;
  const trailing = String(body ?? '').match(/\s*$/)?.[0] ?? '';
  return output.replace(/,\s*$/, trailing);
}

function sameObjectBodyIgnoringTrailingDelimiter(left, right) {
  return normalizeObjectTrailingDelimiter(left) === normalizeObjectTrailingDelimiter(right);
}

function normalizeObjectTrailingDelimiter(body) {
  return String(body ?? '').replace(/,\s*$/, (trailing) => trailing.replace(',', ''));
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
  applyPreparedMemberAdditions,
  canonicalizeSourceBodies,
  removePreparedMemberAdditions
};
