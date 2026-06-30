import { idFragment } from '../../native-import-utils.js';

export function appendCppMoveSemantics(output, bundle, fn, bindings) {
  const declarations = cppMoveDeclarations(fn.bodyText);
  for (const [index, move] of declarations.entries()) appendCppMove(output, bundle, fn, bindings, move, index);
  const calls = cppMoveCallArguments(fn.bodyText);
  for (const [index, move] of calls.entries()) appendCppMove(output, bundle, fn, bindings, move, index + declarations.length);
  const returns = cppMoveReturns(fn.bodyText);
  for (const [index, move] of returns.entries()) appendCppMove(output, bundle, fn, bindings, move, index + declarations.length + calls.length);
}

export function cppMoveDestinationDrop(base, pointerKind, fn) {
  return {
    id: `drop_cpp_moved_${base.idPart}`,
    resourceId: base.resourceId,
    ownerId: base.ownerId,
    lifetimeRegionId: base.lifetimeRegionId,
    dropKind: `cpp-${pointerKind}-moved-destination-destructor`,
    sourcePath: base.sourcePath,
    sourceHash: base.sourceHash,
    sourceSpan: base.sourceSpan,
    evidenceIds: base.evidenceIds,
    metadata: {
      automatic: true,
      pointerKind,
      functionName: fn.name,
      dropSemantics: 'cpp-smart-pointer-destructor'
    }
  };
}

function appendCppMove(output, bundle, fn, bindings, move, index) {
  const source = bindings.get(move.sourceName);
  if (!source || source.pointerKind !== 'unique_ptr') return;
  const base = cppMoveBase(bundle, fn, move, index, source);
  output.owners.push({
    id: base.ownerId,
    name: move.targetName ?? move.ownerName,
    ownerKind: move.ownerKind,
    sourcePath: bundle.sourcePath,
    sourceHash: bundle.sourceHash,
    sourceSpan: fn.span,
    evidenceIds: base.evidenceIds
  });
  output.moves.push({
    id: `move_cpp_${move.kind}_${base.idPart}`,
    resourceId: source.resourceId,
    fromOwnerId: source.ownerId,
    toOwnerId: base.ownerId,
    moveKind: move.moveKind,
    sourcePath: bundle.sourcePath,
    sourceHash: bundle.sourceHash,
    sourceSpan: fn.span,
    evidenceIds: base.evidenceIds,
    metadata: {
      functionName: fn.name,
      pointerKind: source.pointerKind,
      pointeeType: source.pointeeType,
      movedBinding: move.sourceName,
      targetBinding: move.targetName,
      invalidatesSource: true,
      evidenceKind: 'cpp-unique-ptr-std-move'
    }
  });
  if (move.targetName) {
    bindings.set(move.targetName, { ...source, name: move.targetName, ownerId: base.ownerId, bindingKind: 'cpp-moved-unique-ptr' });
    output.drops.push(cppMoveDestinationDrop({ ...base, resourceId: source.resourceId, lifetimeRegionId: source.lifetimeRegionId }, source.pointerKind, fn));
  }
  bindings.set(move.sourceName, { ...source, movedFrom: true, movedToOwnerId: base.ownerId });
}

function cppMoveBase(bundle, fn, move, index, source) {
  const fnId = idFragment(`${bundle.sourcePath ?? 'cpp'}:${fn.name}:${fn.startLine}`);
  const idPart = `${fnId}_${idFragment(move.sourceName)}_${idFragment(move.kind)}_${index + 1}`;
  return {
    idPart,
    ownerId: `owner_cpp_${move.kind}_${idPart}`,
    resourceId: source.resourceId,
    lifetimeRegionId: source.lifetimeRegionId,
    sourcePath: bundle.sourcePath,
    sourceHash: bundle.sourceHash,
    sourceSpan: fn.span,
    evidenceIds: [`cpp-source:${bundle.sourceHash ?? fnId}`, ...bundle.evidenceIds]
  };
}

function cppMoveDeclarations(bodyText) {
  return [...String(bodyText).matchAll(/\b(?:auto|std::unique_ptr\s*<[^;=]+>)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*std::move\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)\s*;/g)]
    .map((match) => ({
      kind: 'declaration',
      moveKind: 'cpp-unique-ptr-std-move',
      targetName: match[1],
      sourceName: match[2],
      ownerKind: 'cpp-unique-ptr-move-destination',
      ownerName: match[1]
    }));
}

function cppMoveCallArguments(bodyText) {
  const records = [];
  for (const match of String(bodyText).matchAll(/\b([A-Za-z_][A-Za-z0-9_:]*)\s*\(([^;{}]*std::move\s*\([^;{}]+?[^;{}]*)\)\s*;/g)) {
    const callee = match[1];
    for (const arg of match[2].matchAll(/std::move\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)/g)) {
      records.push({ kind: 'call_argument', moveKind: 'cpp-call-argument-ownership-transfer', sourceName: arg[1], ownerKind: 'cpp-call-argument-transfer', ownerName: `${callee}(...)` });
    }
  }
  return records;
}

function cppMoveReturns(bodyText) {
  return [...String(bodyText).matchAll(/\breturn\s+std::move\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)\s*;/g)]
    .map((match) => ({ kind: 'return', moveKind: 'cpp-return-ownership-transfer', sourceName: match[1], ownerKind: 'cpp-return-transfer', ownerName: 'return' }));
}
