export function ignoredRustSynField(key) {
  return key === '_type'
    || key === 'type'
    || key === 'kind'
    || key === 'nodeType'
    || key === 'synKind'
    || key === 'span'
    || key === 'tokens'
    || key === 'tokenStream'
    || key === 'parent';
}
