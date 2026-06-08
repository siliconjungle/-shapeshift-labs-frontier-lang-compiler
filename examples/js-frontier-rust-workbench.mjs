#!/usr/bin/env node
import http from 'node:http';
import { convertSource } from './js-frontier-rust-workbench-convert.mjs';
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
  assert(result.routeExplanation.routes.length === 2, 'expected route explanation for both targets');
  assert(result.routeExplanation.semanticMerge.readiness === 'blocked', 'expected blocked semantic merge readiness');
  assert(result.routeExplanation.semanticMerge.missingEvidence.includes('proof-or-replay-evidence'), 'expected missing proof evidence');
  assert(result.routeExplanation.semanticMerge.missingEvidence.includes('merge-ready-parser'), 'expected missing parser evidence');
  assert(result.routeExplanation.semanticMerge.missingEvidence.includes('runtime-adapter-evidence'), 'expected missing runtime adapter evidence');
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
  assert(client.includes('Route Explanation'), 'expected route explanation rendering');
  assert(styles.includes('grid-template-columns: minmax(260px, 0.9fr) minmax(320px, 1.1fr) minmax(280px, 1fr) minmax(280px, 1fr);'), 'expected four-pane desktop scaffold');
  assert(styles.includes('overflow: auto'), 'expected scrollable pane bodies');
  assert(styles.includes('.workspace {'), 'expected fixed workspace section');
  assert(styles.includes('.routeCard'), 'expected route explanation styles');
  console.log(JSON.stringify({
    ok: true,
    summary: result.summary,
    projections: {
      rust: { ok: result.projections.rust.ok, readiness: result.projections.rust.readiness },
      python: { ok: result.projections.python.ok, readiness: result.projections.python.readiness }
    },
    routeExplanation: {
      semanticMerge: result.routeExplanation.semanticMerge,
      routes: result.routeExplanation.routes.map((route) => ({
        target: route.target,
        mode: route.mode,
        routeAction: route.routeAction,
        readiness: route.readiness,
        admissionAction: route.semanticMerge.admissionAction,
        missingEvidence: route.missingEvidence
      }))
    },
    layout: {
      submitBased: true,
      panes: ['typescript', 'frontier', 'rust', 'python'],
      independentScrollRegions: 4,
      fixedSections: ['topbar', 'statusStrip', 'workspace']
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
