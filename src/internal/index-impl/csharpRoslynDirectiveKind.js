export function csharpRoslynDirectiveKind(kind) {
  return /DirectiveTrivia$/.test(String(kind)) || /^(IfDirective|ElifDirective|ElseDirective|EndIfDirective|DefineDirective|UndefDirective|NullableDirective|RegionDirective|EndRegionDirective|PragmaWarningDirective|LineDirective|ErrorDirective|WarningDirective|LoadDirective|ReferenceDirective)/.test(String(kind));
}
