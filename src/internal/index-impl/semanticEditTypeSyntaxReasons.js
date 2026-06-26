import { uniqueStrings } from '../../native-import-utils.js';
import { nativeImportSourceText } from './nativeImportSourceText.js';
import { sourceTextForSpan } from './sourceTextForSpan.js';

export function typeSyntaxEditClassification(input) {
  const reasonCodes = typeSyntaxEditReasonCodes(input);
  if (!reasonCodes.length) return undefined;
  const evidenceIds = typeSyntaxEvidenceIds(input);
  if (evidenceIds.length) {
    return {
      status: 'portable',
      reasonCodes: uniqueStrings([...reasonCodes, 'type-syntax-edit-backed-by-typechecker-or-declaration-evidence']),
      evidenceIds
    };
  }
  return {
    status: 'blocked',
    reasonCodes: uniqueStrings([...reasonCodes, 'type-syntax-edit-requires-typechecker-or-declaration-evidence']),
    evidenceIds: []
  };
}

export function typeSyntaxEditReasonCodes(input) {
  if (!isJsTsLanguage(input) || input.region?.regionKind === 'import') return [];
  if (!['modified', 'removed', 'added'].includes(input.region?.changeKind)) return [];
  const baseText = typeSyntaxSourceText(input.context.base, input.baseSymbol, input.region, 'before');
  const workerText = typeSyntaxSourceText(input.context.worker, input.workerSymbol, input.region, 'after');
  if (typeof baseText !== 'string' || typeof workerText !== 'string' || baseText === workerText) return [];
  const allowAngleAssertion = !isJsxLikeLanguage(input);
  const base = typeSyntaxSignals(baseText, allowAngleAssertion);
  const worker = typeSyntaxSignals(workerText, allowAngleAssertion);
  const reasons = [];
  if (base.satisfies || worker.satisfies) reasons.push('satisfies-expression-edit-requires-typechecker-evidence');
  if (base.asConst || worker.asConst) reasons.push('as-const-assertion-edit-requires-declaration-evidence');
  if (base.typeAssertion || worker.typeAssertion) reasons.push('type-assertion-edit-requires-typechecker-evidence');
  if (base.constTypeParameters !== worker.constTypeParameters) reasons.push('const-type-parameter-edit-requires-declaration-evidence');
  if (base.constraints !== worker.constraints) reasons.push('generic-constraint-edit-requires-typechecker-evidence');
  if (base.generics !== worker.generics) reasons.push('generic-type-parameter-edit-requires-typechecker-evidence');
  if (base.conditionalTypes !== worker.conditionalTypes) reasons.push('conditional-type-edit-requires-declaration-evidence');
  return uniqueStrings(reasons);
}

function typeSyntaxSignals(text, allowAngleAssertion) {
  const normalized = String(text ?? '').replace(/\s+/g, ' ').trim();
  const genericClauses = typeParameterClauses(normalized);
  return {
    satisfies: /\bsatisfies\b/.test(normalized),
    asConst: /\bas\s+const\b/.test(normalized),
    typeAssertion: hasTypeAssertionSyntax(normalized, allowAngleAssertion),
    generics: genericClauses.join('|'),
    constraints: genericClauses.filter((clause) => /\bextends\b/.test(clause)).join('|'),
    constTypeParameters: genericClauses.filter((clause) => /<[^>]*\bconst\s+[A-Za-z_$]/.test(clause)).join('|'),
    conditionalTypes: conditionalTypeClauses(normalized).join('|')
  };
}

function typeSyntaxSourceText(imported, symbol, region, projectionSide) {
  const sourceText = nativeImportSourceText(imported);
  const projection = region?.metadata?.changedRegionProjection;
  const span = symbol?.sourceSpan ?? projection?.[projectionSide]?.sourceSpan ?? region?.sourceSpan;
  const exact = sourceTextForSpan(sourceText, span);
  const lineText = sourceLineTextForSpan(sourceText, span);
  return typeof lineText === 'string' && hasTypeSyntaxCue(lineText) ? lineText : exact;
}

