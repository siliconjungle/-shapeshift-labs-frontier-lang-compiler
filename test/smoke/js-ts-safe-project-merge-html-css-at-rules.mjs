import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';

const sourcePath = 'src/anim.css';
const base = '@keyframes fade { from { opacity: 0; } to { opacity: 1; } }\n.button { color: red; }\n';
const worker = base.replace('opacity: 1', 'opacity: .8');
const head = base.replace('color: red', 'color: blue');
const output = '@keyframes fade { from { opacity: 0; } to { opacity: .8; } }\n\n.button {\n  color: blue;\n}\n';

const preserved = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_at_rule_preserved',
  files: [{
    sourcePath,
    baseSourceText: base,
    workerSourceText: head,
    headSourceText: base.replace('.button {', '.button { background-color: white;')
  }]
});
assert.equal(preserved.status, 'merged');
assert.equal(preserved.summary.cssMergedFiles, 1);
assert.match(preserved.outputFiles[0].sourceText, /@keyframes fade/);
assert.match(preserved.outputFiles[0].sourceText, /color: blue/);
assert.match(preserved.outputFiles[0].sourceText, /background-color: white/);

const unproved = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_at_rule_unproved',
  files: [{ sourcePath, baseSourceText: base, workerSourceText: worker, headSourceText: head }]
});
assert.equal(unproved.status, 'blocked');
assert.equal(unproved.summary.cssBlockedFiles, 1);
assert.equal(unproved.conflicts.some((item) => item.details.reasonCode === 'css-keyframes-runtime-equivalence-unproved'), true);

const proven = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_at_rule_proven',
  cssMergeOptionsByPath: {
    [sourcePath]: {
      cssCascadeRuntimeProofs: [{
        id: 'proof_css_project_keyframes_runtime',
        kind: 'css-source-bound-cascade-runtime-proof',
        status: 'passed',
        sourcePath,
        reasonCode: 'css-keyframes-runtime-equivalence-unproved',
        side: 'worker',
        shapeKey: 'at-rule:keyframes::fade',
        baseSourceHash: hashSemanticValue(base),
        workerSourceHash: hashSemanticValue(worker),
        headSourceHash: hashSemanticValue(head),
        outputSourceHash: hashSemanticValue(output)
      }]
    }
  },
  files: [{ sourcePath, baseSourceText: base, workerSourceText: worker, headSourceText: head }]
});
assert.equal(proven.status, 'merged');
assert.equal(proven.summary.cssMergedFiles, 1);
assert.equal(proven.summary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(proven.outputFiles[0].sourceText, output);
