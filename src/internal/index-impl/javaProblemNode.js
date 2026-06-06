export function javaProblemNode(node, kind) {
  return Boolean(node.problem || node.error || node.malformed || node.recovered || node.hasError || node.hasErrors || kind === 'Erroneous');
}
