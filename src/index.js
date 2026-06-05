import {
  createDocument,
  createImportResult,
  createNativeAstRecord,
  createPatch,
  createSemanticIndexRecord,
  createUniversalAstEnvelope,
  hashDocumentBase,
  hashSemanticValue,
  nativeSourceNode,
  stableUniversalAstJson,
  validateUniversalAstEnvelope
} from '@shapeshift-labs/frontier-lang-kernel';
import { parseFrontierFile, parseFrontierSource } from '@shapeshift-labs/frontier-lang-parser';
import { checkDocument } from '@shapeshift-labs/frontier-lang-checker';
import { renderTypeScriptAst, toTypeScriptAst } from '@shapeshift-labs/frontier-lang-typescript';
import { renderJavaScriptAst, toJavaScriptAst } from '@shapeshift-labs/frontier-lang-javascript';
import { renderRustAst, toRustAst } from '@shapeshift-labs/frontier-lang-rust';
import { renderPythonAst, toPythonAst } from '@shapeshift-labs/frontier-lang-python';
import { renderCAst, toCAst } from '@shapeshift-labs/frontier-lang-c';

export const FrontierCompileTargets = Object.freeze([
  'typescript',
  'javascript',
  'rust',
  'python',
  'c'
]);

const projectors = Object.freeze({
  typescript: toTypeScriptAst,
  javascript: toJavaScriptAst,
  rust: toRustAst,
  python: toPythonAst,
  c: toCAst
});

const renderers = Object.freeze({
  typescript: renderTypeScriptAst,
  javascript: renderJavaScriptAst,
  rust: renderRustAst,
  python: renderPythonAst,
  c: renderCAst
});

const canonicalTargets = Object.freeze({
  ts: 'typescript',
  js: 'javascript',
  rs: 'rust',
  py: 'python',
  h: 'c'
});

export function normalizeCompileTarget(target) {
  const normalized = String(target ?? 'typescript').toLowerCase();
  const canonical = canonicalTargets[normalized] ?? normalized;
  if (!FrontierCompileTargets.includes(canonical)) {
    throw new Error(`Unknown Frontier compile target: ${target}`);
  }
  return canonical;
}

export function compileFrontierSource(source, options = {}) {
  const document = options.fileName
    ? parseFrontierFile(options.fileName, source)
    : parseFrontierSource(source, options.parse);
  return compileFrontierDocument(document, options);
}

export function compileFrontierDocument(document, options = {}) {
  const target = normalizeCompileTarget(options.target);
  const check = checkDocument(document, options.check ?? {});
  const hash = hashDocumentBase(document);
  if (!check.ok && options.emitOnError !== true) {
    return {
      ok: false,
      target,
      hash,
      document,
      diagnostics: check.diagnostics,
      ast: undefined,
      output: ''
    };
  }
  const ast = projectFrontierAst(document, target, options.emit ?? {});
  return {
    ok: check.ok,
    target,
    hash,
    document,
    diagnostics: check.diagnostics,
    ast,
    output: renderTargetAst(ast, target)
  };
}

export function projectFrontierAst(document, target = 'typescript', options = {}) {
  const normalized = normalizeCompileTarget(target);
  const projector = projectors[normalized];
  return projector(document, options);
}

export function renderTargetAst(ast, target = 'typescript') {
  const normalized = normalizeCompileTarget(target);
  const renderer = renderers[normalized];
  return renderer(ast);
}

export function resolveCapabilityAdapters(document, target = 'typescript', options = {}) {
  const normalized = normalizeCompileTarget(target);
  const platform = options.platform;
  return Object.values(document.nodes)
    .filter((node) => node.kind === 'capability')
    .map((node) => {
      const adapters = (node.adapters ?? []).filter((adapter) => {
        if (adapter.target?.language !== normalized) return false;
        if (platform && adapter.target?.platform && adapter.target.platform !== platform) return false;
        return true;
      });
      const unsupported = (node.unsupportedTargets ?? []).find((item) => {
        if (item.target?.language !== normalized) return false;
        if (platform && item.target?.platform && item.target.platform !== platform) return false;
        return true;
      });
      return {
        nodeId: node.id,
        name: node.name,
        capability: node.capability,
        target: { language: normalized, platform },
        status: adapters.length ? 'bound' : unsupported ? 'unsupported' : 'unbound',
        adapters,
        unsupported,
        reason: unsupported?.reason
      };
    });
}

