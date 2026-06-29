import assert from 'node:assert/strict';
import {
  createJsxSemanticMergeEvidence,
  createSvgSemanticMergeEvidence,
  parseJsxSemanticTree,
  parseSvgSemanticTree,
  queryJsxElementRecords,
  querySvgReferenceGraph
} from '../../dist/index.js';

const jsxTree = parseJsxSemanticTree('<section><button key="save">Save</button></section>', {
  sourcePath: 'src/View.tsx'
});
assert.equal(jsxTree.summary.jsxElements, 2);
assert.equal(queryJsxElementRecords(jsxTree, { tagName: 'button' })[0].identityKey, 'key:save');

const jsxEvidence = createJsxSemanticMergeEvidence('<button onClick={save}>Save</button>');
assert.equal(jsxEvidence.status, 'needs-review');
assert.ok(jsxEvidence.proofGaps.some((gap) => gap.code === 'jsx-event-handler-runtime-boundary'));

const svgTree = parseSvgSemanticTree('<svg><defs><linearGradient id="g" /></defs><rect fill="url(#g)" /></svg>', {
  sourcePath: 'icon.svg'
});
assert.equal(svgTree.summary.elements, 4);
assert.equal(querySvgReferenceGraph(svgTree).missingReferences.length, 0);

const svgEvidence = createSvgSemanticMergeEvidence('<svg><use href="#missing" /></svg>');
assert.equal(svgEvidence.status, 'needs-review');
assert.equal(svgEvidence.referenceGraph.missingReferences[0].targetId, 'missing');
