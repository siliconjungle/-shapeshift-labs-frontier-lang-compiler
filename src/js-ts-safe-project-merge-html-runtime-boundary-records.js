import { uniqueStrings } from './js-ts-safe-project-merge-core.js';

function htmlRuntimeBoundaryGroups(sourceText) {
  const groups = new Map();
  for (const record of htmlRuntimeBoundaryRecords(sourceText)) {
    const key = `${record.reasonCode}\0${record.boundary}`;
    const group = groups.get(key) ?? { reasonCode: record.reasonCode, boundary: record.boundary, records: [] };
    group.records.push(record);
    groups.set(key, group);
  }
  for (const group of groups.values()) group.fingerprint = group.records.map(htmlRuntimeBoundaryRecordFingerprint).sort().join('\n');
  return groups;
}

function changedHtmlRuntimeBoundaryAttributes(before, after) {
  const beforeByKey = new Map(before.filter(isHtmlRuntimeBoundaryAttributeRecord).map((attribute) => [`${attribute.elementKey}:${attribute.name}`, attribute]));
  const afterByKey = new Map(after.filter(isHtmlRuntimeBoundaryAttributeRecord).map((attribute) => [`${attribute.elementKey}:${attribute.name}`, attribute]));
  const names = uniqueStrings([...beforeByKey.keys(), ...afterByKey.keys()].flatMap((key) => {
    const left = beforeByKey.get(key);
    const right = afterByKey.get(key);
    return String(left?.value) === String(right?.value) ? [] : [right?.name ?? left?.name];
  }));
  return names.length ? names : uniqueStrings([...before, ...after].map((attribute) => attribute.name).filter(Boolean));
}

function htmlRuntimeBoundaryRecordFingerprint(record) {
  const key = record.name ? `${record.elementKey}:${record.name}` : record.elementKey;
  return `${key}=${String(record.value ?? record.sourceText ?? '')}`;
}

function isHtmlRuntimeBoundaryAttributeRecord(record) {
  return typeof record?.name === 'string' && record.name.length > 0;
}

function htmlRuntimeBoundaryRecords(sourceText) {
  const records = [];
  const text = String(sourceText ?? '');
  let elementIndex = 0;
  for (const tag of text.matchAll(/<[A-Za-z][\w:-]*(?:\s+[^<>]*?)?\/?>/g)) {
    const parsed = /^<([A-Za-z][\w:-]*)([\s\S]*?)\/?>$/.exec(tag[0]);
    if (!parsed) continue;
    const tagName = parsed[1].toLowerCase();
    const elementKey = `${elementIndex++}:${tagName}`;
    const attributes = parseHtmlAttributes(parsed[2] ?? '');
    for (const attribute of attributes) {
      const name = attribute.name.toLowerCase();
      const spec = htmlRuntimeAttributeSpec(name, tagName);
      if (spec) records.push({ ...attribute, ...spec, name, tagName, elementKey });
    }
    const elementSpec = htmlRuntimeElementSpec(tagName, attributes);
    if (elementSpec) records.push({ ...elementSpec, tagName, elementKey, sourceText: htmlRuntimeElementSource(text, tagName, tag.index ?? 0, tag[0]) });
  }
  return records;
}

function htmlRuntimeAttributeSpec(name, tagName) {
  if (isHtmlFrameworkDirectiveAttribute(name)) return { boundary: 'html-framework-directive', reasonCode: 'framework-directive-boundary' };
  if (/^on[\w:.-]+$/i.test(name)) return { boundary: 'html-event-handler-attribute', reasonCode: 'event-handler-runtime-boundary' };
  if (name === 'style') return { boundary: 'html-inline-style-attribute', reasonCode: 'inline-style-runtime-boundary' };
  if (tagName === 'iframe' && name === 'srcdoc') return { boundary: 'html-iframe-srcdoc-attribute', reasonCode: 'iframe-srcdoc-runtime-boundary' };
  if (tagName === 'iframe' && IframeRuntimeAttributes.has(name)) return { boundary: 'html-iframe-runtime-attribute', reasonCode: 'iframe-runtime-boundary' };
  if (tagName === 'form' && FormRuntimeAttributes.has(name)) return { boundary: 'html-form-runtime-attribute', reasonCode: 'form-runtime-boundary' };
  if (FormSubmitterTags.has(tagName) && FormSubmitterRuntimeAttributes.has(name)) return { boundary: 'html-form-submitter-runtime-attribute', reasonCode: 'form-submitter-runtime-boundary' };
  if (FormControlTags.has(tagName) && FormControlRuntimeAttributes.has(name)) return { boundary: 'html-form-control-runtime-attribute', reasonCode: 'form-control-runtime-boundary' };
  if (tagName === 'a' && AnchorNavigationRuntimeAttributes.has(name)) return { boundary: 'html-anchor-navigation-runtime-attribute', reasonCode: 'navigation-runtime-boundary' };
  if (tagName === 'area' && AnchorNavigationRuntimeAttributes.has(name)) return { boundary: 'html-area-navigation-runtime-attribute', reasonCode: 'navigation-runtime-boundary' };
  if (tagName === 'base' && BaseRuntimeAttributes.has(name)) return { boundary: 'html-document-base-runtime-attribute', reasonCode: 'document-base-runtime-boundary' };
  if (tagName === 'meta' && MetaRuntimeAttributes.has(name)) return { boundary: 'html-document-metadata-runtime-attribute', reasonCode: 'document-metadata-runtime-boundary' };
  if (ResourceLoadingTags.has(tagName) && ResourceLoadingAttributes.has(name)) return { boundary: 'html-resource-loading-attribute', reasonCode: 'resource-loading-runtime-boundary' };
  return undefined;
}

