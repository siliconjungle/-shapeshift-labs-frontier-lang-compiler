import { idFragment } from '../../native-import-utils.js';
import { rustStatementSpan } from './semanticResourceGraphRustSourceSpans.js';

export function appendRustBorrowBinding(output, bundle, record, context, bindings, statement, borrowed) {
  const target = bindings.get(borrowed.name);
  const idPart = `${context.recordId}_${idFragment(statement.name)}`;
  const ownerId = `owner_rust_borrow_${idPart}`;
  const lifetimeRegionId = `lifetime_rust_borrow_${idPart}`;
  const resourceId = target?.resourceId ?? `resource_rust_borrowed_place_${context.recordId}_${idFragment(borrowed.name)}`;
  const span = rustStatementSpan(statement, bundle, record);
  output.owners.push({ id: ownerId, name: statement.name, ownerKind: 'rust-borrow-binding', sourcePath: bundle.sourcePath, sourceHash: bundle.sourceHash, sourceSpan: span, evidenceIds: context.evidenceIds });
  if (!target) output.resources.push(unresolvedBorrowResource(resourceId, borrowed, bundle, record, context, span));
  output.lifetimeRegions.push(rustBorrowLifetime(lifetimeRegionId, statement.name, statement, bundle, record, context));
  output.loans.push({
    id: `loan_rust_local_${borrowed.mode}_${idPart}`,
    resourceId,
    ownerId,
    lifetimeRegionId,
    mode: borrowed.mode,
    sourcePath: bundle.sourcePath,
    sourceHash: bundle.sourceHash,
    sourceSpan: span,
    evidenceIds: context.evidenceIds,
    metadata: { rustKey: record.key, statementText: statement.text, borrowedBinding: borrowed.name, evidenceKind: 'rust-lexical-borrow' }
  });
  output.borrowScopes.push(rustBorrowScope(resourceId, lifetimeRegionId, borrowed, statement, bundle, record, context, span, idPart));
  bindings.set(statement.name, {
    name: statement.name,
    resourceId,
    ownerId,
    lifetimeRegionId,
    loanId: `loan_rust_local_${borrowed.mode}_${idPart}`,
    bindingKind: 'borrow',
    borrowedBinding: borrowed.name
  });
}

export function rustBorrowInitializer(initializer) {
  const match = String(initializer ?? '').match(/^&\s*(mut\s+)?([A-Za-z_][A-Za-z0-9_]*)\b/);
  return match ? { mode: match[1] ? 'mutable' : 'shared', name: match[2] } : undefined;
}

function unresolvedBorrowResource(resourceId, borrowed, bundle, record, context, span) {
  return {
    id: resourceId,
    name: borrowed.name,
    resourceKind: 'rust-borrowed-place',
    ownerId: context.ownerId,
    sourcePath: bundle.sourcePath,
    sourceHash: bundle.sourceHash,
    sourceSpan: span,
    evidenceIds: context.evidenceIds,
    metadata: { rustKey: record.key, unresolvedBorrowTarget: true }
  };
}

function rustBorrowScope(resourceId, lifetimeRegionId, borrowed, statement, bundle, record, context, span, idPart) {
  return {
    id: `borrow_scope_rust_local_${borrowed.mode}_${idPart}`,
    scopeKind: 'rust-local-borrow-scope',
    constraintKinds: rustBorrowCompatibilityKinds(borrowed.mode),
    ownershipKind: borrowed.mode === 'mutable' ? 'exclusive-borrow' : 'shared-borrow',
    lifetimeKind: 'loan-region-binding',
    controlFlowKind: 'linear',
    lifetimeRegionId,
    resourceId,
    sourcePath: bundle.sourcePath,
    sourceHash: bundle.sourceHash,
    sourceSpan: span,
    evidenceIds: context.evidenceIds,
    metadata: { rustKey: record.key, statementText: statement.text, borrowedBinding: borrowed.name, borrowMode: borrowed.mode, evidenceKind: 'rust-local-borrow-compatibility-obligation' }
  };
}

function rustBorrowCompatibilityKinds(mode) {
  return mode === 'mutable'
    ? ['loan-scope-boundary', 'exclusive-borrow-alias-exclusion', 'exclusive-borrow-loan-exclusion']
    : ['loan-scope-boundary', 'shared-borrow-compatible'];
}

function rustBorrowLifetime(id, name, statement, bundle, record, context) {
  return {
    id,
    name: `${name} lexical lifetime`,
    lifetimeKind: 'rust-borrow-scope',
    sourcePath: bundle.sourcePath,
    sourceHash: bundle.sourceHash,
    sourceSpan: record.bodySpan ?? rustStatementSpan(statement, bundle, record),
    startLine: statement.line,
    endLine: record.bodySpan?.endLine,
    evidenceIds: context.evidenceIds
  };
}
