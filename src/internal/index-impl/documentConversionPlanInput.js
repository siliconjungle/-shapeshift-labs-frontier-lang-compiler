const CONSTRAINT_ARRAY_FIELDS = [
  'resourceTransfers',
  'lifetimeConstraints',
  'controlFlowConstraints',
  'callableBoundaryConstraints',
  'adtPatternConstraints',
  'borrowScopeConstraints',
  'borrowCheckerConstraints',
  'dataLayoutConstraints',
  'effectConstraints',
  'concurrencyModelConstraints',
  'errorModelConstraints',
  'evaluationModelConstraints',
  'hostEnvironmentConstraints',
  'memoryModelConstraints',
  'metaprogrammingConstraints',
  'scopeBindingConstraints',
  'moduleConstraints',
  'numericSemanticsConstraints',
  'textSemanticsConstraints',
  'collectionSemanticsConstraints',
  'serializationSemanticsConstraints',
  'dependencySemanticsConstraints',
  'objectModelConstraints',
  'protocolConstraints',
  'typeConstraints'
];

export function mergeDocumentConversionPlanInput(input = {}) {
  const authored = input.document?.metadata?.universalConversionPlan;
  if (!authored || typeof authored !== 'object') return input;
  const merged = { ...authored, ...input };
  if (input.targets === undefined && authored.targets) merged.targets = authored.targets;
  for (const field of CONSTRAINT_ARRAY_FIELDS) {
    const authoredValues = aggregateAuthoredRouteConstraints(authored[field] ?? []);
    const inputValues = input[field] ?? [];
    if (authoredValues.length || inputValues.length) merged[field] = [...authoredValues, ...inputValues];
  }
  return merged;
}

function aggregateAuthoredRouteConstraints(records = []) {
  const groups = new Map();
  for (const record of records) {
    const key = routeConstraintKey(record);
    const current = groups.get(key) ?? {};
    mergeRecordInto(current, record);
    groups.set(key, current);
  }
  return [...groups.values()];
}

function routeConstraintKey(record = {}) {
  return [
    record.sourceLanguage ?? '',
    record.target ?? '',
    record.routeId ?? '',
    record.mode ?? '',
    record.metadata?.authoredConversionBlockId ?? ''
  ].join('\0');
}

function mergeRecordInto(target, record = {}) {
  for (const [key, value] of Object.entries(record)) {
    if (Array.isArray(value)) target[key] = uniqueRecords([...(target[key] ?? []), ...value]);
    else if (key === 'metadata') target.metadata = { ...(target.metadata ?? {}), ...value };
    else if (target[key] === undefined) target[key] = value;
  }
}

function uniqueRecords(values) {
  const seen = new Set();
  return values.filter((value) => {
    const key = value && typeof value === 'object' ? value.id ?? JSON.stringify(value) : String(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
