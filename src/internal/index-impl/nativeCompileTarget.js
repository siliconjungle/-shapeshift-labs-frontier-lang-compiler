import{nativeLanguageCompileTarget,normalizeProjectionMatrixTargets}from'../../coverage-matrix-profiles.js';
import{compileTargetLanguage}from'./compileTargetLanguage.js';import{nativeCompileSourceLanguage}from'./nativeCompileSourceLanguage.js';
export function nativeCompileTarget(input, importResult, options) {
  const targetInput = options.target
    ?? compileTargetLanguage(input?.target)
    ?? compileTargetLanguage(importResult.nativeSource?.target)
    ?? nativeLanguageCompileTarget(nativeCompileSourceLanguage(importResult, input))
    ?? 'typescript';
  return normalizeProjectionMatrixTargets([targetInput])[0] ?? String(targetInput ?? 'typescript').toLowerCase();
}
