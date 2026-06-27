import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { isJsxComponentTag, isJsxSpreadAttribute, jsxContextProviderBoundary, parseJsxTags } from '../../js-ts-safe-merge-jsx-attribute-parser.js';
import { jsxSameFileMemberComponentOwnerIndex } from './projectSymbolGraphJsxMemberComponents.js';

function jsxComponentPropRenderFlowBoundary(tag, attribute, valueEvidence, context = {}) {
  if (isJsxSpreadAttribute(attribute) || !isJsxComponentTag(tag.tagName) || jsxContextProviderBoundary(tag.tagName)) return undefined;
  const { targetName, targetKind, owners } = componentPropRenderFlowTarget(tag, context);
  if (owners.length !== 1) return unsupportedComponentPropRenderFlow(tag, attribute, {
    reasonCode: 'jsx-render-component-prop-flow-unsupported',
    targetName,
    targetKind,
    targetOwnerCount: owners.length
  });
  const owner = owners[0];
  const lookupScope = String(owner.componentProviderLookupScope ?? '');
  const sameFileDirect = owner.sourcePath === context.sourcePath && !lookupScope.startsWith('project-import-');
  const projectImport = lookupScope.startsWith('project-import-');
  if (!sameFileDirect && !projectImport) return unsupportedComponentPropRenderFlow(tag, attribute, {
    reasonCode: 'jsx-render-component-prop-flow-unsupported',
    targetName,
    targetKind,
    targetOwnerName: owner.name,
    targetSourcePath: owner.sourcePath,
    targetLookupScope: owner.componentProviderLookupScope,
    targetLookupStatus: owner.componentCallLookupStatus
  });
  if (!staticComponentPropCallsiteValue(valueEvidence)) return unsupportedComponentPropRenderFlow(tag, attribute, {
    reasonCode: 'jsx-render-component-prop-flow-dynamic-value-unsupported',
    targetName,
    targetKind,
    targetOwnerName: owner.name,
    targetSourcePath: owner.sourcePath,
    targetLookupScope: owner.componentProviderLookupScope,
    targetLookupStatus: owner.componentCallLookupStatus,
    dynamicBlockerReasonCode: valueEvidence?.dynamicBlockerReasonCode
  });
  const flowRecord = (owner.componentPropRenderFlowRecords ?? []).find((record) => record.componentPropName === attribute.name);
  if (!flowRecord) return unsupportedComponentPropRenderFlow(tag, attribute, {
    reasonCode: 'jsx-render-component-prop-flow-unsupported',
    targetName,
    targetKind,
    targetOwnerName: owner.name,
    targetSourcePath: owner.sourcePath,
    targetLookupScope: owner.componentProviderLookupScope,
    targetLookupStatus: owner.componentCallLookupStatus
  });
  const targetLookupHash = componentPropFlowLookupHash(tag, targetName, owner);
  return compactRecord({
    status: 'static-component-prop-render-flow-evidence',
    reasonCode: 'jsx-render-component-prop-flow-static-passthrough-evidence',
    claim: true,
    claimScope: 'static-prop-passthrough-only',
    renderEquivalenceClaim: false,
    scope: componentPropRenderFlowScope(flowRecord.scope, lookupScope),
    targetName,
    targetOwnerName: owner.name,
    targetSourcePath: owner.sourcePath,
    targetLookupStatus: owner.componentCallLookupStatus,
    targetLookupScope: owner.componentProviderLookupScope,
    importEdgeId: owner.componentCallImportEdgeId,
    importKind: owner.componentCallImportKind,
    importedName: owner.componentCallImportedName,
    localName: owner.componentCallLocalName,
    targetExportName: owner.componentCallTargetExportName,
    reExportEdgeId: owner.componentCallReExportEdgeId,
    reExportSourcePath: owner.componentCallReExportSourcePath,
    reExportExportedName: owner.componentCallReExportExportedName,
    reExportLocalName: owner.componentCallReExportLocalName,
    reExportTargetSourcePath: owner.componentCallReExportTargetSourcePath,
    reExportKind: owner.componentCallReExportKind,
    reExportIdentityId: owner.componentCallReExportIdentityId,
    targetLookupHash,
    memberObjectName: owner.componentCallMemberObjectName,
    memberPropertyName: owner.componentCallMemberPropertyName,
    memberLocalName: owner.componentCallMemberLocalName,
    memberBindingKind: owner.componentCallMemberBindingKind,
    memberBindingHash: owner.componentCallMemberBindingHash,
    componentPropName: flowRecord.componentPropName,
    renderedTagName: flowRecord.renderedTagName,
    renderedPropName: flowRecord.renderedPropName,
    passthroughExpressionText: flowRecord.passthroughExpressionText,
    bindingKind: flowRecord.bindingKind,
    returnOrdinal: flowRecord.returnOrdinal,
    targetSignatureHash: flowRecord.signatureHash,
    signatureHash: hashSemanticValue({
      kind: 'frontier.lang.projectJsxComponentPropRenderFlowBoundary',
      tagName: tag.tagName,
      tagKey: tag.key,
      propName: attribute.name,
      targetName,
      targetOwnerName: owner.name,
      targetSourcePath: owner.sourcePath,
      targetLookupStatus: owner.componentCallLookupStatus,
      targetLookupScope: owner.componentProviderLookupScope,
      importEdgeId: owner.componentCallImportEdgeId,
      reExportEdgeId: owner.componentCallReExportEdgeId,
      reExportIdentityId: owner.componentCallReExportIdentityId,
      memberBindingHash: owner.componentCallMemberBindingHash,
      targetLookupHash,
      valueSignatureHash: valueEvidence?.signatureHash,
      flowSignatureHash: flowRecord.signatureHash,
      claimScope: 'static-prop-passthrough-only',
      renderEquivalenceClaim: false
    })
  });
}

