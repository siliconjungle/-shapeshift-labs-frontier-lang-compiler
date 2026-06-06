import{idFragment}from'../../native-import-utils.js';
import{normalizeArray}from'./normalizeArray.js';import{semanticTokenModifiers}from'./semanticTokenModifiers.js';
export function addLspSemanticTokens(result, semanticTokens, input) {
  const data = normalizeArray(semanticTokens.data);
  const legend = semanticTokens.legend ?? {};
  let line = 0;
  let character = 0;
  for (let index = 0; index + 4 < data.length; index += 5) {
    line += Number(data[index] ?? 0);
    character = Number(data[index] ?? 0) === 0 ? character + Number(data[index + 1] ?? 0) : Number(data[index + 1] ?? 0);
    const length = Number(data[index + 2] ?? 0);
    const tokenType = legend.tokenTypes?.[Number(data[index + 3] ?? 0)] ?? `tokenType${data[index + 3] ?? 0}`;
    const span = {
      path: input.sourcePath,
      startLine: line + 1,
      startColumn: character + 1,
      endLine: line + 1,
      endColumn: character + length + 1
    };
    result.facts.push({
      id: `fact_${idFragment(input.documentId)}_semantic_token_${index / 5 + 1}`,
      predicate: 'semanticToken',
      subjectId: input.documentId,
      value: {
        tokenType,
        tokenModifiers: semanticTokenModifiers(Number(data[index + 4] ?? 0), legend.tokenModifiers),
        span
      },
      metadata: { format: 'lsp' }
    });
  }
}
