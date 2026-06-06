export function kotlinGeneratedSourcePath(path) {
  return typeof path === 'string' && (/(\.g|\.generated)\.kts?$/i.test(path) || /[\/\\](build|generated|ksp|kapt)[\/\\]/i.test(path));
}
