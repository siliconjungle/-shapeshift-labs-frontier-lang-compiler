import { createEnumMemberSemanticFallbackResult } from './js-ts-safe-merge-enum-member-fallback.js';
import { createJsxAttributeSemanticFallbackResult } from './js-ts-safe-merge-jsx-attribute-fallback.js';
import { createJsxChildExpressionSemanticFallbackResult } from './js-ts-safe-merge-jsx-child-expression-fallback.js';
import { createVariableDeclaratorSemanticFallbackResult } from './js-ts-safe-merge-variable-declarator-fallback.js';

function createSourceShapeSemanticFallbackResult(input, topLevelResult, stagedFallback) {
  return createVariableDeclaratorSemanticFallbackResult(input, topLevelResult, stagedFallback)
    ?? createEnumMemberSemanticFallbackResult(input, topLevelResult, stagedFallback)
    ?? createJsxAttributeSemanticFallbackResult(input, topLevelResult, stagedFallback)
    ?? createJsxChildExpressionSemanticFallbackResult(input, topLevelResult, stagedFallback);
}

export { createSourceShapeSemanticFallbackResult };
