import { idFragment } from '../../native-import-utils.js';
import { appendRustBorrowEscapes } from './semanticResourceGraphRustBorrowEscapes.js';

export function appendRustLocalOwnership(output, bundle, record, context) {
  if (!['fn', 'method'].includes(record.kind) || !bundle.sourceText) return;
  const bodyInfo = rustRecordBody(bundle.sourceText, record);
  const body = bodyInfo.text;
  if (!body) return;
  const bindings = new Map();
  for (const statement of rustLetStatements(body, bodyInfo.span)) {
    appendRustLetStatement(output, bundle, record, context, bindings, statement);
  }
  for (const statement of rustExplicitDropStatements(body, bodyInfo.span)) {
    const binding = bindings.get(statement.name);
    if (!binding) continue;
    output.drops.push({
      id: `drop_rust_explicit_${idFragment(context.recordId)}_${idFragment(statement.name)}_${statement.index}`,
      resourceId: binding.resourceId,
      ownerId: binding.ownerId,
      lifetimeRegionId: binding.lifetimeRegionId,
      dropKind: 'rust-explicit-drop',
      sourcePath: bundle.sourcePath,
      sourceHash: bundle.sourceHash,
      sourceSpan: rustStatementSpan(statement, bundle, record),
      evidenceIds: context.evidenceIds,
      metadata: { rustKey: record.key, statementText: statement.text }
    });
  }
  appendRustBorrowEscapes(output, bundle, record, context, bindings, body);
}

function appendRustLetStatement(output, bundle, record, context, bindings, statement) {
  const init = statement.initializer.trim();
  const borrowed = rustBorrowInitializer(init);
  if (borrowed) {
    appendRustBorrowBinding(output, bundle, record, context, bindings, statement, borrowed);
    return;
  }
  const movedFrom = rustMovedBinding(init, bindings);
  if (movedFrom) {
    appendRustMoveBinding(output, bundle, record, context, bindings, statement, movedFrom);
    return;
  }
  appendRustOwnedBinding(output, bundle, record, context, bindings, statement);
}

