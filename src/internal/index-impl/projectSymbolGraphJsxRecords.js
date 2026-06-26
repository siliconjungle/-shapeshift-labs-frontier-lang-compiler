import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment, uniqueStrings } from '../../native-import-utils.js';
import { isJsxComponentTag, isJsxSpreadAttribute, jsxContextProviderAncestorMap, parseJsxTags } from '../../js-ts-safe-merge-jsx-attribute-parser.js';
import { jsxEventHandlerProps, jsxOwnerEventHandlerDeclarations } from './projectSymbolGraphJsxEventHandlers.js';
import { jsxRenderRiskEvidence } from './projectSymbolGraphJsxRenderRisk.js';
import { jsxHookCalls } from './projectSymbolGraphJsxHooks.js';
import { jsxRenderReturnRecords } from './projectSymbolGraphJsxRenderReturns.js';
import { jsxComponentWrapperRecords, jsxComponentWrapperRenderRiskEvidence, mergeJsxRenderRiskEvidence } from './projectSymbolGraphJsxComponentWrappers.js';
import { jsxComponentProviderContextConsumerRecords } from './projectSymbolGraphJsxComponentProviderLookup.js';
import { jsxImportedComponentOwnerIndexes, jsxImportedMemberComponentOwnerIndexes, mergeJsxComponentOwnerIndexes } from './projectSymbolGraphJsxComponentImports.js';
import { jsxSameFileMemberComponentObjectIndex, jsxSameFileMemberComponentOwnerIndex } from './projectSymbolGraphJsxMemberComponents.js';
import { jsxProviderFlowAncestorMap, jsxProviderFlowRecords } from './projectSymbolGraphJsxProviderFlows.js';
import { jsxComponentPropRenderFlowBoundary, jsxComponentPropRenderFlowRecords } from './projectSymbolGraphJsxPropFlows.js';
import { jsxPropComponentFlowRecordFields, jsxPropValueRecordFields } from './projectSymbolGraphJsxPropRecordFields.js';
import { jsxPropValueEvidence } from './projectSymbolGraphJsxPropValues.js';
import { lineColumnForOffset } from './lineColumnForOffset.js';

function createProjectJsxGraphRecords(semanticIndex, imports, publicContractRegions, importEdges = [], exportEdges = []) {
  const publicKeys = publicJsxOwnerKeys(publicContractRegions, semanticIndex);
  const componentOwnersBySourcePath = componentOwnerIndexesBySourcePath(semanticIndex, imports);
  const importedOwnersBySourcePath = jsxImportedComponentOwnerIndexes(importEdges, exportEdges, componentOwnersBySourcePath);
  const memberObjectsBySourcePath = componentMemberObjectIndexesBySourcePath(imports, componentOwnersBySourcePath, importedOwnersBySourcePath);
  const importedMemberOwnersBySourcePath = jsxImportedMemberComponentOwnerIndexes(importEdges, exportEdges, memberObjectsBySourcePath);
  const records = imports.map((imported) => jsxRecordsForImport(imported, semanticIndex, publicKeys, componentOwnersBySourcePath, importedOwnersBySourcePath, importedMemberOwnersBySourcePath)).filter(Boolean);
  return {
    jsxElementRecords: uniqueRecords(records.flatMap((record) => record.jsxElementRecords)),
    jsxPropRecords: uniqueRecords(records.flatMap((record) => record.jsxPropRecords))
  };
}

