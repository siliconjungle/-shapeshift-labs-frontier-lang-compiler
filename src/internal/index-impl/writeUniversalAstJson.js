import{stableUniversalAstJson,validateUniversalAstEnvelope}from'@shapeshift-labs/frontier-lang-kernel';
export function writeUniversalAstJson(envelope) {
  const issues = validateUniversalAstEnvelope(envelope);
  if (issues.length > 0) {
    throw new Error(`Invalid Frontier universal AST envelope: ${issues.join('; ')}`);
  }
  return stableUniversalAstJson(envelope);
}
