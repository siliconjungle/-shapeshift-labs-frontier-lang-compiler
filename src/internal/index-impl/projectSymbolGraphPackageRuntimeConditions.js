function runtimeAdmittedConditions(conditions, runtimeCondition) {
  const entries = Array.isArray(conditions) ? conditions : [conditions];
  const excluded = new Set(runtimeExcludedConditions(runtimeCondition));
  return excluded.size ? entries.filter((entry) => !excluded.has(String(entry))) : entries;
}

function runtimeConditionRecord(record) {
  return compactRecord({
    ...record,
    packageRuntimeConditionExcludedConditions: runtimeExcludedConditions(record.packageRuntimeCondition)
  });
}

function runtimeExcludedConditions(runtimeCondition) {
  if (runtimeCondition === 'import') return ['require'];
  if (runtimeCondition === 'require') return ['import', 'module'];
  return [];
}

function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }

export { runtimeAdmittedConditions, runtimeConditionRecord };
