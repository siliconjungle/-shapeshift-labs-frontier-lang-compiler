import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import {
  compactRecord,
  constArrayLiteralBinding,
  directJsxChildren,
  isJsxExpression,
  jsxKeyEvidence,
  mapKeyResolution,
  normalizedReturnExpression,
  splitTopLevel,
  staticMapCall,
  staticMapCallback,
  staticMapSourceItemRecord
} from './projectSymbolGraphJsxRenderReturnCollectionHelpers.js';

function jsxRenderReturnCollectionRecord(expressionText, sourceText) {
  const value = normalizedReturnExpression(expressionText);
  return arrayLiteralCollectionRecord(value)
    ?? fragmentCollectionRecord(value)
    ?? staticConstArrayMapCollectionRecord(value, sourceText);
}

function arrayLiteralCollectionRecord(expressionText) {
  if (!expressionText.startsWith('[') || !expressionText.endsWith(']')) return undefined;
  const itemExpressionTexts = splitTopLevel(expressionText.slice(1, -1), ',').map(normalizedReturnExpression).filter(Boolean);
  if (!itemExpressionTexts.length || itemExpressionTexts.some((item) => !isJsxExpression(item))) return undefined;
  return jsxCollectionRecord({
    proofStatus: 'static-render-return-array-evidence',
    reasonCode: 'jsx-render-return-array-static-evidence',
    collectionKind: 'array-literal',
    itemExpressionTexts,
    itemRecords: collectionItemRecords('array-literal', itemExpressionTexts)
  });
}

function fragmentCollectionRecord(expressionText) {
  if (expressionText.startsWith('<>') && expressionText.endsWith('</>')) {
    const itemExpressionTexts = directJsxChildren(expressionText.slice(2, -3));
    if (!itemExpressionTexts.length) return undefined;
    return jsxCollectionRecord({
      proofStatus: 'static-render-return-fragment-evidence',
      reasonCode: 'jsx-render-return-fragment-static-evidence',
      collectionKind: 'fragment-shorthand',
      itemExpressionTexts,
      itemRecords: collectionItemRecords('fragment-shorthand', itemExpressionTexts)
    });
  }
  const named = /^<((?:React\.)?Fragment)\b[^>]*>([\s\S]*)<\/\1>$/.exec(expressionText);
  if (!named) return undefined;
  const itemExpressionTexts = directJsxChildren(named[2]);
  if (!itemExpressionTexts.length) return undefined;
  const collectionKind = named[1] === 'React.Fragment' ? 'fragment-react' : 'fragment-named';
  return jsxCollectionRecord({
    proofStatus: 'static-render-return-fragment-evidence',
    reasonCode: 'jsx-render-return-fragment-static-evidence',
    collectionKind,
    itemExpressionTexts,
    itemRecords: collectionItemRecords(collectionKind, itemExpressionTexts)
  });
}

function staticConstArrayMapCollectionRecord(expressionText, sourceText) {
  const mapCall = staticMapCall(expressionText);
  if (!mapCall) return undefined;
  const arrayBinding = constArrayLiteralBinding(sourceText, mapCall.arrayName);
  if (!arrayBinding) return undefined;
  const callback = staticMapCallback(mapCall.callbackText);
  if (!callback || !isJsxExpression(callback.bodyExpressionText)) return undefined;
  const sourceItemExpressionTexts = splitTopLevel(arrayBinding.arrayLiteralText.slice(1, -1), ',').map(normalizedReturnExpression).filter(Boolean);
  if (!sourceItemExpressionTexts.length) return undefined;
  const sourceItemRecords = sourceItemExpressionTexts.map(staticMapSourceItemRecord);
  if (sourceItemRecords.some((record) => !record)) return undefined;
  const keyEvidence = jsxKeyEvidence(callback.bodyExpressionText);
  const itemExpressionTexts = sourceItemExpressionTexts.map(() => callback.bodyExpressionText);
  const itemRecords = sourceItemExpressionTexts.map((sourceItemExpressionText, index) => staticConstArrayMapItemRecord({
    callback,
    index,
    keyEvidence,
    sourceItem: sourceItemRecords[index],
    sourceItemExpressionText
  }));
  return jsxCollectionRecord({
    proofStatus: 'static-render-return-map-evidence',
    reasonCode: 'jsx-render-return-static-const-array-map-evidence',
    collectionKind: 'static-const-array-map',
    claimScope: 'static-const-array-map-structure-only',
    renderEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    sourceArrayName: mapCall.arrayName,
    sourceArrayItemCount: sourceItemExpressionTexts.length,
    sourceItemExpressionTexts,
    mapCallbackExpressionText: callback.callbackText,
    mapParameterName: callback.parameterName,
    mapIndexParameterName: callback.indexParameterName,
    callbackExpressionText: callback.bodyExpressionText,
    itemExpressionTexts,
    itemRecords
  });
}

