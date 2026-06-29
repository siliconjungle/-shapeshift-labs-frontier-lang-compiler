import {
  createJsxSemanticMergeEvidence,
  createSvgSemanticMergeEvidence,
  parseJsxSemanticTree,
  parseSvgSemanticTree,
  queryJsxElementRecords,
  querySvgReferenceGraph,
  summarizeJsxSemanticTree,
  summarizeSvgSemanticTree
} from '../src/index.js';
import type {
  JsxElementRecord,
  JsxSemanticMergeEvidence,
  JsxSemanticTree,
  SvgReferenceGraph,
  SvgSemanticMergeEvidence,
  SvgSemanticTree
} from '../src/index.js';

const jsxTree: JsxSemanticTree = parseJsxSemanticTree('<button key="save">Save</button>');
const jsxEvidence: JsxSemanticMergeEvidence = createJsxSemanticMergeEvidence('<button onClick={save}>Save</button>');
const jsxRecord: JsxElementRecord | undefined = queryJsxElementRecords(jsxTree, { tagName: 'button' })[0];
summarizeJsxSemanticTree(jsxTree).jsxElements satisfies number;
jsxEvidence.rendererRuntimeEquivalenceClaim satisfies false;
jsxRecord?.identityKey satisfies string | undefined;

const svgTree: SvgSemanticTree = parseSvgSemanticTree('<svg><defs><linearGradient id="g" /></defs><rect fill="url(#g)" /></svg>');
const svgEvidence: SvgSemanticMergeEvidence = createSvgSemanticMergeEvidence('<svg><use href="#missing" /></svg>');
const svgGraph: SvgReferenceGraph = querySvgReferenceGraph(svgTree);
summarizeSvgSemanticTree(svgTree).referenceRecords satisfies number;
svgEvidence.browserRuntimeEquivalenceClaim satisfies false;
svgGraph.references[0]?.targetId satisfies string | undefined;

void jsxTree;
void jsxEvidence;
void jsxRecord;
void svgTree;
void svgEvidence;
void svgGraph;
