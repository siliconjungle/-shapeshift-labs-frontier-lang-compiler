import{parseFrontierFile,parseFrontierSource}from'@shapeshift-labs/frontier-lang-parser';
import{compileFrontierDeclaredTargets}from'./compileFrontierDeclaredTargets.js';

export function compileFrontierSourceDeclaredTargets(source, options = {}) {
  const document = options.fileName
    ? parseFrontierFile(options.fileName, source)
    : parseFrontierSource(source, options.parse);
  const sourcePath = options.sourcePath ?? sourceMapOptions(options.sourceMap).sourcePath ?? options.fileName;
  return compileFrontierDeclaredTargets(document, sourcePath === options.sourcePath ? options : { ...options, sourcePath });
}

function sourceMapOptions(sourceMap) {
  return sourceMap && typeof sourceMap === 'object' ? sourceMap : {};
}
