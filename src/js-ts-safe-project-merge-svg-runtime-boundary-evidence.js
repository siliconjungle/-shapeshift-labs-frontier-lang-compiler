import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { compactRecord } from './js-ts-safe-merge-context.js';
import { hashText, uniqueStrings } from './js-ts-safe-project-merge-core.js';

function createSvgRuntimeBoundaryEvidence({ base, worker, head, status } = {}) {
  const changes = svgRuntimeBoundaryChanges(base, worker, head);
  const sides = {
    base: svgRuntimeBoundarySideEvidence(base, 'base'),
    worker: svgRuntimeBoundarySideEvidence(worker, 'worker'),
    head: svgRuntimeBoundarySideEvidence(head, 'head')
  };
  const sideValues = Object.values(sides);
  const evidence = {
    kind: 'frontier.lang.svgRuntimeBoundaryEvidence',
    version: 1,
    status,
    sourceBound: true,
    sideNames: Object.keys(sides),
    runtimeSensitiveChangeCount: changes.length,
    changedBoundaries: uniqueStrings(changes.map((change) => change.boundary)),
    changedReasonCodes: uniqueStrings(changes.map((change) => change.reasonCode)),
    recordCount: sideValues.reduce((sum, side) => sum + side.recordCount, 0),
    runtimeElementRecords: sideValues.reduce((sum, side) => sum + side.runtimeElementRecords, 0),
    runtimeAttributeRecords: sideValues.reduce((sum, side) => sum + side.runtimeAttributeRecords, 0),
    externalHrefRecords: sideValues.reduce((sum, side) => sum + side.externalHrefRecords, 0),
    changes,
    sides
  };
  return { ...evidence, evidenceHash: hashSemanticValue({ kind: 'frontier.lang.svgRuntimeBoundaryEvidence.v1', changes, sides }) };
}

function svgRuntimeBoundarySideEvidence(sourceText, side) {
  const records = svgRuntimeBoundaryRecords(sourceText);
  return {
    side,
    sourceHash: hashText(String(sourceText ?? '')),
    recordCount: records.length,
    runtimeElementRecords: records.filter((record) => record.recordKind === 'element').length,
    runtimeAttributeRecords: records.filter((record) => record.recordKind === 'attribute').length,
    externalHrefRecords: records.filter((record) => record.reasonCode === 'svg-external-href-runtime-boundary').length,
    boundaries: uniqueStrings(records.map((record) => record.boundary)),
    reasonCodes: uniqueStrings(records.map((record) => record.reasonCode)),
    records
  };
}

function svgRuntimeBoundaryChanges(base, worker, head) {
  const baseGroups = svgRuntimeBoundaryGroups(base);
  return [
    ...svgRuntimeBoundaryChangesForSide('worker', baseGroups, svgRuntimeBoundaryGroups(worker)),
    ...svgRuntimeBoundaryChangesForSide('head', baseGroups, svgRuntimeBoundaryGroups(head))
  ];
}

function svgRuntimeBoundaryChangesForSide(side, baseGroups, currentGroups) {
  return uniqueStrings([...baseGroups.keys(), ...currentGroups.keys()]).flatMap((key) => {
    const before = baseGroups.get(key);
    const after = currentGroups.get(key);
    if ((before?.fingerprint ?? '') === (after?.fingerprint ?? '')) return [];
    const sample = after ?? before;
    return compactRecord({
      side,
      reasonCode: sample.reasonCode,
      boundary: sample.boundary,
      boundaryAttributes: changedSvgRuntimeBoundaryAttributes(before?.records ?? [], after?.records ?? []),
      beforeRecordCount: before?.records?.length ?? 0,
      afterRecordCount: after?.records?.length ?? 0,
      beforeFingerprintHash: before ? hashText(before.fingerprint) : undefined,
      afterFingerprintHash: after ? hashText(after.fingerprint) : undefined
    });
  });
}

function svgRuntimeBoundaryGroups(sourceText) {
  const groups = new Map();
  for (const record of svgRuntimeBoundaryRecords(sourceText)) {
    const key = `${record.reasonCode}\0${record.boundary}`;
    const group = groups.get(key) ?? { reasonCode: record.reasonCode, boundary: record.boundary, records: [] };
    group.records.push(record);
    groups.set(key, group);
  }
  for (const group of groups.values()) group.fingerprint = group.records.map(svgRuntimeBoundaryRecordFingerprint).sort().join('\n');
  return groups;
}

function svgRuntimeBoundaryRecords(sourceText) {
  const text = String(sourceText ?? '');
  const records = [];
  for (const match of text.matchAll(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<![^>]*>|<([A-Za-z_][\w:.-]*)([^<>]*?)\/?>/g)) {
    const openingTag = match[0];
    if (openingTag.startsWith('<!--') || openingTag.startsWith('<!') || openingTag.startsWith('<?')) continue;
    const tagName = String(match[1] ?? '').toLowerCase();
    const attrs = svgRuntimeAttributeRecords(String(match[2] ?? ''));
    const elementKey = svgRuntimeElementKey(tagName, attrs);
    const elementSpec = svgRuntimeElementSpec(tagName);
    if (elementSpec) {
      records.push(compactRecord({
        ...elementSpec,
        recordKind: 'element',
        tagName,
        elementKey,
        sourceText: svgRuntimeElementSource(text, tagName, match.index ?? 0, openingTag)
      }));
    }
    for (const attr of attrs) {
      const spec = svgRuntimeAttributeSpec(attr.name, tagName, attr.value);
      if (spec) records.push({ ...attr, ...spec, recordKind: 'attribute', tagName, elementKey });
    }
  }
  return records;
}

