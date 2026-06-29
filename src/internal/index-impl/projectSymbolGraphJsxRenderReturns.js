import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { jsxRenderReturnCollectionRecord } from './projectSymbolGraphJsxRenderReturnCollections.js';

function jsxRenderReturnRecords(sourceText) {
  const statements = returnStatements(sourceText);
  const implicitArrows = statements.length ? [] : implicitArrowReturnStatements(sourceText);
  return [...statements, ...implicitArrows]
    .map((statement) => ({
      statement,
      collectionRecord: jsxRenderReturnCollectionRecord(statement.expressionText, sourceText)
    }))
    .filter(({ statement, collectionRecord }) => collectionRecord || isRenderableReturnExpression(statement.expressionText))
    .map(({ statement, collectionRecord }, index) => renderReturnRecord(statement, index, collectionRecord));
}

function jsxRenderReturnRiskEvidence(owner) {
  const records = Array.isArray(owner?.renderReturnRecords) ? owner.renderReturnRecords : [];
  if (!records.length) return {};
  const branchCount = records.filter((record) => record.branchControlKind !== 'return-statement' || record.ifConditionHash).length;
  const branched = records.length > 1 || branchCount > 0;
  const hasConditionalBranchEvidence = records.some((record) => record.conditionalBranchRecord);
  const hasLogicalBranchEvidence = records.some((record) => record.logicalBranchRecord);
  const hasArrayCollectionEvidence = records.some((record) => record.collectionRecord?.collectionKind === 'array-literal');
  const hasFragmentCollectionEvidence = records.some((record) => String(record.collectionRecord?.collectionKind ?? '').startsWith('fragment-'));
  const hasMapCollectionEvidence = records.some((record) => record.collectionRecord?.collectionKind === 'static-const-array-map');
  const keyedListReasonCodes = uniqueStrings(records.map((record) => record.collectionRecord?.keyedListRecord?.reasonCode));
  const hasKeyedListEvidence = keyedListReasonCodes.includes('jsx-render-return-keyed-list-static-evidence');
  const unsupportedKeyedListReasonCodes = keyedListReasonCodes.filter((reasonCode) => reasonCode !== 'jsx-render-return-keyed-list-static-evidence');
  const renderRiskKinds = ['render-return-boundary', branched ? 'render-return-branch-control-flow' : undefined].filter(Boolean);
  const hasImplicitArrow = records.some((record) => record.returnKind === 'implicit-arrow-expression');
  const renderRiskReasonCodes = [
    'jsx-render-return-static-evidence',
    hasImplicitArrow ? 'jsx-render-return-implicit-arrow-static-evidence' : undefined,
    hasConditionalBranchEvidence ? 'jsx-render-return-conditional-branch-static-evidence' : undefined,
    hasLogicalBranchEvidence ? 'jsx-render-return-logical-branch-static-evidence' : undefined,
    hasArrayCollectionEvidence ? 'jsx-render-return-array-static-evidence' : undefined,
    hasFragmentCollectionEvidence ? 'jsx-render-return-fragment-static-evidence' : undefined,
    hasMapCollectionEvidence ? 'jsx-render-return-static-const-array-map-evidence' : undefined,
    hasKeyedListEvidence ? 'jsx-render-return-keyed-list-static-evidence' : undefined,
    ...unsupportedKeyedListReasonCodes,
    branched ? 'jsx-render-return-branch-unsupported' : undefined
  ].filter(Boolean);
  const record = compactRecord({
    renderReturnRecords: records,
    renderReturnCount: records.length,
    renderReturnBranchCount: branchCount || undefined,
    renderReturnSignatureHash: hashSemanticValue({
      kind: 'frontier.lang.projectJsxRenderReturns',
      publicOwnerName: owner?.name,
      records
    })
  });
  return { renderRiskKinds, renderRiskReasonCodes, record };
}

function returnStatements(sourceText) {
  const text = String(sourceText ?? '');
  const statements = [];
  for (const match of text.matchAll(/\breturn\b/g)) {
    const start = match.index;
    const expressionStart = start + match[0].length;
    const expressionEnd = statementEnd(text, expressionStart);
    if (expressionEnd <= expressionStart) continue;
    statements.push({
      start,
      end: expressionEnd,
      expressionText: normalizedReturnExpression(text.slice(expressionStart, expressionEnd).replace(/;$/, '')),
      returnKind: 'return-statement',
      ifConditionText: nearestIfConditionText(text, start)
    });
  }
  return statements;
}

