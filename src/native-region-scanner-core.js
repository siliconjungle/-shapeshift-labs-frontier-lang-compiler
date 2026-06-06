import { idFragment } from './native-import-utils.js';

function nativeDeclaration(input, lineNumber, languageKind, symbolKind, name, fields = {}, hasBody = false, options = {}) {
  const nodeId = `native_${idFragment(languageKind)}_${lineNumber}_${idFragment(name)}`;
  return {
    nodeId,
    kind: languageKind,
    languageKind: `${input.language}.${languageKind}`,
    name,
    symbolKind,
    symbolId: `symbol:${input.language}:${idFragment(name)}`,
    span: spanForLine(input, lineNumber),
    fields,
    metadata: { scan: 'lightweight-declaration', hasBody, ...options.metadata },
    ...(options.regionKind ? { regionKind: options.regionKind } : {}),
    ...(options.role ? { role: options.role } : {}),
    ...(hasBody ? { loss: opaqueBodyLoss(input, lineNumber, nodeId, name) } : {})
  };
}

function nativeImportDeclaration(input, lineNumber, importPath, languageKind, symbolKind) {
  const name = String(importPath);
  const nodeId = `native_${idFragment(languageKind)}_${lineNumber}_${idFragment(name)}`;
  return {
    nodeId,
    kind: languageKind,
    languageKind: `${input.language}.${languageKind}`,
    name,
    symbolKind,
    symbolId: `symbol:${input.language}:import:${idFragment(name)}`,
    role: 'import',
    importPath: name,
    span: spanForLine(input, lineNumber),
    fields: { importPath: name },
    metadata: { scan: 'lightweight-import' }
  };
}

function nativeMacroLoss(input, lineNumber, source, kind, name = idFragment(source).slice(0, 40)) {
  const nodeId = `native_${kind}_${lineNumber}_${idFragment(name)}`;
  return {
    nodeId,
    kind: kind === 'preprocessor' ? 'PreprocessorDirective' : 'MacroInvocation',
    languageKind: `${input.language}.${kind}`,
    name,
    symbolKind: 'constant',
    symbolId: `symbol:${input.language}:${kind}:${idFragment(name)}`,
    span: spanForLine(input, lineNumber),
    fields: { source },
    metadata: { scan: 'lightweight-macro' },
    loss: {
      id: `loss_${idFragment(nodeId)}`,
      severity: 'warning',
      phase: 'read',
      sourceFormat: input.language,
      kind,
      message: `${input.language} ${kind} retained as native source; expansion is not evaluated by the lightweight importer.`,
      span: spanForLine(input, lineNumber),
      nodeId
    }
  };
}

function opaqueBodyLoss(input, lineNumber, nodeId, name) {
  return {
    id: `loss_${idFragment(nodeId)}_body`,
    severity: 'info',
    phase: 'read',
    sourceFormat: input.language,
    kind: 'opaqueNative',
    message: `Body for ${name} is retained as native source by the lightweight declaration importer.`,
    span: spanForLine(input, lineNumber),
    nodeId
  };
}

function lightweightCoverageLosses(input, declarations, sourcePreservation) {
  const id = idFragment(input.sourcePath ?? input.language);
  const span = declarations[0]?.span ?? {
    sourceId: input.sourceHash,
    path: input.sourcePath,
    startLine: 1,
    startColumn: 1
  };
  return [
    {
      id: `loss_${id}_declaration_only_coverage`,
      severity: 'info',
      phase: 'read',
      sourceFormat: input.language,
      kind: 'declarationOnlyCoverage',
      message: 'Lightweight importer scanned declarations and imports only; expressions, control flow, and full type checking were not evaluated.',
      span
    },
    {
      id: `loss_${id}_partial_semantic_index`,
      severity: 'info',
      phase: 'index',
      sourceFormat: input.language,
      kind: 'partialSemanticIndex',
      message: 'Semantic index contains lightweight declaration/import facts only; references, calls, resolved types, and cross-file links may be missing.',
      span
    },
    {
      id: `loss_${id}_source_map_approximation`,
      severity: 'info',
      phase: 'map',
      sourceFormat: input.language,
      kind: 'sourceMapApproximation',
      message: 'Source-map spans are declaration or line estimates; exact token ranges require a parser adapter.',
      span
    },
    {
      id: `loss_${id}_source_preservation`,
      severity: 'warning',
      phase: 'read',
      sourceFormat: input.language,
      kind: 'sourcePreservation',
      message: sourcePreservation
        ? 'Comments, whitespace, token order, directives, and formatting are preserved as opaque native source evidence; exact structural edits still require a parser adapter.'
        : 'Comments, whitespace, token order, directives, and formatting are not preserved by the lightweight importer.',
      span,
      metadata: sourcePreservation ? {
        sourcePreservationId: sourcePreservation.id,
        sourcePreservationSummary: sourcePreservation.summary
      } : undefined
    }
  ];
}

function sourceLines(sourceText) {
  return String(sourceText ?? '').split(/\r?\n/).map((line, index) => ({ line, number: index + 1 }));
}

function spanForLine(input, lineNumber) {
  return {
    sourceId: input.sourceHash,
    path: input.sourcePath,
    startLine: lineNumber,
    endLine: lineNumber,
    startColumn: 1
  };
}

function splitParameters(raw) {
  return String(raw ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function splitTypeParameters(raw) {
  return splitParameters(raw);
}

function braceDelta(source) {
  let delta = 0;
  for (const char of String(source ?? '')) {
    if (char === '{') delta += 1;
    if (char === '}') delta -= 1;
  }
  return delta;
}

function jsControlKeyword(value) {
  return ['if', 'for', 'while', 'switch', 'catch', 'with'].includes(String(value));
}

export {
  braceDelta,
  jsControlKeyword,
  lightweightCoverageLosses,
  nativeDeclaration,
  nativeImportDeclaration,
  nativeMacroLoss,
  sourceLines,
  splitParameters,
  splitTypeParameters
};
