import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { uniqueStrings } from '../../native-import-utils.js';

const WRAPPER_CALL = /(?<![\w$.])((?:React\s*\.\s*)?(?:memo|forwardRef|observer|lazy))\s*(?:<[^(){};]*>)?\s*\(/g;

function jsxComponentWrapperRecords(ownerSourceText, ownerName) {
  const text = String(ownerSourceText ?? '');
  const records = [];
  for (const match of text.matchAll(WRAPPER_CALL)) {
    const callStart = match.index;
    if (braceDepthBefore(text, callStart) > 0) continue;
    const calleeText = normalizedCalleeText(match[1]);
    const wrapperName = calleeText.split('.').pop();
    const afterCall = text.slice(callStart + match[0].length);
    const argumentKind = wrapperArgumentKind(afterCall);
    const innerComponentName = wrapperInnerComponentName(afterCall) ?? ownerName;
    const lazyImportSpecifier = wrapperName === 'lazy' ? lazyImportSpecifierText(afterCall) : undefined;
    const wrapperExpressionText = normalizedText(text.slice(callStart, callExpressionPreviewEnd(text, callStart)));
    records.push(compactRecord({
      ordinal: records.length + 1,
      proofStatus: 'static-component-wrapper-evidence',
      reasonCode: 'jsx-render-component-wrapper-static-evidence',
      wrapperName,
      wrapperCalleeText: calleeText,
      wrapperExpressionText,
      wrapperArgumentKind: argumentKind,
      innerComponentName,
      ownerName,
      lazyImportFactory: Boolean(lazyImportSpecifier) || undefined,
      lazyImportSpecifier,
      lazyLoadEquivalenceClaim: wrapperName === 'lazy' ? false : undefined,
      renderEquivalenceClaim: false,
      runtimeEquivalenceClaim: false,
      wrapperExpressionHash: hashSemanticValue({
        kind: 'frontier.lang.projectJsxComponentWrapperExpression',
        ownerName,
        calleeText,
        wrapperExpressionText
      }),
      signatureHash: hashSemanticValue({
        kind: 'frontier.lang.projectJsxComponentWrapper',
        ownerName,
        ordinal: records.length + 1,
        wrapperName,
        calleeText,
        argumentKind,
        innerComponentName
      })
    }));
  }
  return records;
}

function jsxComponentWrapperRenderRiskEvidence(owner) {
  const records = Array.isArray(owner?.componentWrapperRecords) ? owner.componentWrapperRecords : [];
  if (!records.length) return {};
  const componentWrapperNames = uniqueStrings(records.map((record) => record.wrapperName));
  const componentWrapperCalleeTexts = uniqueStrings(records.map((record) => record.wrapperCalleeText));
  const lazyBoundaryCount = records.filter((record) => record.wrapperName === 'lazy').length;
  return compactRecord({
    renderRiskKinds: ['component-wrapper-boundary'],
    renderRiskReasonCodes: uniqueStrings(['jsx-render-component-wrapper-static-evidence', 'jsx-render-component-wrapper-render-equivalence-unproved', lazyBoundaryCount ? 'jsx-render-component-wrapper-lazy-boundary-evidence' : undefined, lazyBoundaryCount ? 'jsx-render-component-wrapper-lazy-runtime-equivalence-unproved' : undefined]),
    componentWrapperNames,
    componentWrapperCalleeTexts,
    componentWrapperRecords: records,
    componentWrapperCount: records.length,
    componentWrapperLazyBoundaryCount: lazyBoundaryCount || undefined,
    componentWrapperRenderEquivalenceClaim: false,
    componentWrapperLazyLoadEquivalenceClaim: lazyBoundaryCount ? false : undefined,
    componentWrapperSignatureHash: hashSemanticValue({
      kind: 'frontier.lang.projectJsxComponentWrappers',
      publicOwnerName: owner?.name,
      records
    })
  });
}

function mergeJsxRenderRiskEvidence(primary = {}, secondary = {}, context = {}) {
  if (!hasRenderRisk(secondary)) return primary;
  const renderRiskKinds = uniqueStrings([...(primary.renderRiskKinds ?? []), ...(secondary.renderRiskKinds ?? [])]);
  const renderRiskReasonCodes = uniqueStrings([...(primary.renderRiskReasonCodes ?? []), ...(secondary.renderRiskReasonCodes ?? [])]);
  return compactRecord({
    ...primary,
    ...secondary,
    renderRiskKinds,
    renderRiskReasonCodes,
    renderRiskSignatureHash: hashSemanticValue({
      kind: 'frontier.lang.projectJsxRenderRiskSignature',
      tagName: context.tagName,
      tagKey: context.tagKey,
      publicOwnerName: context.publicOwnerName,
      baseRenderRiskSignatureHash: primary.renderRiskSignatureHash,
      componentWrapperSignatureHash: secondary.componentWrapperSignatureHash,
      renderRiskKinds,
      renderRiskReasonCodes
    })
  });
}

function hasRenderRisk(record) { return Array.isArray(record?.renderRiskKinds) && record.renderRiskKinds.length > 0; }
function normalizedCalleeText(text) { return String(text ?? '').replace(/\s+/g, '').replace('React.', 'React.'); }
function normalizedText(text) { return String(text ?? '').trim().replace(/\s+/g, ' '); }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }

function wrapperArgumentKind(text) {
  const value = String(text ?? '').trim();
  if (/^(?:async\s+)?function\b/.test(value)) return 'function-expression';
  if (/^class\b/.test(value)) return 'class-expression';
  if (lazyImportSpecifierText(value)) return 'lazy-import-factory';
  if (/^(?:React\s*\.\s*)?(?:memo|forwardRef|observer|lazy)\s*(?:<[^(){};]*>)?\s*\(/.test(value)) return 'wrapper-call';
  if (/^(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/.test(value)) return 'arrow-function';
  if (/^[A-Za-z_$][\w$]*(?:\s*\.\s*[A-Za-z_$][\w$]*)*/.test(value)) return 'reference';
  return 'unknown';
}

function wrapperInnerComponentName(text) {
  const preview = String(text ?? '').slice(0, 360);
  return /\bfunction\s+([A-Za-z_$][\w$]*)\b/.exec(preview)?.[1]
    ?? /\bclass\s+([A-Za-z_$][\w$]*)\b/.exec(preview)?.[1];
}

function lazyImportSpecifierText(text) { return /^(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*import\s*\(\s*(['"])([^'"]+)\1\s*\)/.exec(String(text ?? '').trim().slice(0, 260))?.[2]; }

function callExpressionPreviewEnd(text, start) {
  const value = String(text ?? '');
  const firstBody = value.indexOf('{', start);
  const firstLine = value.indexOf('\n', start);
  const candidates = [firstBody, firstLine, start + 180].filter((index) => index >= start);
  return Math.min(...candidates, value.length);
}

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

export { jsxComponentWrapperRecords, jsxComponentWrapperRenderRiskEvidence, mergeJsxRenderRiskEvidence };
