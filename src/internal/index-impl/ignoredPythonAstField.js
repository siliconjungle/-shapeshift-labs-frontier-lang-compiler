export function ignoredPythonAstField(key) {
  return key === '_type'
    || key === 'type'
    || key === 'kind'
    || key === 'nodeType'
    || key === '_fields'
    || key === 'lineno'
    || key === 'col_offset'
    || key === 'end_lineno'
    || key === 'end_col_offset'
    || key === 'line'
    || key === 'colOffset'
    || key === 'endLine'
    || key === 'endColOffset'
    || key === 'ctx'
    || key === 'parent';
}
