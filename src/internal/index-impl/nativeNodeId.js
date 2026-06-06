import{idFragment}from'../../native-import-utils.js';
export function nativeNodeId(context, kind, loc, propertyPath) {
  context.counter += 1;
  const start = loc?.start;
  const line = start?.line ?? 'x';
  const column = start?.column ?? 'x';
  return `native_${idFragment(kind)}_${idFragment(line)}_${idFragment(column)}_${context.counter}_${idFragment(propertyPath)}`;
}
