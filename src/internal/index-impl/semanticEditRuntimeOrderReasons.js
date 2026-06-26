import { uniqueStrings } from '../../native-import-utils.js';
import { effectTargetContextReasonCodes } from '../../semantic-import-runtime-effect-target-evidence.js'; import { mutationTargetContextReasonCodes } from '../../semantic-import-runtime-mutation-evidence.js';
import { promiseCombinatorContextReasonCodes } from '../../semantic-import-runtime-promise-combinator-evidence.js';
import { promiseChainContextReasonCodes } from '../../semantic-import-runtime-promise-chain-evidence.js';
import { nativeImportSourceText } from './nativeImportSourceText.js';
import { runtimeOrderEvidenceBinding } from './runtimeOrderEvidenceBinding.js';
import { sourceTextForSpan } from './sourceTextForSpan.js';
const runtimeOrderSensitiveRegionKinds = new Set(['call', 'controlFlow', 'effect', 'mutation']);

export function orderSensitiveHeadPeerConflict(input) {
  if (!isRuntimeOrderSensitiveRegion(input.region, input.baseSymbol)) return undefined;
  const explicitEvidence = runtimeOrderEvidenceBinding(input);
  if (explicitEvidence.passed) return undefined;
  const sameAnchor = sameAnchorRuntimeOrderConflict(input);
  if (sameAnchor) {
    return {
      peer: sameAnchor.region,
      reasonCodes: uniqueStrings([
        'head-runtime-order-evidence-changed-since-base',
        'runtime-order-sensitive-merge-requires-explicit-evidence',
        ...explicitEvidence.reasonCodes,
        ...runtimeOrderReasonCodes(input),
        ...runtimeOrderReasonCodes({ ...input, region: sameAnchor.region })
      ]),
      evidenceIds: explicitEvidence.evidenceIds
    };
  }
  const peer = (input.context.headChangeSet?.changedRegions ?? [])
    .find((region) => orderSensitivePeerChanged(input.region, region, input.context));
  if (!peer) return undefined;
  return {
    peer,
    reasonCodes: uniqueStrings([
      'head-order-sensitive-peer-changed-since-base',
      'runtime-order-sensitive-merge-requires-explicit-evidence',
      ...explicitEvidence.reasonCodes,
      ...runtimeOrderReasonCodes(input),
      ...runtimeOrderReasonCodes({ ...input, region: peer })
    ]),
    evidenceIds: explicitEvidence.evidenceIds
  };
}

export function runtimeOrderReasonCodes(input) {
  const regionKind = runtimeRegionKind(input.region, input.baseSymbol);
  if (regionKind === 'call') return uniqueStrings([...callsiteOrderReasonCodes(input), ...runtimeOrderContextReasonCodes(input)]);
  if (regionKind === 'controlFlow') return uniqueStrings([...controlFlowOrderReasonCodes(input), ...runtimeOrderContextReasonCodes(input)]);
  if (regionKind === 'effect') return uniqueStrings([...effectOrderReasonCodes(input), ...runtimeOrderContextReasonCodes(input)]);
  if (regionKind === 'mutation') return uniqueStrings([...mutationOrderReasonCodes(input), ...runtimeOrderContextReasonCodes(input)]);
  return [];
}

export function templateLiteralBlockReasonCodes(input) {
  const kinds = regionFactKinds(input.region);
  if (!kinds.includes('tagged-template') && !kinds.includes('template-interpolation')) return [];
  return uniqueStrings([
    'template-literal-merge-requires-template-evidence',
    ...(kinds.includes('tagged-template') ? ['tagged-template-merge-requires-tag-effect-evidence'] : []),
    ...(kinds.includes('template-interpolation') ? ['template-interpolation-merge-requires-expression-order-evidence'] : []),
    ...effectOrderReasonCodes(input), ...runtimeOrderContextReasonCodes(input)
  ]);
}

