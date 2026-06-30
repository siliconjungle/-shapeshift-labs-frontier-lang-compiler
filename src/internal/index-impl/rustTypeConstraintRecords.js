import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment, uniqueRecordsById, uniqueStrings } from '../../native-import-utils.js';

export function rustTypeConstraintRecordsFromInput(input = {}) {
  return uniqueRecordsById(rustEntries(input).flatMap((entry) => {
    const sourceText = rustSourceText(entry);
    if (!sourceText || !rustLanguage(entry)) return [];
    return rustTypeConstraintRecordsFromSource(sourceText, {
      sourcePath: rustSourcePath(entry),
      sourceHash: rustSourceHash(entry),
      evidenceIds: rustEvidenceIds(entry)
    });
  }));
}

function rustTypeConstraintRecordsFromSource(sourceText, context) {
  return rustItemSignatures(sourceText, context.sourcePath).flatMap((item, index) => {
    const bounds = rustBoundsForSignature(item.signature);
    const constraintKinds = uniqueStrings([
      ...(item.public ? ['public-contract'] : []),
      ...(item.kind === 'fn' ? ['callable-signature'] : []),
      ...(['struct', 'enum', 'trait', 'impl'].includes(item.kind) ? ['nominal-identity'] : []),
      ...(bounds.genericParameters.length ? ['generic-parameters'] : []),
      ...(bounds.traitBounds.length ? ['trait-bound'] : []),
      ...(bounds.whereClause ? ['where-clause'] : []),
      ...(bounds.lifetimeBounds.length ? ['type-lifetime-bound'] : []),
      ...(bounds.associatedTypeBindings.length ? ['associated-type-binding'] : []),
      ...(bounds.implTraits.length ? ['existential-type'] : [])
    ]);
    if (!constraintKinds.length) return [];
    const name = item.name ?? `${item.kind}_${index + 1}`;
    return [{
      id: `rust_type_constraint_${idFragment(context.sourcePath ?? 'source')}_${idFragment(name)}_${index + 1}`,
      name,
      symbolName: name,
      typeKind: `rust-${item.kind}-type-bound`,
      kind: item.public ? `public rust ${item.kind} type bound` : `rust ${item.kind} type bound`,
      publicContract: item.public,
      signatureHash: hashSemanticValue(item.signature),
      constraintKinds,
      sourcePath: context.sourcePath,
      sourceHash: context.sourceHash,
      sourceSpan: item.sourceSpan,
      evidenceIds: context.evidenceIds,
      metadata: {
        role: item.public ? 'public' : 'source',
        rustItemKind: item.kind,
        signatureText: item.signature,
        genericClause: bounds.genericClause,
        whereClause: bounds.whereClause,
        genericParameters: bounds.genericParameters,
        traitBounds: bounds.traitBounds,
        lifetimeBounds: bounds.lifetimeBounds,
        associatedTypeBindings: bounds.associatedTypeBindings,
        implTraits: bounds.implTraits,
        evidenceKind: 'rust-type-bound-obligation'
      }
    }];
  });
}

function rustItemSignatures(sourceText, sourcePath) {
  const signatures = [];
  const regex = /(^|\n)\s*((?:pub(?:\([^)]*\))?\s+)?(?:async\s+)?(?:unsafe\s+)?(?:fn|struct|enum|trait|impl)\b[\s\S]*?)(?=\{|;)/g;
  let match;
  while ((match = regex.exec(sourceText))) {
    const raw = match[2].trim();
    const kind = raw.match(/\b(fn|struct|enum|trait|impl)\b/)?.[1];
    if (!kind) continue;
    const startOffset = match.index + match[1].length + match[0].indexOf(match[2]);
    signatures.push({
      kind,
      name: rustItemName(raw, kind),
      public: /^pub(?:\([^)]*\))?\s/.test(raw),
      signature: raw,
      sourceSpan: {
        path: sourcePath,
        startOffset,
        endOffset: startOffset + raw.length,
        startLine: lineAt(sourceText, startOffset),
        endLine: lineAt(sourceText, startOffset + raw.length)
      }
    });
  }
  return signatures;
}

