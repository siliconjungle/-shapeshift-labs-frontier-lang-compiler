import{canonicalTargets}from'./canonicalTargets.js';import{FrontierCompileTargets}from'./FrontierCompileTargets.js';
export function normalizeCompileTarget(target) {
  const normalized = String(target ?? 'typescript').toLowerCase();
  const canonical = canonicalTargets[normalized] ?? normalized;
  if (!FrontierCompileTargets.includes(canonical)) {
    throw new Error(`Unknown Frontier compile target: ${target}`);
  }
  return canonical;
}