function orderSensitivePeerChanged(workerRegion, headRegion, context) {
  if (!isRuntimeOrderSensitiveRegion(headRegion)) return false;
  if ((headRegion.conflictKey ?? headRegion.key) === (workerRegion.conflictKey ?? workerRegion.key)) return false;
  if (!sameRegionSourcePath(workerRegion, headRegion)) return false;
  if (!headRegionHasCoherentTextChange(headRegion, context)) return false;
  const workerOwner = runtimeRegionOwner(workerRegion);
  const headOwner = runtimeRegionOwner(headRegion);
  return Boolean(workerOwner && headOwner && workerOwner === headOwner);
}

function sameAnchorRuntimeOrderConflict(input) {
  const key = input.region?.key ?? stripRegionPrefix(input.region?.conflictKey);
  if (!key) return undefined;
  const changedSymbol = (input.context.headChangeSet?.changedSymbols ?? [])
    .find((symbol) => symbolRuntimeOrderSignatureChangedForKey(symbol, key));
  if (!changedSymbol) return undefined;
  const region = (input.context.headChangeSet?.changedRegions ?? [])
    .find((candidate) => (candidate.key ?? stripRegionPrefix(candidate.conflictKey)) === key)
    ?? input.region;
  if (!runtimeOrderContextReasonCodes(input).length && !runtimeOrderContextReasonCodes({ ...input, region }).length) return undefined;
  return { region, changedSymbol };
}

function symbolRuntimeOrderSignatureChangedForKey(symbol, key) {
  if (![symbol?.beforeOwnershipKey, symbol?.afterOwnershipKey, symbol?.ownershipKey].includes(key)) return false;
  if ((symbol.beforeSignatureHash ?? '') === (symbol.afterSignatureHash ?? '')) return false;
  if (symbol.beforeSpanHash && symbol.afterSpanHash && symbol.beforeSpanHash !== symbol.afterSpanHash) return false;
  return true;
}

function stripRegionPrefix(value) {
  const text = String(value ?? '');
  return text.startsWith('region:') ? text.slice('region:'.length) : text || undefined;
}

function headRegionHasCoherentTextChange(region, context) {
  const projection = region?.metadata?.changedRegionProjection;
  const beforeSpan = projection?.before?.sourceSpan;
  const afterSpan = projection?.after?.sourceSpan;
  if (!beforeSpan || !afterSpan) return true;

  const beforeHash = projection?.before?.sourceHash ?? context?.base?.nativeSource?.hash;
  const afterHash = projection?.after?.sourceHash ?? context?.head?.nativeSource?.hash;
  if (beforeSpan.sourceId && beforeHash && beforeSpan.sourceId !== beforeHash) return false;
  if (afterSpan.sourceId && afterHash && afterSpan.sourceId !== afterHash) return false;

  const beforeText = sourceTextForSpan(nativeImportSourceText(context?.base), beforeSpan);
  const afterText = sourceTextForSpan(nativeImportSourceText(context?.head), afterSpan);
  if (typeof beforeText === 'string' && typeof afterText === 'string') return beforeText !== afterText;
  return true;
}

function callsiteOrderReasonCodes(input) {
  if (!stableCalleeCallsite(input)) return ['callsite-merge-requires-call-order-evidence'];
  return [
    'callsite-argument-merge-requires-callee-signature-evidence',
    'callsite-argument-merge-requires-argument-effect-evidence',
    'callsite-argument-merge-requires-argument-order-evidence'
  ];
}

function controlFlowOrderReasonCodes(input) {
  return uniqueStrings([
    'control-flow-merge-requires-control-order-evidence',
    ...regionFactKinds(input.region).flatMap((kind) => {
      if (kind === 'branch') return ['control-flow-branch-merge-requires-condition-order-evidence'];
      if (kind === 'loop') return ['control-flow-loop-merge-requires-iteration-order-evidence'];
      if (kind === 'exit') return ['control-flow-exit-merge-requires-return-yield-order-evidence'];
      if (kind === 'transfer') return ['control-flow-transfer-merge-requires-break-continue-order-evidence'];
      if (kind === 'exception') return ['control-flow-exception-merge-requires-throw-order-evidence'];
      if (kind === 'async') return ['control-flow-async-merge-requires-await-order-evidence'];
      return [];
    })
  ]);
}

