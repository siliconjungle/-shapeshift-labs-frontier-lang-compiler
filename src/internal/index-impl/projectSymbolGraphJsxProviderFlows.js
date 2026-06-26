import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { isJsxComponentTag, jsxContextProviderBoundary, jsxTagTokens } from '../../js-ts-safe-merge-jsx-attribute-parser.js';

function jsxProviderFlowRecords(ownerSourceText, ownerName) {
  const text = String(ownerSourceText ?? '');
  const tokens = jsxTagTokens(text);
  return tokens.flatMap((token, index) => {
    if (token.kind !== 'opening' || token.selfClosing) return [];
    const boundary = jsxContextProviderBoundary(token.tagName);
    if (!boundary) return [];
    const close = matchingClose(tokens, index);
    if (!close) return [];
    const children = directChildrenExpression(text.slice(token.end, close.start));
    if (!children) return [];
    return [providerFlowRecord({ ownerName, token, boundary, children })];
  });
}

function jsxProviderFlowAncestorMap(tags, sourceText, componentOwners) {
  const tagsByStart = new Map(tags.map((tag) => [tag.start, tag]));
  const ancestorsByStart = new Map();
  const stack = [];
  for (const token of jsxTagTokens(sourceText)) {
    if (token.kind === 'closing') {
      closeComponentFlowStack(stack, token.tagName);
      continue;
    }
    const tag = tagsByStart.get(token.start);
    if (tag) ancestorsByStart.set(tag.start, stack.flatMap((entry) => entry.flows.map((flow) => ({ ...flow, componentCallTagName: entry.tagName }))));
    const flows = componentProviderFlowsForTag(token.tagName, componentOwners);
    if (flows.length && !token.selfClosing) stack.push({ tagName: token.tagName, flows });
  }
  return ancestorsByStart;
}

function providerFlowRecord(input) {
  const providerFlowHash = hashSemanticValue({
    kind: 'frontier.lang.projectJsxProviderChildrenFlow',
    componentOwnerName: input.ownerName,
    contextName: input.boundary.contextName,
    tagName: input.token.tagName,
    childrenExpressionText: input.children.expressionText
  });
  return {
    providerFlowStatus: 'static-provider-children-flow-evidence',
    providerFlowScope: 'same-file-component-children-flow',
    componentProviderFlowOwnerName: input.ownerName,
    contextName: input.boundary.contextName,
    tagName: input.token.tagName,
    contextProviderLookupTagName: input.token.tagName,
    childrenExpressionText: input.children.expressionText,
    providerFlowHash
  };
}

function componentProviderFlowsForTag(tagName, componentOwners) {
  if (!isJsxComponentTag(tagName) || !/^[A-Z][A-Za-z0-9_$]*$/.test(String(tagName ?? ''))) return [];
  const owners = componentOwners?.get(tagName) ?? [];
  return owners.length === 1 ? providerFlowRecordsForOwner(tagName, owners[0]) : [];
}

function providerFlowRecordsForOwner(tagName, owner) {
  const records = owner?.providerFlowRecords ?? [];
  return records.map((record) => providerFlowRecordForOwner(tagName, owner, record));
}

function providerFlowRecordForOwner(tagName, owner, record) {
  const scope = owner?.componentProviderLookupScope;
  if (!String(scope ?? '').startsWith('project-import-')) return record;
  const componentProviderFlowLookupHash = hashSemanticValue({
    kind: 'frontier.lang.projectJsxProviderFlowComponentLookup',
    tagName,
    ownerName: owner.name,
    scope,
    targetSourcePath: owner.componentCallTargetSourcePath,
    importEdgeId: owner.componentCallImportEdgeId,
    reExportEdgeId: owner.componentCallReExportEdgeId,
    reExportIdentityId: owner.componentCallReExportIdentityId,
    providerFlowHash: record.providerFlowHash
  });
  return compactRecord({
    ...record,
    providerFlowScope: projectImportProviderFlowScope(scope),
    componentProviderFlowLookupStatus: owner.componentCallLookupStatus,
    componentProviderFlowLookupScope: scope,
    componentProviderFlowLookupHash,
    componentProviderFlowComponentTagName: tagName,
    componentProviderFlowTargetOwnerName: owner.name,
    componentProviderFlowTargetSourcePath: owner.componentCallTargetSourcePath,
    componentProviderFlowImportEdgeId: owner.componentCallImportEdgeId,
    componentProviderFlowImportKind: owner.componentCallImportKind,
    componentProviderFlowImportedName: owner.componentCallImportedName,
    componentProviderFlowLocalName: owner.componentCallLocalName,
    componentProviderFlowTargetExportName: owner.componentCallTargetExportName,
    componentProviderFlowReExportEdgeId: owner.componentCallReExportEdgeId,
    componentProviderFlowReExportSourcePath: owner.componentCallReExportSourcePath,
    componentProviderFlowReExportExportedName: owner.componentCallReExportExportedName,
    componentProviderFlowReExportLocalName: owner.componentCallReExportLocalName,
    componentProviderFlowReExportTargetSourcePath: owner.componentCallReExportTargetSourcePath,
    componentProviderFlowReExportKind: owner.componentCallReExportKind,
    componentProviderFlowReExportIdentityId: owner.componentCallReExportIdentityId
  });
}

function directChildrenExpression(text) {
  const match = /\{\s*((?:(?:this\s*\.\s*)?props\s*(?:\.|\?\.)\s*)?children)\s*\}/.exec(String(text ?? ''));
  return match ? { expressionText: match[1].replace(/\s+/g, '') } : undefined;
}

function matchingClose(tokens, openIndex) {
  const tagName = tokens[openIndex]?.tagName;
  let depth = 0;
  for (let index = openIndex + 1; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.tagName !== tagName) continue;
    if (token.kind === 'opening' && !token.selfClosing) depth += 1;
    if (token.kind === 'closing' && depth-- === 0) return token;
  }
  return undefined;
}

function closeComponentFlowStack(stack, tagName) {
  for (let index = stack.length - 1; index >= 0; index -= 1) {
    if (stack[index].tagName !== tagName) continue;
    stack.splice(index);
    return;
  }
}

function projectImportProviderFlowScope(scope) { return scope === 'project-import-reexport-component' ? 'project-import-reexport-component-children-flow' : 'project-import-component-children-flow'; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }

export { jsxProviderFlowAncestorMap, jsxProviderFlowRecords };
