import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';

function createSvgReferenceGraphEvidence({ base, worker, head, output } = {}) {
  const sides = {
    base: svgReferenceGraphSideEvidence(base, 'base'),
    worker: svgReferenceGraphSideEvidence(worker, 'worker'),
    head: svgReferenceGraphSideEvidence(head, 'head'),
    output: typeof output === 'string' ? svgReferenceGraphSideEvidence(output, 'output') : undefined
  };
  const sideValues = Object.values(sides).filter(Boolean);
  return {
    kind: 'frontier.lang.svgReferenceGraphEvidence',
    version: 1,
    ...SvgReferenceEvidenceClaimFlags,
    sourceBound: true,
    sideNames: Object.keys(sides).filter((side) => sides[side]),
    definitionRecords: sideValues.reduce((sum, side) => sum + side.definitionRecords, 0),
    referenceRecords: sideValues.reduce((sum, side) => sum + side.referenceRecords, 0),
    localReferenceRecords: sideValues.reduce((sum, side) => sum + side.localReferenceRecords, 0),
    externalReferenceRecords: sideValues.reduce((sum, side) => sum + side.externalReferenceRecords, 0),
    missingReferenceRecords: sideValues.reduce((sum, side) => sum + side.missingReferenceRecords, 0),
    duplicateDefinitionRecords: sideValues.reduce((sum, side) => sum + side.duplicateDefinitionRecords, 0),
    referenceErrors: sideValues.reduce((sum, side) => sum + side.referenceErrors, 0),
    referenceErrorCodes: uniqueStrings(sideValues.flatMap((side) => side.referenceErrorCodes)),
    sides
  };
}

function svgReferenceGraphSideEvidence(sourceText, side) {
  const scan = scanSvgReferenceGraph(sourceText);
  const referenceErrorCodes = uniqueStrings([
    scan.missingReferences.length ? 'svg-reference-target-missing' : undefined,
    scan.duplicateDefinitions.length ? 'svg-reference-definition-duplicate' : undefined
  ]);
  return {
    side,
    ...SvgReferenceEvidenceClaimFlags,
    sourceHash: hashSemanticValue({ kind: 'frontier.lang.svg.source.v1', sourceText: String(sourceText ?? '') }),
    graphHash: hashSemanticValue({ kind: 'frontier.lang.svg.referenceGraph.v1', definitions: scan.definitions, references: scan.references }),
    definitionRecords: scan.definitions.length,
    referenceRecords: scan.references.length,
    localReferenceRecords: scan.references.filter((record) => record.local === true).length,
    externalReferenceRecords: scan.references.filter((record) => record.external === true).length,
    missingReferenceRecords: scan.missingReferences.length,
    duplicateDefinitionRecords: scan.duplicateDefinitions.length,
    referenceErrors: scan.missingReferences.length + scan.duplicateDefinitions.length,
    referenceErrorCodes,
    definitions: scan.definitions,
    references: scan.references,
    missingReferences: scan.missingReferences,
    duplicateDefinitions: scan.duplicateDefinitions
  };
}

function scanSvgReferenceGraph(sourceText) {
  const text = String(sourceText ?? '');
  const definitions = [];
  const references = [];
  let elementOrdinal = 0;
  for (const match of text.matchAll(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<![^>]*>|<\/?([A-Za-z_][\w:.-]*)([^<>]*?)\/?>/g)) {
    const token = match[0];
    if (token.startsWith('</') || token.startsWith('<!--') || token.startsWith('<?') || token.startsWith('<!')) continue;
    const tagName = String(match[1] ?? '').toLowerCase();
    const attrs = svgAttributeRecords(String(match[2] ?? ''));
    elementOrdinal += 1;
    for (const attr of attrs) {
      if (attr.name === 'id' || attr.name === 'data-frontier-key') definitions.push(svgDefinitionRecord(tagName, attr, elementOrdinal));
      references.push(...svgReferencesForAttribute(tagName, attr, elementOrdinal));
    }
    if (tagName === 'style') references.push(...svgReferencesForStyleElement(text, token, match.index ?? 0, elementOrdinal));
  }
  const ids = definitions.filter((record) => record.attributeName === 'id').map((record) => record.identity);
  const idSet = new Set(ids);
  const duplicateIds = new Set(ids.filter((id, index) => ids.indexOf(id) !== index));
  const missingReferences = references.filter((record) => record.local && !idSet.has(record.targetId));
  const duplicateDefinitions = definitions.filter((record) => record.attributeName === 'id' && duplicateIds.has(record.identity));
  return { definitions, references, missingReferences, duplicateDefinitions };
}

