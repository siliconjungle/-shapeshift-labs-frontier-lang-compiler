function publicOwnerRanges(context, sourcePath, sourceText) {
  return (context.sourceTextsByPath.has(sourcePath) ? context.sourceTextsByPath : new Map([[sourcePath, sourceText]]))
    && (context.publicOwnerRangesByPath?.get(sourcePath) ?? publicOwnerRangesFromKeys(context.publicKeys, sourcePath, sourceText));
}

function publicOwnerRangesFromKeys(publicKeys, sourcePath, sourceText) {
  return [...publicKeys]
    .map((key) => publicKeyParts(key))
    .filter((parts) => parts?.sourcePath === sourcePath)
    .map((parts) => ({ name: parts.name, range: rangeForNamedDeclaration(sourceText, parts.name) }))
    .filter((owner) => owner.range);
}

function nearestPublicOwnerForOffset(publicOwners, offset) {
  return (publicOwners ?? [])
    .filter((owner) => owner.range.start <= offset && offset <= owner.range.end)
    .sort((left, right) => right.range.start - left.range.start || left.range.end - right.range.end)[0];
}

function nearestLexicalPublicOwner(publicOwners, binding) {
  if (binding.depth === 0) return undefined;
  return publicOwners.filter((owner) => owner.start < binding.start && owner.depth < binding.depth)
    .sort((left, right) => right.start - left.start)[0];
}

function rangeForNamedDeclaration(sourceText, name) {
  if (!sourceText || !name) return undefined;
  const escaped = escapeRegExp(name);
  const declaration = new RegExp(`\\b(?:export\\s+)?(?:async\\s+)?(?:function|class|interface|type|enum|namespace|module)\\s+${escaped}\\b`, 'm').exec(sourceText);
  if (declaration) return declarationRange(sourceText, declaration.index);
  const variable = new RegExp(`\\b(?:export\\s+)?(?:const|let|var)\\s+${escaped}\\b`, 'm').exec(sourceText);
  return variable ? declarationRange(sourceText, variable.index) : undefined;
}

function declarationRange(sourceText, start) {
  const nextTopLevel = /\n(?:export\s+)?(?:async\s+)?(?:function|class|interface|type|enum|namespace|module|const|let|var)\s+[A-Za-z_$][\w$]*/g;
  nextTopLevel.lastIndex = start + 1;
  const next = nextTopLevel.exec(sourceText);
  return { start, end: next ? next.index : sourceText.length };
}

function publicKeyParts(key) {
  const separator = String(key).indexOf('\0');
  if (separator <= 0) return undefined;
  return { sourcePath: String(key).slice(0, separator), name: String(key).slice(separator + 1) };
}

function escapeRegExp(value) { return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

export { nearestLexicalPublicOwner, nearestPublicOwnerForOffset, publicOwnerRanges };
