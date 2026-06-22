import { assert } from './helpers.mjs';
import { importNativeProject } from './compiler-api.mjs';

const project = await importNativeProject({
  id: 'project_symbol_graph_named_import_resolution',
  projectRoot: 'src',
  sources: [{
    language: 'javascript',
    sourcePath: 'src/index.js',
    sourceText: "import { thing as localThing } from './thing.js';\nexport const used = localThing;\n",
    metadata: { semanticImportExpected: true }
  }, {
    language: 'javascript',
    sourcePath: 'src/thing.js',
    sourceText: 'export const thing = 1;\n',
    metadata: { semanticImportExpected: true }
  }]
});

const graph = project.projectSymbolGraph;
const namedImportEdge = graph.importEdges.find((edge) => edge.importedName === 'thing');
assert.equal(namedImportEdge.moduleSpecifier, './thing.js');
assert.equal(namedImportEdge.resolvedModulePath, 'src/thing.js');
assert.equal(namedImportEdge.targetDocumentId, 'doc_src_thing_js');
assert.equal(namedImportEdge.resolvedTargetSymbolId, 'symbol:javascript:export:thing');
assert.equal(graph.remainingFields.includes('moduleEdges[].resolvedTargetSymbolId'), false);
assert.equal(project.semanticIndex.metadata.projectSymbolGraph, graph);
