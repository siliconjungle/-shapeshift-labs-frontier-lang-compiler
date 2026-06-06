import{idFragment}from'../../native-import-utils.js';
import{normalizeExternalSemanticLanguage}from'./normalizeExternalSemanticLanguage.js';import{uriToPath}from'./uriToPath.js';
export function externalDocument(document, context, index) {
  const path = document.path ?? document.uri ?? document.relative_path ?? document.relativePath ?? context.sourcePath ?? `external-document-${index + 1}`;
  return {
    id: document.id ?? `doc_${idFragment(path)}`,
    path: uriToPath(path) ?? path,
    language: normalizeExternalSemanticLanguage(document.language ?? document.languageId ?? context.language),
    sourceHash: document.sourceHash ?? document.md5 ?? context.sourceHash,
    metadata: { format: context.format, ...document.metadata }
  };
}
