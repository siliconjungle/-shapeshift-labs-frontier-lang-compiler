import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment } from '../../native-import-utils.js';
import { collectBindings } from '../../js-ts-semantic-scope-use-def-bindings.js';
import { createBraceDepthIndex, isPropertyAccess, likelyTypeReference, maskNonCode, tokenize } from '../../js-ts-semantic-scope-use-def-scan.js';
import { LexicalUseDefReasonCodes, identifierRegExp, namespaceOverlap, rangeKey } from '../../js-ts-semantic-scope-use-def-utils.js';
import { bindingRecords, closureCaptureEvidence, compactRecord, semanticSpanForHash, sourceSpanForRange } from './projectSymbolGraphScopeUseDefRecordBuilders.js';
import { nearestPublicOwnerForOffset } from './projectSymbolGraphScopeUseDefOwners.js';
import { readStaticMemberLiteral } from './staticMemberLiteral.js';

const jsTsKeywords = new Set('abstract as async await break case catch class const continue debugger declare default delete do else enum export extends false finally for from function if implements import in infer instanceof interface keyof let module namespace new null of package private protected public readonly return satisfies static super switch this throw true try type typeof undefined unique unknown var void while with yield'.split(' '));

function lexicalScopeRecordsForImport(sourceText, context) {
  const masked = maskNonCode(sourceText);
  const tokens = tokenize(masked.code).map((token, index) => ({ ...token, index, depth: 0 }));
  const depthAt = createBraceDepthIndex(masked.code);
  for (const token of tokens) token.depth = depthAt[token.start] ?? 0;
  const rawBindings = collectBindings(masked.code, tokens, depthAt);
  const bindings = bindingRecords(rawBindings, context);
  const references = [
    ...referenceRecords(tokens, masked, bindings, context),
    ...receiverMemberReferenceRecords(masked, context)
  ];
  return {
    scopeBindingRecords: bindings,
    scopeReferenceRecords: references
  };
}

function receiverMemberReferenceRecords(masked, context) {
  const code = masked.code;
  const records = [];
  for (const match of code.matchAll(/\b(this|super)\b/g)) {
    const receiver = match[1];
    if (isPropertyAccess(code, match.index)) continue;
    const access = receiverMemberAccess(context.sourceText ?? code, code, match.index + receiver.length);
    if (!access) continue;
    const publicOwner = nearestPublicOwnerForOffset(context.publicOwners, match.index);
    if (!publicOwner) continue;
    const writeOperation = namespaceMemberWriteOperation(code, match.index, access.accessEnd);
    const sourceSpan = sourceSpanForRange(context, match.index, access.accessEnd);
    const referenceKind = `${receiver}-member-${writeOperation ? 'write' : 'read'}`;
    records.push(compactRecord({
      id: `scope_ref_${idFragment(context.sourcePath)}_receiver_${records.length + 1}`,
      name: receiver,
      namespace: 'value',
      namespaces: ['value'],
      sourcePath: context.sourcePath,
      sourceHash: context.sourceHash,
      sourceSpan,
      start: match.index,
      end: access.accessEnd,
      depth: 0,
      referenceKind,
      receiverKind: receiver,
      memberName: access.memberName,
      memberStart: access.memberStart,
      memberEnd: access.memberEnd,
      memberComputed: access.memberComputed,
      memberLiteralKind: access.memberLiteralKind,
      memberStaticTemplateLiteral: access.memberLiteralKind === 'static-template-literal' ? true : undefined,
      memberOptional: access.memberOptional,
      writeOperation,
      publicContract: true,
      publicOwnerName: publicOwner.name,
      signatureHash: hashSemanticValue({
        kind: 'frontier.lang.projectScopeReceiverMemberReference',
        receiver,
        memberName: access.memberName,
        memberComputed: access.memberComputed,
        memberOptional: access.memberOptional,
        writeOperation,
        publicOwnerName: publicOwner.name,
        sourceSpan: semanticSpanForHash(sourceSpan)
      })
    }));
  }
  return records;
}

