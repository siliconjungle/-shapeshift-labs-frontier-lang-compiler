#!/usr/bin/env node
import http from 'node:http';
import { compileNativeSource, createSemanticImportSidecar, importNativeSource, writeUniversalAstJson } from '../dist/index.js';
import { conversionBounds } from './js-frontier-rust-workbench-bounds.mjs';
import { renderWorkbenchHtml } from './js-frontier-rust-workbench-html.mjs';
import { workbenchClientScript } from './js-frontier-rust-workbench-client.mjs';
import { workbenchStyles } from './js-frontier-rust-workbench-styles.mjs';

const args = readArgs(process.argv.slice(2));
const port = Number(args.port ?? 4177);
const sampleSource = `import { nanoid } from "nanoid";

export type TodoInput = {
  title: string;
};

export function addTodo(input: TodoInput) {
  return { id: nanoid(), title: input.title };
}

export class TodoStore {
  save(title: string) {
    return addTodo({ title });
  }
}
`;
const sampleRustSource = `// Generated from Frontier semantic graph evidence.
pub fn add_todo() {
    // port body from preserved TypeScript source
}

pub struct TodoStore;
`;

if (args.smoke) {
  const result = convertSource(sampleSource, { sourceLanguage: 'typescript' });
  assert(result.summary.symbols >= 2, 'expected semantic symbols');
  assert(result.projection.output.includes('pub'), 'expected Rust projection');
  const reverse = convertSource(result.projection.output, { sourceLanguage: 'rust' });
  assert(reverse.projection.output.includes('export'), 'expected TypeScript projection');
  console.log(JSON.stringify({ ok: true, summary: result.summary }, null, 2));
} else {
  const server = http.createServer(routeRequest);
  server.listen(port, '127.0.0.1', () => {
    console.log(`Frontier Lang workbench: http://127.0.0.1:${port}/`);
  });
}

async function routeRequest(request, response) {
  try {
    if (request.method === 'GET' && request.url === '/') {
      return send(response, 200, renderWorkbenchHtml({
        sourceLanguage: 'typescript',
        sources: { typescript: sampleSource, rust: sampleRustSource },
        result: convertSource(sampleSource, { sourceLanguage: 'typescript' })
      }), 'text/html; charset=utf-8');
    }
    if (request.method === 'GET' && request.url === '/styles.css') {
      return send(response, 200, workbenchStyles(), 'text/css; charset=utf-8');
    }
    if (request.method === 'GET' && request.url === '/client.js') {
      return send(response, 200, workbenchClientScript(), 'text/javascript; charset=utf-8');
    }
    if (request.method === 'POST' && request.url === '/api/convert') {
      const body = await readJsonBody(request);
      return sendJson(response, 200, {
        ok: true,
        result: convertSource(String(body.source ?? ''), {
          sourceLanguage: body.sourceLanguage ?? 'typescript'
        })
      });
    }
    return send(response, 404, 'not found', 'text/plain; charset=utf-8');
  } catch (error) {
    return sendJson(response, 500, { ok: false, error: String(error.message || error) });
  }
}

function convertSource(source, options = {}) {
  const sourceLanguage = normalizeSourceLanguage(options.sourceLanguage);
  const target = sourceLanguage === 'rust' ? 'typescript' : 'rust';
  const imported = importNativeSource({
    language: sourceLanguage,
    sourcePath: `workbench/input.${sourceExtension(sourceLanguage)}`,
    sourceText: source
  });
  const projection = compileNativeSource(imported, {
    target,
    targetPath: `workbench/output.${targetExtension(target)}`,
    targetAdapters: [createTsToRustWorkbenchAdapter(), createRustToTsWorkbenchAdapter()],
    emitOnBlocked: true
  });
  const sidecar = createSemanticImportSidecar(imported, { generatedAt: 0, targetPath: projection.sourceMap?.targetPath });
  return {
    sourceHash: imported.nativeSource.sourceHash,
    sourceLanguage,
    summary: {
      readiness: sidecar.summary.readiness,
      symbols: imported.semanticIndex.symbols.length,
      sourceMapMappings: imported.sourceMaps[0]?.mappings.length ?? 0,
      losses: imported.losses.length,
      patchHints: sidecar.patchHints.length
    },
    frontier: {
      universalAst: universalAstSummary(imported),
      semanticIndexId: imported.semanticIndex.id,
      sidecarId: sidecar.id,
      symbols: imported.semanticIndex.symbols.map(symbolSummary),
      relations: relationSummaries(imported),
      losses: imported.losses.map(lossSummary),
      patchHints: sidecar.patchHints.map((hint) => ({
        id: hint.id,
        readiness: hint.readiness,
        operations: hint.supportedOperations,
        ownershipKey: hint.ownershipKey
      }))
    },
    bounds: conversionBounds(sourceLanguage, target),
    projection: {
      target,
      targetLanguage: target,
      sourceLanguage,
      mode: projection.outputMode,
      readiness: projection.readiness.readiness,
      ok: projection.ok,
      output: projection.output,
      sourceMapMappings: projection.sourceMap?.mappings.length ?? 0
    }
  };
}

function createTsToRustWorkbenchAdapter() {
  return {
    id: 'frontier-lang-workbench-ts-to-rust',
    sourceLanguage: 'typescript',
    target: 'rust',
    version: '0.0.0-demo',
    capabilities: ['semantic-symbol-scaffold'],
    coverage: {
      readiness: 'ready',
      handledLossKinds: ['opaqueNative', 'declarationOnlyCoverage', 'partialSemanticIndex', 'sourceMapApproximation', 'sourcePreservation'],
      notes: ['Workbench adapter lowers TypeScript semantic symbols to Rust scaffolding and leaves bodies explicit.']
    },
    project(input) {
      return {
        output: rustFromSymbols(input.importResult.semanticIndex?.symbols ?? []),
        readiness: 'ready',
        evidence: [{
          id: 'evidence_workbench_js_to_rust',
          kind: 'projection',
          status: 'passed',
          summary: 'Workbench adapter projected TypeScript semantic symbols to Rust scaffolding.'
        }]
      };
    }
  };
}