function jsxRecordsForImport(imported, semanticIndex, publicKeys, componentOwnersBySourcePath, importedOwnersBySourcePath, importedMemberOwnersBySourcePath) {
  if (!isJsxLikeImport(imported)) return undefined;
  const sourceText = nativeImportSourceText(imported);
  const sourcePath = imported?.sourcePath ?? imported?.nativeSource?.sourcePath;
  if (!sourceText || !sourcePath) return undefined;
  const sourceHash = imported?.nativeSource?.sourceHash ?? imported?.metadata?.sourceHash;
  const publicOwners = publicOwnerRanges(semanticIndex, sourcePath, publicKeys, sourceText);
  const componentOwners = mergeJsxComponentOwnerIndexes(componentOwnersBySourcePath.get(sourcePath), importedOwnersBySourcePath.get(sourcePath));
  const componentMemberOwners = mergeJsxComponentOwnerIndexes(
    jsxSameFileMemberComponentOwnerIndex(sourceText, componentOwners),
    importedMemberOwnersBySourcePath.get(sourcePath)
  );
  const parsed = parseJsxTags(sourceText);
  const contextProviderAncestors = jsxContextProviderAncestorMap(parsed.tags, sourceText);
  const providerFlowAncestors = jsxProviderFlowAncestorMap(parsed.tags, sourceText, componentOwners);
  const elementRecords = parsed.tags.map((tag, index) => jsxElementRecord(tag, index, {
    sourceText, sourcePath, sourceHash, publicOwners, componentOwners, componentMemberOwners,
    contextProviderAncestors: contextProviderAncestors.get(tag.start), providerFlowAncestors: providerFlowAncestors.get(tag.start)
  }));
  return {
    jsxElementRecords: elementRecords,
    jsxPropRecords: parsed.tags.flatMap((tag, index) => jsxPropRecordsForTag(tag, index, elementRecords[index], { sourceText, sourcePath, sourceHash, componentOwners, componentMemberOwners }))
  };
}

function jsxElementRecord(tag, index, context) {
  const sourceSpan = sourceSpanForRange(context, tag.start, tag.end);
  const owner = nearestPublicOwner(context.publicOwners, tag.start);
  const propNames = uniqueStrings(tag.attributes.map((attribute) => attribute.name));
  const propKinds = uniqueStrings(tag.attributes.map((attribute) => propKind(attribute)));
  const spreadPropCount = tag.attributes.filter(isJsxSpreadAttribute).length;
  const keyProp = jsxKeyProp(tag);
  const fragmentKind = jsxFragmentKind(tag.tagName);
  const eventHandlerProps = jsxEventHandlerProps(tag.attributes, owner?.eventHandlerDeclarations);
  const effectiveProviders = [...(context.contextProviderAncestors ?? []), ...(context.providerFlowAncestors ?? [])];
  const componentCall = jsxComponentProviderCallTarget(tag, context.componentOwners, context.componentMemberOwners, effectiveProviders);
  const componentWrapperCallTarget = jsxComponentWrapperCallTarget(tag, context.componentOwners);
  const componentContextConsumers = jsxComponentProviderContextConsumerRecords(tag, componentCall, effectiveProviders);
  const renderRisk = mergeJsxRenderRiskEvidence(mergeJsxRenderRiskEvidence(
    jsxRenderRiskEvidence(tag, owner, context.contextProviderAncestors, eventHandlerProps, componentContextConsumers),
    jsxComponentWrapperRenderRiskEvidence(owner),
    { tagName: tag.tagName, tagKey: tag.key, publicOwnerName: owner?.name }),
    jsxComponentWrapperRenderRiskEvidence(componentWrapperCallTarget),
    { tagName: tag.tagName, tagKey: tag.key, publicOwnerName: owner?.name }
  );
  return compactRecord({
    id: `jsx_element_${idFragment(context.sourcePath)}_${index + 1}`,
    tagName: tag.tagName,
    tagKey: tag.key,
    sourcePath: context.sourcePath,
    sourceHash: context.sourceHash,
    sourceSpan,
    start: tag.start,
    end: tag.end,
    ordinal: index + 1,
    propNames,
    propKinds,
    propCount: tag.attributes.length,
    spreadPropCount: spreadPropCount || undefined,
    keyedChild: keyProp ? true : undefined,
    keyPropName: keyProp?.name,
    keyPropValue: keyProp?.value,
    keyPropText: keyProp?.text,
    keyPropHash: keyProp?.hash,
    fragmentKind,
    component: isJsxComponentTag(tag.tagName) || undefined,
    publicContract: Boolean(owner) || undefined,
    publicOwnerName: owner?.name,
    ...renderRisk,
    childOrderSignatureHash: hashSemanticValue({
      kind: 'frontier.lang.projectJsxChildOrderSignature', tagName: tag.tagName, tagKey: tag.key,
      publicOwnerName: owner?.name, keyPropValue: keyProp?.value, fragmentKind, ordinal: index + 1,
      span: semanticSpanForHash(sourceSpan)
    }),
    signatureHash: hashSemanticValue({
      kind: 'frontier.lang.projectJsxElementSignature', tagName: tag.tagName, tagKey: tag.key,
      keyPropValue: keyProp?.value, fragmentKind, propNames, propKinds, spreadPropCount,
      span: semanticSpanForHash(sourceSpan)
    })
  });
}

