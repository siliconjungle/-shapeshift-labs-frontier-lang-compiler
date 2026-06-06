import{validateUniversalAstEnvelope}from'@shapeshift-labs/frontier-lang-kernel';
export function readUniversalAstJson(source) {
  const envelope = JSON.parse(source);
  const issues = validateUniversalAstEnvelope(envelope);
  if (issues.length > 0) {
    throw new Error(`Invalid Frontier universal AST JSON: ${issues.join('; ')}`);
  }
  return envelope;
}
