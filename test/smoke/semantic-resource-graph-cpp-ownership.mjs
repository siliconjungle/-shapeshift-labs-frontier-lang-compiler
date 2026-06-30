import { assert } from './helpers.mjs';
import {
  createSemanticImportSidecar,
  createUniversalOwnershipConstraintEvidence,
  importNativeSource,
  querySemanticResourceGraph
} from './compiler-api.mjs';

const cppOwnershipImport = importNativeSource({
  language: 'cpp',
  sourcePath: 'src/cpp_ownership.cpp',
  sourceText: [
    '#include <memory>',
    '#include <mutex>',
    'std::unique_ptr<Buffer> make_buffer() {',
    '  auto owned = std::make_unique<Buffer>();',
    '  auto moved = std::move(owned);',
    '  return std::move(moved);',
    '}',
    '',
    'void handoff() {',
    '  auto owned = std::make_unique<Buffer>();',
    '  consume(std::move(owned));',
    '  std::lock_guard<std::mutex> lock(globalMutex);',
    '}',
    ''
  ].join('\n')
});

const cppOwnershipGraph = createSemanticImportSidecar(cppOwnershipImport, { generatedAt: 144.5 }).resourceGraph;
const cppMoves = querySemanticResourceGraph(cppOwnershipGraph, { kind: 'move' });
const cppMoveKinds = cppMoves.map((record) => record.moveKind);
const destructorDrops = cppOwnershipGraph.drops.filter((record) => record.metadata?.dropSemantics);

assert.equal(cppMoveKinds.includes('cpp-unique-ptr-std-move'), true);
assert.equal(cppMoveKinds.includes('cpp-call-argument-ownership-transfer'), true);
assert.equal(cppMoveKinds.includes('cpp-return-ownership-transfer'), true);
assert.equal(cppMoves.every((record) => record.metadata?.invalidatesSource === true), true);
assert.equal(destructorDrops.some((record) => record.metadata?.dropSemantics === 'cpp-smart-pointer-destructor'), true);
assert.equal(destructorDrops.some((record) => record.metadata?.dropSemantics === 'cpp-raii-destructor'), true);

const cppOwnershipConstraint = createUniversalOwnershipConstraintEvidence({
  sourceLanguage: 'cpp',
  target: 'typescript',
  sourceGraph: cppOwnershipGraph
});

assert.equal(cppOwnershipConstraint.requiredKinds.includes('move-invalidates-source'), true);
assert.equal(cppOwnershipConstraint.requiredKinds.includes('call-argument-ownership-transfer'), true);
assert.equal(cppOwnershipConstraint.requiredKinds.includes('return-ownership-transfer'), true);
assert.equal(cppOwnershipConstraint.requiredKinds.includes('destructor-drop-semantics'), true);
assert.equal(cppOwnershipConstraint.missingEvidence.includes('translation-ownership-constraint:cpp-return-ownership-transfer'), false);
assert.equal(cppOwnershipConstraint.missingEvidence.includes('translation-ownership-constraint:return-ownership-transfer'), true);
assert.equal(cppOwnershipConstraint.constraints.find((record) => record.kind === 'destructor-drop-semantics')?.source.includes('cpp-smart-pointer-destructor'), true);