export async function runNativeImporterAdapter(adapter, input = {}) {
  const summary = normalizeNativeImporterAdapter(adapter);
  const language = input.language ?? summary.language;
  const parser = input.parser ?? summary.parser;
  const parserVersion = input.parserVersion ?? summary.version;
  const sourceText = input.sourceText ?? '';
  const sourceHash = input.sourceHash ?? hashSemanticValue(sourceText);
  const parseInput = {
    sourceText,
    sourcePath: input.sourcePath,
    sourceHash,
    language,
    parser,
    parserVersion,
    adapterId: summary.id,
    adapterVersion: summary.version,
    options: input.adapterOptions ?? {},
    metadata: input.adapterMetadata ?? {}
  };
  let parsed;
  let thrownDiagnostic;
  try {
    parsed = await adapter.parse(parseInput);
  } catch (error) {
    thrownDiagnostic = {
      severity: 'error',
      code: 'adapter.parse.threw',
      phase: 'parse',
      kind: 'unsupportedSyntax',
      message: error instanceof Error ? error.message : String(error),
      metadata: {
        errorName: error instanceof Error ? error.name : undefined
      }
    };
    parsed = {
      rootId: 'adapter_error_root',
      nodes: {
        adapter_error_root: {
          id: 'adapter_error_root',
          kind: 'AdapterParseError',
          languageKind: `${language}.adapterParseError`,
          value: thrownDiagnostic.message,
          metadata: { adapterId: summary.id, parser }
        }
      }
    };
  }
  const parseResult = parsed ?? {};
  const diagnostics = [
    ...normalizeAdapterDiagnostics(summary.diagnostics, summary, parseInput, 'adapter'),
    ...(thrownDiagnostic ? normalizeAdapterDiagnostics([thrownDiagnostic], summary, parseInput, 'throw') : []),
    ...normalizeAdapterDiagnostics(parseResult.diagnostics, summary, parseInput, 'parse')
  ];
  const losses = mergeNativeLosses(
    parseResult.losses,
    diagnostics.map((diagnostic, index) => adapterDiagnosticToLoss(diagnostic, index, summary, parseInput))
  );
  const sourceEvidence = adapterDiagnosticsEvidence(summary, diagnostics, {
    language,
    parser,
    parserVersion,
    sourcePath: parseResult.sourcePath ?? input.sourcePath,
    sourceHash: parseResult.sourceHash ?? sourceHash
  });
  const evidence = [...(parseResult.evidence ?? []), sourceEvidence];
  const importInput = {
    ...input,
    ...parseResult,
    language,
    parser,
    parserVersion,
    sourceText,
    sourcePath: parseResult.sourcePath ?? input.sourcePath,
    sourceHash: parseResult.sourceHash ?? sourceHash,
    losses,
    evidence,
    metadata: {
      adapterId: summary.id,
      adapterVersion: summary.version,
      adapterCapabilities: summary.capabilities,
      supportedExtensions: summary.supportedExtensions,
      diagnostics: diagnostics.map(serializableDiagnostic),
      ...input.metadata,
      ...parseResult.metadata
    },
    nativeAstMetadata: {
      adapterId: summary.id,
      adapterVersion: summary.version,
      parser,
      ...input.nativeAstMetadata,
      ...parseResult.nativeAstMetadata
    },
    nativeSourceMetadata: {
      adapterId: summary.id,
      adapterVersion: summary.version,
      parser,
      ...input.nativeSourceMetadata,
      ...parseResult.nativeSourceMetadata
    },
    documentMetadata: {
      nativeImporterAdapterId: summary.id,
      nativeImporterAdapterVersion: summary.version,
      ...input.documentMetadata,
      ...parseResult.documentMetadata
    },
    universalAstMetadata: {
      nativeImporterAdapterId: summary.id,
      nativeImporterAdapterVersion: summary.version,
      ...input.universalAstMetadata,
      ...parseResult.universalAstMetadata
    }
  };
  return {
    ...importNativeSource(importInput),
    adapter: summary,
    diagnostics
  };
}