function appendRustBorrowBinding(output, bundle, record, context, bindings, statement, borrowed) {
  const target = bindings.get(borrowed.name);
  const idPart = `${context.recordId}_${idFragment(statement.name)}`;
  const ownerId = `owner_rust_borrow_${idPart}`;
  const lifetimeRegionId = `lifetime_rust_borrow_${idPart}`;
  const resourceId = target?.resourceId ?? `resource_rust_borrowed_place_${context.recordId}_${idFragment(borrowed.name)}`;
  output.owners.push({
    id: ownerId,
    name: statement.name,
    ownerKind: 'rust-borrow-binding',
    sourcePath: bundle.sourcePath,
    sourceHash: bundle.sourceHash,
    sourceSpan: rustStatementSpan(statement, bundle, record),
    evidenceIds: context.evidenceIds
  });
  if (!target) {
    output.resources.push({
      id: resourceId,
      name: borrowed.name,
      resourceKind: 'rust-borrowed-place',
      ownerId: context.ownerId,
      sourcePath: bundle.sourcePath,
      sourceHash: bundle.sourceHash,
      sourceSpan: rustStatementSpan(statement, bundle, record),
      evidenceIds: context.evidenceIds,
      metadata: { rustKey: record.key, unresolvedBorrowTarget: true }
    });
  }
  output.lifetimeRegions.push(rustBindingLifetime(lifetimeRegionId, statement.name, 'rust-borrow-scope', statement, bundle, record, context));
  output.loans.push({
    id: `loan_rust_local_${borrowed.mode}_${idPart}`,
    resourceId,
    ownerId,
    lifetimeRegionId,
    mode: borrowed.mode,
    sourcePath: bundle.sourcePath,
    sourceHash: bundle.sourceHash,
    sourceSpan: rustStatementSpan(statement, bundle, record),
    evidenceIds: context.evidenceIds,
    metadata: {
      rustKey: record.key,
      statementText: statement.text,
      borrowedBinding: borrowed.name,
      evidenceKind: 'rust-lexical-borrow'
    }
  });
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

function appendRustMoveBinding(output, bundle, record, context, bindings, statement, movedFrom) {
  const idPart = `${context.recordId}_${idFragment(statement.name)}`;
  const ownerId = `owner_rust_binding_${idPart}`;
  const lifetimeRegionId = `lifetime_rust_binding_${idPart}`;
  output.drops = output.drops.filter((drop) => !(
    drop.resourceId === movedFrom.resourceId
    && drop.ownerId === movedFrom.ownerId
    && drop.dropKind === 'rust-lexical-drop'
  ));
  output.owners.push({
    id: ownerId,
    name: statement.name,
    ownerKind: 'rust-local-binding',
    sourcePath: bundle.sourcePath,
    sourceHash: bundle.sourceHash,
    sourceSpan: rustStatementSpan(statement, bundle, record),
    evidenceIds: context.evidenceIds
  });
  output.lifetimeRegions.push(rustBindingLifetime(lifetimeRegionId, statement.name, 'rust-lexical-scope', statement, bundle, record, context));
  output.moves.push({
    id: `move_rust_local_${idFragment(context.recordId)}_${idFragment(movedFrom.name)}_${idFragment(statement.name)}`,
    resourceId: movedFrom.resourceId,
    fromOwnerId: movedFrom.ownerId,
    toOwnerId: ownerId,
    sourcePath: bundle.sourcePath,
    sourceHash: bundle.sourceHash,
    sourceSpan: rustStatementSpan(statement, bundle, record),
    evidenceIds: context.evidenceIds,
    metadata: {
      rustKey: record.key,
      statementText: statement.text,
      fromBinding: movedFrom.name,
      toBinding: statement.name,
      evidenceKind: 'rust-lexical-possible-move',
      note: 'Lexical move evidence is source-derived and does not prove Copy or borrow-checker behavior.'
    }
  });
  output.drops.push(rustLexicalDrop(movedFrom.resourceId, ownerId, lifetimeRegionId, statement, bundle, record, context, 'rust-lexical-drop-after-move'));
  bindings.set(statement.name, { name: statement.name, resourceId: movedFrom.resourceId, ownerId, lifetimeRegionId, bindingKind: 'moved-local' });
}

function appendRustOwnedBinding(output, bundle, record, context, bindings, statement) {
  const idPart = `${context.recordId}_${idFragment(statement.name)}`;
  const resourceId = `resource_rust_local_${idPart}`;
  const ownerId = `owner_rust_binding_${idPart}`;
  const lifetimeRegionId = `lifetime_rust_binding_${idPart}`;
  const span = rustStatementSpan(statement, bundle, record);
  output.resources.push({
    id: resourceId,
    name: statement.name,
    resourceKind: 'rust-owned-local-binding',
    ownerId,
    sourcePath: bundle.sourcePath,
    sourceHash: bundle.sourceHash,
    sourceSpan: span,
    evidenceIds: context.evidenceIds,
    metadata: {
      rustKey: record.key,
      statementText: statement.text,
      initializerText: statement.initializer,
      typeText: statement.typeText,
      mutable: statement.mutable
    }
  });
  output.owners.push({
    id: ownerId,
    name: statement.name,
    ownerKind: 'rust-local-binding',
    sourcePath: bundle.sourcePath,
    sourceHash: bundle.sourceHash,
    sourceSpan: span,
    evidenceIds: context.evidenceIds
  });
  output.lifetimeRegions.push(rustBindingLifetime(lifetimeRegionId, statement.name, 'rust-lexical-scope', statement, bundle, record, context));
  output.drops.push(rustLexicalDrop(resourceId, ownerId, lifetimeRegionId, statement, bundle, record, context, 'rust-lexical-drop'));
  bindings.set(statement.name, { name: statement.name, resourceId, ownerId, lifetimeRegionId, bindingKind: 'owned-local' });
}

function rustRecordBody(sourceText, record) {
  const start = record.bodySpan?.startOffset;
  const end = record.bodySpan?.endOffset;
  if (typeof start === 'number' && typeof end === 'number' && end > start) {
    return { text: sourceText.slice(start, end), span: record.bodySpan };
  }
  const fallback = fallbackBodySpan(sourceText, record);
  return fallback ? { text: sourceText.slice(fallback.startOffset, fallback.endOffset), span: fallback } : { text: '', span: record.bodySpan };
}

function rustLetStatements(body, bodySpan = {}) {
  const statements = [];
  const regex = /(^|[\n;])\s*let\s+(mut\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*(?::\s*([^=;]+?))?\s*=\s*([^;]+);/g;
  let match;
  while ((match = regex.exec(body))) {
    statements.push({
      index: statements.length,
      offset: match.index + match[1].length,
      bodyStartOffset: bodySpan.startOffset ?? 0,
      line: rustLineAt(body, match.index) + (bodySpan.startLine ?? 1) - 1,
      text: match[0].slice(match[1].length).trim(),
      mutable: Boolean(match[2]),
      name: match[3],
      typeText: match[4]?.trim(),
      initializer: match[5].trim()
    });
  }
  return statements;
}

function rustExplicitDropStatements(body, bodySpan = {}) {
  const statements = [];
  const regex = /(^|[\n;])\s*drop\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)\s*;/g;
  let match;
  while ((match = regex.exec(body))) {
    statements.push({
      index: statements.length,
      offset: match.index + match[1].length,
      bodyStartOffset: bodySpan.startOffset ?? 0,
      line: rustLineAt(body, match.index) + (bodySpan.startLine ?? 1) - 1,
      text: match[0].slice(match[1].length).trim(),
      name: match[2]
    });
  }
  return statements;
}

function rustBorrowInitializer(initializer) {
  const match = initializer.match(/^&\s*(mut\s+)?([A-Za-z_][A-Za-z0-9_]*)\b/);
  if (!match) return undefined;
  return { mode: match[1] ? 'mutable' : 'shared', name: match[2] };
}

function rustMovedBinding(initializer, bindings) {
  const match = initializer.match(/^([A-Za-z_][A-Za-z0-9_]*)$/);
  if (!match) return undefined;
  const binding = bindings.get(match[1]);
  return binding ? { ...binding, name: match[1] } : undefined;
}

function rustBindingLifetime(id, name, lifetimeKind, statement, bundle, record, context) {
  return {
    id,
    name: `${name} lexical lifetime`,
    lifetimeKind,
    sourcePath: bundle.sourcePath,
    sourceHash: bundle.sourceHash,
    sourceSpan: record.bodySpan ?? rustStatementSpan(statement, bundle, record),
    startLine: statement.line,
    endLine: record.bodySpan?.endLine,
    evidenceIds: context.evidenceIds
  };
}

function rustLexicalDrop(resourceId, ownerId, lifetimeRegionId, statement, bundle, record, context, dropKind) {
  return {
    id: `drop_${dropKind}_${idFragment(resourceId)}_${idFragment(ownerId)}`,
    resourceId,
    ownerId,
    lifetimeRegionId,
    dropKind,
    sourcePath: bundle.sourcePath,
    sourceHash: bundle.sourceHash,
    sourceSpan: rustStatementSpan(statement, bundle, record),
    evidenceIds: context.evidenceIds,
    metadata: { rustKey: record.key, statementText: statement.text }
  };
}

function rustStatementSpan(statement, bundle, record) {
  const startOffset = (statement.bodyStartOffset ?? record.bodySpan?.startOffset ?? 0) + statement.offset;
  return {
    path: bundle.sourcePath,
    startOffset,
    endOffset: startOffset + statement.text.length,
    startLine: statement.line,
    endLine: statement.line
  };
}

function rustLineAt(text, offset) {
  return text.slice(0, offset).split('\n').length;
}

function fallbackBodySpan(sourceText, record) {
  const searchStart = record.sourceSpan?.startOffset ?? 0;
  const open = sourceText.indexOf('{', searchStart);
  if (open < 0) return undefined;
  let depth = 0;
  for (let index = open; index < sourceText.length; index += 1) {
    if (sourceText[index] === '{') depth += 1;
    else if (sourceText[index] === '}') {
      depth -= 1;
      if (depth === 0) {
        return {
          path: record.sourceSpan?.path,
          startOffset: open + 1,
          endOffset: index,
          startLine: rustLineAt(sourceText, open),
          endLine: rustLineAt(sourceText, index)
        };
      }
    }
  }
  return undefined;
}