function unsupportedComponentPropRenderFlow(tag, attribute, options = {}) {
  return compactRecord({
    status: 'component-prop-render-flow-unsupported',
    reasonCode: options.reasonCode ?? 'jsx-render-component-prop-flow-unsupported',
    claim: false,
    renderEquivalenceClaim: false,
    targetName: options.targetName,
    targetKind: options.targetKind ?? (plainComponentTagName(tag.tagName) ? 'plain-component' : 'member-component'),
    targetOwnerName: options.targetOwnerName,
    targetOwnerCount: options.targetOwnerCount,
    targetSourcePath: options.targetSourcePath,
    targetLookupStatus: options.targetLookupStatus,
    targetLookupScope: options.targetLookupScope,
    dynamicBlockerReasonCode: options.dynamicBlockerReasonCode,
    signatureHash: hashSemanticValue({
      kind: 'frontier.lang.projectJsxComponentPropRenderFlowBoundary',
      tagName: tag.tagName,
      tagKey: tag.key,
      propName: attribute.name,
      targetName: options.targetName,
      targetKind: options.targetKind ?? (plainComponentTagName(tag.tagName) ? 'plain-component' : 'member-component'),
      reasonCode: options.reasonCode ?? 'jsx-render-component-prop-flow-unsupported',
      targetLookupStatus: options.targetLookupStatus,
      targetLookupScope: options.targetLookupScope,
      dynamicBlockerReasonCode: options.dynamicBlockerReasonCode
    })
  });
}

function staticComponentPropCallsiteValue(valueEvidence) {
  return valueEvidence?.proofStatus === 'static-literal-jsx-prop-value-evidence' || valueEvidence?.proofStatus === 'static-reference-jsx-prop-value-evidence' || valueEvidence?.proofStatus === 'static-optional-reference-jsx-prop-value-evidence';
}

function componentPropRenderFlowScope(fallbackScope, lookupScope) {
  if (lookupScope === 'project-import-reexport-member-component') return 'project-import-reexport-member-component-static-prop-passthrough';
  if (lookupScope === 'project-import-member-component') return 'project-import-member-component-static-prop-passthrough';
  if (lookupScope === 'project-import-reexport-component') return 'project-import-reexport-component-static-prop-passthrough';
  if (lookupScope === 'project-import-direct-component') return 'project-import-direct-component-static-prop-passthrough';
  if (lookupScope === 'same-file-member-component') return 'same-file-member-component-static-prop-passthrough';
  return fallbackScope;
}

