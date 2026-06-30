import { idFragment } from '../../native-import-utils.js';
import { rustBindingOwnershipSemantics } from './semanticResourceGraphRustOwnershipSemantics.js';

export function appendRustValueParameterOwnership(output, bundle, record, context, bindings, signature) {
  for (const [index, parameter] of rustValueParameters(signature).entries()) {
    const idPart = `${context.recordId}_${idFragment(parameter.name ?? `param_${index + 1}`)}`;
    const resourceId = `resource_rust_owned_param_${idPart}`;
    const ownerId = `owner_rust_owned_param_${idPart}`;
    const lifetimeRegionId = `lifetime_rust_owned_param_${idPart}`;
    const sourceSpan = record.sourceSpan;
    const semantics = rustBindingOwnershipSemantics({ typeText: parameter.typeText });
    output.resources.push({
      id: resourceId,
      name: parameter.name,
      resourceKind: semantics.copySemantics ? 'rust-copy-value-parameter' : 'rust-owned-value-parameter',
      ownerId,
      sourcePath: bundle.sourcePath,
      sourceHash: bundle.sourceHash,
      sourceSpan,
      evidenceIds: context.evidenceIds,
      metadata: { rustKey: record.key, parameterText: parameter.text, typeText: parameter.typeText, ...semantics }
    });
    output.owners.push({
      id: ownerId,
      name: parameter.name,
      ownerKind: 'rust-owned-value-parameter',
      sourcePath: bundle.sourcePath,
      sourceHash: bundle.sourceHash,
      sourceSpan,
      evidenceIds: context.evidenceIds
    });
    output.lifetimeRegions.push({
      id: lifetimeRegionId,
      name: `${parameter.name} parameter lexical lifetime`,
      lifetimeKind: 'rust-parameter-lexical-scope',
      sourcePath: bundle.sourcePath,
      sourceHash: bundle.sourceHash,
      sourceSpan,
      evidenceIds: context.evidenceIds
    });
    if (semantics.dropSemantics) output.drops.push(lexicalDrop(resourceId, ownerId, lifetimeRegionId, 'rust-parameter-lexical-drop', bundle, record, context, sourceSpan, parameter.text, { dropSemantics: semantics.dropSemantics }));
    bindings.set(parameter.name, { name: parameter.name, resourceId, ownerId, lifetimeRegionId, bindingKind: 'owned-parameter', typeText: parameter.typeText, ...semantics });
  }
}

export function appendRustMoveTransferEvidence(output, bundle, record, context, bindings, bodyInfo) {
  const transfers = rustMoveTransfers(bodyInfo.text, bodyInfo.span, bindings);
  for (const [index, transfer] of transfers.entries()) {
    const binding = bindings.get(transfer.name);
    if (!binding || binding.transferred || !movableBinding(binding)) continue;
    const toOwnerId = `owner_rust_${transfer.kind}_${idFragment(context.recordId)}_${index + 1}_${idFragment(transfer.name)}`;
    const span = rustBodySpan(transfer, bodyInfo, bundle);
    output.owners.push({
      id: toOwnerId,
      name: transfer.ownerName,
      ownerKind: transfer.ownerKind,
      sourcePath: bundle.sourcePath,
      sourceHash: bundle.sourceHash,
      sourceSpan: span,
      evidenceIds: context.evidenceIds
    });
    output.moves.push({
      id: `move_rust_${transfer.kind}_${idFragment(context.recordId)}_${idFragment(transfer.name)}_${index + 1}`,
      resourceId: binding.resourceId,
      fromOwnerId: binding.ownerId,
      toOwnerId,
      moveKind: transfer.moveKind,
      sourcePath: bundle.sourcePath,
      sourceHash: bundle.sourceHash,
      sourceSpan: span,
      evidenceIds: context.evidenceIds,
      metadata: {
        rustKey: record.key,
        statementText: transfer.text,
        movedBinding: transfer.name,
        evidenceKind: 'rust-ownership-transfer',
        note: 'Source-derived ownership transfer evidence does not prove Copy, Drop, or borrow-checker behavior.'
      }
    });
    removeLexicalDrops(output, binding);
    bindings.set(transfer.name, { ...binding, ownerId: toOwnerId, transferred: true, transferKind: transfer.moveKind });
  }
}

function rustValueParameters(signature) {
  return rustParameterTexts(signature).flatMap((text, index) => {
    if (!text || /&|\*/.test(text)) return [];
    if (text === '&self' || text === '&mut self') return [];
    const selfMode = text === 'self' || text === 'mut self';
    const match = selfMode ? undefined : text.match(/^(?:mut\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.+)$/s);
    const name = selfMode ? 'self' : match?.[1];
    if (!name) return [];
    return [{ text, name, typeText: selfMode ? 'Self' : match?.[2]?.trim(), index }];
  });
}

function rustMoveTransfers(body, bodySpan, bindings) {
  return [
    ...rustCallArgumentTransfers(body, bodySpan, bindings),
    ...rustReturnTransfers(body, bodySpan, bindings),
    ...rustTailExpressionTransfers(body, bodySpan, bindings)
  ].sort((left, right) => left.offset - right.offset);
}

