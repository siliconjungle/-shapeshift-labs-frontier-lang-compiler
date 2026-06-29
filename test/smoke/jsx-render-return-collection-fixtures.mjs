import { jsxRenderReturnCollectionDelta } from '../../src/js-ts-safe-project-merge-jsx-render-collection-proof.js';

function sourceBoundCollectionProof(identityKey, records, itemOrigins) {
  const expected = jsxRenderReturnCollectionDelta({
    identityKey,
    baseRecord: records.base,
    workerRecord: records.worker,
    headRecord: records.head,
    outputRecord: records.output
  });
  return {
    schema: 'frontier.lang.jsxRenderReturnCollectionProof.v1',
    kind: 'frontier.lang.jsxRenderReturnCollectionProof',
    status: 'passed',
    sourcePath: expected.sourcePath,
    identityKey,
    baseSourceHash: expected.baseSourceHash,
    workerSourceHash: expected.workerSourceHash,
    headSourceHash: expected.headSourceHash,
    outputSourceHash: expected.outputSourceHash,
    publicOwnerName: expected.publicOwnerName,
    tagName: expected.tagName,
    tagKey: expected.tagKey,
    returnOrdinal: expected.returnOrdinal,
    returnKind: expected.returnKind,
    collectionKind: expected.collectionKind,
    items: itemOrigins.map((origin, index) => ({
      ordinal: index + 1,
      origin,
      itemHash: expected[origin].itemHashes[index],
      outputItemHash: expected.output.itemHashes[index]
    })),
    outputKeyedListHash: expected.output.keyedListHash,
    collectionItemPreservationHash: expected.collectionItemPreservationHash,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    renderEquivalenceClaim: false,
    collectionItemPreservationClaim: true,
    claimScope: 'static-render-return-collection-item-preservation-only'
  };
}

function collectionRisk(stage, itemHashes, options = {}) {
  const missingOrdinals = new Set(options.missingKeyOrdinals ?? []);
  const ambiguousOrdinals = new Set(options.ambiguousKeyOrdinals ?? []);
  const itemRecords = itemHashes.map((itemHash, index) => {
    const ordinal = index + 1;
    const keyValue = options.duplicateKeys ? 'a' : index === 0 ? 'a' : 'b';
    const missingKey = missingOrdinals.has(ordinal);
    const ambiguousKey = ambiguousOrdinals.has(ordinal);
    return {
      ordinal,
      proofStatus: 'static-render-return-collection-item-evidence',
      expressionText: missingKey ? `<li>${itemHash}</li>` : ambiguousKey ? `<li key={dynamicKey}>${itemHash}</li>` : `<li key="${keyValue}">${itemHash}</li>`,
      expressionHash: `expression:${itemHash}`,
      keyPropText: missingKey ? undefined : ambiguousKey ? 'key={dynamicKey}' : `key="${keyValue}"`,
      keyExpressionText: ambiguousKey ? 'dynamicKey' : undefined,
      keyValue: missingKey || ambiguousKey ? undefined : keyValue,
      keyStatic: missingKey ? undefined : !ambiguousKey,
      signatureHash: itemHash
    };
  });
  const keyedListRecord = keyedListRecordFor(stage, itemHashes, itemRecords, options);
  const collectionRecord = {
    proofStatus: 'static-render-return-array-evidence',
    reasonCode: 'jsx-render-return-array-static-evidence',
    collectionKind: 'array-literal',
    itemExpressionTexts: itemRecords.map((item) => item.expressionText),
    itemRecords,
    itemCount: itemRecords.length,
    keyedListRecord,
    signatureHash: `collection:${stage}:${itemHashes.join('|')}`
  };
  const renderReturnRecord = {
    ordinal: 1,
    proofStatus: 'static-render-return-evidence',
    returnKind: 'return-statement',
    branchControlKind: 'return-statement',
    expressionText: `[${collectionRecord.itemExpressionTexts.join(', ')}]`,
    expressionHash: `collection-expression:${stage}:${itemHashes.join('|')}`,
    collectionRecord,
    signatureHash: `render-return:${stage}:${itemHashes.join('|')}`
  };
  return {
    id: `jsx_render_collection_${stage}`,
    sourcePath: 'src/list.tsx',
    tagName: 'li',
    tagKey: 'li#1',
    publicContract: true,
    publicOwnerName: 'ListView',
    renderRiskKinds: ['render-return-boundary'],
    renderRiskReasonCodes: [
      'jsx-render-return-static-evidence',
      'jsx-render-return-array-static-evidence',
      keyedListRecord.reasonCode
    ],
    renderReturnRecords: [renderReturnRecord],
    renderReturnCount: 1,
    renderReturnSignatureHash: `render-returns:${stage}:${itemHashes.join('|')}`,
    renderRiskSignatureHash: `render-risk:collection:${stage}:${itemHashes.join('|')}:${keyedListRecord.reasonCode}`,
    sourceHash: `source:${stage}`
  };
}

