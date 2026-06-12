import { assert, nativeNodeForSymbol, symbolByName } from './helpers.mjs';
import {
  createSemanticEditScript,
  createSemanticImportSidecar,
  importNativeSource,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection
} from './compiler-api.mjs';

const baseSource = '<?php\nclass Store {\n  public static function save($title) {\n    return trim($title);\n  }\n\n  public function label($title) {\n    return trim($title);\n  }\n}\n\nfunction save($title) {\n  return trim($title);\n}\n';
const workerSource = baseSource.replace('return trim($title);\n  }\n\n  public function label', 'return strtoupper(trim($title));\n  }\n\n  public function label');
const headSource = `<?php\n// coordinator moved this file\n${baseSource.replace('<?php\n', '')}`;
const expectedSource = `<?php\n// coordinator moved this file\n${workerSource.replace('<?php\n', '')}`;
const laterHeadSource = `<?php\n// later coordinator note\n${headSource.replace('<?php\n', '')}`;
const laterExpectedSource = `<?php\n// later coordinator note\n${expectedSource.replace('<?php\n', '')}`;

const imported = importNativeSource({
  language: 'php',
  sourcePath: 'Store.php',
  sourceText: baseSource
});

const staticSymbol = symbolByName(imported, 'Store.static.save');
const instanceSymbol = symbolByName(imported, 'Store.label');
const topLevelSymbol = symbolByName(imported, 'save');
assert.equal(staticSymbol.kind, 'method');
assert.equal(instanceSymbol.kind, 'method');
assert.equal(topLevelSymbol.kind, 'function');
assert.equal(staticSymbol.metadata.owner, 'Store');
assert.equal(staticSymbol.metadata.receiverKind, 'static');
assert.equal(instanceSymbol.metadata.receiverKind, 'instance');

const staticNode = nativeNodeForSymbol(imported, 'Store.static.save');
assert.equal(staticNode.kind, 'FunctionDeclaration');
assert.deepEqual(staticNode.fields.parameters, ['$title']);
assert.equal(staticNode.fields.methodName, 'save');
assert.equal(staticNode.fields.receiverKind, 'static');
assert.deepEqual(staticNode.fields.modifiers, ['public', 'static']);

const sidecar = createSemanticImportSidecar(imported);
assert.equal(sidecar.ownershipRegions.some((region) => region.regionKind === 'body' && region.symbolName === 'Store.static.save'), true);
assert.equal(sidecar.ownershipRegions.some((region) => region.regionKind === 'body' && region.symbolName === 'Store.label'), true);
assert.equal(sidecar.ownershipRegions.some((region) => region.regionKind === 'body' && region.symbolName === 'save'), true);

const nestedImport = importNativeSource({
  language: 'php',
  sourcePath: 'Nested.php',
  sourceText: '<?php\nclass Store {\n  public function outer() {\n    function helper() {\n      return 1;\n    }\n    return helper();\n  }\n}\n'
});
assert.equal(symbolByName(nestedImport, 'Store.outer').kind, 'method');
assert.equal(symbolByName(nestedImport, 'helper').kind, 'function');
assert.equal(symbolByName(nestedImport, 'Store.helper'), undefined);

const script = createSemanticEditScript({
  id: 'semantic_edit_php_static_method',
  language: 'php',
  sourcePath: 'Store.php',
  baseSourceText: baseSource,
  workerSourceText: workerSource,
  headSourceText: headSource,
  generatedAt: 190
});
assert.equal(script.admission.status, 'auto-merge-candidate');
assert.equal(script.operations.length, 1);
assert.equal(script.operations[0].kind, 'replaceControlFlow');
assert.equal(script.operations[0].anchor.symbolName, 'Store.static.save:controlFlow:exit#1');

const projection = projectSemanticEditScriptToSource({ script, workerSourceText: workerSource, headSourceText: headSource });
assert.equal(projection.status, 'projected');
assert.equal(projection.sourceText, expectedSource);

const replay = replaySemanticEditProjection({ projection, currentSourceText: laterHeadSource });
assert.equal(replay.status, 'accepted-clean');
assert.equal(replay.outputSourceText, laterExpectedSource);
assert.equal(replay.edits[0].reasonCodes.includes('offset-reanchored-by-symbol'), true);