export function importNativeSource(input) {
  const language = input.language ?? input.nativeAst?.language;
  if (!language) throw new Error('importNativeSource requires a language or nativeAst.language');
  const sourcePath = input.sourcePath ?? input.nativeAst?.sourcePath;
  const sourceHash = input.sourceHash ?? input.nativeAst?.sourceHash ?? (input.sourceText ? hashSemanticValue(input.sourceText) : hashSemanticValue(input.nativeAst?.nodes ?? input.nativeAst ?? {}));
  const importIdPart = idFragment(input.id ?? input.nativeSourceId ?? sourcePath ?? language);
  const lightweight = !input.nativeAst && !input.nodes && input.sourceText
    ? createLightweightNativeImport({
      language,
      sourceText: input.sourceText,
      sourcePath,
      sourceHash,
      parser: input.parser
    })
    : undefined;
  const nativeAst = input.nativeAst ?? createNativeAstRecord({
    id: input.nativeAstId ?? `native_ast_${importIdPart}`,
    language,
    parser: input.parser ?? lightweight?.parser,
    parserVersion: input.parserVersion,
    sourcePath,
    sourceHash,
    rootId: input.rootId ?? lightweight?.rootId ?? 'native_root',
    nodes: input.nodes ?? lightweight?.nodes ?? {
      native_root: {
        id: 'native_root',
        kind: 'Unknown',
        languageKind: `${language}.unknown`,
        value: null,
        metadata: { reason: 'no-native-ast-nodes-provided' }
      }
    },
    losses: input.losses ?? lightweight?.losses,
    metadata: {
      ...(input.sourceText ? { sourceBytes: input.sourceText.length } : {}),
      ...lightweight?.metadata,
      ...input.nativeAstMetadata
    }
  });
  const frontierNodeIds = input.frontierNodeIds ?? input.semanticNodes?.map((node) => node.id) ?? [];
  const losses = input.losses ?? nativeAst.losses ?? lightweight?.losses ?? [];
  const nativeSource = nativeSourceNode({
    id: input.nativeSourceId ?? `native_source_${importIdPart}`,
    name: input.name ?? sourcePath?.split(/[\\/]/).filter(Boolean).at(-1) ?? `${language}NativeSource`,
    language,
    parser: input.parser ?? nativeAst.parser,
    parserVersion: input.parserVersion ?? nativeAst.parserVersion,
    sourcePath,
    sourceHash,
    symbol: input.symbol,
    ast: nativeAst,
    frontierNodeIds,
    losses,
    target: input.target,
    metadata: {
      semanticStatus: input.semanticStatus ?? (input.semanticNodes?.length ? 'mapped' : 'native-only'),
      mappings: input.mappings ?? [],
      ...input.nativeSourceMetadata
    }
  });
  const semanticNodes = input.semanticNodes ?? [];
  const document = createDocument({
    id: input.documentId ?? `document_${importIdPart}`,
    name: input.documentName ?? nativeSource.name,
    nodes: [...semanticNodes, nativeSource],
    rootIds: input.rootIds,
    metadata: {
      sourceLanguage: language,
      semanticStatus: input.semanticStatus ?? (semanticNodes.length ? 'mapped' : 'native-only'),
      ...input.documentMetadata
    }
  });
  const evidence = input.evidence ?? [{
    id: input.evidenceId ?? `evidence_${importIdPart}_import`,
    kind: 'import',
    status: losses.some((loss) => loss.severity === 'error') ? 'failed' : 'passed',
    path: sourcePath,
    summary: `Imported ${language} native source with ${Object.keys(nativeAst.nodes).length} native AST node(s), ${semanticNodes.length} semantic node(s), and ${losses.length} loss record(s).`,
    metadata: {
      parser: nativeAst.parser,
      sourcePath,
      semanticStatus: input.semanticStatus ?? (semanticNodes.length ? 'mapped' : 'native-only')
    }
  }];
  const semanticIndex = input.semanticIndex ?? lightweight?.semanticIndex;
  const universalAst = createUniversalAstEnvelope({
    id: input.universalAstId ?? `universal_ast_${importIdPart}`,
    document,
    nativeSources: [nativeSource],
    semanticIndex,
    losses,
    evidence,
    metadata: {
      sourceLanguage: language,
      sourcePath,
      semanticStatus: input.semanticStatus ?? (semanticNodes.length ? 'mapped' : 'native-only'),
      ...input.universalAstMetadata
    }
  });
  const patch = input.patch ?? createPatch({
    id: input.patchId ?? `patch_${importIdPart}_import`,
    author: input.author ?? '@shapeshift-labs/frontier-lang-compiler/importNativeSource',
    risk: losses.some((loss) => loss.severity === 'error') ? 'high' : losses.length ? 'medium' : 'low',
    operations: [...semanticNodes, nativeSource].map((node) => ({
      op: 'upsertNode',
      node,
      touches: [{ id: node.id, access: node.kind === 'nativeSource' ? 'evidence' : 'schema' }]
    })),
    evidence,
    metadata: { sourceLanguage: language, sourcePath, semanticIndexId: semanticIndex?.id, universalAstId: universalAst.id }
  });
  return {
    ...createImportResult({
      id: input.id ?? `import_${importIdPart}`,
      language,
      sourcePath,
      document,
      patch,
      nativeAst,
      semanticIndex,
      universalAst,
      losses,
      evidence,
      metadata: {
        nativeSourceId: nativeSource.id,
        semanticIndexId: semanticIndex?.id,
        universalAstId: universalAst.id,
        semanticStatus: input.semanticStatus ?? (semanticNodes.length ? 'mapped' : 'native-only'),
        mappings: input.mappings ?? [],
        ...input.metadata
      }
    }),
    nativeSource
  };
}

