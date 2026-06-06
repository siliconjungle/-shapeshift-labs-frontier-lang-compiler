export function adapterCoverageCapabilityRow(capability, declared, observed, effective, count = 0) {
  const status = declared && observed
    ? 'declared-and-observed'
    : declared ? 'declared-unobserved' : observed ? 'observed-undeclared' : 'absent';
  return Object.freeze({
    capability,
    declared: Boolean(declared),
    observed: Boolean(observed),
    effective: Boolean(effective),
    count: Number(count ?? 0) || 0,
    status
  });
}