function staticConstArrayMapItemRecord(input) {
  const { callback, index, keyEvidence, sourceItem, sourceItemExpressionText } = input;
  const keyResolution = mapKeyResolution(keyEvidence, callback.parameterName, sourceItem.props);
  return compactRecord({
    ordinal: index + 1,
    proofStatus: 'static-render-return-map-item-evidence',
    expressionText: callback.bodyExpressionText,
    expressionHash: hashSemanticValue({ kind: 'frontier.lang.projectJsxRenderReturnMapItemExpression', text: callback.bodyExpressionText }),
    sourceItemExpressionText,
    sourceItemExpressionHash: hashSemanticValue({ kind: 'frontier.lang.projectJsxRenderReturnMapSourceItem', text: sourceItemExpressionText }),
    sourceItemKind: sourceItem.kind,
    keyPropText: keyEvidence?.keyPropText,
    keyExpressionText: keyEvidence?.keyExpressionText,
    keyValue: keyResolution?.keyValue,
    keySourcePropName: keyResolution?.keySourcePropName,
    keyStatic: keyResolution?.keyStatic,
    signatureHash: hashSemanticValue({
      kind: 'frontier.lang.projectJsxRenderReturnMapItem',
      ordinal: index + 1,
      expressionText: callback.bodyExpressionText,
      sourceItemExpressionText,
      sourceItemKind: sourceItem.kind,
      keyPropText: keyEvidence?.keyPropText,
      keyExpressionText: keyEvidence?.keyExpressionText,
      keyValue: keyResolution?.keyValue,
      keySourcePropName: keyResolution?.keySourcePropName
    })
  });
}

function jsxCollectionRecord(record) {
  const itemRecords = record.itemRecords ?? [];
  const keyedListRecord = keyedListRecordFor(record.collectionKind, itemRecords);
  return compactRecord({
    ...record,
    itemCount: itemRecords.length,
    keyedListRecord,
    signatureHash: hashSemanticValue({
      kind: 'frontier.lang.projectJsxRenderReturnCollection',
      proofStatus: record.proofStatus,
      collectionKind: record.collectionKind,
      sourceArrayName: record.sourceArrayName,
      sourceItemExpressionTexts: record.sourceItemExpressionTexts,
      mapCallbackExpressionText: record.mapCallbackExpressionText,
      itemExpressionTexts: record.itemExpressionTexts,
      itemRecords,
      keyedListSignatureHash: keyedListRecord?.signatureHash,
      claimScope: record.claimScope,
      renderEquivalenceClaim: record.renderEquivalenceClaim,
      runtimeEquivalenceClaim: record.runtimeEquivalenceClaim
    })
  });
}

function collectionItemRecords(collectionKind, itemExpressionTexts) {
  return itemExpressionTexts.map((itemExpressionText, index) => {
    const key = jsxKeyEvidence(itemExpressionText);
    return compactRecord({
      ordinal: index + 1,
      proofStatus: 'static-render-return-collection-item-evidence',
      expressionText: itemExpressionText,
      expressionHash: hashSemanticValue({ kind: 'frontier.lang.projectJsxRenderReturnCollectionItemExpression', text: itemExpressionText }),
      keyPropText: key?.keyPropText,
      keyExpressionText: key?.keyExpressionText,
      keyValue: key?.keyValue,
      keyStatic: key ? key.keyValue !== undefined : undefined,
      signatureHash: hashSemanticValue({
        kind: 'frontier.lang.projectJsxRenderReturnCollectionItem',
        collectionKind,
        ordinal: index + 1,
        expressionText: itemExpressionText,
        keyPropText: key?.keyPropText,
        keyExpressionText: key?.keyExpressionText,
        keyValue: key?.keyValue
      })
    });
  });
}

function keyedListRecordFor(collectionKind, itemRecords) {
  if (!itemRecords.length || itemRecords.some((record) => record.keyStatic === false || (!record.keyPropText && !record.keyExpressionText && record.keyValue === undefined))) return undefined;
  const keyRecords = itemRecords.map((record) => compactRecord({
    ordinal: record.ordinal,
    keyPropText: record.keyPropText,
    keyExpressionText: record.keyExpressionText,
    keyValue: record.keyValue,
    keySourcePropName: record.keySourcePropName,
    keyStatic: record.keyStatic
  }));
  return compactRecord({
    proofStatus: 'static-render-return-keyed-list-evidence',
    reasonCode: 'jsx-render-return-keyed-list-static-evidence',
    claimScope: 'static-list-key-identity-only',
    renderEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    keyCount: keyRecords.length,
    keyRecords,
    keyValues: keyRecords.every((record) => record.keyValue !== undefined) ? keyRecords.map((record) => record.keyValue) : undefined,
    signatureHash: hashSemanticValue({
      kind: 'frontier.lang.projectJsxRenderReturnKeyedList',
      collectionKind,
      keyRecords,
      claimScope: 'static-list-key-identity-only',
      renderEquivalenceClaim: false,
      runtimeEquivalenceClaim: false
    })
  });
}

export { jsxRenderReturnCollectionRecord };
