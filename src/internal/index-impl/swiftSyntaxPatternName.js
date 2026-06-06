import{swiftSyntaxName}from'./swiftSyntaxName.js';
export function swiftSyntaxPatternName(pattern) {
  if (!pattern) return undefined;
  if (typeof pattern === 'string') return pattern;
  return swiftSyntaxName(pattern.identifier ?? pattern.name ?? pattern.boundName ?? pattern.pattern ?? pattern);
}