function implicitArrowReturnStatements(sourceText) {
  const text = String(sourceText ?? '');
  const statements = [];
  for (const match of text.matchAll(/=>/g)) {
    if (braceDepthBefore(text, match.index) > 0) continue;
    const expressionStart = skipWhitespace(text, match.index + match[0].length);
    if (text[expressionStart] === '{') continue;
    const expressionEnd = statementEnd(text, expressionStart);
    if (expressionEnd <= expressionStart) continue;
    statements.push({
      start: match.index,
      end: expressionEnd,
      expressionText: normalizedReturnExpression(text.slice(expressionStart, expressionEnd).replace(/;$/, '')),
      returnKind: 'implicit-arrow-expression'
    });
  }
  return statements;
}

function renderReturnRecord(statement, index, collectionRecord) {
  const expressionText = normalizedText(statement.expressionText);
  const ifConditionText = normalizedText(statement.ifConditionText);
  const conditionalBranch = conditionalBranchRecord(expressionText);
  const logicalBranch = logicalBranchRecord(expressionText);
  return compactRecord({
    ordinal: index + 1,
    proofStatus: 'static-render-return-evidence',
    returnKind: statement.returnKind,
    branchControlKind: branchControlKind(expressionText),
    expressionText,
    expressionHash: hashSemanticValue({ kind: 'frontier.lang.projectJsxRenderReturnExpression', expressionText }),
    conditionalBranchRecord: conditionalBranch,
    logicalBranchRecord: logicalBranch,
    collectionRecord,
    ifConditionText,
    ifConditionHash: ifConditionText ? hashSemanticValue({ kind: 'frontier.lang.projectJsxRenderReturnIfCondition', ifConditionText }) : undefined,
    signatureHash: hashSemanticValue({
      kind: 'frontier.lang.projectJsxRenderReturn',
      ordinal: index + 1,
      returnKind: statement.returnKind,
      branchControlKind: branchControlKind(expressionText),
      expressionText,
      conditionalBranch,
      logicalBranch,
      collectionRecord,
      ifConditionText
    })
  });
}

