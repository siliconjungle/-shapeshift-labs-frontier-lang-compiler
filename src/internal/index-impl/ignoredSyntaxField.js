export function ignoredSyntaxField(key) {
  return key === 'type'
    || key === 'kind'
    || key === 'loc'
    || key === 'start'
    || key === 'end'
    || key === 'range'
    || key === 'comments'
    || key === 'leadingComments'
    || key === 'trailingComments'
    || key === 'innerComments'
    || key === 'tokens'
    || key === 'extra'
    || key === 'parent';
}