function jsxPropRecordsForTag(tag, index, element, context) {
  return tag.attributes.map((attribute, attrIndex) => {
    const sourceSpan = sourceSpanForRange(context, attribute.start, attribute.end);
    const valueEvidence = jsxPropValueEvidence(tag, attribute, context);
    const componentPropRenderFlow = jsxComponentPropRenderFlowBoundary(tag, attribute, valueEvidence, { componentOwners: context.componentOwners, componentMemberOwners: context.componentMemberOwners, sourcePath: context.sourcePath, sourceText: context.sourceText });
    return compactRecord({
      id: `jsx_prop_${idFragment(context.sourcePath)}_${index + 1}_${attrIndex + 1}`,
      elementId: element.id, tagName: tag.tagName, tagKey: tag.key, propName: attribute.name,
      sourcePath: context.sourcePath, sourceHash: context.sourceHash, sourceSpan,
      start: attribute.start, end: attribute.end, ordinal: attrIndex + 1,
      propKind: propKind(attribute), keyProp: attribute.name === 'key' || undefined,
      spread: isJsxSpreadAttribute(attribute) || undefined, spreadOrdinal: attribute.spreadOrdinal,
      spreadExpressionHash: spreadExpressionHash(attribute),
      ...jsxPropValueRecordFields(valueEvidence),
      ...jsxPropComponentFlowRecordFields(componentPropRenderFlow),
      publicContract: element.publicContract, publicOwnerName: element.publicOwnerName,
      signatureHash: hashSemanticValue({
        kind: 'frontier.lang.projectJsxPropSignature', tagName: tag.tagName, tagKey: tag.key,
        propName: attribute.name, propKind: propKind(attribute), text: normalizedAttrText(attribute.text),
        spreadExpressionHash: spreadExpressionHash(attribute), propValueSignatureHash: valueEvidence?.signatureHash,
        componentPropRenderFlowSignatureHash: componentPropRenderFlow?.signatureHash
      })
    });
  });
}

function publicOwnerRanges(semanticIndex, sourcePath, publicKeys, sourceText) { return ownerRanges(semanticIndex, sourcePath, sourceText, (symbol) => symbol?.kind !== 'export' && publicKeys.has(publicKey(sourcePath, symbol?.name))); }

function componentOwnerRanges(semanticIndex, sourcePath, sourceText) { return ownerRanges(semanticIndex, sourcePath, sourceText, (symbol) => symbol?.kind !== 'export' && plainComponentTagName(symbol?.name)).filter(jsxComponentOwnerHasRenderableEvidence); }

function ownerRanges(semanticIndex, sourcePath, sourceText, predicate) {
  return (semanticIndex?.symbols ?? []).filter((symbol) => predicate(symbol) && symbol.definitionSpan?.path === sourcePath).map((symbol) => publicOwnerRange(symbol, sourceText)).filter((owner) => owner.range);
}

function componentOwnerIndex(owners) {
  const result = new Map(); for (const owner of owners) result.set(owner.name, [...(result.get(owner.name) ?? []), owner]); return result;
}

function componentOwnerIndexesBySourcePath(semanticIndex, imports) { return new Map(imports.map((imported) => componentOwnerIndexEntry(semanticIndex, imported)).filter(([sourcePath]) => sourcePath)); }

function componentOwnerIndexEntry(semanticIndex, imported) {
  const sourceText = nativeImportSourceText(imported); const sourcePath = imported?.sourcePath ?? imported?.nativeSource?.sourcePath;
  return [sourcePath, sourceText && sourcePath ? componentOwnerIndex(componentOwnerRanges(semanticIndex, sourcePath, sourceText)) : new Map()];
}

function componentMemberObjectIndexesBySourcePath(imports, componentOwnersBySourcePath, importedOwnersBySourcePath) {
  return new Map(imports.map((imported) => componentMemberObjectIndexEntry(imported, componentOwnersBySourcePath, importedOwnersBySourcePath)).filter(([sourcePath]) => sourcePath));
}

