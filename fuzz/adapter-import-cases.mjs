import assert from 'node:assert/strict';
import { runNativeImporterAdapter } from '../dist/index.js';
import {
  createClangAstImportCase,
  createEstreeImportCase,
  createGoAstImportCase,
  createJavaAstImportCase,
  createPythonAstImportCase,
  createRustSynImportCase
} from './adapter-fixtures.mjs';
import {
  createCSharpRoslynImportCase,
  createKotlinPsiImportCase,
  createSwiftSyntaxImportCase
} from './adapter-fixtures-extra.mjs';
import { runLightweightNativeCase } from './lightweight-native-cases.mjs';

export async function runAdapterImportCases(adapters) {
  for (let index = 0; index < 50; index += 1) {
    await assertEstreeImport(index, adapters.estreeAdapter);
    await assertReadyImport(
      await runNativeImporterAdapter(adapters.pythonAstAdapter, createPythonAstImportCase(index)),
      'python-ast',
      `fuzz_py_${index}`
    );
    await assertReadyImport(
      await runNativeImporterAdapter(adapters.rustSynAdapter, createRustSynImportCase(index)),
      'syn',
      `fuzz_rust_${index}`
    );
    await assertReadyImport(
      await runNativeImporterAdapter(adapters.clangAstAdapter, createClangAstImportCase(index)),
      'clang',
      `fuzz_c_${index}`
    );
    await assertReadyImport(
      await runNativeImporterAdapter(adapters.goAstAdapter, createGoAstImportCase(index)),
      'go/parser',
      `fuzzGo${index}`
    );
    await assertReadyImport(
      await runNativeImporterAdapter(adapters.javaAstAdapter, createJavaAstImportCase(index)),
      'javac',
      `FuzzJava${index}`
    );
    await assertReadyImport(
      await runNativeImporterAdapter(adapters.kotlinPsiAdapter, createKotlinPsiImportCase(index)),
      'kotlin-psi',
      `FuzzKotlin${index}`
    );
    await assertReadyImport(
      await runNativeImporterAdapter(adapters.csharpRoslynAdapter, createCSharpRoslynImportCase(index)),
      'roslyn',
      `FuzzCSharp${index}`
    );
    await assertReadyImport(
      await runNativeImporterAdapter(adapters.swiftSyntaxAdapter, createSwiftSyntaxImportCase(index)),
      'swift-syntax',
      `FuzzSwift${index}`
    );
    runLightweightNativeCase(index);
  }
}

async function assertEstreeImport(index, estreeAdapter) {
  const { name, ...importCase } = createEstreeImportCase(index);
  const imported = await runNativeImporterAdapter(estreeAdapter, importCase);
  assert.equal(imported.nativeAst.rootId.startsWith('native_program'), true);
  assert.equal(imported.semanticIndex.symbols.some((symbol) => symbol.name === name), true);
  assert.ok(imported.sourceMaps[0].mappings.length >= 1);
  assert.equal(imported.adapter.coverage.capabilityEvidence.declared.exactAst, true);
  assert.equal(imported.adapter.coverage.capabilityEvidence.declared.tokens, true);
  assert.equal(imported.adapter.coverage.capabilityEvidence.declared.trivia, true);
  assert.equal(imported.adapter.coverage.capabilityEvidence.observed.tokens, false);
  assert.equal(imported.adapter.coverage.capabilityEvidence.observed.trivia, false);
  assert.equal(imported.adapter.coverage.capabilityEvidence.observed.sourceRanges, true);
  assert.equal(imported.adapter.coverage.capabilityEvidence.gaps.includes('tokens'), false);
  assert.equal(imported.metadata.sourcePreservation.summary.parserTriviaExactnessStatus, 'approximate');
}

async function assertReadyImport(imported, parser, symbolName) {
  assert.equal(imported.adapter.parser, parser);
  assert.equal(imported.metadata.nativeImportLossSummary.semanticMergeReadiness, 'ready');
  assert.equal(imported.semanticIndex.symbols.some((symbol) => symbol.name === symbolName), true);
}