function rustCallArgumentTransfers(body, bodySpan, bindings) {
  const transfers = [];
  const regex = /(^|[;\n])\s*([A-Za-z_][A-Za-z0-9_:]*)\s*\(([^;{}]*)\)\s*;/g;
  let match;
  while ((match = regex.exec(body))) {
    const callee = match[2];
    if (callee === 'drop') continue;
    const args = splitArgs(match[3]);
    for (const arg of args) {
      const name = movedArgumentName(arg);
      if (!name || !bindings.has(name)) continue;
      transfers.push(transfer('call_arg', 'rust-call-argument-move', name, `${callee}(...)`, 'rust-call-argument-transfer', match, bodySpan));
    }
  }
  return transfers;
}

function rustReturnTransfers(body, bodySpan, bindings) {
  const transfers = [];
  const regex = /(^|[;\n])\s*return\s+([A-Za-z_][A-Za-z0-9_]*)\s*;/g;
  let match;
  while ((match = regex.exec(body))) {
    if (bindings.has(match[2])) transfers.push(transfer('return', 'rust-return-move', match[2], 'return', 'rust-return-transfer', match, bodySpan));
  }
  return transfers;
}

function rustTailExpressionTransfers(body, bodySpan, bindings) {
  const match = body.trimEnd().match(/(?:^|[;\n])\s*([A-Za-z_][A-Za-z0-9_]*)\s*$/);
  if (!match || !bindings.has(match[1])) return [];
  const offset = body.lastIndexOf(match[1]);
  return [{
    kind: 'return',
    moveKind: 'rust-return-move',
    name: match[1],
    ownerName: 'return',
    ownerKind: 'rust-return-transfer',
    offset,
    text: match[0].trim(),
    line: lineAt(body, offset) + (bodySpan?.startLine ?? 1) - 1
  }];
}

function transfer(kind, moveKind, name, ownerName, ownerKind, match, bodySpan) {
  return {
    kind,
    moveKind,
    name,
    ownerName,
    ownerKind,
    offset: match.index + match[1].length,
    text: match[0].slice(match[1].length).trim(),
    line: lineAt(match.input, match.index) + (bodySpan?.startLine ?? 1) - 1
  };
}

function movedArgumentName(text) {
  const value = text.trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) return undefined;
  if (['true', 'false', 'None', 'Some', 'Ok', 'Err'].includes(value)) return undefined;
  return value;
}

function movableBinding(binding = {}) {
  if (binding.copySemantics) return false;
  if (['owned-parameter', 'moved-local'].includes(binding.bindingKind)) return true;
  const typeText = String(binding.typeText ?? '');
  const initializerText = String(binding.initializerText ?? '');
  return /(?:String|Vec|Box|Rc|Arc|HashMap|HashSet|BTreeMap|BTreeSet|PathBuf|Buffer)\b/.test(typeText)
    || /\b(?:String|Vec|Box|Rc|Arc|HashMap|HashSet|BTreeMap|BTreeSet|PathBuf|Buffer)::/.test(initializerText);
}

function splitArgs(text) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < text.length; index += 1) {
    if ('([{<'.includes(text[index])) depth += 1;
    else if (')}]>'.includes(text[index])) depth = Math.max(0, depth - 1);
    else if (text[index] === ',' && depth === 0) {
      parts.push(text.slice(start, index));
      start = index + 1;
    }
  }
  return [...parts, text.slice(start)].map((part) => part.trim()).filter(Boolean);
}

function rustParameterTexts(signature) {
  const match = String(signature ?? '').match(/\(([^)]*)\)/s);
  return match ? splitArgs(match[1]) : [];
}

function removeLexicalDrops(output, binding) {
  output.drops = output.drops.filter((drop) => !(drop.resourceId === binding.resourceId && drop.ownerId === binding.ownerId && String(drop.dropKind ?? '').includes('lexical-drop')));
}

function lexicalDrop(resourceId, ownerId, lifetimeRegionId, dropKind, bundle, record, context, sourceSpan, text, metadata = {}) {
  return {
    id: `drop_${dropKind}_${idFragment(resourceId)}_${idFragment(ownerId)}`,
    resourceId,
    ownerId,
    lifetimeRegionId,
    dropKind,
    sourcePath: bundle.sourcePath,
    sourceHash: bundle.sourceHash,
    sourceSpan,
    evidenceIds: context.evidenceIds,
    metadata: { rustKey: record.key, statementText: text, ...metadata }
  };
}

function rustBodySpan(statement, bodyInfo, bundle) {
  const startOffset = (bodyInfo.span?.startOffset ?? 0) + statement.offset;
  return {
    path: bundle.sourcePath,
    startOffset,
    endOffset: startOffset + statement.text.length,
    startLine: statement.line,
    endLine: statement.line
  };
}

function lineAt(text, offset) {
  return text.slice(0, offset).split('\n').length;
}
