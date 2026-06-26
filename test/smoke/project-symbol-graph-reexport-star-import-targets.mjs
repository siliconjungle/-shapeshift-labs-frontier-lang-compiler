import { assert } from './helpers.mjs';
import { importNativeProject } from './compiler-api.mjs';

function source(language, sourcePath, sourceText) {
  return { language, sourcePath, sourceText, metadata: { semanticImportExpected: true } };
}

const starProject = await importNativeProject({
  id: 'project_symbol_graph_reexport_star_import_targets',
  projectRoot: 'src',
  sources: [
    source('tsx', 'src/child.tsx', 'export function Child() { return <button />; }\n'),
    source('typescript', 'src/components.ts', 'export * from "./child.js";\n'),
    source('tsx', 'src/view.tsx', 'import { Child } from "./components.js";\nexport function View() { return <Child />; }\n')
  ]
});
const starEdge = starProject.projectSymbolGraph.importEdges
  .find((edge) => edge.sourcePath === 'src/view.tsx' && edge.importedName === 'Child');
assert.equal(starEdge.resolvedTargetSymbolId, 'symbol:tsx:export:child');
assert.equal(starEdge.reExportResolved, true);
assert.equal(starEdge.reExportResolutionKind, 'export-star');
assert.equal(starEdge.reExportSourcePath, 'src/components.ts');
assert.equal(starEdge.reExportModuleSpecifier, './child.js');
assert.equal(starEdge.reExportTargetSourcePath, 'src/child.tsx');
assert.equal(starEdge.reExportTargetDocumentId, 'doc_src_child_tsx');
assert.equal(typeof starEdge.reExportIdentityId, 'string');
assert.equal(starProject.projectSymbolGraph.reExportIdentities.some((identity) => identity.isExportStar && identity.exportedName === 'Child'), true);

const ambiguousProject = await importNativeProject({
  id: 'project_symbol_graph_reexport_star_ambiguous_import_targets',
  projectRoot: 'src',
  sources: [
    source('tsx', 'src/a.tsx', 'export function Child() { return <button />; }\n'),
    source('tsx', 'src/b.tsx', 'export function Child() { return <a />; }\n'),
    source('typescript', 'src/components.ts', 'export * from "./a.js";\nexport * from "./b.js";\n'),
    source('tsx', 'src/view.tsx', 'import { Child } from "./components.js";\nexport function View() { return <Child />; }\n')
  ]
});
const ambiguousEdge = ambiguousProject.projectSymbolGraph.importEdges
  .find((edge) => edge.sourcePath === 'src/view.tsx' && edge.importedName === 'Child');
const ambiguousIdentities = ambiguousProject.projectSymbolGraph.reExportIdentities
  .filter((identity) => identity.sourcePath === 'src/components.ts' && identity.exportedName === 'Child');
assert.equal(ambiguousEdge.resolvedTargetSymbolId, undefined);
assert.equal(ambiguousEdge.reExportResolved, undefined);
assert.equal(ambiguousIdentities.length, 2);
