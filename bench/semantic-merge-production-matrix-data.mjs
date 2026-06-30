const sourceAnchorUrls = Object.freeze({
  'JavaScript syntax and runtime semantics': [
    'https://tc39.es/ecma262/',
    'https://github.com/estree/estree',
    'https://babeljs.io/docs/babel-parser',
    'https://github.com/acornjs/acorn'
  ],
  'TypeScript symbols, types, and diagnostics': [
    'https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API',
    'https://github.com/microsoft/TypeScript'
  ],
  'JSX/TSX parser and React-like layout hazards': [
    'https://babeljs.io/docs/babel-parser',
    'https://github.com/microsoft/TypeScript',
    'https://react.dev/reference/react'
  ],
  'HTML tree construction and runtime boundaries': [
    'https://html.spec.whatwg.org/multipage/parsing.html',
    'https://parse5.js.org/'
  ],
  'SVG XML graphics structure and browser paint/layout boundaries': [
    'https://www.w3.org/TR/SVG2/',
    'https://developer.mozilla.org/en-US/docs/Web/SVG'
  ],
  'CSS syntax, selectors, cascade, and at-rules': [
    'https://www.w3.org/TR/css-syntax-3/',
    'https://www.w3.org/TR/selectors-4/',
    'https://www.w3.org/TR/css-cascade-5/',
    'https://postcss.org/api/'
  ],
  'CSS Modules contracts': [
    'https://github.com/css-modules/css-modules',
    'https://github.com/webpack-contrib/css-loader'
  ],
  'Package manifests, lockfiles, and workspace installs': [
    'https://docs.npmjs.com/cli/v8/configuring-npm/package-lock-json/',
    'https://pnpm.io/cli/install',
    'https://classic.yarnpkg.com/lang/en/docs/yarn-lock/'
  ],
  'Canvas and OffscreenCanvas runtime semantics': [
    'https://html.spec.whatwg.org/multipage/canvas.html',
    'https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas',
    'https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/transferControlToOffscreen'
  ]
});

const jsTsAnchors = ['JavaScript syntax and runtime semantics', 'TypeScript symbols, types, and diagnostics'];
const jsxAnchors = ['JSX/TSX parser and React-like layout hazards', ...jsTsAnchors];
const htmlCssAnchors = ['HTML tree construction and runtime boundaries', 'CSS syntax, selectors, cascade, and at-rules'];
const svgAnchors = ['SVG XML graphics structure and browser paint/layout boundaries', 'HTML tree construction and runtime boundaries'];
const cssModulesAnchors = ['CSS Modules contracts', 'CSS syntax, selectors, cascade, and at-rules', 'JSX/TSX parser and React-like layout hazards'];
const packageAnchors = ['Package manifests, lockfiles, and workspace installs', 'JavaScript syntax and runtime semantics'];
const canvasAnchors = ['Canvas and OffscreenCanvas runtime semantics', 'HTML tree construction and runtime boundaries', 'JavaScript syntax and runtime semantics'];