function componentMemberObjectIndexEntry(imported, componentOwnersBySourcePath, importedOwnersBySourcePath) {
  const sourceText = nativeImportSourceText(imported); const sourcePath = imported?.sourcePath ?? imported?.nativeSource?.sourcePath;
  const owners = mergeJsxComponentOwnerIndexes(componentOwnersBySourcePath.get(sourcePath), importedOwnersBySourcePath.get(sourcePath));
  return [sourcePath, sourceText && sourcePath ? jsxSameFileMemberComponentObjectIndex(sourceText, owners) : new Map()];
}

function jsxComponentProviderCallTarget(tag, componentOwners, componentMemberOwners, contextProviderAncestors = []) {
  if (!contextProviderAncestors?.length || !isJsxComponentTag(tag.tagName)) return undefined;
  const targetName = plainComponentTagName(tag.tagName) ? tag.tagName : undefined;
  if (!targetName) return jsxMemberComponentProviderCallTarget(tag, componentMemberOwners);
  const owners = componentOwners?.get(targetName) ?? [];
  if (owners.length !== 1) return { status: 'unsupported', targetName, reasonCode: 'jsx-render-context-consumer-provider-component-target-unsupported' };
  return { status: 'resolved', targetName, owner: owners[0], scope: owners[0].componentProviderLookupScope, lookupStatus: owners[0].componentCallLookupStatus };
}
function jsxMemberComponentProviderCallTarget(tag, componentMemberOwners) { const targetName = memberComponentTagName(tag.tagName); const owners = targetName ? componentMemberOwners?.get(targetName) ?? [] : []; return owners.length === 1 ? { status: 'resolved', targetName, owner: owners[0], scope: owners[0].componentProviderLookupScope, lookupStatus: owners[0].componentCallLookupStatus } : { status: 'unsupported', targetName: tag.tagName, reasonCode: 'jsx-render-context-consumer-provider-component-target-unsupported' }; }
function jsxComponentWrapperCallTarget(tag, componentOwners) { const targetName = plainComponentTagName(tag.tagName); const owners = targetName ? componentOwners?.get(targetName) ?? [] : []; return owners.length === 1 ? owners[0] : undefined; }
function jsxComponentOwnerHasRenderableEvidence(owner) { return Boolean(owner.hookCalls?.length || owner.renderReturnRecords?.length || owner.componentWrapperRecords?.length); }

function publicOwnerRange(symbol, sourceText) {
  const range = rangeForSpan(sourceText, symbol.definitionSpan);
  const ownerSourceText = range ? sourceText.slice(range.start, range.end) : undefined;
  const hookCalls = ownerSourceText ? jsxHookCalls(ownerSourceText) : [];
  const eventHandlerDeclarations = ownerSourceText ? jsxOwnerEventHandlerDeclarations(ownerSourceText, symbol.name) : undefined;
  const renderReturnRecords = ownerSourceText ? jsxRenderReturnRecords(ownerSourceText) : [];
  const componentWrapperRecords = ownerSourceText ? jsxComponentWrapperRecords(ownerSourceText, symbol.name) : [];
  const providerFlowRecords = ownerSourceText ? jsxProviderFlowRecords(ownerSourceText, symbol.name) : [];
  const componentPropRenderFlowRecords = ownerSourceText ? jsxComponentPropRenderFlowRecords(ownerSourceText, symbol.name, renderReturnRecords) : [];
  return {
    name: symbol.name,
    sourcePath: symbol.definitionSpan?.path,
    range,
    hookNames: uniqueStrings(hookCalls.map((call) => call.name)),
    hookCalls,
    eventHandlerDeclarations,
    renderReturnRecords,
    componentWrapperRecords,
    providerFlowRecords,
    componentPropRenderFlowRecords
  };
}

function publicJsxOwnerKeys(publicContractRegions = [], semanticIndex) {
  const keys = new Set(publicContractRegions.flatMap((region) => [
    publicKey(region.sourcePath, region.symbolName),
    publicKey(region.sourcePath, region.exportedName)
  ]).filter(Boolean));
  for (const symbol of semanticIndex?.symbols ?? []) {
    if (symbol?.kind === 'export' && symbol.definitionSpan?.path && symbol.name && !String(symbol.name).startsWith('{')) keys.add(publicKey(symbol.definitionSpan.path, symbol.name));
  }
  return keys;
}

function nearestPublicOwner(owners, start) {
  return owners.filter((owner) => owner.range.start <= start && start <= owner.range.end).sort((left, right) => right.range.start - left.range.start)[0];
}

