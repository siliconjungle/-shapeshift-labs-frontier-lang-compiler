import{parseFrontierFile,parseFrontierSource}from'@shapeshift-labs/frontier-lang-parser';
import{compileFrontierDocument}from'./compileFrontierDocument.js';
export function compileFrontierSource(source, options = {}) {
  const document = options.fileName
    ? parseFrontierFile(options.fileName, source)
    : parseFrontierSource(source, options.parse);
  return compileFrontierDocument(document, options);
}