function effectOrderReasonCodes(input) {
  return uniqueStrings([
    'effect-merge-requires-side-effect-evidence',
    'effect-merge-requires-effect-order-evidence',
    ...regionFactKinds(input.region).flatMap((kind) => {
      if (kind === 'async') return ['effect-async-merge-requires-await-order-evidence'];
      if (kind === 'network') return ['effect-network-merge-requires-io-order-evidence'];
      if (kind === 'storage') return ['effect-storage-merge-requires-storage-order-evidence'];
      if (kind === 'scheduler') return ['effect-scheduler-merge-requires-scheduler-order-evidence']; if (kind === 'class-static-block') return ['effect-class-static-block-merge-requires-static-initialization-order-evidence'];
      if (kind === 'host-context') return ['effect-import-meta-merge-requires-host-context-evidence'];
      if (kind === 'host') return ['effect-host-merge-requires-host-order-evidence'];
      if (kind === 'browser') return ['effect-browser-merge-requires-browser-order-evidence'];
      if (kind === 'getter') return ['effect-getter-merge-requires-getter-order-evidence'];
      if (kind === 'generator') return ['effect-generator-merge-requires-yield-order-evidence'];
      if (kind === 'resource-management' || kind === 'using' || kind === 'await-using') return ['effect-resource-management-merge-requires-acquisition-disposal-evidence'];
      if (kind === 'template-literal') return ['effect-template-literal-merge-requires-template-token-evidence'];
      if (kind === 'template-interpolation') return ['effect-template-interpolation-merge-requires-expression-order-evidence'];
      if (kind === 'tagged-template') return ['effect-tagged-template-merge-requires-tag-effect-evidence'];
      return [];
    })
  ]);
}

function mutationOrderReasonCodes(input) {
  return uniqueStrings([
    'mutation-merge-requires-write-order-evidence',
    ...regionFactKinds(input.region).flatMap((kind) => {
      if (kind === 'assignment') return ['mutation-assignment-merge-requires-assignment-order-evidence'];
      if (kind === 'update') return ['mutation-update-merge-requires-update-order-evidence'];
      if (kind === 'delete') return ['mutation-delete-merge-requires-delete-order-evidence'];
      if (kind === 'mutating-call') return ['mutation-call-merge-requires-call-order-evidence'];
      return [];
    })
  ]);
}

function runtimeOrderContextReasonCodes(input) {
  const evidence = runtimeOrderEvidence(input.region);
  return uniqueStrings([
    ...array(evidence?.branchOrder).flatMap(controlFlowContextReasonCodes),
    ...array(evidence?.loopOrder).flatMap(controlFlowContextReasonCodes),
    ...array(evidence?.sameLineControlFlow).flatMap(controlFlowContextReasonCodes),
    ...array(evidence?.loopIterationOrder).flatMap(loopIterationContextReasonCodes),
    ...array(evidence?.controlTransferOrder).flatMap(controlTransferContextReasonCodes),
    ...array(evidence?.exitOrder).flatMap(exitContextReasonCodes),
    ...array(evidence?.reachabilityOrder).flatMap(reachabilityContextReasonCodes),
    ...(array(evidence?.sameLineShortCircuit).length ? ['runtime-order-short-circuit-merge-requires-expression-order-evidence'] : []),
    ...(array(evidence?.importMetaHostContext).length ? ['runtime-order-import-meta-merge-requires-host-context-evidence'] : []), ...(array(evidence?.classStaticBlockOrder).length ? ['runtime-order-class-static-block-merge-requires-static-initialization-evidence'] : []),
    ...(evidence?.sameLineAwait || array(evidence?.sameLineAwaitOrder).length
      ? ['runtime-order-await-merge-requires-suspension-order-evidence']
      : []),
    ...(array(evidence?.sameLineOptionalChain).length
      ? ['runtime-order-optional-chain-merge-requires-nullish-boundary-evidence']
      : []),
    ...(array(evidence?.sameLineConditionalExpression).length
      ? ['runtime-order-conditional-expression-merge-requires-branch-selection-evidence']
      : []),
    ...array(evidence?.sameLinePromiseCombinator).flatMap(promiseCombinatorContextReasonCodes),
    ...array(evidence?.sameLinePromiseChain).flatMap(promiseChainContextReasonCodes),
    ...(array(evidence?.sameLineThrowOrder).length || evidence?.sameLineThrow
      ? ['runtime-order-throw-merge-requires-exception-path-evidence']
      : []),
    ...array(evidence?.switchDispatchOrder).flatMap(switchDispatchContextReasonCodes),
    ...array(evidence?.tryCatchOrder).flatMap(tryCatchContextReasonCodes),
    ...array(evidence?.mutationTargetOrder).flatMap(mutationTargetContextReasonCodes), ...array(evidence?.effectTargetOrder).flatMap(effectTargetContextReasonCodes),
    ...array(evidence?.tryFinallyOrder).flatMap(tryFinallyContextReasonCodes),
    ...array(evidence?.resourceManagementOrder).flatMap(resourceManagementContextReasonCodes)
  ]);
}