function receiverMemberAccess(sourceText, code, receiverEnd) {
  let index = receiverEnd;
  while (index < code.length && /\s/.test(code[index])) index += 1;
  let memberOptional;
  if (code[index] === '?' && code[index + 1] === '.') {
    memberOptional = true;
    index += 2;
  }
  if (memberOptional && code[index] !== '[') return receiverDotMemberAccess(code, index, memberOptional);
  if (code[index] === '.') return receiverDotMemberAccess(code, index + 1, memberOptional);
  if (code[index] !== '[') return undefined;
  return receiverComputedMemberAccess(sourceText, code, index, memberOptional);
}

function receiverDotMemberAccess(code, memberOffset, memberOptional) {
  let index = memberOffset;
  while (index < code.length && /\s/.test(code[index])) index += 1;
  const match = /^#?[A-Za-z_$][\w$]*/.exec(code.slice(index));
  if (!match) return undefined;
  return { memberName: match[0], memberStart: index, memberEnd: index + match[0].length, memberOptional, accessEnd: index + match[0].length };
}

function receiverComputedMemberAccess(sourceText, code, open, memberOptional) {
  const close = findMatchingBracket(code, open);
  if (close === -1) return undefined;
  let index = open + 1;
  while (index < close && /\s/.test(sourceText[index])) index += 1;
  const literal = readStaticMemberLiteral(sourceText, index, close);
  if (!literal || !identifierRegExp.test(literal.value)) return undefined;
  return { memberName: literal.value, memberStart: literal.start, memberEnd: literal.end, memberComputed: true, memberLiteralKind: literal.literalKind, memberOptional, accessEnd: close + 1 };
}

function referenceRecords(tokens, masked, bindings, context) {
  const code = masked.code;
  const bindingKeys = new Set(bindings.map((binding) => `${binding.start}:${binding.end}`));
  return tokens.flatMap((token, index) => {
    if (jsTsKeywords.has(token.value) || bindingKeys.has(rangeKey(token)) || isPropertyAccess(code, token.start)) return [];
    const namespace = likelyTypeReference(code, tokens, index) ? 'type' : 'value';
    const binding = nearestBinding(bindings, token, namespace);
    if (!binding) return [];
    const namespaceProperty = namespacePropertyAccess(code, token, binding, context);
    const sourceSpan = sourceSpanForRange(context, token.start, token.end);
    const semanticSpan = semanticSpanForHash(sourceSpan);
    const publicOwner = nearestPublicOwnerForOffset(context.publicOwners, token.start);
    const publicOwnerName = binding.publicOwnerName ?? publicOwner?.name;
    const closureCapture = closureCaptureEvidence(token.depth, binding, publicOwnerName);
    const templateExpression = templateExpressionRangeForOffset(masked.templateExpressionRanges, token.start);
    const templateExpressionHash = templateExpression ? hashSemanticValue({
      kind: 'frontier.lang.projectScopeReferenceTemplateExpression',
      sourcePath: context.sourcePath,
      sourceHash: context.sourceHash,
      start: templateExpression.start,
      end: templateExpression.end,
      templateKind: templateExpression.templateKind,
      templateTagText: templateExpression.templateTagText
    }) : undefined;
    return [compactRecord({
      id: `scope_ref_${idFragment(context.sourcePath)}_${index + 1}`,
      name: token.value,
      namespace,
      namespaces: [namespace],
      sourcePath: context.sourcePath,
      sourceHash: context.sourceHash,
      sourceSpan,
      start: token.start,
      end: token.end,
      depth: token.depth,
      referenceKind: namespaceProperty?.referenceKind ?? (templateExpression ? 'template-literal-interpolation' : undefined),
      templateLiteralInterpolation: templateExpression ? true : undefined,
      templateExpressionStart: templateExpression?.start,
      templateExpressionEnd: templateExpression?.end,
      templateExpressionHash,
      templateLiteralKind: templateExpression?.templateKind,
      taggedTemplate: templateExpression?.templateKind === 'tagged-template' ? true : undefined,
      templateTagText: templateExpression?.templateTagText,
      templateTagRoot: templateExpression?.templateTagRoot,
      templateTagMemberName: templateExpression?.templateTagMemberName,
      templateTagStart: templateExpression?.templateTagStart,
      templateTagEnd: templateExpression?.templateTagEnd,
      memberName: namespaceProperty?.memberName,
      memberStart: namespaceProperty?.memberStart,
      memberEnd: namespaceProperty?.memberEnd,
      memberComputed: namespaceProperty?.memberComputed,
      memberLiteralKind: namespaceProperty?.memberLiteralKind,
      memberStaticTemplateLiteral: namespaceProperty?.memberLiteralKind === 'static-template-literal' ? true : undefined,
      writeOperation: namespaceProperty?.writeOperation,
      bindingId: binding.id,
      bindingName: binding.name,
      bindingKind: binding.bindingKind,
      bindingOrdinal: binding.ordinal,
      closure: Boolean(closureCapture) || undefined,
      closureDepthDelta: closureCapture?.closureDepthDelta,
      closureBindingDepth: closureCapture?.closureBindingDepth,
      closureOwnerName: closureCapture?.closureOwnerName,
      closureCaptureHash: closureCapture?.closureCaptureHash,
      publicContract: (binding.publicContract || Boolean(publicOwnerName)) || undefined,
      publicOwnerName,
      status: namespaceProperty?.status,
      reasonCodes: namespaceProperty?.reasonCodes,
      signatureHash: hashSemanticValue({
        kind: 'frontier.lang.projectScopeReferenceSignature',
        name: token.value,
        namespace,
        bindingId: binding.id,
        sourceSpan: semanticSpan,
        referenceKind: namespaceProperty?.referenceKind ?? (templateExpression ? 'template-literal-interpolation' : undefined),
        templateExpressionHash,
        templateKind: templateExpression?.templateKind,
        templateTagText: templateExpression?.templateTagText,
        memberName: namespaceProperty?.memberName,
        memberComputed: namespaceProperty?.memberComputed,
        writeOperation: namespaceProperty?.writeOperation,
        closureCaptureHash: closureCapture?.closureCaptureHash,
        closureDepthDelta: closureCapture?.closureDepthDelta,
        closureOwnerName: closureCapture?.closureOwnerName,
        status: namespaceProperty?.status,
        reasonCodes: namespaceProperty?.reasonCodes
      })
    })];
  });
}

