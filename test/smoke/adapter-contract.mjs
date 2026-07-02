import { readFile } from 'node:fs/promises';
import { assert } from './helpers.mjs';
import {
  getLanguageAdapterPackageContract,
  LanguageAdapterPackageContracts,
  queryLanguageAdapterPackageContracts,
  runNativeImporterAdapter,
  summarizeLanguageAdapterPackageContracts
} from './compiler-api.mjs';

const adapterImport = await runNativeImporterAdapter({
  id: 'fixture-estree-importer',
  language: 'javascript',
  parser: 'estree',
  version: '1.0.0',
  capabilities: ['nativeAst', 'diagnostics'],
  supportedExtensions: ['js', '.mjs'],
  diagnostics: [{ severity: 'info', code: 'adapter.ready', message: 'Fixture adapter is available.' }],
  parse(input) {
    assert.equal(input.adapterId, 'fixture-estree-importer');
    assert.equal(input.language, 'javascript');
    assert.equal(input.parser, 'estree');
    assert.equal(input.parserVersion, '1.0.0');
    assert.equal(input.sourceHash.startsWith('fnv1a32:'), true);
    assert.equal(input.options.mode, 'smoke');
    return {
      rootId: 'adapter_program',
      nodes: {
        adapter_program: { id: 'adapter_program', kind: 'Program', languageKind: 'ESTree.Program', children: ['adapter_fn'] },
        adapter_fn: { id: 'adapter_fn', kind: 'FunctionDeclaration', languageKind: 'ESTree.FunctionDeclaration', span: { path: input.sourcePath, startLine: 1, endLine: 1 } }
      },
      diagnostics: [{ severity: 'warning', code: 'adapter.opaqueBody', kind: 'opaqueNative', message: 'Function body retained as native AST.', span: { path: input.sourcePath, startLine: 1, endLine: 1 } }]
    };
  }
}, {
  sourcePath: 'src/adapter.js',
  sourceText: 'export function fromAdapter() { return true; }\n',
  adapterOptions: { mode: 'smoke' },
  metadata: { requestId: 'adapter-smoke' },
  evidence: [{
    id: 'caller_fixture_semantic_evidence',
    kind: 'host-semantic-evidence',
    status: 'passed',
    metadata: { source: 'smoke' }
  }]
});
assert.equal(adapterImport.kind, 'frontier.lang.importResult');
assert.equal(adapterImport.adapter.id, 'fixture-estree-importer');
assert.deepEqual(adapterImport.adapter.capabilities, ['nativeAst', 'diagnostics']);
assert.deepEqual(adapterImport.adapter.supportedExtensions, ['.js', '.mjs']);
assert.equal(adapterImport.adapter.coverage.exactness, 'adapter-reported-native-ast');
assert.equal(adapterImport.adapter.coverage.tokens, false);
assert.equal(adapterImport.adapter.coverage.trivia, false);
assert.equal(adapterImport.adapter.coverage.diagnostics, true);
assert.equal(adapterImport.adapter.coverage.sourceRanges, true);
assert.equal(adapterImport.adapter.coverage.generatedRanges, false);
assert.equal(adapterImport.adapter.coverage.semanticCoverage.level, 'native-ast');
assert.equal(adapterImport.adapter.coverage.observed.diagnostics, 2);
const adapterCoverageEvidence = adapterImport.adapter.coverage.capabilityEvidence;
assert.equal(adapterCoverageEvidence.declared.exactAst, false);
assert.equal(adapterCoverageEvidence.observed.exactness, 'adapter-reported-native-ast');
assert.equal(adapterCoverageEvidence.parserDiagnostics.declared, true);
assert.equal(adapterCoverageEvidence.parserDiagnostics.observed, true);
assert.equal(adapterCoverageEvidence.parserDiagnostics.count, 2);
assert.equal(adapterCoverageEvidence.sourceRanges.declared, false);
assert.equal(adapterCoverageEvidence.sourceRanges.observed, true);
assert.equal(adapterCoverageEvidence.observedOnly.includes('sourceRanges'), true);
assert.equal(adapterCoverageEvidence.gaps.includes('tokens'), true);
assert.equal(adapterCoverageEvidence.gaps.includes('trivia'), true);
assert.equal(adapterCoverageEvidence.gaps.includes('references'), true);
assert.equal(adapterCoverageEvidence.gaps.includes('types'), true);
assert.equal(adapterCoverageEvidence.gaps.includes('controlFlow'), true);
assert.equal(adapterImport.nativeAst.parser, 'estree');
assert.equal(adapterImport.nativeAst.parserVersion, '1.0.0');
assert.equal(adapterImport.nativeAst.metadata.adapterId, 'fixture-estree-importer');
assert.equal(adapterImport.nativeAst.metadata.adapterCoverage.sourceRanges, true);
assert.equal(adapterImport.sourceMaps[0].mappings.some((mapping) => mapping.nativeAstNodeId === 'adapter_fn'), true);
assert.equal(adapterImport.metadata.adapterId, 'fixture-estree-importer');
assert.equal(adapterImport.metadata.adapterCoverage.exactness, 'adapter-reported-native-ast');
assert.equal(adapterImport.metadata.requestId, 'adapter-smoke');
assert.equal(adapterImport.diagnostics.length, 2);
assert.equal(adapterImport.diagnostics.some((diagnostic) => diagnostic.code === 'adapter.opaqueBody'), true);
assert.equal(adapterImport.losses.some((loss) => loss.metadata?.diagnosticCode === 'adapter.opaqueBody'), true);
assert.equal(adapterImport.evidence.some((record) => record.id === 'caller_fixture_semantic_evidence'), true);
assert.equal(adapterImport.evidence.some((record) => record.id === 'evidence_fixture_estree_importer_native_importer_adapter' && record.status === 'passed'), true);
assert.equal(adapterImport.evidence.find((record) => record.id === 'evidence_fixture_estree_importer_native_importer_adapter').metadata.coverage.sourceRanges, true);
const packageJson = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8'));
const requiredStaticPackages = [
  ['@shapeshift-labs/frontier-lang-typescript', 'typescript-compiler-api', 'typescript'],
  ['@shapeshift-labs/frontier-lang-javascript', 'estree', 'javascript'],
  ['@shapeshift-labs/frontier-lang-rust', 'rust-syn', 'rust'],
  ['@shapeshift-labs/frontier-lang-python', 'python-ast', 'python'],
  ['@shapeshift-labs/frontier-lang-c', 'clang-ast-json', 'c']
];
const publishedPlatformPackages = [
  ['@shapeshift-labs/frontier-lang-java', '0.1.18', 'java', 'java-ast', 'semanticdb'],
  ['@shapeshift-labs/frontier-lang-kotlin', '0.1.18', 'kotlin', 'kotlin-psi', 'semanticdb'],
  ['@shapeshift-labs/frontier-lang-swift', '0.1.18', 'swift', 'swift-syntax', 'sourcekit-lsp'],
  ['@shapeshift-labs/frontier-lang-csharp', '0.1.18', 'csharp', 'roslyn-csharp', 'lsp'],
  ['@shapeshift-labs/frontier-lang-go', '0.1.18', 'go', 'go-ast', 'lsp'],
  ['@shapeshift-labs/frontier-lang-clang', '0.1.18', 'c', 'clang-ast-json', 'lsp'],
  ['@shapeshift-labs/frontier-lang-assembly', '0.1.0', 'assembly', 'frontier-assembly-scan', 'assembly-semantic-scan']
];
const plannedPlatformPackages = [
  { packageName: '@shapeshift-labs/frontier-lang-lisp', language: 'lisp', queryLanguage: 'scheme', parserFormat: 'tree-sitter', semanticFormat: 'lsp', supportedLanguage: 'scheme', caveat: 'macro' },
  { packageName: '@shapeshift-labs/frontier-lang-haskell', language: 'haskell', parserFormat: 'ghc-api', semanticFormat: 'lsp', caveat: 'template haskell' },
  { packageName: '@shapeshift-labs/frontier-lang-unison', language: 'unison', parserFormat: 'unison-parser', semanticFormat: 'lsp', caveat: 'content-addressed' },
  { packageName: '@shapeshift-labs/frontier-lang-erlang', language: 'erlang', parserFormat: 'erl-parse', semanticFormat: 'lsp', caveat: 'parse transforms' },
  { packageName: '@shapeshift-labs/frontier-lang-elixir', language: 'elixir', parserFormat: 'elixir-quoted', semanticFormat: 'lsp', caveat: 'macro expansion' },
  { packageName: '@shapeshift-labs/frontier-lang-ruby', language: 'ruby', parserFormat: 'prism', semanticFormat: 'lsp', caveat: 'metaprogramming' },
  { packageName: '@shapeshift-labs/frontier-lang-php', language: 'php', parserFormat: 'php-parser', semanticFormat: 'lsp', caveat: 'composer' },
  { packageName: '@shapeshift-labs/frontier-lang-lua', language: 'lua', parserFormat: 'luaparse', semanticFormat: 'lsp', caveat: 'metatables' },
  { packageName: '@shapeshift-labs/frontier-lang-r', language: 'r', parserFormat: 'r-parser', semanticFormat: 'lsp', caveat: 'non-standard evaluation' },
  { packageName: '@shapeshift-labs/frontier-lang-julia', language: 'julia', parserFormat: 'julia-syntax', semanticFormat: 'lsp', caveat: 'multiple dispatch' },
  { packageName: '@shapeshift-labs/frontier-lang-zig', language: 'zig', parserFormat: 'zig-ast', semanticFormat: 'lsp', caveat: 'comptime' },
  { packageName: '@shapeshift-labs/frontier-lang-ocaml', language: 'ocaml', parserFormat: 'ocaml-parsetree', semanticFormat: 'lsp', caveat: 'ppx' },
  { packageName: '@shapeshift-labs/frontier-lang-scala', language: 'scala', parserFormat: 'scalameta', semanticFormat: 'semanticdb', caveat: 'semanticdb' },
  { packageName: '@shapeshift-labs/frontier-lang-dart', language: 'dart', parserFormat: 'dart-analyzer', semanticFormat: 'lsp', caveat: 'null-safety' },
  { packageName: '@shapeshift-labs/frontier-lang-sql', language: 'sql', queryLanguage: 'postgres', parserFormat: 'sqlparser', semanticFormat: 'lsp', supportedLanguage: 'postgres', caveat: 'dialect selection' },
  { packageName: '@shapeshift-labs/frontier-lang-graphql', language: 'graphql', parserFormat: 'graphql-js', semanticFormat: 'graphql-schema', caveat: 'schema' },
  { packageName: '@shapeshift-labs/frontier-lang-cypher', language: 'cypher', parserFormat: 'cypher-parser', semanticFormat: 'graph-schema', caveat: 'graph schema' },
  { packageName: '@shapeshift-labs/frontier-lang-sparql', language: 'sparql', parserFormat: 'sparqljs', semanticFormat: 'rdf-schema', caveat: 'rdf dataset' },
  { packageName: '@shapeshift-labs/frontier-lang-datalog', language: 'datalog', parserFormat: 'souffle', semanticFormat: 'logic-schema', caveat: 'fixed-point' },
  { packageName: '@shapeshift-labs/frontier-lang-jsonpath', language: 'jsonpath', parserFormat: 'jsonpath-parser', semanticFormat: 'json-schema', caveat: 'dialect selection' },
  { packageName: '@shapeshift-labs/frontier-lang-xpath', language: 'xpath', parserFormat: 'xpath-parser', semanticFormat: 'xml-schema', caveat: 'namespaces' },
  { packageName: '@shapeshift-labs/frontier-lang-promql', language: 'promql', parserFormat: 'promql-parser', semanticFormat: 'metric-catalog', caveat: 'metric catalogs' },
  { packageName: '@shapeshift-labs/frontier-lang-shader', language: 'shader', queryLanguage: 'glsl', parserFormat: 'tree-sitter', semanticFormat: 'spirv-reflect', supportedLanguage: 'glsl', caveat: 'reflection data' }
];
assert.equal(LanguageAdapterPackageContracts.length >= requiredStaticPackages.length + 6, true);
for (const [packageName, parserFormat, target] of requiredStaticPackages) {
  const contract = getLanguageAdapterPackageContract(packageName);
  assert.equal(contract.kind, 'frontier.lang.languageAdapterPackageContract');
  assert.equal(contract.version, 3);
  assert.equal(contract.package.name, packageName);
  assert.equal(contract.package.version, packageJson.dependencies[packageName]);
  assert.equal(contract.package.version, contract.releaseReadiness.packageVersion);
  assert.equal(contract.releaseReadiness.versionSource, 'package-json-dependency');
  assert.equal(contract.releaseReadiness.signals.some((signal) => signal.includes('package.json dependency')), true);
  assert.equal(contract.sourceParser.supportedLanguages.includes(contract.sourceParser.language), true);
  assert.equal(contract.sourceParser.format, parserFormat);
  assert.equal(contract.sourceParser.supportedFormats.includes(parserFormat), true);
  assert.equal(contract.sourceParser.caveats.length > 0, true);
  assert.equal(contract.targetProjection.targets.includes(target), true);
  assert.equal(contract.targetProjection.caveats.length > 0, true);
  assert.equal(contract.semanticIndex.supported, true);
  assert.equal(contract.semanticIndex.formats.includes('frontier-semantic-index'), true);
  assert.equal(contract.proofEvidence.supported, true);
  assert.equal(contract.proofEvidence.requiredEvidenceKeys.includes('semanticSidecar'.toLowerCase()), true);
  assert.equal(contract.releaseReadiness.releaseReady, true);
  assert.equal(contract.runtime.importsAdapterPackage, false);
}
for (const [packageName, packageVersion, language, parserFormat, semanticFormat] of publishedPlatformPackages) {
  const contract = getLanguageAdapterPackageContract(packageName);
  assert.equal(contract.kind, 'frontier.lang.languageAdapterPackageContract');
  assert.equal(contract.package.name, packageName);
  assert.equal(contract.package.version, packageVersion);
  assert.equal(contract.sourceParser.language, language);
  assert.equal(contract.sourceParser.format, parserFormat);
  assert.equal(contract.sourceParser.supportedFormats.includes(parserFormat), true);
  assert.equal(contract.targetProjection.supported, false);
  assert.equal(contract.targetProjection.caveats.some((caveat) => caveat.includes('No target projection package')), true);
  assert.equal(contract.semanticIndex.formats.includes('frontier-semantic-index'), true);
  assert.equal(contract.semanticIndex.formats.includes(semanticFormat), true);
  assert.equal(contract.proofEvidence.hostEvidenceRequired, true);
  assert.equal(contract.releaseReadiness.releaseReady, true);
  assert.equal(contract.releaseReadiness.versionSource, 'static-package-catalog');
  assert.equal(contract.releaseReadiness.signals.some((signal) => signal.includes('Host parser')), true);
  assert.equal(contract.runtime.importsAdapterPackage, false);
}
assert.equal(plannedPlatformPackages.length >= 5, true);
for (const planned of plannedPlatformPackages) {
  const contract = getLanguageAdapterPackageContract({ language: planned.queryLanguage ?? planned.language, packageClass: 'platform-importer' });
  assert.equal(contract.kind, 'frontier.lang.languageAdapterPackageContract');
  assert.equal(contract.package.name, planned.packageName);
  assert.equal(contract.package.version, '0.0.0');
  assert.equal(contract.sourceParser.language, planned.language);
  assert.equal(contract.sourceParser.format, planned.parserFormat);
  assert.equal(contract.sourceParser.supportedLanguages.includes(planned.supportedLanguage ?? planned.language), true);
  assert.equal(contract.sourceParser.caveats.some((caveat) => caveat.toLowerCase().includes(planned.caveat)), true);
  assert.equal(contract.targetProjection.supported, false);
  assert.equal(contract.targetProjection.caveats.some((caveat) => caveat.includes('No target projection package')), true);
  assert.equal(contract.semanticIndex.formats.includes('frontier-semantic-index'), true);
  assert.equal(contract.semanticIndex.formats.includes(planned.semanticFormat), true);
  assert.equal(contract.proofEvidence.hostEvidenceRequired, true);
  assert.equal(contract.proofEvidence.requiredEvidenceKeys.includes('sourcepreservationevidence'), true);
  assert.equal(contract.releaseReadiness.status, 'needs-review');
  assert.equal(contract.releaseReadiness.releaseReady, false);
  assert.equal(contract.releaseReadiness.versionSource, 'related-package-catalog-placeholder');
  assert.equal(contract.releaseReadiness.blockers.length > 0, true);
  assert.equal(contract.releaseReadiness.signals.some((signal) => signal.includes('0.0.0')), true);
  assert.equal(contract.runtime.importsAdapterPackage, false);
}
const javaPackageContract = getLanguageAdapterPackageContract({ language: 'java', packageClass: 'platform-importer' });
assert.equal(javaPackageContract.package.name, '@shapeshift-labs/frontier-lang-java');
assert.equal(javaPackageContract.sourceParser.format, 'java-ast');
assert.equal(javaPackageContract.targetProjection.supported, false);
assert.equal(javaPackageContract.semanticIndex.formats.includes('semanticdb'), true);
assert.equal(javaPackageContract.proofEvidence.hostEvidenceRequired, true);
assert.equal(javaPackageContract.releaseReadiness.releaseReady, true);
assert.equal(javaPackageContract.releaseReadiness.versionSource, 'static-package-catalog');
assert.equal(javaPackageContract.releaseReadiness.signals.some((signal) => signal.includes('Host parser')), true);
assert.equal(javaPackageContract.runtime.importsAdapterPackage, false);
const goPackageContract = getLanguageAdapterPackageContract({ packageName: '@shapeshift-labs/frontier-lang-go' });
assert.equal(goPackageContract.sourceParser.language, 'go');
assert.equal(goPackageContract.sourceParser.format, 'go-ast');
assert.equal(goPackageContract.sourceParser.supportedFormats.includes('go-ast'), true);
assert.equal(goPackageContract.targetProjection.supported, false);
assert.equal(goPackageContract.releaseReadiness.releaseReady, true);
const clangPackageContract = getLanguageAdapterPackageContract({ packageName: '@shapeshift-labs/frontier-lang-clang' });
assert.equal(clangPackageContract.sourceParser.format, 'clang-ast-json');
assert.equal(clangPackageContract.sourceParser.supportedLanguages.includes('c'), true);
assert.equal(clangPackageContract.sourceParser.supportedLanguages.includes('cpp'), true);
assert.equal(clangPackageContract.proofEvidence.requiredEvidenceKeys.includes('compilecommandshash'), true);
assert.equal(clangPackageContract.proofEvidence.requiredEvidenceKeys.includes('preprocessorrecordshash'), true);
assert.equal(clangPackageContract.targetProjection.caveats.some((caveat) => caveat.includes('No target projection package')), true);
assert.equal(queryLanguageAdapterPackageContracts({ packageClass: 'platform-importer' }).length >= 6, true);
assert.equal(queryLanguageAdapterPackageContracts({ releaseReady: true }).length >= 11, true);
assert.equal(queryLanguageAdapterPackageContracts({ importsAdapterPackage: true }).length, 0);
const packageSummary = summarizeLanguageAdapterPackageContracts();
assert.equal(packageSummary.runtimeImportsAdapterPackages, 0);
assert.equal(packageSummary.byPackageClass['target-projection'] >= 5, true);
assert.equal(packageSummary.byPackageClass['platform-importer'] >= 6, true);
assert.equal(packageSummary.byReleaseReadiness['ready-with-losses'] >= 11, true);
assert.equal(packageSummary.byReleaseReadiness['needs-review'] >= plannedPlatformPackages.length, true);
assert.equal(packageSummary.parserFormats.includes('go-ast'), true);
assert.equal(packageSummary.parserFormats.includes('clang-ast-json'), true);
assert.equal(packageSummary.parserFormats.includes('scalameta'), true);
assert.equal(queryLanguageAdapterPackageContracts({ language: 'scheme', packageClass: 'platform-importer' })[0].package.name, '@shapeshift-labs/frontier-lang-lisp');
assert.equal(queryLanguageAdapterPackageContracts({ language: 'glsl', packageClass: 'platform-importer' })[0].package.name, '@shapeshift-labs/frontier-lang-shader');
export const failedAdapterImport = await runNativeImporterAdapter({
  id: 'throwing-typescript-importer',
  language: 'typescript',
  parser: 'typescript-compiler-api',
  parse() {
    throw new Error('fixture parser failure');
  }
}, {
  sourcePath: 'src/broken.ts',
  sourceText: 'export const = ;\n'
});
assert.equal(failedAdapterImport.kind, 'frontier.lang.importResult');
assert.equal(failedAdapterImport.nativeAst.rootId, 'adapter_error_root');
assert.equal(failedAdapterImport.diagnostics.some((diagnostic) => diagnostic.code === 'adapter.parse.threw'), true);
assert.equal(failedAdapterImport.losses.some((loss) => loss.severity === 'error'), true);
assert.equal(failedAdapterImport.evidence.some((record) => record.id === 'evidence_throwing_typescript_importer_native_importer_adapter' && record.status === 'failed'), true);
