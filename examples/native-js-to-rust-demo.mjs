import {
  compileFrontierSource,
  compileNativeSource,
  importNativeSource,
  writeUniversalAstJson
} from '../dist/index.js';

const javascriptSource = `import { nanoid } from "nanoid";

export function addTodo(title) {
  return { id: nanoid(), title };
}

export class TodoStore {
  save(title) {
    return addTodo(title);
  }
}
`;

const imported = importNativeSource({
  language: 'javascript',
  sourcePath: 'src/todo.js',
  sourceText: javascriptSource
});

const graphSummary = {
  universalAst: imported.universalAst.kind,
  semanticIndexId: imported.semanticIndex.id,
  symbols: imported.semanticIndex.symbols.map((symbol) => ({
    name: symbol.name,
    kind: symbol.kind,
    region: symbol.metadata?.ownershipRegionKind
  })),
  sourceMapMappings: imported.sourceMaps[0]?.mappings.length ?? 0,
  mergeReadiness: imported.metadata.nativeImportLossSummary.semanticMergeReadiness,
  losses: imported.losses.map((loss) => loss.kind)
};

console.log('--- JavaScript source ---');
console.log(javascriptSource.trim());
console.log('\n--- Frontier graph summary ---');
console.log(JSON.stringify(graphSummary, null, 2));
console.log('\n--- Universal AST envelope excerpt ---');
console.log(JSON.stringify(universalAstExcerpt(imported), null, 2));

const stubProjection = compileNativeSource(imported, {
  target: 'rust',
  targetPath: 'src/todo.rs'
});

console.log('\n--- Rust declaration stubs without a target adapter ---');
console.log(`ok=${stubProjection.ok} readiness=${stubProjection.readiness.readiness} mode=${stubProjection.outputMode}`);
console.log(stubProjection.output.trim());

const adapterProjection = compileNativeSource(imported, {
  target: 'rust',
  targetPath: 'src/todo.rs',
  targetAdapters: [createDemoJsToRustAdapter()]
});

console.log('\n--- Rust output with a host-owned target adapter ---');
console.log(`ok=${adapterProjection.ok} readiness=${adapterProjection.readiness.readiness} mode=${adapterProjection.outputMode}`);
console.log(adapterProjection.output.trim());

const frontierSource = `module TodoApp @id("mod_todo")

type TodoInput @id("type_todo_input") {
  title: Text
}

entity Todo @id("ent_todo") {
  title @id("field_title"): Text
}

action addTodo @id("action_add") {
  input TodoInput
  writes field_title
  returns Patch
}
`;

const canonicalRust = compileFrontierSource(frontierSource, { target: 'rust' });

console.log('\n--- Frontier source projected directly to Rust ---');
console.log(`ok=${canonicalRust.ok} target=${canonicalRust.target}`);
console.log(canonicalRust.output.trim());

function universalAstExcerpt(importResult) {
  const parsed = JSON.parse(writeUniversalAstJson(importResult.universalAst));
  return {
    kind: parsed.kind,
    id: parsed.id,
    documentCount: parsed.documents?.length ?? 0,
    symbolCount: parsed.semanticIndex?.symbols?.length ?? 0,
    sourceMapCount: parsed.sourceMaps?.length ?? 0
  };
}

function createDemoJsToRustAdapter() {
  return {
    id: 'demo-js-to-rust-target-adapter',
    sourceLanguage: 'javascript',
    target: 'rust',
    version: '0.0.0-demo',
    capabilities: ['declaration-stubs'],
    coverage: {
      readiness: 'ready',
      handledLossKinds: ['opaqueNative', 'declarationOnlyCoverage', 'partialSemanticIndex', 'sourceMapApproximation', 'sourcePreservation'],
      notes: ['Demo adapter turns Frontier semantic symbols into deterministic Rust scaffolding.']
    },
    project(input) {
      const symbols = input.importResult.semanticIndex?.symbols ?? [];
      return {
        output: renderRustScaffold(symbols),
        readiness: 'ready',
        evidence: [{
          id: 'evidence_demo_js_to_rust_adapter',
          kind: 'projection',
          status: 'passed',
          summary: 'Demo adapter projected JavaScript semantic symbols to Rust scaffolding.'
        }]
      };
    }
  };
}

function renderRustScaffold(symbols) {
  const lines = ['// Generated from Frontier semantic graph evidence.'];
  for (const symbol of symbols) {
    if (symbol.kind === 'class') {
      lines.push(`pub struct ${symbol.name};`, '');
    } else if (symbol.kind === 'function' || symbol.kind === 'method') {
      lines.push(`pub fn ${rustName(symbol.name)}() {`);
      lines.push('    todo!("port body from native source evidence");');
      lines.push('}', '');
    }
  }
  return `${lines.join('\n').trim()}\n`;
}

function rustName(name) {
  return String(name)
    .replace(/\./g, '_')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^A-Za-z0-9_]/g, '_')
    .toLowerCase();
}
