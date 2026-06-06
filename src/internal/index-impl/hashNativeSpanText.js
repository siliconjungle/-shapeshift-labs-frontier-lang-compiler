import{hashSemanticValue}from'@shapeshift-labs/frontier-lang-kernel';
import{sourceTextForSpan}from'./sourceTextForSpan.js';
export function hashNativeSpanText(sourceText, span) {
  const text = sourceTextForSpan(sourceText, span);
  return text === undefined ? undefined : hashSemanticValue(text);
}
