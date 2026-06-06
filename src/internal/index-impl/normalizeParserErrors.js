import{idFragment}from'../../native-import-utils.js';
import{spanFromLoc}from'./spanFromLoc.js';
export function normalizeParserErrors(errors, input, options) {
  return (errors ?? []).map((error, index) => ({
    id: `diagnostic_${idFragment(options.parser)}_parser_error_${index + 1}`,
    severity: 'error',
    code: error.code ?? error.reasonCode,
    phase: 'parse',
    kind: 'unsupportedSyntax',
    message: String(error.message ?? 'Parser reported a syntax error.'),
    path: input.sourcePath,
    span: spanFromLoc(error.loc ? { start: error.loc, end: error.loc } : undefined, input),
    metadata: {
      parser: options.parser,
      reasonCode: error.reasonCode
    }
  }));
}