function runtimeOrderEvidence(region) { return region?.metadata?.runtimeOrderEvidence ?? region?.runtimeOrderEvidence; }
function exitContextReasonCodes(record) { return uniqueStrings(['runtime-order-exit-merge-requires-completion-value-evidence', record?.delegated ? 'runtime-order-yield-star-merge-requires-iterator-delegation-evidence' : undefined, record?.iteratorProtocolEquivalenceClaim === false ? 'runtime-order-yield-star-iterator-protocol-equivalence-not-proven' : undefined, record?.delegatedCompletionPropagationClaim === false ? 'runtime-order-yield-star-completion-propagation-equivalence-not-proven' : undefined]); }
function controlFlowContextReasonCodes(record) { if (record?.kind === 'branch') return ['control-flow-branch-merge-requires-condition-order-evidence']; if (record?.kind === 'loop') return ['control-flow-loop-merge-requires-iteration-order-evidence']; if (record?.kind === 'exception') return ['control-flow-exception-merge-requires-throw-order-evidence']; return []; }

function loopIterationContextReasonCodes(record) {
  return uniqueStrings([
    'runtime-order-loop-iteration-merge-requires-loop-header-evidence',
    ['for-of', 'for-await-of', 'for-in'].includes(record?.loopKind)
      ? 'runtime-order-loop-iterator-merge-requires-iteration-source-evidence'
      : undefined,
    record?.loopKind === 'for' ? 'runtime-order-for-loop-merge-requires-init-condition-update-evidence' : undefined,
    record?.loopKind === 'while' || record?.loopKind === 'do'
      ? 'runtime-order-while-loop-merge-requires-condition-evidence'
      : undefined
  ]);
}

function controlTransferContextReasonCodes(record) {
  return uniqueStrings([
    'runtime-order-control-transfer-merge-requires-break-continue-evidence',
    record?.transferKind === 'break' ? 'runtime-order-break-merge-requires-loop-switch-exit-evidence' : undefined,
    record?.transferKind === 'continue' ? 'runtime-order-continue-merge-requires-next-iteration-evidence' : undefined,
    record?.labelText ? 'runtime-order-labeled-transfer-merge-requires-label-target-evidence' : undefined,
    record?.labelText ? (record?.labelTargetKind ? 'runtime-order-labeled-transfer-target-lexical-evidence' : 'runtime-order-labeled-transfer-target-unresolved-review') : undefined
  ]);
}

function reachabilityContextReasonCodes(record) {
  const kind = record?.completionKind;
  return uniqueStrings(['runtime-order-unreachable-region-merge-requires-reachability-evidence', 'runtime-order-reachability-merge-requires-completion-path-evidence', kind === 'return' ? 'runtime-order-return-reachability-merge-requires-completion-value-evidence' : undefined, kind === 'throw' ? 'runtime-order-throw-reachability-merge-requires-exception-path-evidence' : undefined, kind === 'break' ? 'runtime-order-break-reachability-merge-requires-loop-switch-exit-evidence' : undefined, kind === 'continue' ? 'runtime-order-continue-reachability-merge-requires-next-iteration-evidence' : undefined]);
}