function rustBoundsForSignature(signature) {
  const genericClause = firstAngleClause(signature);
  const whereClause = String(signature ?? '').match(/\bwhere\b([\s\S]*)$/)?.[1]?.trim();
  const genericParts = splitTopLevel(genericClause?.slice(1, -1) ?? '');
  const whereParts = splitTopLevel(whereClause ?? '');
  const boundParts = [...genericParts, ...whereParts].map((part) => part.trim()).filter(Boolean);
  const boundPairs = boundParts.flatMap(boundPair);
  return {
    genericClause,
    whereClause,
    genericParameters: uniqueStrings(genericParts.map((part) => part.split(/[:=]/)[0]?.trim()).filter(Boolean)),
    traitBounds: uniqueStrings(boundPairs.flatMap((pair) => pair.bounds.filter((bound) => !/^'/.test(bound)))),
    lifetimeBounds: uniqueStrings(boundPairs.flatMap((pair) => pair.bounds.filter((bound) => /^'/.test(bound)).map((bound) => `${pair.subject}: ${bound}`))),
    associatedTypeBindings: uniqueStrings(boundPairs.flatMap((pair) => pair.bounds.filter((bound) => /=/.test(bound)))),
    implTraits: uniqueStrings([...String(signature ?? '').matchAll(/\bimpl\s+([^,{;)]+)/g)].map((item) => item[1].trim()))
  };
}

function boundPair(part) {
  const index = part.indexOf(':');
  if (index < 0) return [];
  return [{
    subject: part.slice(0, index).trim(),
    bounds: splitTopLevel(part.slice(index + 1), '+').map((bound) => bound.trim()).filter(Boolean)
  }];
}

function firstAngleClause(text) {
  const start = String(text ?? '').indexOf('<');
  if (start < 0) return undefined;
  let depth = 0;
  for (let index = start; index < text.length; index += 1) {
    if (text[index] === '<') depth += 1;
    else if (text[index] === '>') {
      depth -= 1;
      if (depth === 0) return text.slice(start, index + 1);
    }
  }
  return undefined;
}

function splitTopLevel(text, separator = ',') {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < text.length; index += 1) {
    if ('<([{'.includes(text[index])) depth += 1;
    else if ('>)]}'.includes(text[index])) depth = Math.max(0, depth - 1);
    else if (text[index] === separator && depth === 0) {
      parts.push(text.slice(start, index));
      start = index + 1;
    }
  }
  const tail = text.slice(start);
  return [...parts, tail].map((part) => part.trim()).filter(Boolean);
}

function rustItemName(signature, kind) {
  if (kind === 'impl') {
    const target = signature.replace(/^impl\s*(?:<[^>]*>\s*)?/, '').split(/\bwhere\b|$/)[0]?.trim();
    return target?.replace(/\s+/g, ' ');
  }
  return signature.match(new RegExp(`\\b${kind}\\s+([A-Za-z_][A-Za-z0-9_]*)`))?.[1];
}

function rustEntries(input) {
  return [input, ...(input.imports ?? [])].filter((entry) => entry && typeof entry === 'object');
}

function rustSourceText(entry) {
  return entry.sourceText
    ?? entry.metadata?.sourcePreservation?.sourceText
    ?? entry.nativeAst?.metadata?.sourcePreservation?.sourceText
    ?? entry.nativeSource?.metadata?.sourcePreservation?.sourceText
    ?? entry.universalAst?.metadata?.sourcePreservation?.sourceText;
}

function rustSourcePath(entry) {
  return entry.sourcePath ?? entry.nativeSource?.sourcePath ?? entry.nativeAst?.sourcePath;
}

function rustSourceHash(entry) {
  return entry.sourceHash ?? entry.nativeSource?.sourceHash ?? entry.nativeAst?.sourceHash;
}

function rustLanguage(entry) {
  return String(entry.language ?? entry.nativeSource?.language ?? entry.nativeAst?.language ?? '').toLowerCase() === 'rust';
}

function rustEvidenceIds(entry) {
  return (entry.evidence ?? []).map((record) => record?.id).filter(Boolean);
}

function lineAt(text, offset) {
  return text.slice(0, offset).split('\n').length;
}