function componentPropFlowLookupHash(tag, targetName, owner) {
  const scope = String(owner?.componentProviderLookupScope ?? '');
  if (!scope.startsWith('project-import-') && scope !== 'same-file-member-component') return undefined;
  return hashSemanticValue({
    kind: 'frontier.lang.projectJsxComponentPropFlowLookupTarget',
    tagName: tag.tagName,
    targetName,
    ownerName: owner.name,
    scope: owner.componentProviderLookupScope,
    targetSourcePath: owner.componentCallTargetSourcePath ?? owner.sourcePath,
    importEdgeId: owner.componentCallImportEdgeId,
    reExportEdgeId: owner.componentCallReExportEdgeId,
    reExportIdentityId: owner.componentCallReExportIdentityId,
    memberBindingHash: owner.componentCallMemberBindingHash
  });
}

function componentPropRenderFlowTarget(tag, context) {
  const plain = plainComponentTagName(tag.tagName);
  if (plain) return { targetName: plain, targetKind: 'plain-component', owners: context.componentOwners?.get(plain) ?? [] };
  const member = memberComponentTagName(tag.tagName);
  const owners = member ? context.componentMemberOwners?.get(member) ?? [] : [];
  const fallbackOwners = member && !owners.length ? jsxSameFileMemberComponentOwnerIndex(context.sourceText, context.componentOwners).get(member) ?? [] : owners;
  return { targetName: member ?? tag.tagName, targetKind: 'member-component', owners: fallbackOwners };
}

function jsxComponentPropRenderFlowRecords(ownerSourceText, ownerName, renderReturnRecords = []) {
  const binding = componentPropsBinding(ownerSourceText, ownerName);
  if (!binding) return [];
  const singleStaticReturn = renderReturnRecords.length === 1 && renderReturnRecords[0]?.branchControlKind === 'return-statement';
  if (!singleStaticReturn) return [];
  return staticPropPassthroughRecords(renderReturnRecords[0], binding, ownerName);
}

function staticPropPassthroughRecords(returnRecord, binding, ownerName) {
  return parseJsxTags(returnRecord.expressionText).tags.flatMap((tag) => tag.attributes.flatMap((attribute) => {
    if (isJsxSpreadAttribute(attribute)) return [];
    const assigned = jsxAssignedPropValueText(attribute);
    const expressionText = assigned === undefined ? undefined : bracedExpressionText(assigned);
    const reference = expressionText === undefined ? undefined : staticPropReferenceForBinding(expressionText, binding);
    if (!reference) return [];
    return [componentPropRenderFlowRecord({ ownerName, returnRecord, tag, attribute, reference })];
  }));
}

function componentPropRenderFlowRecord(input) {
  const passthroughExpressionText = input.reference.expressionText;
  const signatureHash = hashSemanticValue({
    kind: 'frontier.lang.projectJsxStaticComponentPropPassthrough',
    ownerName: input.ownerName,
    componentPropName: input.reference.propName,
    renderedTagName: input.tag.tagName,
    renderedPropName: input.attribute.name,
    returnOrdinal: input.returnRecord.ordinal,
    passthroughExpressionText,
    bindingKind: input.reference.bindingKind
  });
  return {
    proofStatus: 'static-component-prop-render-flow-evidence',
    reasonCode: 'jsx-render-component-prop-flow-static-passthrough-evidence',
    scope: 'same-file-plain-component-static-prop-passthrough',
    renderEquivalenceClaim: false,
    componentPropName: input.reference.propName,
    renderedTagName: input.tag.tagName,
    renderedPropName: input.attribute.name,
    passthroughExpressionText,
    bindingKind: input.reference.bindingKind,
    returnOrdinal: input.returnRecord.ordinal,
    signatureHash
  };
}