function createLightweightNativeImport(input) {
  const parser = input.parser ?? `${input.language}.lightweight-declaration-scan`;
  const rootId = 'native_root';
  const nodes = {
    [rootId]: {
      id: rootId,
      kind: 'Program',
      languageKind: `${input.language}.program`,
      children: [],
      metadata: { parser, sourceHash: input.sourceHash }
    }
  };
  const declarations = scanNativeDeclarations(input);
  const losses = [];
  const documentId = `doc_${idFragment(input.sourcePath ?? input.language)}`;
  const symbols = [];
  const occurrences = [];
  const relations = [];
  const facts = [];

  for (const declaration of declarations) {
    nodes[rootId].children.push(declaration.nodeId);
    nodes[declaration.nodeId] = {
      id: declaration.nodeId,
      kind: declaration.kind,
      languageKind: declaration.languageKind,
      span: declaration.span,
      value: declaration.name ?? declaration.importPath ?? null,
      fields: declaration.fields,
      metadata: declaration.metadata
    };
    if (declaration.symbolId) {
      symbols.push({
        id: declaration.symbolId,
        scheme: 'frontier',
        name: declaration.name,
        kind: declaration.symbolKind,
        language: input.language,
        nativeAstNodeId: declaration.nodeId,
        signatureHash: hashSemanticValue([input.language, declaration.kind, declaration.name, declaration.fields ?? {}]),
        definitionSpan: declaration.span
      });
      occurrences.push({
        id: `occ_${idFragment(declaration.nodeId)}_def`,
        documentId,
        symbolId: declaration.symbolId,
        role: declaration.role ?? 'definition',
        span: declaration.span,
        nativeAstNodeId: declaration.nodeId
      });
      relations.push({
        id: `rel_${idFragment(documentId)}_${idFragment(declaration.nodeId)}`,
        sourceId: documentId,
        predicate: declaration.role === 'import' ? 'imports' : 'defines',
        targetId: declaration.symbolId
      });
      facts.push({
        id: `fact_${idFragment(declaration.nodeId)}_kind`,
        predicate: 'nativeKind',
        subjectId: declaration.symbolId,
        value: declaration.languageKind
      });
    }
    if (declaration.loss) losses.push(declaration.loss);
  }

  const semanticIndex = createSemanticIndexRecord({
    id: `index_${idFragment(input.sourcePath ?? input.language)}`,
    documents: [{
      id: documentId,
      path: input.sourcePath ?? `${input.language}:memory`,
      language: input.language,
      sourceHash: input.sourceHash
    }],
    symbols,
    occurrences,
    relations,
    facts,
    evidence: [{
      id: `evidence_${idFragment(input.sourcePath ?? input.language)}_lightweight_scan`,
      kind: 'import',
      status: 'passed',
      path: input.sourcePath,
      summary: `Lightweight declaration scan found ${symbols.length} symbol(s).`,
      metadata: { parser }
    }],
    metadata: {
      parser,
      coverage: 'declarations-only',
      unsupported: ['full expression AST', 'type checking', 'control flow', 'comments and formatting preservation']
    }
  });

  return {
    parser,
    rootId,
    nodes,
    losses,
    semanticIndex,
    metadata: { parser, scanKind: 'lightweight-declaration-scan', declarationCount: declarations.length }
  };
}

