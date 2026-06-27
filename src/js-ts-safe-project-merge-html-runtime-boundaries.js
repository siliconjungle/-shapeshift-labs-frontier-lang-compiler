import { compactRecord } from './js-ts-safe-merge-context.js';
import { hashText, uniqueStrings } from './js-ts-safe-project-merge-core.js';

function htmlRuntimeBoundaryChanges(base, worker, head) {
  const baseBoundaries = htmlRuntimeBoundaryAttributeGroups(base);
  return [
    ...htmlRuntimeBoundaryChangesForSide('worker', baseBoundaries, htmlRuntimeBoundaryAttributeGroups(worker)),
    ...htmlRuntimeBoundaryChangesForSide('head', baseBoundaries, htmlRuntimeBoundaryAttributeGroups(head))
  ];
}

function htmlRuntimeBoundaryChangesForSide(side, baseGroups, currentGroups) {
  return uniqueStrings([...baseGroups.keys(), ...currentGroups.keys()]).flatMap((key) => {
    const before = baseGroups.get(key);
    const after = currentGroups.get(key);
    if ((before?.fingerprint ?? '') === (after?.fingerprint ?? '')) return [];
    const sample = after ?? before;
    return [{
      side,
      reasonCode: sample.reasonCode,
      boundary: sample.boundary,
      boundaryAttributes: changedHtmlRuntimeBoundaryAttributes(before?.records ?? [], after?.records ?? [])
    }];
  });
}

function htmlRuntimeBoundaryProofForChange(proofs, change, binding) {
  return proofs.find((proof) => isHtmlRuntimeBoundaryProofForChange(proof, change, binding));
}

function isHtmlRuntimeBoundaryProofForChange(proof, change, binding) {
  return Boolean(proof && typeof proof === 'object') &&
    HtmlRuntimeBoundaryProofKinds.has(proof.kind) &&
    proof.status === 'passed' &&
    proof.sourcePath === binding.sourcePath &&
    htmlProofCoversValue(proof.reasonCode, proof.reasonCodes, change.reasonCode) &&
    htmlProofCoversValue(proof.side, proof.sides, change.side) &&
    proof.boundary === change.boundary &&
    sameStringSet(proof.boundaryAttributes ?? proof.changedBoundaryAttributes, change.boundaryAttributes) &&
    htmlRuntimeBoundaryProofSourceBound(proof, binding);
}

function htmlRuntimeBoundaryProofSourceBound(proof, binding) {
  return htmlRuntimeBoundaryProofSourceMatches(proof, 'base', binding.base) &&
    htmlRuntimeBoundaryProofSourceMatches(proof, 'worker', binding.worker) &&
    htmlRuntimeBoundaryProofSourceMatches(proof, 'head', binding.head) &&
    htmlRuntimeBoundaryProofSourceMatches(proof, 'output', binding.output);
}

function htmlRuntimeBoundaryProofSourceMatches(proof, role, sourceText) {
  if (typeof sourceText !== 'string') return false;
  const hash = hashText(sourceText);
  const textFields = role === 'output' ? ['outputSourceText', 'mergedSourceText'] : [`${role}SourceText`];
  const hashFields = role === 'output' ? ['outputSourceHash', 'mergedSourceHash'] : [`${role}SourceHash`];
  const aliases = role === 'output' ? ['output', 'merged'] : [role];
  return textFields.some((field) => proof[field] === sourceText) ||
    aliases.some((alias) => proof.sourceTexts?.[alias] === sourceText || proof.sources?.[alias] === sourceText) ||
    hashFields.some((field) => proof[field] === hash) ||
    aliases.some((alias) => proof.sourceHashes?.[alias] === hash || proof.hashes?.[alias] === hash);
}

function htmlRuntimeBoundaryProofRecord(proof, change, binding) {
  return compactRecord({
    id: proof.id,
    kind: proof.kind,
    status: 'passed',
    proofLevel: proof.proofLevel ?? 'html-runtime-boundary-source-bound',
    reasonCode: change.reasonCode,
    side: change.side,
    boundary: change.boundary,
    boundaryAttributes: change.boundaryAttributes,
    sourcePath: binding.sourcePath,
    baseSourceHash: hashText(binding.base),
    workerSourceHash: hashText(binding.worker),
    headSourceHash: hashText(binding.head),
    outputSourceHash: hashText(binding.output)
  });
}

function htmlRuntimeBoundaryProvenResult(result, runtimeBoundaryProofs) {
  return compactRecord({
    ...result,
    runtimeBoundaryProofs,
    browserRuntimeEquivalenceClaim: true,
    admission: compactRecord({
      ...(result.admission ?? {}),
      browserRuntimeEquivalenceClaim: true,
      htmlRuntimeBoundaryProofs: runtimeBoundaryProofs,
      reasonCodes: uniqueStrings([...(result.admission?.reasonCodes ?? []), 'html-runtime-boundary-source-bound'])
    })
  });
}

function htmlRuntimeBoundaryAttributeGroups(sourceText) {
  const groups = new Map();
  for (const attribute of htmlRuntimeBoundaryAttributes(sourceText)) {
    const key = `${attribute.reasonCode}\0${attribute.boundary}`;
    const group = groups.get(key) ?? { reasonCode: attribute.reasonCode, boundary: attribute.boundary, records: [] };
    group.records.push(attribute);
    groups.set(key, group);
  }
  for (const group of groups.values()) group.fingerprint = group.records.map((attribute) => `${attribute.elementKey}:${attribute.name}=${String(attribute.value)}`).sort().join('\n');
  return groups;
}

