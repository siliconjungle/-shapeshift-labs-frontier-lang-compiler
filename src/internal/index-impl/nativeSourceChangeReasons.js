export function nativeSourceChangeReasons(input) {
  if (!input.before) return ['Native source was added.'];
  if (!input.after) return ['Native source was removed.'];
  if (input.changedSymbols.length) {
    return [`Native source changed ${input.changedSymbols.length} symbol(s) across ${input.changedRegions.length} ownership region(s).`];
  }
  if (input.beforeHash && input.afterHash && input.beforeHash !== input.afterHash) {
    return ['Native source hash changed without declaration-level symbol changes; file-level review is required.'];
  }
  return ['Native source imports are semantically unchanged at available scanner precision.'];
}