function svgAttributeRecords(rawAttrs) {
  const attrs = [];
  const pattern = /([A-Za-z_:][\w:.-]*)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g;
  for (const match of String(rawAttrs ?? '').matchAll(pattern)) {
    const name = String(match[1] ?? '').toLowerCase();
    if (name === '/') continue;
    const rawValue = match[2];
    attrs.push({
      name,
      value: rawValue === undefined ? '' : String(rawValue).replace(/^['"]|['"]$/g, ''),
      start: match.index,
      end: match.index + match[0].length
    });
  }
  return attrs;
}

function svgDefinitionRecord(tagName, attr, elementOrdinal) {
  return {
    tagName,
    attributeName: attr.name,
    identity: attr.value,
    identityKind: attr.name === 'id' ? 'svg-id' : 'frontier-key',
    definitionKind: svgDefinitionKind(tagName),
    elementOrdinal,
    attributeSpan: { start: attr.start, end: attr.end }
  };
}

function svgReferencesForAttribute(tagName, attr, elementOrdinal) {
  const direct = svgDirectReferenceForAttribute(tagName, attr, elementOrdinal);
  const urls = svgUrlReferencesForValue({
    tagName,
    attributeName: attr.name,
    elementOrdinal,
    value: attr.value,
    span: { attributeSpan: { start: attr.start, end: attr.end } }
  });
  return [direct, ...urls].filter(Boolean);
}

function svgReferencesForStyleElement(sourceText, openingTag, start, elementOrdinal) {
  const span = svgStyleElementTextSpan(sourceText, openingTag, start);
  if (!span) return [];
  return svgUrlReferencesForValue({
    tagName: 'style',
    attributeName: 'style-content',
    elementOrdinal,
    value: sourceText.slice(span.start, span.end),
    span: { sourceSpan: span }
  });
}

function svgUrlReferencesForValue({ tagName, attributeName, elementOrdinal, value, span }) {
  return [...String(value ?? '').matchAll(SvgUrlReferencePattern)].flatMap((match) => {
    const target = String(match[1] ?? match[2] ?? match[3] ?? '').trim();
    if (!target) return [];
    const local = isLocalSvgReferenceTarget(target);
    return [{
      tagName,
      attributeName,
      referenceKind: svgUrlReferenceKind(attributeName, target),
      targetId: local ? target.slice(1) : target,
      local,
      external: !local,
      elementOrdinal,
      ...span
    }];
  });
}

function svgDirectReferenceForAttribute(tagName, attr, elementOrdinal) {
  if (!SvgHrefAttributes.has(attr.name)) return undefined;
  const value = String(attr.value ?? '');
  if (value.startsWith('#')) return {
    tagName,
    attributeName: attr.name,
    referenceKind: tagName === 'use' ? 'svg-use-reference' : 'svg-href-reference',
    targetId: value.slice(1),
    local: true,
    external: false,
    elementOrdinal,
    attributeSpan: { start: attr.start, end: attr.end }
  };
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) || value.includes('#')) return {
    tagName,
    attributeName: attr.name,
    referenceKind: 'svg-external-href-reference',
    targetId: value,
    local: false,
    external: true,
    elementOrdinal,
    attributeSpan: { start: attr.start, end: attr.end }
  };
  return undefined;
}

function svgDefinitionKind(tagName) {
  if (SvgPaintServerTags.has(tagName)) return 'paint-server';
  if (['clippath', 'mask', 'filter', 'marker'].includes(tagName)) return 'render-resource';
  if (['symbol', 'g', 'defs'].includes(tagName)) return 'structural-resource';
  return 'element';
}

function svgPaintReferenceKind(attributeName) {
  if (['fill', 'stroke'].includes(attributeName)) return 'svg-paint-server-reference';
  if (['clip-path', 'mask', 'filter'].includes(attributeName)) return 'svg-render-resource-reference';
  if (attributeName.startsWith('marker')) return 'svg-marker-reference';
  return 'svg-url-reference';
}

function svgUrlReferenceKind(attributeName, target) {
  if (attributeName === 'style-content') return 'svg-style-url-reference';
  if (!isLocalSvgReferenceTarget(target)) return 'svg-external-url-reference';
  return svgPaintReferenceKind(attributeName);
}

function svgStyleElementTextSpan(sourceText, openingTag, start) {
  if (/\/>\s*$/.test(openingTag)) return undefined;
  const contentStart = start + openingTag.length;
  const close = /<\/style\s*>/i.exec(sourceText.slice(contentStart));
  return close ? { start: contentStart, end: contentStart + close.index } : undefined;
}

function isLocalSvgReferenceTarget(target) {
  return String(target ?? '').trim().startsWith('#');
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))];
}

const SvgHrefAttributes = new Set(['href', 'xlink:href']);
const SvgPaintServerTags = new Set(['lineargradient', 'radialgradient', 'pattern']);
const SvgUrlReferencePattern = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)/gi;
const SvgReferenceEvidenceClaimFlags = Object.freeze({
  autoMergeClaim: false,
  semanticEquivalenceClaim: false,
  runtimeEquivalenceClaim: false,
  renderEquivalenceClaim: false,
  browserRuntimeEquivalenceClaim: false,
  browserRenderEquivalenceClaim: false
});

export { createSvgReferenceGraphEvidence, scanSvgReferenceGraph };