function changedHtmlRuntimeBoundaryAttributes(before, after) {
  const beforeByKey = new Map(before.map((attribute) => [`${attribute.elementKey}:${attribute.name}`, attribute]));
  const afterByKey = new Map(after.map((attribute) => [`${attribute.elementKey}:${attribute.name}`, attribute]));
  const names = uniqueStrings([...beforeByKey.keys(), ...afterByKey.keys()].flatMap((key) => {
    const left = beforeByKey.get(key);
    const right = afterByKey.get(key);
    return String(left?.value) === String(right?.value) ? [] : [right?.name ?? left?.name];
  }));
  return names.length ? names : uniqueStrings([...before, ...after].map((attribute) => attribute.name));
}

function htmlRuntimeBoundaryAttributes(sourceText) {
  const attributes = [];
  let elementIndex = 0;
  for (const tag of String(sourceText ?? '').matchAll(/<[A-Za-z][\w:-]*(?:\s+[^<>]*?)?\/?>/g)) {
    const parsed = /^<([A-Za-z][\w:-]*)([\s\S]*?)\/?>$/.exec(tag[0]);
    if (!parsed) continue;
    const tagName = parsed[1].toLowerCase();
    const elementKey = `${elementIndex++}:${tagName}`;
    for (const attribute of parseHtmlAttributes(parsed[2] ?? '')) {
      const name = attribute.name.toLowerCase();
      const spec = htmlRuntimeAttributeSpec(name, tagName);
      if (spec) attributes.push({ ...attribute, ...spec, name, tagName, elementKey });
    }
  }
  return attributes;
}

function htmlRuntimeAttributeSpec(name, tagName) {
  if (/^on[\w:.-]+$/i.test(name)) return { boundary: 'html-event-handler-attribute', reasonCode: 'event-handler-runtime-boundary' };
  if (name === 'style') return { boundary: 'html-inline-style-attribute', reasonCode: 'inline-style-runtime-boundary' };
  if (tagName === 'iframe' && name === 'srcdoc') return { boundary: 'html-iframe-srcdoc-attribute', reasonCode: 'iframe-srcdoc-runtime-boundary' };
  if (tagName === 'iframe' && IframeRuntimeAttributes.has(name)) return { boundary: 'html-iframe-runtime-attribute', reasonCode: 'iframe-runtime-boundary' };
  if (tagName === 'form' && FormRuntimeAttributes.has(name)) return { boundary: 'html-form-runtime-attribute', reasonCode: 'form-runtime-boundary' };
  if (FormSubmitterTags.has(tagName) && FormSubmitterRuntimeAttributes.has(name)) return { boundary: 'html-form-submitter-runtime-attribute', reasonCode: 'form-submitter-runtime-boundary' };
  if (FormControlTags.has(tagName) && FormControlRuntimeAttributes.has(name)) return { boundary: 'html-form-control-runtime-attribute', reasonCode: 'form-control-runtime-boundary' };
  return undefined;
}

function parseHtmlAttributes(text) {
  const attributes = [];
  const pattern = /([:@A-Za-z_][\w:.-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of text.matchAll(pattern)) attributes.push({ name: match[1], value: match[2] ?? match[3] ?? match[4] ?? true });
  return attributes;
}

function htmlProofCoversValue(value, values, expected) {
  return value === expected || (Array.isArray(values) && values.includes(expected));
}

function sameStringSet(actual, expected) {
  const actualSet = uniqueStrings(asArray(actual).map((value) => String(value)));
  const expectedSet = uniqueStrings(asArray(expected).map((value) => String(value)));
  return actualSet.length === expectedSet.length && expectedSet.every((value) => actualSet.includes(value));
}

function asArray(value) {
  return Array.isArray(value) ? value : value === undefined ? [] : [value];
}

const HtmlRuntimeBoundaryProofKinds = new Set(['html-runtime-boundary-proof', 'html-source-bound-runtime-boundary-proof']);
const IframeRuntimeAttributes = new Set(['allow', 'allowfullscreen', 'allowpaymentrequest', 'credentialless', 'csp', 'fetchpriority', 'loading', 'name', 'referrerpolicy', 'sandbox', 'src']);
const FormRuntimeAttributes = new Set(['accept-charset', 'action', 'autocomplete', 'enctype', 'method', 'novalidate', 'target']);
const FormSubmitterTags = new Set(['button', 'input']);
const FormSubmitterRuntimeAttributes = new Set(['form', 'formaction', 'formenctype', 'formmethod', 'formnovalidate', 'formtarget', 'type']);
const FormControlTags = new Set(['button', 'fieldset', 'input', 'optgroup', 'option', 'output', 'select', 'textarea']);
const FormControlRuntimeAttributes = new Set(['accept', 'autocomplete', 'capture', 'checked', 'disabled', 'form', 'list', 'max', 'maxlength', 'min', 'minlength', 'multiple', 'name', 'pattern', 'readonly', 'required', 'selected', 'size', 'step', 'value']);

export { htmlRuntimeBoundaryChanges, htmlRuntimeBoundaryProofForChange, htmlRuntimeBoundaryProofRecord, htmlRuntimeBoundaryProvenResult };