function svgRuntimeAttributeRecords(rawAttrs) {
  const attrs = [];
  const pattern = /([A-Za-z_:][\w:.-]*)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g;
  for (const match of String(rawAttrs ?? '').matchAll(pattern)) {
    const name = String(match[1] ?? '').toLowerCase();
    if (name === '/') continue;
    const rawValue = match[2];
    attrs.push({
      name,
      value: rawValue === undefined ? true : String(rawValue).replace(/^['"]|['"]$/g, ''),
      start: match.index,
      end: match.index + match[0].length
    });
  }
  return attrs;
}

function svgRuntimeElementSpec(tagName) {
  if (tagName === 'script') return { boundary: 'svg-script-element', reasonCode: 'svg-script-runtime-boundary' };
  if (tagName === 'foreignobject') return { boundary: 'svg-foreign-object-element', reasonCode: 'svg-foreign-object-runtime-boundary' };
  if (tagName === 'style') return { boundary: 'svg-style-element', reasonCode: 'svg-style-runtime-boundary' };
  if (SvgAnimationTags.has(tagName)) return { boundary: 'svg-animation-element', reasonCode: 'svg-animation-runtime-boundary' };
  return undefined;
}

function svgRuntimeAttributeSpec(name, tagName, value) {
  if (/^on[\w:.-]+$/i.test(name)) return { boundary: 'svg-event-handler-attribute', reasonCode: 'svg-event-handler-runtime-boundary' };
  if (name === 'style') return { boundary: 'svg-style-attribute', reasonCode: 'svg-style-runtime-boundary' };
  if (SvgPointerFocusAttributes.has(name)) return { boundary: 'svg-pointer-focus-attribute', reasonCode: 'svg-pointer-focus-runtime-boundary' };
  if (SvgHrefAttributes.has(name) && isExternalSvgHrefValue(value)) return { boundary: tagName === 'a' ? 'svg-navigation-href-attribute' : 'svg-external-href-attribute', reasonCode: 'svg-external-href-runtime-boundary' };
  if (hasExternalSvgUrlReference(value)) return { boundary: 'svg-external-url-reference-attribute', reasonCode: 'svg-external-reference-runtime-boundary' };
  return undefined;
}

function svgRuntimeElementSource(sourceText, tagName, start, openingTag) {
  if (/\/>\s*$/.test(openingTag)) return openingTag;
  const rest = sourceText.slice(start + openingTag.length);
  const close = new RegExp(`</${escapeRegExp(tagName)}\\s*>`, 'i').exec(rest);
  return close ? sourceText.slice(start, start + openingTag.length + close.index + close[0].length) : openingTag;
}

function svgRuntimeElementKey(tagName, attrs) {
  const id = attrs.find((attr) => attr.name === 'id')?.value;
  if (id !== undefined && id !== true && String(id)) return `${tagName}#${id}`;
  const frontierKey = attrs.find((attr) => attr.name === 'data-frontier-key')?.value;
  if (frontierKey !== undefined && frontierKey !== true && String(frontierKey)) return `${tagName}[data-frontier-key=${frontierKey}]`;
  return tagName;
}

function svgRuntimeBoundaryRecordFingerprint(record) {
  if (record.recordKind === 'attribute') return `attr:${record.boundary}:${record.elementKey}:${record.name}=${String(record.value)}`;
  return `element:${record.boundary}:${record.tagName}:${String(record.sourceText ?? '')}`;
}

function changedSvgRuntimeBoundaryAttributes(before, after) {
  const beforeByKey = new Map(before.filter(isSvgRuntimeAttributeRecord).map((record) => [`${record.elementKey}:${record.name}`, record]));
  const afterByKey = new Map(after.filter(isSvgRuntimeAttributeRecord).map((record) => [`${record.elementKey}:${record.name}`, record]));
  const names = uniqueStrings([...beforeByKey.keys(), ...afterByKey.keys()].flatMap((key) => {
    const left = beforeByKey.get(key);
    const right = afterByKey.get(key);
    return String(left?.value) === String(right?.value) ? [] : [right?.name ?? left?.name];
  }));
  return names.length ? names : uniqueStrings([...before, ...after].map((record) => record.name ?? record.tagName).filter(Boolean));
}

function isSvgRuntimeAttributeRecord(record) {
  return record?.recordKind === 'attribute' && typeof record.name === 'string' && record.name.length > 0;
}

function isExternalSvgHrefValue(value) {
  if (value === true) return false;
  const text = String(value ?? '').trim();
  return text.length > 0 && !text.startsWith('#');
}

function hasExternalSvgUrlReference(value) {
  if (value === true) return false;
  for (const match of String(value ?? '').matchAll(SvgUrlReferencePattern)) {
    const target = String(match[1] ?? match[2] ?? match[3] ?? '').trim();
    if (target && !target.startsWith('#')) return true;
  }
  return false;
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const SvgAnimationTags = new Set(['animate', 'set', 'animatetransform', 'animatemotion']);
const SvgPointerFocusAttributes = new Set(['pointer-events', 'tabindex', 'focusable', 'autofocus']);
const SvgHrefAttributes = new Set(['href', 'xlink:href']);
const SvgUrlReferencePattern = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)/gi;

export { createSvgRuntimeBoundaryEvidence, svgRuntimeBoundaryChanges };
