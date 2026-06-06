export function csharpGeneratedSourcePath(path) {
  return typeof path === 'string' && /\.(g|generated|designer)\.cs$/i.test(path);
}
