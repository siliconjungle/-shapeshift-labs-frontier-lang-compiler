import { JsTsSafeMergeConflictCodes, JsTsSafeMergeGateIds } from './js-ts-safe-merge-constants.js';
import { addConflict } from './js-ts-safe-merge-context.js';
import { classifyStatement, importSpecifierCanonical } from './js-ts-safe-merge-parse-declarations.js';
import { findStatementEnd, skipTopLevelTrivia } from './js-ts-safe-merge-parse-statements.js';

export function scanJsTsTopLevelLedger(sourceText, label, context) {
  const entries = [];
  let offset = 0;
  while (offset < sourceText.length) {
    const skipped = skipTopLevelTrivia(sourceText, offset);
    if (skipped.error) {
      addConflict(context, {
        code: JsTsSafeMergeConflictCodes.parserLedgerLoss,
        gateId: JsTsSafeMergeGateIds.parseLedger,
        side: label,
        message: `${label} source contains unterminated top-level trivia.`,
        details: { offset, error: skipped.error }
      });
      return createLedger(label, sourceText, entries);
    }
    offset = skipped.offset;
    if (offset >= sourceText.length) break;

    if (sourceText[offset] === '@') {
      addConflict(context, {
        code: JsTsSafeMergeConflictCodes.unsupportedDecorator,
        gateId: JsTsSafeMergeGateIds.parseLedger,
        side: label,
        message: `${label} source contains decorator syntax that is not safe for ledger merge anchors.`,
        details: { offset, reasonCode: 'unsupported-js-ts-syntax', preview: sourceText.slice(offset, Math.min(sourceText.length, offset + 80)) }
      });
      return createLedger(label, sourceText, entries);
    }

    const end = findStatementEnd(sourceText, offset);
    if (end.error) {
      addConflict(context, {
        code: JsTsSafeMergeConflictCodes.malformedSyntax,
        gateId: JsTsSafeMergeGateIds.parseLedger,
        side: label,
        message: `${label} source contains a top-level statement the narrow ledger cannot bound.`,
        details: { offset, error: end.error, preview: sourceText.slice(offset, Math.min(sourceText.length, offset + 80)) }
      });
      return createLedger(label, sourceText, entries);
    }

    const statementText = sourceText.slice(offset, end.offset);
    const entry = classifyStatement(statementText, offset, end.offset);
    if (entry?.unsupported) {
      addConflict(context, {
        code: entry.unsupported.code,
        gateId: JsTsSafeMergeGateIds.parseLedger,
        side: label,
        message: `${label} source contains syntax that is not safe for automatic JS/TS ledger merge.`,
        details: { offset, ...entry.unsupported.details, statement: statementText.trim().slice(0, 120) }
      });
      return createLedger(label, sourceText, entries);
    }
    if (!entry) {
      addConflict(context, {
        code: JsTsSafeMergeConflictCodes.parserLedgerLoss,
        gateId: JsTsSafeMergeGateIds.parseLedger,
        side: label,
        message: `${label} source contains an unsupported top-level statement.`,
        details: { offset, statement: statementText.trim().slice(0, 120) }
      });
      return createLedger(label, sourceText, entries);
    }
    entries.push(entry);
    offset = end.offset;
  }
  return createLedger(label, sourceText, entries);
}

function createLedger(label, sourceText, entries) {
  return {
    label,
    sourceText,
    entries,
    baseEntries: entries.filter((entry) => entry.kind === 'import' || entry.kind === 'declaration' || entry.kind === 'export')
  };
}

export { importSpecifierCanonical } from './js-ts-safe-merge-parse-declarations.js';
export { indexBaseLedger, validateLedgerUniqueness } from './js-ts-safe-merge-ledger-validation.js';
