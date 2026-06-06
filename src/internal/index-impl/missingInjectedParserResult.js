import{idFragment}from'../../native-import-utils.js';
export function missingInjectedParserResult(input, details) {
  const rootId = `native_${idFragment(details.adapterId ?? details.parser)}_missing_parser`;
  const diagnostic = {
    severity: 'error',
    code: 'adapter.parser.missing',
    phase: 'parse',
    kind: 'unsupportedSyntax',
    message: details.message,
    path: input.sourcePath,
    metadata: {
      adapterId: details.adapterId,
      parser: details.parser
    }
  };
  return {
    rootId,
    nodes: {
      [rootId]: {
        id: rootId,
        kind: 'MissingInjectedParser',
        languageKind: `${input.language}.missingInjectedParser`,
        value: details.parser,
        metadata: {
          adapterId: details.adapterId,
          parser: details.parser,
          reason: 'missing-injected-parser'
        }
      }
    },
    diagnostics: [diagnostic],
    losses: [{
      id: `loss_${idFragment(rootId)}`,
      severity: 'error',
      phase: 'parse',
      sourceFormat: input.language,
      kind: 'unsupportedSyntax',
      message: details.message,
      nodeId: rootId,
      metadata: {
        adapterId: details.adapterId,
        parser: details.parser
      }
    }],
    metadata: {
      parser: details.parser,
      adapterId: details.adapterId,
      missingInjectedParser: true
    }
  };
}
