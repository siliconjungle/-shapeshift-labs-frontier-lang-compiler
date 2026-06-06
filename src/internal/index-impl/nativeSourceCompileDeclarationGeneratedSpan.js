import{uniqueStrings,upperFirst}from'../../native-import-utils.js';
import{nativeSourceCompileFullGeneratedSpan}from'./nativeSourceCompileFullGeneratedSpan.js';import{nativeSourceCompileGeneratedSpanForOffset}from'./nativeSourceCompileGeneratedSpanForOffset.js';import{safeProjectionIdentifier}from'./safeProjectionIdentifier.js';
export function nativeSourceCompileDeclarationGeneratedSpan(input, declaration) {
  const identifiers = uniqueStrings([
    declaration.name,
    safeProjectionIdentifier(declaration.name),
    upperFirst(safeProjectionIdentifier(declaration.name)),
    safeProjectionIdentifier(declaration.name).toUpperCase()
  ]).filter(Boolean);
  for (const identifier of identifiers) {
    const offset = input.output.indexOf(identifier);
    if (offset >= 0) {
      return {
        name: identifier,
        exactName: true,
        span: nativeSourceCompileGeneratedSpanForOffset(input, offset, identifier.length, identifier)
      };
    }
  }
  return {
    name: safeProjectionIdentifier(declaration.name),
    exactName: false,
    span: nativeSourceCompileFullGeneratedSpan(input, safeProjectionIdentifier(declaration.name))
  };
}
