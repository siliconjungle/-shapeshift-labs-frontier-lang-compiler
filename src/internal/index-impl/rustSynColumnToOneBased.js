export function rustSynColumnToOneBased(column, span) {
  return span.columnBase === 1 || span.columnsOneBased ? column : column + 1;
}