function isRenderableReturnExpression(text) {
  const value = normalizedText(text).replace(/^\(([\s\S]*)\)$/, '$1').trim();
  if (/^(?:null|false|undefined)$/.test(value)) return true;
  if (/^(?:<|\[?\s*<|React\s*\.\s*createElement\s*\()/.test(value)) return true;
  return topLevelConditionalOperator(value) || /(?:^|\s)(?:&&|\|\|)\s*</.test(value) || /[?:]\s*(?:<|null|false|undefined)\b/.test(value);
}

function branchControlKind(expressionText) {
  if (topLevelConditionalOperator(expressionText)) return 'conditional-expression';
  if (topLevelLogicalOperator(expressionText)) return 'logical-expression';
  return 'return-statement';
}

function nearestIfConditionText(text, returnIndex) {
  const prefix = String(text ?? '').slice(Math.max(0, returnIndex - 180), returnIndex);
  const match = /if\s*\(([\s\S]*?)\)\s*(?:\{\s*)?$/.exec(prefix);
  return match ? match[1] : undefined;
}

function statementEnd(text, start) {
  const value = String(text ?? '');
  let quote;
  let depth = 0;
  let escaped = false;
  for (let index = start; index < value.length; index += 1) {
    const char = value[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') quote = char;
    else if (char === '(' || char === '[' || char === '{') depth += 1;
    else if (char === ')' || char === ']' || char === '}') depth = Math.max(0, depth - 1);
    else if (char === ';' && depth === 0) return index + 1;
  }
  return value.length;
}

function topLevelConditionalOperator(text) {
  return topLevelOperator(text, '?');
}
function topLevelLogicalOperator(text) {
  return topLevelOperator(text, '&&') || topLevelOperator(text, '||');
}
function topLevelOperator(text, operator) {
  const value = String(text ?? '');
  let quote;
  let depth = 0;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (quote) {
      if (char === '\\') index += 1;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') quote = char;
    else if (char === '(' || char === '[' || char === '{') depth += 1;
    else if (char === ')' || char === ']' || char === '}') depth = Math.max(0, depth - 1);
    else if (depth === 0 && value.slice(index, index + operator.length) === operator) return true;
  }
  return false;
}

function conditionalBranchRecord(expressionText) {
  const split = splitTopLevelConditional(expressionText);
  if (!split) return undefined;
  return compactRecord({
    proofStatus: 'static-conditional-render-branch-evidence',
    conditionText: split.conditionText,
    consequentText: split.consequentText,
    alternateText: split.alternateText,
    conditionHash: hashSemanticValue({ kind: 'frontier.lang.projectJsxRenderConditionalCondition', text: split.conditionText }),
    consequentHash: hashSemanticValue({ kind: 'frontier.lang.projectJsxRenderConditionalConsequent', text: split.consequentText }),
    alternateHash: hashSemanticValue({ kind: 'frontier.lang.projectJsxRenderConditionalAlternate', text: split.alternateText }),
    signatureHash: hashSemanticValue({ kind: 'frontier.lang.projectJsxRenderConditionalBranch', ...split })
  });
}

function logicalBranchRecord(expressionText) {
  const split = splitTopLevelLogical(expressionText);
  if (!split) return undefined;
  return compactRecord({
    proofStatus: 'static-logical-render-branch-evidence',
    operator: split.operator,
    leftText: split.leftText,
    rightText: split.rightText,
    leftHash: hashSemanticValue({ kind: 'frontier.lang.projectJsxRenderLogicalLeft', text: split.leftText }),
    rightHash: hashSemanticValue({ kind: 'frontier.lang.projectJsxRenderLogicalRight', text: split.rightText }),
    signatureHash: hashSemanticValue({ kind: 'frontier.lang.projectJsxRenderLogicalBranch', ...split })
  });
}

function splitTopLevelConditional(text) {
  const value = String(text ?? '');
  let quote;
  let depth = 0;
  let question = -1;
  let nested = 0;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (quote) {
      if (char === '\\') index += 1;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') quote = char;
    else if (char === '(' || char === '[' || char === '{') depth += 1;
    else if (char === ')' || char === ']' || char === '}') depth = Math.max(0, depth - 1);
    else if (depth === 0 && char === '?') {
      if (question < 0) question = index;
      else nested += 1;
    } else if (depth === 0 && char === ':' && question >= 0) {
      if (nested > 0) nested -= 1;
      else return {
        conditionText: normalizedText(value.slice(0, question)),
        consequentText: normalizedReturnExpression(value.slice(question + 1, index)),
        alternateText: normalizedReturnExpression(value.slice(index + 1))
      };
    }
  }
  return undefined;
}

function splitTopLevelLogical(text) {
  const value = String(text ?? '');
  let quote;
  let depth = 0;
  for (let index = 0; index < value.length - 1; index += 1) {
    const char = value[index];
    if (quote) {
      if (char === '\\') index += 1;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') quote = char;
    else if (char === '(' || char === '[' || char === '{') depth += 1;
    else if (char === ')' || char === ']' || char === '}') depth = Math.max(0, depth - 1);
    else if (depth === 0 && (value.slice(index, index + 2) === '&&' || value.slice(index, index + 2) === '||')) {
      return {
        operator: value.slice(index, index + 2),
        leftText: normalizedReturnExpression(value.slice(0, index)),
        rightText: normalizedReturnExpression(value.slice(index + 2))
      };
    }
  }
  return undefined;
}

function normalizedText(text) { return String(text ?? '').trim().replace(/\s+/g, ' '); }
function normalizedReturnExpression(text) {
  const value = normalizedText(text);
  const wrapped = /^\(([\s\S]*)\)$/.exec(value);
  return wrapped ? normalizedText(wrapped[1]) : value;
}
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }
function skipWhitespace(text, start) { let index = start; while (/\s/.test(String(text ?? '')[index] ?? '')) index += 1; return index; }
function braceDepthBefore(text, offset) {
  const value = String(text ?? '').slice(0, offset);
  let depth = 0;
  let quote;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (quote) {
      if (char === '\\') index += 1;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') quote = char;
    else if (char === '{') depth += 1;
    else if (char === '}') depth = Math.max(0, depth - 1);
  }
  return depth;
}

export { jsxRenderReturnRecords, jsxRenderReturnRiskEvidence };