function createRustToTsWorkbenchAdapter() {
  return {
    id: 'frontier-lang-workbench-rust-to-ts',
    sourceLanguage: 'rust',
    target: 'typescript',
    version: '0.0.0-demo',
    capabilities: ['semantic-symbol-scaffold'],
    coverage: {
      readiness: 'ready',
      handledLossKinds: ['opaqueNative', 'macroExpansion', 'declarationOnlyCoverage', 'partialSemanticIndex', 'sourceMapApproximation', 'sourcePreservation'],
      notes: ['Workbench adapter lowers Rust semantic symbols to TypeScript scaffolding and leaves bodies explicit.']
    },
    project(input) {
      return {
        output: tsFromSymbols(input.importResult.semanticIndex?.symbols ?? []),
        readiness: 'ready',
        evidence: [{
          id: 'evidence_workbench_rust_to_ts',
          kind: 'projection',
          status: 'passed',
          summary: 'Workbench adapter projected Rust semantic symbols to TypeScript scaffolding.'
        }]
      };
    }
  };
}

function rustFromSymbols(symbols) {
  const lines = ['// Generated from Frontier semantic graph evidence.'];
  for (const symbol of symbols) {
    if (symbol.kind === 'class') lines.push('', `pub struct ${safeTypeName(symbol.name)};`);
    if (symbol.kind === 'function' || symbol.kind === 'method') {
      lines.push('', `pub fn ${safeRustName(symbol.name)}() {`, '    // port body from preserved TypeScript source', '}');
    }
  }
  return `${lines.join('\n').trim()}\n`;
}

function tsFromSymbols(symbols) {
  const lines = ['// Generated from Frontier semantic graph evidence.'];
  for (const symbol of symbols) {
    if (symbol.kind === 'type' || symbol.kind === 'class') lines.push('', `export class ${safeTypeName(symbol.name)} {}`);
    if (symbol.kind === 'function' || symbol.kind === 'method') {
      lines.push('', `export function ${safeJsName(symbol.name)}(...args: unknown[]) {`, "  throw new Error('port body from preserved Rust source');", '}');
    }
  }
  return `${lines.join('\n').trim()}\n`;
}

function universalAstSummary(imported) {
  const summary = { valid: true, validationError: undefined };
  let parsed = imported.universalAst;
  try {
    parsed = JSON.parse(writeUniversalAstJson(imported.universalAst));
  } catch (error) {
    summary.valid = false;
    summary.validationError = String(error.message || error);
  }
  return {
    ...summary,
    kind: parsed.kind,
    id: parsed.id,
    nativeSources: parsed.nativeSources?.length ?? 0,
    semanticSymbols: parsed.semanticIndex?.symbols?.length ?? 0,
    sourceMaps: parsed.sourceMaps?.length ?? 0,
    layers: Object.keys(parsed.layers ?? {})
  };
}

function symbolSummary(symbol) {
  return {
    id: symbol.id,
    name: symbol.name,
    kind: symbol.kind,
    language: symbol.language,
    region: symbol.metadata?.ownershipRegionKind,
    ownershipKey: symbol.metadata?.ownershipRegionKey
  };
}

function relationSummaries(imported) {
  const names = new Map(imported.semanticIndex.symbols.map((symbol) => [symbol.id, symbol.name]));
  return imported.semanticIndex.relations.map((relation) => ({
    id: relation.id,
    predicate: relation.predicate,
    label: `${names.get(relation.sourceId) ?? relation.sourceId} ${relation.predicate} ${names.get(relation.targetId) ?? relation.targetId}`
  }));
}

function lossSummary(loss) {
  return { id: loss.id, kind: loss.kind, severity: loss.severity, message: loss.message };
}

function normalizeSourceLanguage(language) {
  return String(language || 'typescript').toLowerCase() === 'rust' ? 'rust' : 'typescript';
}

function targetExtension(target) {
  return target === 'rust' ? 'rs' : 'ts';
}

function sourceExtension(language) {
  return language === 'rust' ? 'rs' : 'ts';
}

function safeTypeName(name) {
  const clean = String(name).replace(/[^A-Za-z0-9_]/g, '');
  return clean && /^[A-Z]/.test(clean) ? clean : `Frontier${clean || 'Type'}`;
}

function safeRustName(name) {
  return String(name).replace(/\./g, '_').replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/[^A-Za-z0-9_]/g, '_').toLowerCase();
}

function safeJsName(name) {
  const clean = String(name).replace(/[^A-Za-z0-9_$]/g, '_');
  return /^[A-Za-z_$]/.test(clean) ? clean : `frontier_${clean}`;
}

function sendJson(response, status, value) {
  return send(response, status, JSON.stringify(value), 'application/json; charset=utf-8');
}

function send(response, status, body, type) {
  response.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
  response.end(body);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let text = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      text += chunk;
      if (text.length > 200000) reject(new Error('request body too large'));
    });
    request.on('end', () => resolve(text ? JSON.parse(text) : {}));
    request.on('error', reject);
  });
}

function readArgs(entries) {
  const parsed = {};
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (entry === '--serve') parsed.serve = true;
    else if (entry === '--smoke') parsed.smoke = true;
    else if (entry === '--port') parsed.port = entries[++index];
    else if (entry.startsWith('--port=')) parsed.port = entry.slice('--port='.length);
  }
  return parsed;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