function keyedListRecordFor(stage, itemHashes, itemRecords, options) {
  const missingKeyOrdinals = options.missingKeyOrdinals ?? [];
  const ambiguousKeyOrdinals = options.ambiguousKeyOrdinals ?? [];
  const duplicateKeyValues = options.duplicateKeys ? ['a'] : [];
  const proofStatus = missingKeyOrdinals.length
    ? 'static-render-return-keyed-list-missing-key-unsupported'
    : ambiguousKeyOrdinals.length
      ? 'static-render-return-keyed-list-ambiguous-key-unsupported'
      : duplicateKeyValues.length
        ? 'static-render-return-keyed-list-duplicate-key-unsupported'
        : 'static-render-return-keyed-list-evidence';
  const reasonCode = missingKeyOrdinals.length
    ? 'jsx-render-return-keyed-list-missing-keys-unsupported'
    : ambiguousKeyOrdinals.length
      ? 'jsx-render-return-keyed-list-ambiguous-keys-unsupported'
      : duplicateKeyValues.length
        ? 'jsx-render-return-keyed-list-duplicate-keys-unsupported'
        : 'jsx-render-return-keyed-list-static-evidence';
  return {
    proofStatus,
    reasonCode,
    claimScope: 'static-list-key-identity-only',
    renderEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    keyCount: itemRecords.length,
    keyRecords: itemRecords.map((item) => ({
      ordinal: item.ordinal,
      keyPropText: item.keyPropText,
      keyExpressionText: item.keyExpressionText,
      keyValue: item.keyValue,
      keyStatic: item.keyStatic
    })),
    keyValues: itemRecords.every((item) => item.keyValue !== undefined) ? itemRecords.map((item) => item.keyValue) : undefined,
    missingKeyOrdinals: missingKeyOrdinals.length ? missingKeyOrdinals : undefined,
    ambiguousKeyOrdinals: ambiguousKeyOrdinals.length ? ambiguousKeyOrdinals : undefined,
    duplicateKeyValues: duplicateKeyValues.length ? duplicateKeyValues : undefined,
    duplicateKeyOrdinals: duplicateKeyValues.length ? [1, 2] : undefined,
    signatureHash: `keyed-list:${stage}:${itemHashes.join('|')}:${reasonCode}`
  };
}

function withDynamicEventHandlerFactoryRisk(record, stage) {
  const propName = 'onClick';
  const expressionText = '{makeHandler(theme)}';
  return {
    ...record,
    renderRiskKinds: [...record.renderRiskKinds, 'event-handler-prop-boundary'],
    renderRiskReasonCodes: [...record.renderRiskReasonCodes, 'jsx-render-event-handler-prop-unsupported', 'jsx-render-event-handler-prop-call-expression-unsupported'],
    eventHandlerPropNames: [propName],
    eventHandlerPropRecords: [{
      propName,
      ordinal: 1,
      propKind: 'named',
      proofStatus: 'dynamic-event-handler-unsupported',
      dynamicExpressionText: expressionText,
      dynamicExpressionKind: 'call-expression',
      dynamicBlockerReasonCode: 'jsx-render-event-handler-prop-call-expression-unsupported',
      expressionHash: `event-handler-expression:${stage}:${expressionText}`,
      signatureHash: `event-handler:${stage}:${propName}:${expressionText}`
    }],
    eventHandlerPropCount: 1,
    eventHandlerSignatureHash: `event-handlers:${stage}:${propName}:${expressionText}`,
    renderRiskSignatureHash: `${record.renderRiskSignatureHash}:event-handler-factory`
  };
}

export { collectionRisk, sourceBoundCollectionProof, withDynamicEventHandlerFactoryRisk };
