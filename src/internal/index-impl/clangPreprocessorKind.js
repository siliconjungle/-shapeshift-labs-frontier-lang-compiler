export function clangPreprocessorKind(kind) {
  return /Macro|Preprocess|Preprocessor|IfDirective|IfdefDirective|IfndefDirective|ElifDirective|ElseDirective|EndifDirective/.test(String(kind));
}
