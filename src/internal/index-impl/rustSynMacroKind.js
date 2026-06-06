export function rustSynMacroKind(kind) {
  return /Macro|MacroRules|MacroCall/.test(String(kind));
}