function isJsxLikeImport(imported) {
  const language = String(imported?.language ?? imported?.nativeSource?.language ?? '').toLowerCase();
  const path = String(imported?.sourcePath ?? imported?.nativeSource?.sourcePath ?? '').toLowerCase();
  return language === 'jsx' || language === 'tsx' || path.endsWith('.jsx') || path.endsWith('.tsx');
}
function rangeForSpan(sourceText, span) {
  if (!span?.startLine || !span?.startColumn) return undefined;
  return { start: offsetForLineColumn(sourceText, span.startLine, span.startColumn), end: offsetForLineColumn(sourceText, span.endLine ?? span.startLine, span.endColumn ?? span.startColumn) };
}
function offsetForLineColumn(sourceText, line, column) {
  const lines = String(sourceText ?? '').split(/\n/);
  let offset = 0;
  for (let index = 0; index < Math.max(0, line - 1); index += 1) offset += lines[index].length + 1;
  return offset + Math.max(0, column - 1);
}
function sourceSpanForRange(context, start, end) {
  const startPos = lineColumnForOffset(context.sourceText, start);
  const endPos = lineColumnForOffset(context.sourceText, end);
  return { sourceId: context.sourceHash, path: context.sourcePath, start, end, startLine: startPos.line, startColumn: startPos.column, endLine: endPos.line, endColumn: endPos.column };
}
function nativeImportSourceText(imported) {
  return imported?.metadata?.sourcePreservation?.sourceText ?? imported?.nativeSource?.metadata?.sourcePreservation?.sourceText ?? imported?.nativeAst?.metadata?.sourcePreservation?.sourceText ?? imported?.universalAst?.metadata?.sourcePreservation?.sourceText ?? imported?.sourceText;
}
function semanticSpanForHash(span) { return { path: span.path, start: span.start, end: span.end, startLine: span.startLine, startColumn: span.startColumn, endLine: span.endLine, endColumn: span.endColumn }; }
function normalizedAttrText(text) { return String(text ?? '').trim().replace(/\s+/g, ' '); }
function normalizedSpreadExpressionText(attribute) { return String(attribute?.expressionText ?? '').trim().replace(/\s+/g, ' '); }
function propKind(attribute) { return isJsxSpreadAttribute(attribute) ? 'spread' : 'named'; }
function spreadExpressionHash(attribute) {
  return isJsxSpreadAttribute(attribute)
    ? hashSemanticValue({ kind: 'frontier.lang.projectJsxSpreadExpression', text: normalizedSpreadExpressionText(attribute) })
    : undefined;
}
function jsxKeyProp(tag) {
  const attribute = tag.attributes.find((candidate) => candidate.name === 'key');
  if (!attribute) return undefined;
  const parsed = literalJsxKeyValue(attribute.text);
  return compactRecord({
    name: 'key',
    value: parsed?.value,
    text: normalizedAttrText(attribute.text),
    hash: hashSemanticValue({
      kind: 'frontier.lang.projectJsxKeyProp',
      text: normalizedAttrText(attribute.text),
      value: parsed?.value
    })
  });
}
function literalJsxKeyValue(text) {
  const match = /^key\s*=\s*(?:"([^"]*)"|'([^']*)')\s*$/.exec(String(text ?? '').trim());
  return match ? { value: match[1] ?? match[2] ?? '' } : undefined;
}
function jsxFragmentKind(tagName) {
  const value = String(tagName ?? '');
  if (value === 'Fragment') return 'fragment';
  if (value === 'React.Fragment') return 'react-fragment';
  return undefined;
}
function plainComponentTagName(tagName) { return /^[A-Z][A-Za-z0-9_$]*$/.test(String(tagName ?? '')) ? String(tagName) : undefined; }
function memberComponentTagName(tagName) { return /^[A-Z][A-Za-z0-9_$]*(?:\.[A-Z][A-Za-z0-9_$]*)+$/.test(String(tagName ?? '')) ? String(tagName) : undefined; }
function publicKey(sourcePath, name) { return sourcePath && name ? `${sourcePath}\0${name}` : undefined; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }
function uniqueRecords(records) {
  const seen = new Set();
  return records.filter((record) => {
    const key = record.id ?? JSON.stringify(record);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
export { createProjectJsxGraphRecords };