function templateExpressionRangeForOffset(ranges = [], offset) {
  return ranges.filter((range) => offset >= range.start && offset < range.end).sort((left, right) => (left.end - left.start) - (right.end - right.start))[0];
}

function nearestBinding(bindings, token, namespace) {
  return bindings
    .filter((binding) => binding.name === token.value && binding.start < token.start && namespaceOverlap(binding.namespaces, [namespace]))
    .sort((left, right) => right.start - left.start || right.depth - left.depth)[0];
}

function namespacePropertyAccess(code, token, binding, context) {
  const importAlias = context.importAliasesByLocalKey?.get(context.sourcePath && token.value ? `${context.sourcePath}\0${token.value}` : undefined);
  if (binding.bindingKind !== 'import' || importAlias?.importKind !== 'namespace') return undefined;
  let index = token.end;
  while (index < code.length && /\s/.test(code[index])) index += 1;
  if (code[index] === '.') {
    const match = /^[A-Za-z_$][\w$]*/.exec(code.slice(index + 1).trimStart());
    const memberStart = match ? code.indexOf(match[0], index + 1) : -1;
    if (!match) return undefined;
    const memberEnd = memberStart + match[0].length;
    const writeOperation = namespaceMemberWriteOperation(code, token.start, memberEnd);
    return writeOperation
      ? blockedNamespaceMemberWrite('namespace-property-write', { memberName: match[0], memberStart, memberEnd, writeOperation })
      : { referenceKind: 'namespace-property-read', memberName: match[0], memberStart, memberEnd };
  }
  if (code[index] === '[') return namespaceComputedPropertyAccess(context.sourceText ?? code, code, token.start, index);
  return undefined;
}

