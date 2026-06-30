import { idFragment } from '../../native-import-utils.js';

export function appendRustSignatureLifetimes(output, bundle, record, context, signature) {
  const lifetimeNames = rustLifetimeNames(signature);
  for (const name of lifetimeNames) {
    output.lifetimeRegions.push(namedLifetimeRegion(name, bundle, record, context));
  }
  for (const binding of rustParameterLifetimeBindings(signature)) {
    appendReferenceLifetimeBinding(output, bundle, record, context, binding);
  }
  const returned = rustReturnLifetimeBinding(signature);
  if (returned) appendReturnLifetimeBinding(output, bundle, record, context, returned);
  for (const relation of rustOutlivesRelations(signature)) {
    appendOutlivesRelation(output, bundle, record, context, relation);
  }
}

function appendReferenceLifetimeBinding(output, bundle, record, context, binding) {
  const namedId = namedLifetimeId(context.recordId, binding.lifetimeName);
  const paramId = `lifetime_rust_param_${context.recordId}_${idFragment(binding.parameterName)}`;
  output.lifetimeRegions.push({
    id: paramId,
    name: `${binding.parameterName} ${binding.lifetimeName} reference lifetime`,
    lifetimeKind: 'rust-reference-region',
    sourcePath: bundle.sourcePath,
    sourceHash: bundle.sourceHash,
    sourceSpan: record.sourceSpan,
    evidenceIds: context.evidenceIds,
    metadata: { rustKey: record.key, parameterText: binding.parameterText, lifetimeName: binding.lifetimeName }
  });
  output.lifetimeRelations.push(relationRecord('rust-reference-lifetime-binding', namedId, paramId, bundle, record, context, {
    lifetimeName: binding.lifetimeName,
    parameterName: binding.parameterName,
    parameterText: binding.parameterText
  }));
}

function appendReturnLifetimeBinding(output, bundle, record, context, returned) {
  const namedId = namedLifetimeId(context.recordId, returned.lifetimeName);
  const returnId = `lifetime_rust_return_${context.recordId}_${idFragment(returned.lifetimeName)}`;
  output.lifetimeRegions.push({
    id: returnId,
    name: `return ${returned.lifetimeName} reference lifetime`,
    lifetimeKind: 'rust-return-reference-region',
    sourcePath: bundle.sourcePath,
    sourceHash: bundle.sourceHash,
    sourceSpan: record.sourceSpan,
    evidenceIds: context.evidenceIds,
    metadata: { rustKey: record.key, returnText: returned.returnText, lifetimeName: returned.lifetimeName }
  });
  output.lifetimeRelations.push(relationRecord('rust-return-lifetime-binding', namedId, returnId, bundle, record, context, {
    lifetimeName: returned.lifetimeName,
    returnText: returned.returnText
  }));
}

function appendOutlivesRelation(output, bundle, record, context, relation) {
  output.lifetimeRelations.push(relationRecord('rust-outlives', namedLifetimeId(context.recordId, relation.longer), namedLifetimeId(context.recordId, relation.shorter), bundle, record, context, {
    longer: relation.longer,
    shorter: relation.shorter,
    constraintText: relation.constraintText
  }));
}

function namedLifetimeRegion(name, bundle, record, context) {
  return {
    id: namedLifetimeId(context.recordId, name),
    name: `${name} named lifetime`,
    lifetimeKind: 'rust-named-lifetime',
    sourcePath: bundle.sourcePath,
    sourceHash: bundle.sourceHash,
    sourceSpan: record.sourceSpan,
    evidenceIds: context.evidenceIds,
    metadata: { rustKey: record.key, lifetimeName: name }
  };
}

function relationRecord(kind, fromLifetimeId, toLifetimeId, bundle, record, context, metadata) {
  return {
    id: `lifetime_relation_${kind}_${idFragment(fromLifetimeId)}_${idFragment(toLifetimeId)}`,
    relationKind: kind,
    fromLifetimeId,
    toLifetimeId,
    sourcePath: bundle.sourcePath,
    sourceHash: bundle.sourceHash,
    sourceSpan: record.sourceSpan,
    evidenceIds: context.evidenceIds,
    metadata: { rustKey: record.key, ...metadata }
  };
}

function rustLifetimeNames(signature) {
  return unique([...String(signature ?? '').matchAll(/'([A-Za-z_][A-Za-z0-9_]*)/g)].map((match) => `'${match[1]}`));
}

function rustParameterLifetimeBindings(signature) {
  return rustParameterTexts(signature).flatMap((parameterText, index) => {
    const lifetime = explicitReferenceLifetime(parameterText);
    if (!lifetime) return [];
    return [{
      lifetimeName: lifetime,
      parameterName: rustParameterName(parameterText) ?? `param_${index + 1}`,
      parameterText
    }];
  });
}

function rustReturnLifetimeBinding(signature) {
  const match = String(signature ?? '').match(/->\s*(&\s*'([A-Za-z_][A-Za-z0-9_]*)[^,{;)]*)/s);
  return match ? { lifetimeName: `'${match[2]}`, returnText: match[1].trim() } : undefined;
}

function rustOutlivesRelations(signature) {
  return [...String(signature ?? '').matchAll(/'([A-Za-z_][A-Za-z0-9_]*)\s*:\s*'([A-Za-z_][A-Za-z0-9_]*)/g)].map((match) => ({
    longer: `'${match[1]}`,
    shorter: `'${match[2]}`,
    constraintText: match[0]
  }));
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

function namedLifetimeId(recordId, name) {
  return `lifetime_rust_named_${recordId}_${idFragment(name)}`;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