function switchDispatchContextReasonCodes(record) {
  return uniqueStrings([
    'runtime-order-switch-dispatch-merge-requires-case-selection-evidence',
    record?.caseKind === 'case' ? 'runtime-order-switch-case-merge-requires-case-arm-evidence' : undefined,
    record?.caseKind === 'default' ? 'runtime-order-switch-default-merge-requires-default-arm-evidence' : undefined,
    record?.caseKind ? undefined : 'runtime-order-switch-merge-requires-discriminant-evidence',
    record?.fallthroughFromPrevious ? 'runtime-order-switch-fallthrough-merge-requires-prior-case-completion-evidence' : undefined
  ]);
}

function tryCatchContextReasonCodes(record) {
  return uniqueStrings([
    'runtime-order-try-catch-merge-requires-throw-catch-order-evidence',
    record?.kind === 'catch-handler' ? 'runtime-order-catch-merge-requires-handler-order-evidence' : undefined,
    record?.kind === 'try-catch' ? 'runtime-order-try-catch-merge-requires-handler-selection-evidence' : undefined
  ]);
}

function tryFinallyContextReasonCodes(record) {
  return uniqueStrings([
    'runtime-order-try-finally-merge-requires-completion-order-evidence',
    record?.kind === 'finalizer' ? 'runtime-order-finally-merge-requires-finalizer-order-evidence' : undefined,
    record?.kind === 'try-finally' && record?.enclosingLoop ? 'runtime-order-try-finally-loop-merge-requires-iteration-finalizer-order-evidence' : undefined
  ]);
}

function resourceManagementContextReasonCodes(record) { return uniqueStrings(['runtime-order-resource-management-merge-requires-disposal-order-evidence', record?.awaitUsing || record?.declarationKind === 'await-using' ? 'runtime-order-await-using-merge-requires-async-disposal-evidence' : 'runtime-order-using-merge-requires-dispose-evidence', record?.disposalEffectEquivalenceClaim === false ? 'runtime-order-resource-management-disposal-effect-equivalence-not-proven' : undefined]); }

function stableCalleeCallsite(input) {
  if (runtimeRegionKind(input.region, input.baseSymbol) !== 'call') return false;
  const baseName = input.baseSymbol?.name ?? input.region?.symbolName;
  if (!baseName) return false;
  return [input.workerSymbol?.name, input.headSymbol?.name].every((name) => name === baseName);
}

function isRuntimeOrderSensitiveRegion(region, symbol) { return runtimeOrderSensitiveRegionKinds.has(runtimeRegionKind(region, symbol)); }

function runtimeRegionKind(region, symbol) { return String(region?.regionKind ?? symbol?.ownershipRegionKind ?? ''); }

function regionFactKinds(region) {
  const regionKind = runtimeRegionKind(region);
  const signature = factSignatureFromSymbolName(region?.symbolName, regionKind);
  return uniqueStrings([
    ...array(region?.metadata?.factKinds),
    ...array(region?.metadata?.factKind),
    ...array(region?.runtimeKinds),
    ...array(region?.runtimeKind),
    ...array(signature)
  ].flatMap((kind) => String(kind ?? '').split('+')).filter(Boolean));
}

function factSignatureFromSymbolName(symbolName, regionKind) {
  const marker = `:${regionKind}:`;
  const text = String(symbolName ?? '');
  const markerIndex = text.indexOf(marker);
  if (markerIndex < 0) return undefined;
  const signature = text.slice(markerIndex + marker.length).replace(/#\d+$/, '');
  return signature || undefined;
}

function runtimeRegionOwner(region) {
  const subjectName = region?.metadata?.subjectName;
  if (subjectName) return String(subjectName);
  const symbolName = String(region?.symbolName ?? '');
  const kind = runtimeRegionKind(region);
  const marker = `:${kind}:`;
  const markerIndex = symbolName.indexOf(marker);
  if (markerIndex >= 0) return symbolName.slice(0, markerIndex);
  if (kind === 'call' && symbolName.includes('->')) return symbolName.split('->')[0];
  return '';
}

function sameRegionSourcePath(left, right) {
  const leftPath = left?.sourcePath ?? left?.sourceSpan?.path;
  const rightPath = right?.sourcePath ?? right?.sourceSpan?.path;
  return Boolean(leftPath && rightPath && leftPath === rightPath);
}

function array(value) { return value === undefined || value === null ? [] : Array.isArray(value) ? value : [value]; }