function htmlRuntimeElementSpec(tagName, attributes = []) {
  if (tagName === 'template') return { boundary: 'html-template-runtime', reasonCode: 'template-runtime-boundary' };
  if (tagName === 'slot') return { boundary: 'html-slot-runtime', reasonCode: 'slot-runtime-boundary' };
  if (isCustomElementRuntimeBoundary(tagName, attributes)) return { boundary: 'html-custom-element-runtime', reasonCode: 'custom-element-runtime-boundary' };
  return undefined;
}

function isCustomElementRuntimeBoundary(tagName, attributes) {
  return tagName.includes('-') || attributes.some((attribute) => attribute.name.toLowerCase() === 'is' && String(attribute.value).includes('-'));
}

function htmlRuntimeElementSource(sourceText, tagName, start, openingTag) {
  if (/\/>$/.test(openingTag)) return openingTag;
  const rest = sourceText.slice(start + openingTag.length);
  const close = new RegExp(`</${escapeRegExp(tagName)}\\s*>`, 'i').exec(rest);
  return close ? sourceText.slice(start, start + openingTag.length + close.index + close[0].length) : openingTag;
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isHtmlFrameworkDirectiveAttribute(name) {
  return isAngularFrameworkDirectiveAttribute(name) ||
    name.startsWith(':') ||
    name.startsWith('@') ||
    /^v(?:-|:)/.test(name) ||
    /^x(?:-|:)/.test(name) ||
    /^(?:on|bind|class|use|transition|in|out|animate|let):/.test(name) ||
    /^ng-/.test(name) ||
    /^data-ng-/.test(name);
}

function isAngularFrameworkDirectiveAttribute(name) {
  return AngularTwoWayBindingAttributePattern.test(name) ||
    AngularPropertyBindingAttributePattern.test(name) ||
    AngularEventBindingAttributePattern.test(name) ||
    AngularStructuralOrReferenceAttributePattern.test(name) ||
    AngularCanonicalBindingAttributePattern.test(name);
}

function parseHtmlAttributes(text) {
  const attributes = [];
  for (const match of text.matchAll(HtmlAttributePattern)) attributes.push({ name: match[1], value: match[2] ?? match[3] ?? match[4] ?? true });
  return attributes;
}

const HtmlAttributePattern = /(?:^|\s+)(\[\([\w:.-]+\)\]|\[[\w:.-]+\]|\([\w:.-]+\)|[*#][A-Za-z_][\w:.-]*|[:@A-Za-z_][\w:.[\]-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
const AngularTwoWayBindingAttributePattern = /^\[\([\w:.-]+\)\]$/;
const AngularPropertyBindingAttributePattern = /^\[[\w:.-]+\]$/;
const AngularEventBindingAttributePattern = /^\([\w:.-]+\)$/;
const AngularStructuralOrReferenceAttributePattern = /^[*#][a-z_][\w:.-]*$/;
const AngularCanonicalBindingAttributePattern = /^(?:bind|on|bindon|ref|let)-[\w:.-]+$/;
const IframeRuntimeAttributes = new Set(['allow', 'allowfullscreen', 'allowpaymentrequest', 'credentialless', 'csp', 'fetchpriority', 'loading', 'name', 'referrerpolicy', 'sandbox', 'src']);
const FormRuntimeAttributes = new Set(['accept-charset', 'action', 'autocomplete', 'enctype', 'method', 'novalidate', 'target']);
const FormSubmitterTags = new Set(['button', 'input']);
const FormSubmitterRuntimeAttributes = new Set(['form', 'formaction', 'formenctype', 'formmethod', 'formnovalidate', 'formtarget', 'type']);
const FormControlTags = new Set(['button', 'fieldset', 'input', 'optgroup', 'option', 'output', 'select', 'textarea']);
const FormControlRuntimeAttributes = new Set(['accept', 'autocomplete', 'capture', 'checked', 'disabled', 'form', 'list', 'max', 'maxlength', 'min', 'minlength', 'multiple', 'name', 'pattern', 'readonly', 'required', 'selected', 'size', 'step', 'value']);
const AnchorNavigationRuntimeAttributes = new Set(['download', 'href', 'ping', 'referrerpolicy', 'target']);
const BaseRuntimeAttributes = new Set(['href', 'target']);
const MetaRuntimeAttributes = new Set(['charset', 'content', 'http-equiv', 'media', 'name', 'property']);
const ResourceLoadingTags = new Set(['audio', 'embed', 'img', 'link', 'object', 'source', 'track', 'video']);
const ResourceLoadingAttributes = new Set(['as', 'autoplay', 'blocking', 'color', 'controls', 'controlslist', 'crossorigin', 'data', 'decoding', 'default', 'disablepictureinpicture', 'disableremoteplayback', 'fetchpriority', 'height', 'href', 'imagesizes', 'imagesrcset', 'integrity', 'ismap', 'kind', 'label', 'loading', 'loop', 'media', 'muted', 'poster', 'preload', 'referrerpolicy', 'rel', 'sizes', 'src', 'srcset', 'srclang', 'type', 'usemap', 'width']);

export { changedHtmlRuntimeBoundaryAttributes, htmlRuntimeBoundaryGroups };
