export function swiftGeneratedSourcePath(path) {
  return typeof path === 'string' && /\.(g|generated)\.swift$/i.test(path);
}