function componentPropsBinding(sourceText, ownerName) {
  const text = String(sourceText ?? '');
  const functionMatch = new RegExp(`\\bfunction\\s+${escapeRegExp(ownerName)}\\s*\\(([^)]*)\\)`).exec(text);
  const arrowMatch = new RegExp(`\\b(?:const|let|var)\\s+${escapeRegExp(ownerName)}\\s*=\\s*(?:\\(([^)]*)\\)|([A-Za-z_$][\\w$]*))\\s*=>`).exec(text);
  const paramsText = functionMatch?.[1] ?? arrowMatch?.[1] ?? arrowMatch?.[2];
  const first = firstParameterText(paramsText);
  if (!first) return undefined;
  if (/^[A-Za-z_$][\w$]*$/.test(first)) return { kind: 'props-identifier', identifier: first };
  if (/^\{[\s\S]*\}$/.test(first)) {
    const props = destructuredPropBindings(first);
    return props.length ? { kind: 'destructured-parameter', props } : undefined;
  }
  return undefined;
}

function firstParameterText(paramsText) {
  const text = String(paramsText ?? '').trim();
  if (!text) return undefined;
  return splitTopLevel(text, ',')[0]?.trim();
}

function destructuredPropBindings(paramText) {
  const inner = String(paramText ?? '').trim().replace(/^\{|\}$/g, '');
  return splitTopLevel(inner, ',').flatMap((part) => {
    const withoutDefault = splitTopLevel(part.trim(), '=')[0]?.trim();
    if (!withoutDefault || withoutDefault.startsWith('...') || /[\[\]{}]/.test(withoutDefault)) return [];
    const alias = /^([A-Za-z_$][\w$]*)\s*:\s*([A-Za-z_$][\w$]*)$/.exec(withoutDefault);
    if (alias) return [{ propName: alias[1], localName: alias[2] }];
    const direct = /^([A-Za-z_$][\w$]*)$/.exec(withoutDefault);
    return direct ? [{ propName: direct[1], localName: direct[1] }] : [];
  });
}

function staticPropReferenceForBinding(expressionText, binding) {
  const normalized = normalizedMemberExpression(expressionText);
  if (!normalized) return undefined;
  if (binding.kind === 'props-identifier') {
    const prefix = `${binding.identifier}.`;
    if (!normalized.startsWith(prefix)) return undefined;
    const propName = normalized.slice(prefix.length);
    return /^[A-Za-z_$][\w$]*$/.test(propName)
      ? { propName, expressionText: normalized, bindingKind: 'props-identifier' }
      : undefined;
  }
  if (binding.kind === 'destructured-parameter') {
    const prop = binding.props.find((candidate) => candidate.localName === normalized);
    return prop ? { propName: prop.propName, expressionText: normalized, bindingKind: 'destructured-parameter' } : undefined;
  }
  return undefined;
}

function normalizedMemberExpression(text) {
  const value = normalizedText(text).replace(/\s*\.\s*/g, '.').replace(/\s+/g, '');
  return /^(?:[A-Za-z_$][\w$]*)(?:\.[A-Za-z_$][\w$]*)*$/.test(value) ? value : undefined;
}

function splitTopLevel(text, delimiter) {
  const value = String(text ?? '');
  const parts = [];
  let quote;
  let depth = 0;
  let start = 0;
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
    else if (depth === 0 && value.slice(index, index + delimiter.length) === delimiter) {
      parts.push(value.slice(start, index));
      start = index + delimiter.length;
      index += delimiter.length - 1;
    }
  }
  parts.push(value.slice(start));
  return parts;
}

function jsxAssignedPropValueText(attribute) {
  const match = /^[A-Za-z_$][\w$:-]*\s*=\s*([\s\S]*)$/.exec(String(attribute?.text ?? '').trim());
  return match ? normalizedText(match[1]) : undefined;
}

function bracedExpressionText(text) {
  const match = /^\{\s*([\s\S]*?)\s*\}$/.exec(String(text ?? '').trim());
  return match ? normalizedText(match[1]) : undefined;
}

function escapeRegExp(text) { return String(text ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function plainComponentTagName(tagName) { return /^[A-Z][A-Za-z0-9_$]*$/.test(String(tagName ?? '')) ? String(tagName) : undefined; }
function memberComponentTagName(tagName) { return /^[A-Z][A-Za-z0-9_$]*(?:\.[A-Z][A-Za-z0-9_$]*)+$/.test(String(tagName ?? '')) ? String(tagName) : undefined; }
function normalizedText(text) { return String(text ?? '').trim().replace(/\s+/g, ' '); }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }

export { jsxComponentPropRenderFlowBoundary, jsxComponentPropRenderFlowRecords };