function scanNativeDeclarations(input) {
  const language = String(input.language).toLowerCase();
  if (language === 'javascript' || language === 'typescript') return scanJavaScriptLike(input);
  if (language === 'python') return scanPython(input);
  if (language === 'rust') return scanRust(input);
  if (language === 'c' || language === 'cpp' || language === 'c++') return scanCLike(input);
  return scanGenericDeclarations(input);
}

function scanJavaScriptLike(input) {
  const declarations = [];
  for (const { line, number } of sourceLines(input.sourceText)) {
    const trimmed = line.trim();
    let match;
    if ((match = trimmed.match(/^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/))) {
      declarations.push(nativeDeclaration(input, number, 'FunctionDeclaration', 'function', match[1], { parameters: splitParameters(match[2]) }, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^(?:export\s+)?class\s+([A-Za-z_$][\w$]*)/))) {
      declarations.push(nativeDeclaration(input, number, 'ClassDeclaration', 'class', match[1], {}, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^(?:export\s+)?interface\s+([A-Za-z_$][\w$]*)/))) {
      declarations.push(nativeDeclaration(input, number, 'InterfaceDeclaration', 'interface', match[1], {}, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^(?:export\s+)?type\s+([A-Za-z_$][\w$]*)\s*=/))) {
      declarations.push(nativeDeclaration(input, number, 'TypeAliasDeclaration', 'type', match[1], {}, false));
    } else if ((match = trimmed.match(/^(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(?([^=;]*)\)?\s*=>/))) {
      declarations.push(nativeDeclaration(input, number, 'VariableFunctionDeclaration', 'function', match[1], { parameters: splitParameters(match[2]) }, true));
    } else if ((match = trimmed.match(/^import\s+(?:.+?\s+from\s+)?['"]([^'"]+)['"]/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'ImportDeclaration', 'module'));
    } else if ((match = trimmed.match(/^export\s+\{[^}]*\}\s+from\s+['"]([^'"]+)['"]/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'ExportFromDeclaration', 'module'));
    }
  }
  return declarations;
}

function scanPython(input) {
  const declarations = [];
  for (const { line, number } of sourceLines(input.sourceText)) {
    const trimmed = line.trim();
    let match;
    if ((match = trimmed.match(/^(?:async\s+)?def\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*:/))) {
      declarations.push(nativeDeclaration(input, number, 'FunctionDef', 'function', match[1], { parameters: splitParameters(match[2]) }, true));
    } else if ((match = trimmed.match(/^class\s+([A-Za-z_]\w*)/))) {
      declarations.push(nativeDeclaration(input, number, 'ClassDef', 'class', match[1], {}, true));
    } else if ((match = trimmed.match(/^(?:from\s+([A-Za-z_][\w.]*)\s+import\s+.+|import\s+([A-Za-z_][\w.]*))/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1] ?? match[2], 'Import', 'module'));
    }
  }
  return declarations;
}