const rowProofs = new Map([
  ['JS/TS parser, source spans, and trivia', {
    anchors: jsTsAnchors,
    evidence: ['test/smoke/js-ts-syntax-parser-trivia-evidence.mjs', 'test/smoke/js-ts-source-span-parser-trivia-exactness.mjs'],
    remaining: []
  }],
  ['JS/TS scope and use-def graph', {
    anchors: jsTsAnchors,
    evidence: ['test/smoke/js-ts-safe-merge-binding-patterns.mjs', 'test/smoke/js-ts-safe-project-merge-scope-use-def-graph.mjs'],
    remaining: []
  }],
  ['JS/TS module/export/import graph', {
    anchors: jsTsAnchors,
    evidence: ['test/smoke/js-ts-safe-merge-import-shapes.mjs', 'test/smoke/project-symbol-graph-commonjs-interop.mjs', 'test/smoke/js-ts-real-repo-corpus-live-project-proof.mjs'],
    remaining: []
  }],
  ['JS/TS public API and type graph', {
    anchors: jsTsAnchors,
    evidence: ['test/smoke/js-ts-safe-project-merge-compiler-type-graph.mjs', 'test/smoke/js-ts-safe-project-merge-public-api-declaration-emit-parity.mjs', 'test/smoke/js-ts-safe-project-merge-tsconfig-diagnostics.mjs', 'test/smoke/js-ts-real-repo-corpus-live-project-proof.mjs'],
    remaining: []
  }],
  ['JS/TS control-flow and effect graph', {
    anchors: jsTsAnchors,
    evidence: ['test/smoke/semantic-effect-runtime-order-evidence.mjs', 'test/smoke/semantic-effect-runtime-resource-management.mjs', 'test/smoke/semantic-effect-control-flow-denominator.mjs'],
    remaining: []
  }],
  ['Generic semantic edit admission and replay', {
    anchors: jsTsAnchors,
    evidence: [
      'test/smoke/semantic-edit-script.mjs',
      'test/smoke/js-ts-safe-project-merge-semantic-replay-proof.mjs',
      'test/smoke/semantic-edit-bundle-auto-merge.mjs',
      'test/smoke/semantic-patch-bundle-overlaps-same-file.mjs'
    ],
    remaining: []
  }],
  ['Symbol move between files', {
    anchors: jsTsAnchors,
    evidence: ['test/smoke/js-ts-safe-project-merge-symbol-move-default-admission.mjs', 'test/smoke/semantic-edit-rename-move-source-replay.mjs'],
    remaining: []
  }],
  ['Split/merge modules and classes', {
    anchors: jsTsAnchors,
    evidence: ['test/smoke/js-ts-safe-project-merge-split-merge-classifier.mjs', 'test/smoke/js-ts-safe-project-merge-split-merge-multifile.mjs', 'test/smoke/js-ts-safe-project-merge-admission-routes.mjs'],
    remaining: []
  }],
  ['JSX/TSX prop graph', {
    anchors: jsxAnchors,
    evidence: ['test/smoke/js-ts-safe-project-merge-jsx-prop-values.mjs', 'test/smoke/js-ts-safe-project-merge-jsx-spread-props.mjs', 'test/smoke/js-ts-safe-project-merge-jsx-style-object-props.mjs', 'test/smoke/js-ts-safe-project-merge-jsx-prop-contracts.mjs', 'test/smoke/js-ts-safe-project-merge-jsx-proof-bridges.mjs'],
    remaining: []
  }],
  ['JSX/TSX child order and render layout', {
    anchors: jsxAnchors,
    evidence: ['test/smoke/js-ts-safe-project-merge-jsx-render-returns.mjs', 'test/smoke/js-ts-safe-project-merge-jsx-render-branch-proof.mjs', 'test/smoke/js-ts-safe-project-merge-jsx-proof-bridges.mjs', 'test/smoke/js-ts-safe-project-merge-jsx-runtime-proof-bridge.mjs'],
    remaining: []
  }],
  ['JSX/TSX hook/context/render-risk graph', {
    anchors: jsxAnchors,
    evidence: ['test/smoke/js-ts-safe-project-merge-jsx-hook-dependencies.mjs', 'test/smoke/js-ts-safe-project-merge-jsx-context-values.mjs', 'test/smoke/js-ts-safe-project-merge-jsx-proof-bridges.mjs', 'test/smoke/js-ts-safe-project-merge-jsx-runtime-proof-bridge.mjs'],
    remaining: []
  }],
  ['HTML static structure', {
    anchors: htmlCssAnchors,
    evidence: ['test/smoke/js-ts-safe-project-merge-html-css.mjs', 'test/smoke/js-ts-safe-project-merge-html-css-parser-source-evidence.mjs', 'test/smoke/js-ts-safe-project-merge-html-css-runtime-proof-corpus.mjs'],
    remaining: []
  }],
  ['HTML runtime/browser boundaries', {
    anchors: ['HTML tree construction and runtime boundaries'],
    evidence: ['test/smoke/js-ts-safe-project-merge-html-runtime-boundary.mjs', 'test/smoke/js-ts-safe-project-merge-html-runtime-proof-admission.mjs', 'test/smoke/js-ts-safe-project-merge-html-css-runtime-proof-corpus.mjs'],
    remaining: []
  }],
  ['SVG parser, identity, structural, and runtime proof', {
    anchors: svgAnchors,
    evidence: ['test/smoke/js-ts-safe-project-merge-html-css.mjs', 'test/smoke/js-ts-safe-project-merge-svg.mjs', 'test/smoke/js-ts-semantic-merge-admission-matrix-html-css.mjs'],
    remaining: []
  }],
  ['SVG reference graph and paint-server dependencies', {
    anchors: svgAnchors,
    evidence: ['test/smoke/js-ts-safe-project-merge-svg.mjs', 'test/smoke/js-ts-semantic-merge-admission-matrix-html-css.mjs'],
    remaining: []
  }],
  ['CSS selectors, cascade, and static declarations', {
    anchors: htmlCssAnchors,
    evidence: ['test/smoke/js-ts-safe-project-merge-html-css-selectors.mjs', 'test/smoke/js-ts-safe-project-merge-html-css-cascade-proof.mjs', 'test/smoke/js-ts-safe-project-merge-html-css-runtime-proof-corpus.mjs'],
    remaining: []
  }],
  ['CSS dependencies and runtime descriptors', {
    anchors: ['CSS syntax, selectors, cascade, and at-rules'],
    evidence: ['test/smoke/js-ts-safe-project-merge-html-css-dependencies.mjs', 'test/smoke/js-ts-safe-project-merge-html-css-at-rules.mjs', 'test/smoke/js-ts-safe-project-merge-html-css-runtime-proof-corpus.mjs'],
    remaining: []
  }],
  ['Nested/scoped CSS', {
    anchors: ['CSS syntax, selectors, cascade, and at-rules'],
    evidence: ['test/smoke/js-ts-safe-project-merge-html-css-scoped-basic.mjs', 'test/smoke/js-ts-safe-project-merge-html-css-scoped-nested.mjs'],
    remaining: []
  }],
  ['CSS Modules import/use-site graph', {
    anchors: cssModulesAnchors,
    evidence: ['test/smoke/js-ts-safe-project-merge-css-modules-use-sites.mjs', 'test/smoke/js-ts-safe-project-merge-css-modules-import-shapes.mjs', 'test/smoke/js-ts-safe-project-merge-css-modules-real-bundler-source-map-corpus.mjs'],
    remaining: []
  }],
  ['CSS Modules transform/source-map identity', {
    anchors: cssModulesAnchors,
    evidence: ['test/smoke/js-ts-safe-project-merge-css-modules-source-map-proof.mjs', 'test/smoke/js-ts-safe-project-merge-css-modules-generated-map-hash.mjs', 'test/smoke/js-ts-safe-project-merge-css-modules-real-bundler-source-map-corpus.mjs'],
    remaining: []
  }],
  ['Package management intent and lockfile proof', {
    anchors: packageAnchors,
    evidence: [
      'test/smoke/js-ts-safe-project-merge-package-canvas.mjs',
      'test/smoke/js-ts-safe-project-merge-package-command-execution.mjs',
      'test/smoke/js-ts-safe-project-merge-package-manager-corpus.mjs',
      'test/smoke/js-ts-real-repo-corpus-command-execution-proof.mjs'
    ],
    remaining: []
  }],
  ['Canvas static element and runtime proof', {
    anchors: canvasAnchors,
    evidence: [
      'test/smoke/js-ts-safe-project-merge-package-canvas.mjs',
      'test/smoke/js-ts-safe-project-merge-canvas-runtime-proof-corpus.mjs'
    ],
    remaining: []
  }],
  ['Real-repo corpus', {
    anchors: [...jsTsAnchors, 'JSX/TSX parser and React-like layout hazards', 'CSS Modules contracts'],
    evidence: ['bench/real-repo-corpus-suite.mjs', 'bench/real-repo-corpus-upstream-proof.mjs', 'research/real-repo-corpus-upstream-proof.json', 'test/smoke/js-ts-real-repo-corpus-command-execution-proof.mjs', 'test/smoke/js-ts-real-repo-corpus-live-project-proof.mjs', 'test/smoke/js-ts-real-repo-corpus-upstream-proof-artifact.mjs'],
    remaining: []
  }],
  ['Source-backed completeness matrix', {
    anchors: ['JavaScript syntax and runtime semantics', 'HTML tree construction and runtime boundaries', 'CSS Modules contracts', 'Package manifests, lockfiles, and workspace installs', 'Canvas and OffscreenCanvas runtime semantics'],
    evidence: ['research/semantic-merge-production-matrix.md', 'test/smoke/semantic-merge-production-matrix-denominator.mjs'],
    remaining: []
  }]
]);

const readmeHighRowProofs = new Map([
  ['Package management intent and lockfile proof', rowProofs.get('Package management intent and lockfile proof')],
  ['Canvas static element and runtime proof', rowProofs.get('Canvas static element and runtime proof')],
  ['Real-repo benchmark suite', rowProofs.get('Real-repo corpus')]
]);

export { readmeHighRowProofs, rowProofs, sourceAnchorUrls };