function hasTypeSyntaxCue(text) {
  return /\b(?:satisfies|extends|infer|as\s+const|as\s+(?:unknown|any|never|string|number|boolean|symbol|bigint))\b|<\s*const\s+[A-Za-z_$]|\btype\s+[A-Za-z_$][\w$]*(?:\s*<[^>\n]+>)?\s*=/.test(String(text ?? ''));
}

function sourceLineTextForSpan(sourceText, span) {
  if (typeof sourceText !== 'string' || typeof span?.startLine !== 'number') return undefined;
  const lines = sourceText.split('\n');
  const startLine = Math.max(1, span.startLine);
  const endLine = Math.max(startLine, typeof span.endLine === 'number' ? span.endLine : startLine);
  return lines.slice(startLine - 1, endLine).join('\n');
}

function typeParameterClauses(text) {
  const clauses = [];
  const pattern = /\b(?:export\s+)?(?:declare\s+)?(?:async\s+)?(?:function|class|interface|type)\s+[A-Za-z_$][\w$]*\s*(<[^>\n]+>)/g;
  for (const match of text.matchAll(pattern)) clauses.push(match[1].replace(/\s+/g, ' '));
  return clauses;
}

function conditionalTypeClauses(text) {
  const clauses = [];
  const pattern = /\btype\s+[A-Za-z_$][\w$]*(?:\s*<[^>\n]+>)?\s*=\s*([^;\n]*\bextends\b[^;\n]*\?[^;\n]*:[^;\n]*)/g;
  for (const match of text.matchAll(pattern)) clauses.push(match[1].replace(/\s+/g, ' '));
  return clauses;
}

function hasTypeAssertionSyntax(text, allowAngleAssertion) {
  if (/\bas\s+const\b/.test(text)) return true;
  const asAssertion = /\bas\s+(?:unknown|any|never|string|number|boolean|symbol|bigint|readonly|[A-Z_$][\w$]*|\{|\[)/;
  const angleAssertion = /(?:\b(?:return|throw)\b|[=([,])\s*<\s*[A-Za-z_$][^>\n]*>\s*(?:[A-Za-z_$"'[(])/;
  return asAssertion.test(text) || (allowAngleAssertion && angleAssertion.test(text));
}

function typeSyntaxEvidenceIds(input) {
  return uniqueStrings(typeSyntaxEvidenceRecords(input)
    .filter(typeSyntaxEvidencePassed).map((record) => String(record.id ?? record.evidenceId ?? record.hash ?? record.kind)));
}

function typeSyntaxEvidenceRecords(input) {
  return [
    input.scriptInput?.typeSyntaxEvidence,
    input.scriptInput?.typeCheckerEvidence,
    input.scriptInput?.typescriptEvidence,
    input.scriptInput?.diagnosticsEvidence,
    input.scriptInput?.declarationEvidence,
    input.scriptInput?.evidence,
    input.context?.typeSyntaxEvidence
  ].flatMap((entry) => Array.isArray(entry) ? entry : [entry]).filter((entry) => entry && typeof entry === 'object');
}

function typeSyntaxEvidencePassed(record) {
  const status = String(record.status ?? record.result ?? '').toLowerCase();
  if (status && !['passed', 'pass', 'ok', 'clean', 'accepted-clean'].includes(status)) return false;
  const text = [
    record.kind, record.type, record.source, record.gateId, record.summary, record.metadata?.kind,
    record.metadata?.source, record.metadata?.diagnosticSource, record.metadata?.declarationSource
  ].filter(Boolean).join(' ').toLowerCase();
  return /\b(typechecker|type-checker|typescript|diagnostic|diagnostics|declaration|declarations|d\.ts|type-syntax)\b/.test(text);
}

function isJsTsLanguage(input) {
  const language = String(input.region?.language ?? input.context?.workerChangeSet?.language ?? input.context?.base?.language ?? '').toLowerCase();
  return ['javascript', 'typescript', 'jsx', 'tsx'].includes(language);
}

function isJsxLikeLanguage(input) {
  const language = String(input.region?.language ?? input.context?.workerChangeSet?.language ?? input.context?.base?.language ?? '').toLowerCase();
  return ['jsx', 'tsx'].includes(language);
}