function scanRust(input) {
  const declarations = [];
  for (const { line, number } of sourceLines(input.sourceText)) {
    const trimmed = line.trim();
    let match;
    if ((match = trimmed.match(/^(?:pub(?:\([^)]*\))?\s+)?(?:async\s+)?fn\s+([A-Za-z_]\w*)\s*\(([^)]*)\)/))) {
      declarations.push(nativeDeclaration(input, number, 'ItemFn', 'function', match[1], { parameters: splitParameters(match[2]) }, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^(?:pub(?:\([^)]*\))?\s+)?struct\s+([A-Za-z_]\w*)/))) {
      declarations.push(nativeDeclaration(input, number, 'ItemStruct', 'type', match[1], {}, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^(?:pub(?:\([^)]*\))?\s+)?enum\s+([A-Za-z_]\w*)/))) {
      declarations.push(nativeDeclaration(input, number, 'ItemEnum', 'type', match[1], {}, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^(?:pub(?:\([^)]*\))?\s+)?trait\s+([A-Za-z_]\w*)/))) {
      declarations.push(nativeDeclaration(input, number, 'ItemTrait', 'trait', match[1], {}, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^impl(?:\s*<[^>]+>)?\s+(.+?)\s*\{/))) {
      declarations.push(nativeDeclaration(input, number, 'ItemImpl', 'implementation', idFragment(match[1]), { target: match[1].trim() }, true));
    } else if ((match = trimmed.match(/^(?:pub(?:\([^)]*\))?\s+)?mod\s+([A-Za-z_]\w*)/))) {
      declarations.push(nativeDeclaration(input, number, 'ItemMod', 'module', match[1], {}, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^use\s+(.+?);/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'ItemUse', 'module'));
    } else if (/^[A-Za-z_]\w*!\s*[({[]/.test(trimmed)) {
      declarations.push(nativeMacroLoss(input, number, trimmed, 'macroExpansion'));
    }
  }
  return declarations;
}

function scanCLike(input) {
  const declarations = [];
  for (const { line, number } of sourceLines(input.sourceText)) {
    const trimmed = line.trim();
    let match;
    if ((match = trimmed.match(/^#\s*include\s+[<"]([^>"]+)[>"]/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'IncludeDirective', 'header'));
    } else if ((match = trimmed.match(/^#\s*define\s+([A-Za-z_]\w*)/))) {
      declarations.push(nativeMacroLoss(input, number, trimmed, 'preprocessor', match[1]));
    } else if ((match = trimmed.match(/^typedef\s+struct(?:\s+([A-Za-z_]\w*))?/))) {
      declarations.push(nativeDeclaration(input, number, 'TypedefStructDeclaration', 'type', match[1] ?? `anonymous_struct_${number}`, {}, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^(?:struct|enum)\s+([A-Za-z_]\w*)/))) {
      declarations.push(nativeDeclaration(input, number, 'TagDeclaration', 'type', match[1], {}, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^(?:[A-Za-z_][\w\s*:&<>]+)\s+([A-Za-z_]\w*)\s*\(([^;{}]*)\)\s*(?:;|\{)?$/))) {
      declarations.push(nativeDeclaration(input, number, 'FunctionDeclaration', 'function', match[1], { parameters: splitParameters(match[2]) }, trimmed.endsWith('{')));
    }
  }
  return declarations;
}

function scanGenericDeclarations(input) {
  return sourceLines(input.sourceText)
    .filter(({ line }) => /\b(function|class|struct|enum|trait|interface|def)\b/.test(line))
    .map(({ line, number }) => nativeDeclaration(input, number, 'NativeDeclaration', 'variable', idFragment(line.trim()).slice(0, 40), { source: line.trim() }, true));
}

function nativeDeclaration(input, lineNumber, languageKind, symbolKind, name, fields = {}, hasBody = false) {
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
    metadata: { scan: 'lightweight-declaration', hasBody },
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

export function createUniversalAstFromDocument(document, input = {}) {
  return createUniversalAstEnvelope({
    id: input.id ?? `universal_ast_${idFragment(document.id)}`,
    document,
    semanticIndex: input.semanticIndex,
    evidence: input.evidence ?? [],
    metadata: input.metadata
  });
}

export function readUniversalAstJson(source) {
  const envelope = JSON.parse(source);
  const issues = validateUniversalAstEnvelope(envelope);
  if (issues.length > 0) {
    throw new Error(`Invalid Frontier universal AST JSON: ${issues.join('; ')}`);
  }
  return envelope;
}

export function writeUniversalAstJson(envelope) {
  const issues = validateUniversalAstEnvelope(envelope);
  if (issues.length > 0) {
    throw new Error(`Invalid Frontier universal AST envelope: ${issues.join('; ')}`);
  }
  return stableUniversalAstJson(envelope);
}

export function emitForTarget(document, target = 'typescript', options = {}) {
  return renderTargetAst(projectFrontierAst(document, target, options), target);
}

function normalizeNativeImporterAdapter(adapter) {
  if (!adapter || typeof adapter !== 'object') {
    throw new Error('Native importer adapter must be an object');
  }
  if (!adapter.id) throw new Error('Native importer adapter requires an id');
  if (!adapter.language) throw new Error(`Native importer adapter ${adapter.id} requires a language`);
  if (!adapter.parser) throw new Error(`Native importer adapter ${adapter.id} requires a parser`);
  if (typeof adapter.parse !== 'function') throw new Error(`Native importer adapter ${adapter.id} requires a parse function`);
  const summaryInput = {
    id: String(adapter.id),
    language: adapter.language,
    parser: String(adapter.parser),
    version: adapter.version === undefined ? undefined : String(adapter.version)
  };
  return Object.freeze({
    ...summaryInput,
    capabilities: normalizeStringList(adapter.capabilities),
    supportedExtensions: normalizeStringList(adapter.supportedExtensions).map((extension) => extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`),
    diagnostics: normalizeAdapterDiagnostics(adapter.diagnostics, summaryInput, {
      language: adapter.language,
      parser: String(adapter.parser),
      parserVersion: adapter.version === undefined ? undefined : String(adapter.version)
    }, 'adapter')
  });
}

function normalizeStringList(value) {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  return [String(value)].filter(Boolean);
}

function normalizeAdapterDiagnostics(value, adapter, input, scope = 'diagnostic') {
  if (value === undefined || value === null) return [];
  const diagnostics = Array.isArray(value) ? value : [value];
  return diagnostics.map((diagnostic, index) => {
    const normalized = typeof diagnostic === 'string' ? { message: diagnostic } : diagnostic ?? {};
    const severity = normalizeDiagnosticSeverity(normalized.severity);
    return Object.freeze({
      id: normalized.id ?? `diagnostic_${idFragment(adapter.id)}_${idFragment(scope)}_${index + 1}`,
      severity,
      code: normalized.code,
      phase: normalized.phase ?? 'parse',
      kind: normalized.kind,
      message: String(normalized.message ?? `${adapter.id} reported a ${severity} diagnostic.`),
      path: normalized.path ?? input.sourcePath,
      span: normalized.span,
      metadata: {
        adapterId: adapter.id,
        adapterVersion: adapter.version,
        language: input.language ?? adapter.language,
        parser: input.parser ?? adapter.parser,
        parserVersion: input.parserVersion,
        ...normalized.metadata
      }
    });
  });
}

function normalizeDiagnosticSeverity(value) {
  const severity = String(value ?? 'warning').toLowerCase();
  if (severity === 'error') return 'error';
  if (severity === 'info') return 'info';
  return 'warning';
}

function adapterDiagnosticToLoss(diagnostic, index, adapter, input) {
  const code = diagnostic.code ?? diagnostic.kind ?? diagnostic.severity;
  return {
    id: `loss_${idFragment(diagnostic.id ?? `${adapter.id}_${index}_${code}`)}`,
    severity: diagnostic.severity,
    phase: diagnostic.phase,
    sourceFormat: input.language,
    kind: diagnostic.kind ?? (diagnostic.severity === 'error' ? 'unsupportedSyntax' : 'opaqueNative'),
    message: diagnostic.message,
    span: diagnostic.span,
    metadata: {
      adapterId: adapter.id,
      adapterVersion: adapter.version,
      diagnosticId: diagnostic.id,
      diagnosticCode: diagnostic.code,
      parser: input.parser,
      parserVersion: input.parserVersion,
      path: diagnostic.path,
      ...diagnostic.metadata
    }
  };
}

function mergeNativeLosses(primary = [], secondary = []) {
  const seen = new Set();
  const losses = [];
  for (const loss of [...primary, ...secondary]) {
    if (!loss) continue;
    const id = loss.id ?? `loss_${losses.length + 1}`;
    if (seen.has(id)) continue;
    seen.add(id);
    losses.push(loss.id ? loss : { ...loss, id });
  }
  return losses;
}

function adapterDiagnosticsEvidence(adapter, diagnostics, input) {
  const errors = diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length;
  const warnings = diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length;
  return {
    id: `evidence_${idFragment(adapter.id)}_native_importer_adapter`,
    kind: 'import',
    status: errors ? 'failed' : 'passed',
    path: input.sourcePath,
    summary: `Ran ${adapter.id} native importer for ${input.language} with ${diagnostics.length} diagnostic(s).`,
    metadata: {
      adapterId: adapter.id,
      adapterVersion: adapter.version,
      language: input.language,
      parser: input.parser,
      parserVersion: input.parserVersion,
      sourceHash: input.sourceHash,
      capabilities: adapter.capabilities,
      supportedExtensions: adapter.supportedExtensions,
      diagnostics: diagnostics.map(serializableDiagnostic),
      errors,
      warnings
    }
  };
}

function serializableDiagnostic(diagnostic) {
  return {
    id: diagnostic.id,
    severity: diagnostic.severity,
    code: diagnostic.code,
    phase: diagnostic.phase,
    kind: diagnostic.kind,
    message: diagnostic.message,
    path: diagnostic.path,
    span: diagnostic.span,
    metadata: diagnostic.metadata
  };
}

function idFragment(value) {
  return String(value ?? 'native')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'native';
}
