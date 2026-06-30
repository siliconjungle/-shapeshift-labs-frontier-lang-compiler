import { assert } from './helpers.mjs';
import {
  createSemanticImportSidecar,
  createSemanticResourceGraph,
  createUniversalLifetimeConstraintEvidence,
  createUniversalOwnershipConstraintEvidence,
  importNativeSource,
  querySemanticResourceGraph
} from './compiler-api.mjs';

const managedGraph = createSemanticResourceGraph({
  imports: [
    importNativeSource({
      language: 'java',
      sourcePath: 'src/Reader.java',
      sourceText: [
        'class Reader {',
        '  WeakReference<Session> cached;',
        '  void read(Path path) throws Exception {',
        '    try (BufferedReader reader = Files.newBufferedReader(path)) {',
        '      reader.readLine();',
        '    }',
        '  }',
        '  protected void finalize() {}',
        '}',
        ''
      ].join('\n')
    }),
    importNativeSource({
      language: 'csharp',
      sourcePath: 'src/Reader.cs',
      sourceText: [
        'class Reader {',
        '  WeakReference<Session> cached;',
        '  void Read(string path) {',
        '    using var reader = File.OpenText(path);',
        '    reader.ReadLine();',
        '  }',
        '  ~Reader() {}',
        '}',
        ''
      ].join('\n')
    }),
    importNativeSource({
      language: 'swift',
      sourcePath: 'Sources/Reader.swift',
      sourceText: [
        'class Reader {',
        '  weak var delegate: ReaderDelegate?',
        '  unowned var owner: Owner',
        '  deinit {}',
        '}',
        ''
      ].join('\n')
    })
  ]
});

const deterministicDrops = managedGraph.drops.filter((record) => record.metadata?.dropSemantics === 'managed-deterministic-disposal');
const finalizerDrops = managedGraph.drops.filter((record) => record.metadata?.dropSemantics === 'managed-finalizer');
const weakAliases = managedGraph.aliases.filter((record) => record.metadata?.aliasSemantics === 'managed-weak-reference');
const unownedAliases = managedGraph.aliases.filter((record) => record.metadata?.aliasSemantics === 'managed-unowned-reference');
const finalizerUnsafe = managedGraph.unsafeBoundaries.filter((record) => String(record.metadata?.proofGapCode ?? '').includes('finalizer-nondeterministic-boundary'));

assert.equal(managedGraph.status, 'blocked');
assert.equal(deterministicDrops.some((record) => record.dropKind === 'java-auto-close'), true);
assert.equal(deterministicDrops.some((record) => record.dropKind === 'csharp-dispose'), true);
assert.equal(finalizerDrops.some((record) => record.dropKind === 'java-finalize-method'), true);
assert.equal(finalizerDrops.some((record) => record.dropKind === 'csharp-finalizer'), true);
assert.equal(finalizerDrops.some((record) => record.dropKind === 'swift-deinit'), true);
assert.equal(weakAliases.some((record) => record.aliasKind === 'java-weak-reference'), true);
assert.equal(weakAliases.some((record) => record.aliasKind === 'csharp-weak-reference'), true);
assert.equal(weakAliases.some((record) => record.aliasKind === 'swift-weak-reference'), true);
assert.equal(unownedAliases.some((record) => record.aliasKind === 'swift-unowned-reference'), true);
assert.equal(finalizerUnsafe.length, 3);
assert.equal(querySemanticResourceGraph(managedGraph, { unsafe: true }).length >= 3, true);

const managedOwnershipConstraint = createUniversalOwnershipConstraintEvidence({
  sourceLanguage: 'java',
  target: 'typescript',
  sourceGraph: managedGraph
});

assert.equal(managedOwnershipConstraint.requiredKinds.includes('destructor-drop-semantics'), true);
assert.equal(managedOwnershipConstraint.missingEvidence.includes('translation-ownership-constraint:destructor-drop-semantics'), true);
assert.equal(managedOwnershipConstraint.constraints.find((record) => record.kind === 'destructor-drop-semantics')?.source.includes('managed-deterministic-disposal'), true);
assert.equal(managedOwnershipConstraint.constraints.find((record) => record.kind === 'destructor-drop-semantics')?.source.includes('managed-finalizer'), true);
assert.equal(managedOwnershipConstraint.claims.semanticEquivalenceClaim, false);

const managedLifetimeConstraint = createUniversalLifetimeConstraintEvidence({
  sourceLanguage: 'java',
  target: 'typescript',
  sourceGraph: managedGraph
});

assert.equal(managedLifetimeConstraint.requiredKinds.includes('alias-region-binding'), true);
assert.equal(managedLifetimeConstraint.requiredKinds.includes('unsafe-lifetime-proof'), true);
assert.equal(managedLifetimeConstraint.missingEvidence.includes('translation-lifetime-constraint:alias-region-binding'), true);
assert.equal(managedLifetimeConstraint.missingEvidence.includes('translation-lifetime-unsafe-proof'), true);

const goDeferImport = importNativeSource({
  language: 'go',
  sourcePath: 'reader.go',
  sourceText: [
    'func read(file *os.File) {',
    '  defer file.Close()',
    '}',
    ''
  ].join('\n')
});
const goDeferGraph = createSemanticImportSidecar(goDeferImport, { generatedAt: 146 }).resourceGraph;

assert.equal(goDeferGraph.drops.some((record) => record.metadata?.dropSemantics === 'managed-deterministic-disposal'), true);
assert.equal(goDeferGraph.drops.some((record) => record.metadata?.disposalSemantics === 'go-defer-disposal'), true);
