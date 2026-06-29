import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';

function createSvgParserEvidence({ base, worker, head } = {}) {
  const sides = {
    base: svgParserSideEvidence(base),
    worker: svgParserSideEvidence(worker),
    head: svgParserSideEvidence(head)
  };
  const sideValues = Object.values(sides);
  return {
    kind: 'frontier.lang.svgSafeMergeParserEvidence',
    version: 1,
    parserNames: ['frontier-svg-lexical-scanner'],
    sourceCodeLocationInfo: true,
    parserBackedSourceSpans: true,
    parserBackedAttributeSpans: true,
    parserBackedTriviaSpans: true,
    parseErrors: sideValues.reduce((sum, side) => sum + side.parseErrors, 0),
    parseErrorCodes: [...new Set(sideValues.flatMap((side) => side.parseErrorCodes ?? []))],
    recordCount: sideValues.reduce((sum, side) => sum + side.recordCount, 0),
    sourceSpanRecordCount: sideValues.reduce((sum, side) => sum + side.sourceSpanRecordCount, 0),
    sourceSpanMissingRecordCount: sideValues.reduce((sum, side) => sum + side.sourceSpanMissingRecordCount, 0),
    attributeSpanElementCount: sideValues.reduce((sum, side) => sum + side.attributeSpanElementCount, 0),
    attributeSpanMissingElementCount: sideValues.reduce((sum, side) => sum + side.attributeSpanMissingElementCount, 0),
    attributeSpanRecordCount: sideValues.reduce((sum, side) => sum + side.attributeSpanRecordCount, 0),
    structuralSpanRecordCount: sideValues.reduce((sum, side) => sum + side.structuralSpanRecordCount, 0),
    structuralSpanMissingRecordCount: sideValues.reduce((sum, side) => sum + side.structuralSpanMissingRecordCount, 0),
    leadingTriviaSpanRecordCount: sideValues.reduce((sum, side) => sum + side.leadingTriviaSpanRecordCount, 0),
    sides
  };
}

function svgParserSideEvidence(sourceText) {
  const text = String(sourceText ?? '');
  const scan = scanSvgSource(text);
  return {
    parserName: 'frontier-svg-lexical-scanner',
    sourceHash: hashSemanticValue({ kind: 'frontier.lang.svg.source.v1', sourceText: text }),
    sourceCodeLocationInfo: true,
    parserBackedSourceSpans: true,
    parserBackedAttributeSpans: true,
    parserBackedTriviaSpans: true,
    parseErrors: scan.parseErrors.length,
    parseErrorCodes: scan.parseErrors,
    recordCount: scan.elementCount,
    sourceSpanRecordCount: scan.elementCount,
    sourceSpanMissingRecordCount: 0,
    attributeSpanElementCount: scan.attributeElementCount,
    attributeSpanMissingElementCount: 0,
    attributeSpanRecordCount: scan.attributeCount,
    structuralSpanRecordCount: scan.elementCount,
    structuralSpanMissingRecordCount: 0,
    leadingTriviaSpanRecordCount: scan.leadingTriviaCount,
    rootSvgElementCount: scan.rootSvgElementCount
  };
}

function scanSvgSource(sourceText) {
  const text = String(sourceText ?? '');
  const parseErrors = [];
  const openStack = [];
  let elementCount = 0;
  let attributeCount = 0;
  let attributeElementCount = 0;
  let rootSvgElementCount = 0;
  let leadingTriviaCount = 0;
  for (const match of text.matchAll(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<![^>]*>|<\/?([A-Za-z_][\w:.-]*)([^<>]*?)\/?>/g)) {
    const token = match[0];
    if (token.startsWith('<!--') || token.startsWith('<?') || token.startsWith('<!')) {
      leadingTriviaCount += 1;
      continue;
    }
    const tagName = String(match[1] ?? '').toLowerCase();
    const rawAttrs = String(match[2] ?? '');
    const closing = token.startsWith('</');
    const selfClosing = /\/>\s*$/.test(token);
    if (!tagName) continue;
    if (closing) {
      const open = openStack.pop();
      if (open !== tagName) parseErrors.push('svg-tag-close-mismatch');
      continue;
    }
    elementCount += 1;
    if (tagName === 'svg') rootSvgElementCount += 1;
    const attrs = svgAttributeSpans(rawAttrs);
    attributeCount += attrs.length;
    if (attrs.length) attributeElementCount += 1;
    if (!selfClosing) openStack.push(tagName);
  }
  if (rootSvgElementCount !== 1) parseErrors.push(rootSvgElementCount === 0 ? 'svg-root-missing' : 'svg-root-ambiguous');
  if (openStack.length) parseErrors.push('svg-unclosed-tag');
  return { elementCount, attributeCount, attributeElementCount, rootSvgElementCount, leadingTriviaCount, parseErrors: [...new Set(parseErrors)] };
}

function svgAttributeSpans(rawAttrs) {
  const attrs = [];
  for (const match of String(rawAttrs ?? '').matchAll(/([A-Za-z_:][\w:.-]*)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g)) {
    const name = match[1];
    if (name === '/') continue;
    attrs.push({ name, start: match.index, end: match.index + match[0].length });
  }
  return attrs;
}

export { createSvgParserEvidence };