function namespaceComputedPropertyAccess(sourceText, code, tokenStart, open) {
  const close = findMatchingBracket(code, open);
  if (close === -1) return blockedNamespaceComputedPropertyAccess();
  const writeOperation = namespaceMemberWriteOperation(code, tokenStart, close + 1);
  let index = open + 1;
  while (index < close && /\s/.test(sourceText[index])) index += 1;
  const literal = readStaticMemberLiteral(sourceText, index, close);
  if (!literal) return blockedNamespaceComputedPropertyAccess(writeOperation);
  let afterLiteral = literal.end + 1;
  while (afterLiteral < close && /\s/.test(sourceText[afterLiteral])) afterLiteral += 1;
  if (afterLiteral !== close || !identifierRegExp.test(literal.value)) return blockedNamespaceComputedPropertyAccess(writeOperation);
  if (writeOperation) {
    return blockedNamespaceMemberWrite('namespace-computed-property-write', {
      memberName: literal.value,
      memberStart: literal.start,
      memberEnd: literal.end,
      memberComputed: true,
      memberLiteralKind: literal.literalKind,
      writeOperation
    });
  }
  return { referenceKind: 'namespace-computed-property-read', memberName: literal.value, memberStart: literal.start, memberEnd: literal.end, memberComputed: true, memberLiteralKind: literal.literalKind };
}

function blockedNamespaceComputedPropertyAccess(writeOperation) {
  return {
    referenceKind: writeOperation ? 'namespace-computed-property-write' : 'namespace-computed-property-read',
    memberComputed: true,
    writeOperation,
    status: 'blocked',
    reasonCodes: [
      LexicalUseDefReasonCodes.namespaceComputedMemberUnsupported,
      ...(writeOperation ? [LexicalUseDefReasonCodes.namespaceMemberWriteUnsupported] : [])
    ]
  };
}

function blockedNamespaceMemberWrite(referenceKind, fields = {}) {
  return {
    referenceKind,
    memberName: fields.memberName,
    memberStart: fields.memberStart,
    memberEnd: fields.memberEnd,
    memberComputed: fields.memberComputed,
    memberLiteralKind: fields.memberLiteralKind,
    status: 'blocked',
    reasonCodes: [LexicalUseDefReasonCodes.namespaceMemberWriteUnsupported],
    writeOperation: fields.writeOperation
  };
}

function namespaceMemberWriteOperation(code, tokenStart, accessEnd) {
  if (hasPrefixUpdateOperator(code, tokenStart)) return 'update';
  let index = accessEnd;
  while (index < code.length && /\s/.test(code[index])) index += 1;
  if (code.slice(index, index + 2) === '++' || code.slice(index, index + 2) === '--') return 'update';
  const operator = assignmentOperatorAt(code, index);
  return operator ? 'assignment' : undefined;
}

function assignmentOperatorAt(code, index) {
  for (const operator of ['>>>=', '**=', '<<=', '>>=', '&&=', '||=', '??=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '=']) {
    if (!code.startsWith(operator, index)) continue;
    if (operator === '=' && (code[index + 1] === '=' || code[index + 1] === '>')) return undefined;
    return operator;
  }
  return undefined;
}

function hasPrefixUpdateOperator(code, tokenStart) {
  let index = tokenStart - 1;
  while (index >= 0 && /\s/.test(code[index])) index -= 1;
  const operatorStart = index - 1;
  const operator = code.slice(operatorStart, index + 1);
  if (operator !== '++' && operator !== '--') return false;
  let before = operatorStart - 1;
  while (before >= 0 && /\s/.test(code[before])) before -= 1;
  return before < 0 || !/[A-Za-z0-9_$)\]]/.test(code[before]);
}

function findMatchingBracket(code, open) {
  let depth = 0;
  for (let index = open; index < code.length; index += 1) {
    if (code[index] === '[') depth += 1;
    else if (code[index] === ']' && --depth === 0) return index;
  }
  return -1;
}

export { lexicalScopeRecordsForImport };
