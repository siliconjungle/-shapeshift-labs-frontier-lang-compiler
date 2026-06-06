import { performance } from 'node:perf_hooks';
import { importNativeSource, runNativeImporterAdapter } from '../dist/index.js';
import { createBenchNativeAdapters } from './native-adapters.mjs';

export async function collectNativeImports() {
  const importStart = performance.now();
  const adapters = createBenchNativeAdapters();
  let nativeSymbols = 0;
  const nativeImportResults = [];

  for (let index = 0; index < 150; index += 1) {
    const imported = index % 2 === 0
      ? importNativeSource({
        language: 'javascript',
        sourcePath: `src/bench-${index}.js`,
        sourceText: `export function bench${index}() { return ${index}; }\n`
      })
      : await runNativeImporterAdapter(adapters.estreeAdapter, {
        sourcePath: `src/bench-${index}.js`,
        sourceText: `export function bench${index}() { return ${index}; }\n`,
        adapterOptions: {
          ast: {
            type: 'Program',
            loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 42 } },
            body: [{
              type: 'FunctionDeclaration',
              id: { type: 'Identifier', name: `bench${index}` },
              loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 42 } }
            }]
          }
        }
      });
    nativeSymbols += imported.semanticIndex?.symbols?.length ?? 0;
    nativeImportResults.push(imported);
  }

  for (let index = 0; index < 50; index += 1) {
    const imported = await runNativeImporterAdapter(adapters.kotlinPsiAdapter, createKotlinBenchCase(index));
    nativeSymbols += imported.semanticIndex?.symbols?.length ?? 0;
    nativeImportResults.push(imported);
  }

  return {
    adapters,
    nativeImportResults,
    nativeSymbols,
    nativeImportDurationMs: performance.now() - importStart
  };
}

function createKotlinBenchCase(index) {
  return {
    sourcePath: `src/bench-${index}.kt`,
    sourceText: `package bench\nclass BenchKotlin${index}(val title: String) { fun render${index}() = title }\n`,
    adapterOptions: {
      ast: {
        kind: 'KtFile',
        packageDirective: { kind: 'KtPackageDirective', fqName: 'bench' },
        declarations: [{
          kind: 'KtClass',
          name: `BenchKotlin${index}`,
          declarations: [{
            kind: 'KtPrimaryConstructor',
            parameters: [{
              kind: 'KtParameter',
              name: 'title',
              typeReference: { text: 'String' },
              valOrVarKeyword: 'val'
            }]
          }, {
            kind: 'KtNamedFunction',
            name: `render${index}`,
            bodyExpression: { kind: 'KtBlockExpression' }
          }]
        }]
      }
    }
  };
}
