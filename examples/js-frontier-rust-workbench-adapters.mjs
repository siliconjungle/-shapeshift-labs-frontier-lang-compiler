export function createTsToRustWorkbenchAdapter() {
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

export function createTsToPythonWorkbenchAdapter() {
  return {
    id: 'frontier-lang-workbench-ts-to-python',
    sourceLanguage: 'typescript',
    target: 'python',
    version: '0.0.0-demo',
    capabilities: ['semantic-symbol-scaffold'],
    coverage: {
      readiness: 'ready',
      handledLossKinds: ['opaqueNative', 'declarationOnlyCoverage', 'partialSemanticIndex', 'sourceMapApproximation', 'sourcePreservation'],
      notes: ['Workbench adapter lowers TypeScript semantic symbols to Python scaffolding and leaves bodies explicit.']
    },
    project(input) {
      return {
        output: pythonFromSymbols(input.importResult.semanticIndex?.symbols ?? []),
        readiness: 'ready',
        evidence: [{
          id: 'evidence_workbench_js_to_python',
          kind: 'projection',
          status: 'passed',
          summary: 'Workbench adapter projected TypeScript semantic symbols to Python scaffolding.'
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

function pythonFromSymbols(symbols) {
  const lines = ['# Generated from Frontier semantic graph evidence.'];
  for (const symbol of symbols) {
    if (symbol.kind === 'type' || symbol.kind === 'class') lines.push('', `class ${safeTypeName(symbol.name)}:`, '    pass');
    if (symbol.kind === 'function' || symbol.kind === 'method') {
      lines.push('', `def ${safePythonName(symbol.name)}(*args):`, '    raise NotImplementedError("port body from preserved TypeScript source")');
    }
  }
  return `${lines.join('\n').trim()}\n`;
}

function safeTypeName(name) {
  const clean = String(name).replace(/[^A-Za-z0-9_]/g, '');
  return clean && /^[A-Z]/.test(clean) ? clean : `Frontier${clean || 'Type'}`;
}

function safeRustName(name) {
  return String(name).replace(/\./g, '_').replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/[^A-Za-z0-9_]/g, '_').toLowerCase();
}

function safePythonName(name) {
  const clean = String(name).replace(/\./g, '_').replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/[^A-Za-z0-9_]/g, '_').toLowerCase();
  return /^[A-Za-z_]/.test(clean) ? clean : `frontier_${clean}`;
}
