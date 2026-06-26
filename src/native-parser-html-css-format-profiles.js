export const HtmlCssNativeParserAstFormatProfileInputs = Object.freeze([
  ['parse5', {
    aliases: ['parse5-html', 'html-parse5'],
    kind: 'concrete-syntax-tree',
    languages: ['html'],
    parserAdapters: ['parse5'],
    exactness: 'parser-tree',
    sourceRangeModel: 'source-code-location-info',
    preservesTrivia: true,
    supportsErrorRecovery: true,
    notes: ['parse5 exposes spec-oriented HTML tree construction and source locations; rendered DOM, custom elements, templates, slots, scripts, styles, and hydration remain host-owned evidence.']
  }],
  ['htmlparser2', {
    aliases: ['htmlparser', 'domhandler'],
    kind: 'concrete-syntax-tree',
    languages: ['html'],
    parserAdapters: ['htmlparser2'],
    exactness: 'parser-tree',
    sourceRangeModel: 'start-end-index',
    supportsErrorRecovery: true,
    notes: ['htmlparser2/DOMHandler trees provide fast HTML element and text structure; spec tree-construction edge cases, trivia, and browser DOM normalization remain host-owned evidence.']
  }],
  ['rehype', {
    aliases: ['hast', 'unified-rehype'],
    kind: 'concrete-syntax-tree',
    languages: ['html'],
    parserAdapters: ['rehype', 'hast'],
    exactness: 'parser-tree',
    sourceRangeModel: 'unist-position',
    preservesTrivia: true,
    supportsErrorRecovery: true,
    notes: ['rehype/HAST is useful for HTML/MDX-like tree transforms; browser semantics, scripts/styles, and hydration boundaries remain host-owned evidence.']
  }],
  ['tree-sitter-html', {
    aliases: ['treesitter-html'],
    kind: 'concrete-syntax-tree',
    languages: ['html'],
    parserAdapters: ['tree-sitter-html'],
    exactness: 'parser-tree',
    sourceRangeModel: 'row-column',
    supportsIncremental: true,
    supportsErrorRecovery: true,
    notes: ['Tree-sitter HTML exposes incremental concrete syntax for HTML files; browser DOM construction, templates, slots, scripts/styles, and hydration remain host-owned evidence.']
  }],
  ['postcss', {
    kind: 'concrete-syntax-tree',
    languages: ['css'],
    parserAdapters: ['postcss'],
    exactness: 'parser-tree',
    sourceRangeModel: 'line-column',
    preservesTrivia: true,
    supportsErrorRecovery: true,
    notes: ['PostCSS exposes CSS rule/declaration structure and source locations; cascade resolution, browser normalization, layout, and computed style remain host-owned evidence.']
  }],
  ['csstree', {
    aliases: ['css-tree', 'css-tree-ast'],
    kind: 'concrete-syntax-tree',
    languages: ['css'],
    parserAdapters: ['csstree', 'css-tree'],
    exactness: 'parser-tree',
    sourceRangeModel: 'offset-line-column',
    supportsErrorRecovery: true,
    notes: ['CSSTree provides detailed CSS grammar ASTs; cascade layers, browser normalization, and computed/rendered effects remain host-owned evidence.']
  }],
  ['lightningcss', {
    aliases: ['lightning-css'],
    kind: 'compiler-ast',
    languages: ['css'],
    parserAdapters: ['lightningcss', 'lightning-css'],
    exactness: 'loss-aware-native-ast',
    sourceRangeModel: 'source-location',
    notes: ['Lightning CSS can parse and transform CSS with browser-target lowering; transformation settings, minification, and rendered cascade equivalence remain host-owned evidence.']
  }],
  ['tree-sitter-css', {
    aliases: ['treesitter-css'],
    kind: 'concrete-syntax-tree',
    languages: ['css'],
    parserAdapters: ['tree-sitter-css'],
    exactness: 'parser-tree',
    sourceRangeModel: 'row-column',
    supportsIncremental: true,
    supportsErrorRecovery: true,
    notes: ['Tree-sitter CSS exposes incremental concrete syntax for CSS files; cascade resolution, browser normalization, and computed/rendered effects remain host-owned evidence.']
  }]
]);
