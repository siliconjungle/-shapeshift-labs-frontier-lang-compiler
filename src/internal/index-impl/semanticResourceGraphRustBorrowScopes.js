import { idFragment, uniqueStrings } from '../../native-import-utils.js';

export function appendRustBorrowScopes(output, bundle, record, context, signature) {
  if (!['fn', 'method'].includes(record.kind)) return;
  const body = rustRecordBody(bundle.sourceText ?? '', record);
  const flow = rustFlowFacts(signature, body);
  for (const [index, parameter] of rustReferenceParameters(signature).entries()) {
    const idPart = `${context.recordId}_${idFragment(parameter.name ?? `param_${index + 1}`)}`;
    const constraintKinds = uniqueStrings([
      'loan-scope-boundary',
      ...(flow.hasAwait && flow.isAsync ? ['borrow-across-await'] : []),
      ...(parameter.mode === 'mutable' && flow.hasBranch ? ['exclusive-borrow-branch-join'] : []),
      ...(parameter.returned && (flow.hasExit || flow.hasAwait) ? ['no-escape-flow'] : [])
    ]);
    output.borrowScopes.push({
      id: `borrow_scope_rust_param_${idPart}`,
      scopeKind: 'rust-reference-parameter-scope',
      constraintKinds,
      ownershipKind: parameter.mode === 'mutable' ? 'exclusive-borrow' : 'shared-borrow',
      lifetimeKind: parameter.lifetimeName ? 'loan-region-binding' : 'loan-scope-boundary',
      controlFlowKind: rustControlFlowKind(flow),
      sourceControlFlowId: `rust_flow_${idFragment(context.recordId)}`,
      lifetimeRegionId: `lifetime_rust_param_${idPart}`,
      resourceId: `resource_rust_param_${idPart}`,
      sourcePath: bundle.sourcePath,
      sourceHash: bundle.sourceHash,
      sourceSpan: record.sourceSpan,
      evidenceIds: context.evidenceIds,
      metadata: {
        rustKey: record.key,
        parameterText: parameter.text,
        lifetimeName: parameter.lifetimeName,
        asyncFunction: flow.isAsync,
        hasAwait: flow.hasAwait,
        hasBranch: flow.hasBranch,
        hasExit: flow.hasExit,
        evidenceKind: 'rust-borrow-scope-obligation'
      }
    });
  }
  appendFunctionFlowScope(output, bundle, record, context, flow, body);
}

function appendFunctionFlowScope(output, bundle, record, context, flow, body) {
  const constraintKinds = uniqueStrings([
    ...(flow.hasExit && /\bdrop\s*\(/.test(body) ? ['drop-cleanup-order'] : []),
    ...(flow.hasExit && rustPossibleMove(body) ? ['move-invalidates-exit'] : [])
  ]);
  if (!constraintKinds.length) return;
  output.borrowScopes.push({
    id: `borrow_scope_rust_flow_${idFragment(context.recordId)}`,
    scopeKind: 'rust-function-exit-scope',
    constraintKinds,
    ownershipKind: constraintKinds.includes('move-invalidates-exit') ? 'move-invalidates-source' : 'drop-order',
    controlFlowKind: rustControlFlowKind(flow),
    sourceControlFlowId: `rust_flow_${idFragment(context.recordId)}`,
    sourcePath: bundle.sourcePath,
    sourceHash: bundle.sourceHash,
    sourceSpan: record.sourceSpan,
    evidenceIds: context.evidenceIds,
    metadata: {
      rustKey: record.key,
      asyncFunction: flow.isAsync,
      hasAwait: flow.hasAwait,
      hasBranch: flow.hasBranch,
      hasExit: flow.hasExit,
      evidenceKind: 'rust-function-flow-borrow-scope-obligation'
    }
  });
}

function rustReferenceParameters(signature) {
  const returnedLifetime = rustReturnLifetime(signature);
  return rustParameterTexts(signature).flatMap((text, index) => {
    if (!/&/.test(text)) return [];
    const lifetimeName = explicitReferenceLifetime(text);
    return [{
      text,
      name: rustParameterName(text) ?? `param_${index + 1}`,
      mode: /&\s*(?:'[^ ]+\s+)?mut\b/.test(text) ? 'mutable' : 'shared',
      lifetimeName,
      returned: Boolean(lifetimeName && returnedLifetime === lifetimeName)
    }];
  });
}

function rustFlowFacts(signature, body) {
  return {
    isAsync: /\basync\s+(?:unsafe\s+)?fn\b/.test(signature),
    hasAwait: /\.await\b/.test(body),
    hasBranch: /\b(if|match|while|for|loop)\b/.test(body),
    hasExit: /\breturn\b|\?/.test(body)
  };
}

function rustControlFlowKind(flow) {
  return uniqueStrings([
    ...(flow.isAsync || flow.hasAwait ? ['async-await'] : []),
    ...(flow.hasBranch ? ['branch'] : []),
    ...(flow.hasExit ? ['early-return'] : [])
  ]).join('+') || 'linear';
}

function rustRecordBody(sourceText, record) {
  const start = record.bodySpan?.startOffset;
  const end = record.bodySpan?.endOffset;
  if (typeof start === 'number' && typeof end === 'number' && end > start) return sourceText.slice(start, end);
  const open = sourceText.indexOf('{', record.sourceSpan?.startOffset ?? 0);
  if (open < 0) return '';
  let depth = 0;
  for (let index = open; index < sourceText.length; index += 1) {
    if (sourceText[index] === '{') depth += 1;
    else if (sourceText[index] === '}') {
      depth -= 1;
      if (depth === 0) return sourceText.slice(open + 1, index);
    }
  }
  return '';
}

function rustPossibleMove(body) {
  return /\blet\s+(?:mut\s+)?[A-Za-z_][A-Za-z0-9_]*\s*=\s*[A-Za-z_][A-Za-z0-9_]*\s*;/.test(body);
}

function rustReturnLifetime(signature) {
  const match = String(signature ?? '').match(/->\s*&\s*'([A-Za-z_][A-Za-z0-9_]*)\b/s);
  return match ? `'${match[1]}` : undefined;
}

function explicitReferenceLifetime(text) {
  const match = String(text ?? '').match(/&\s*'([A-Za-z_][A-Za-z0-9_]*)\b/);
  return match ? `'${match[1]}` : undefined;
}

function rustParameterTexts(signature) {
  const match = String(signature ?? '').match(/\(([^)]*)\)/s);
  return match ? match[1].split(',').map((part) => part.trim()).filter(Boolean) : [];
}

function rustParameterName(text) {
  if (text === 'self' || text === '&self' || text === '&mut self') return 'self';
  const match = String(text ?? '').match(/^(?:mut\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*:/);
  return match?.[1];
}
