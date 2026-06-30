import { idFragment } from '../../native-import-utils.js';

export function appendRustBorrowEscapes(output, bundle, record, context, bindings, body) {
  for (const escape of rustBorrowEscapeExpressions(body, record.bodySpan, bindings)) {
    appendRustBorrowEscape(output, bundle, record, context, bindings, escape);
  }
}

function appendRustBorrowEscape(output, bundle, record, context, bindings, escape) {
  const binding = escape.bindingName ? bindings.get(escape.bindingName) : undefined;
  const borrowed = escape.borrowedName ? bindings.get(escape.borrowedName) : undefined;
  const target = binding ?? borrowed;
  const idPart = `${context.recordId}_${idFragment(escape.name ?? escape.bindingName ?? escape.borrowedName ?? escape.index)}`;
  output.escapes.push({
    id: `escape_rust_borrow_${idPart}_${escape.index}`,
    resourceId: target?.resourceId,
    ownerId: target?.ownerId,
    lifetimeRegionId: target?.lifetimeRegionId,
    loanId: binding?.loanId,
    escapeKind: 'rust-borrow-escape',
    status: 'needs-proof',
    sourcePath: bundle.sourcePath,
    sourceHash: bundle.sourceHash,
    sourceSpan: rustStatementSpan(escape, bundle, record),
    evidenceIds: context.evidenceIds,
    metadata: {
      rustKey: record.key,
      statementText: escape.text,
      returnedExpression: escape.expression,
      escapedBinding: escape.bindingName,
      borrowedBinding: escape.borrowedName ?? binding?.borrowedBinding,
      evidenceKind: escape.expressionKind,
      note: 'Returned borrow evidence is source-derived and requires lifetime/no-escape proof before cross-language admission.'
    }
  });
}

function rustBorrowEscapeExpressions(body, bodySpan = {}, bindings) {
  return [
    ...rustReturnBorrowExpressions(body, bodySpan, bindings),
    ...rustTailBorrowExpressions(body, bodySpan, bindings)
  ];
}

function rustReturnBorrowExpressions(body, bodySpan, bindings) {
  const expressions = [];
  const regex = /(^|[\n;{])\s*return\s+([^;]+);/g;
  let match;
  while ((match = regex.exec(body))) {
    const expression = match[2].trim();
    const target = rustBorrowEscapeTarget(expression, bindings);
    if (!target) continue;
    expressions.push({
      index: expressions.length,
      offset: match.index + match[1].length,
      line: rustLineAt(body, match.index) + (bodySpan.startLine ?? 1) - 1,
      text: match[0].slice(match[1].length).trim(),
      expression,
      expressionKind: 'rust-returned-borrow',
      ...target
    });
  }
  return expressions;
}

function rustTailBorrowExpressions(body, bodySpan, bindings) {
  const lines = body.split('\n');
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index];
    const trimmed = line.trim();
    const lineOffset = offsetForLine(lines, index);
    if (!trimmed || trimmed === '}') continue;
    if (trimmed.endsWith(';')) return [];
    const target = rustBorrowEscapeTarget(trimmed, bindings);
    if (!target) return [];
    return [{
      index: 0,
      offset: lineOffset + line.indexOf(trimmed),
      line: index + (bodySpan.startLine ?? 1),
      text: trimmed,
      expression: trimmed,
      expressionKind: 'rust-tail-borrow-escape',
      ...target
    }];
  }
  return [];
}

function rustBorrowEscapeTarget(expression, bindings) {
  const directBorrow = expression.match(/^&\s*(?:mut\s+)?([A-Za-z_][A-Za-z0-9_]*)\b$/);
  if (directBorrow) return { name: directBorrow[1], borrowedName: directBorrow[1] };
  const bindingRef = expression.match(/^([A-Za-z_][A-Za-z0-9_]*)$/);
  if (!bindingRef) return undefined;
  const binding = bindings.get(bindingRef[1]);
  if (binding?.bindingKind !== 'borrow') return undefined;
  return { name: bindingRef[1], bindingName: bindingRef[1], borrowedName: binding.borrowedBinding };
}

function rustStatementSpan(statement, bundle, record) {
  const startOffset = (record.bodySpan?.startOffset ?? 0) + statement.offset;
  return {
    path: bundle.sourcePath,
    startOffset,
    endOffset: startOffset + statement.text.length,
    startLine: statement.line,
    endLine: statement.line
  };
}

function rustLineAt(text, offset) {
  return text.slice(0, offset).split('\n').length;
}

function offsetForLine(lines, index) {
  return lines.slice(0, index).reduce((sum, line) => sum + line.length + 1, 0);
}
