#!/usr/bin/env node
import http from 'node:http';
import { compileNativeSource, createSemanticImportSidecar, importNativeSource, writeUniversalAstJson } from '../dist/index.js';
import {
  createTsToPythonWorkbenchAdapter,
  createTsToRustWorkbenchAdapter
} from './js-frontier-rust-workbench-adapters.mjs';
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

if (args.smoke) {
  const result = convertSource(sampleSource, { sourceLanguage: 'typescript' });
  assert(result.summary.symbols >= 2, 'expected semantic symbols');
  assert(result.frontier.universalAst.valid, 'expected valid universal AST summary');
  assert(result.projections.rust.output.includes('pub'), 'expected Rust projection');
  assert(result.projections.python.output.includes('def add_todo'), 'expected Python projection');
  const html = renderWorkbenchHtml({
    sourceLanguage: 'typescript',
    sources: { typescript: sampleSource },
    result
  });
  const client = workbenchClientScript();
  const styles = workbenchStyles();
  assert(html.includes('id="convertForm"'), 'expected submit form');
  assert(html.includes('id="typescriptInput"'), 'expected TypeScript input pane');
  assert(html.includes('id="frontierJson"'), 'expected Frontier graph JSON pane');
  assert(html.includes('id="rustOutput"'), 'expected Rust output pane');
  assert(html.includes('id="pythonOutput"'), 'expected Python output pane');
  assert(client.includes("addEventListener('submit'"), 'expected submit-based conversion listener');
  assert(styles.includes('grid-template-columns: minmax(260px, 0.9fr) minmax(320px, 1.1fr) minmax(280px, 1fr) minmax(280px, 1fr);'), 'expected four-pane desktop scaffold');
  assert(styles.includes('overflow: auto'), 'expected scrollable pane bodies');
  console.log(JSON.stringify({
    ok: true,
    summary: result.summary,
    projections: {
      rust: { ok: result.projections.rust.ok, readiness: result.projections.rust.readiness },
      python: { ok: result.projections.python.ok, readiness: result.projections.python.readiness }
    },
    layout: {
      submitBased: true,
      panes: ['typescript', 'frontier', 'rust', 'python'],
      independentScrollRegions: 4
    }
  }, null, 2));
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
        sources: { typescript: sampleSource },
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
          sourceLanguage: 'typescript'
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
  const targets = ['rust', 'python'];
  const imported = importNativeSource({
    language: sourceLanguage,
    sourcePath: `workbench/input.${sourceExtension(sourceLanguage)}`,
    sourceText: source
  });
  const targetAdapters = [createTsToRustWorkbenchAdapter(), createTsToPythonWorkbenchAdapter()];
  const projections = Object.fromEntries(targets.map((target) => {
    const projection = compileNativeSource(imported, {
      target,
      targetPath: `workbench/output.${targetExtension(target)}`,
      targetAdapters,
      emitOnBlocked: true
    });
    return [target, projectionSummary(projection, { sourceLanguage, target })];
  }));
  const sidecar = createSemanticImportSidecar(imported, { generatedAt: 0, targetPath: projections.rust?.targetPath });
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
    bounds: conversionBounds(sourceLanguage, targets.join('/')),
    projection: projections.rust,
    projections
  };
}

function projectionSummary(projection, { sourceLanguage, target }) {
  return {
    target,
    targetLanguage: target,
    sourceLanguage,
    targetPath: projection.sourceMap?.targetPath,
    mode: projection.outputMode,
    readiness: projection.readiness.readiness,
    ok: projection.ok,
    output: projection.output,
    sourceMapMappings: projection.sourceMap?.mappings.length ?? 0
  };
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
  return 'typescript';
}

function targetExtension(target) {
  if (target === 'rust') return 'rs';
  if (target === 'python') return 'py';
  return 'txt';
}

function sourceExtension(language) {
  return 'ts';
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
