export function inferredAdapterCoverageNotes(context, coverage) {
  const notes = [];
  if (!coverage.exactAst) notes.push('Adapter did not declare exact parser AST/CST coverage; import readiness depends on losses and evidence.');
  if (!coverage.generatedRanges) notes.push('Adapter does not declare generated-range coverage unless parse output includes generated spans.');
  if (!coverage.diagnostics) notes.push('Adapter did not declare parser diagnostics support.');
  if (context.language && context.parser) notes.push(`Coverage summary applies to ${context.language} via ${context.parser}.`);
  return notes;
}
