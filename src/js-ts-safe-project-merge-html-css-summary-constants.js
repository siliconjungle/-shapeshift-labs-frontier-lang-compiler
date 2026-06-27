const ScopedCascadeMissingProofReasonCodes = new Set([
  'css-scoped-cascade-equivalence-unproved',
  'css-media-cascade-scope-unproved',
  'css-supports-cascade-scope-unproved',
  'css-container-cascade-scope-unproved',
  'css-layer-cascade-scope-unproved',
  'css-scope-cascade-scope-unproved',
  'css-scoped-cascade-nesting-unproved'
]);

const HtmlRuntimeBoundaryReasonCodes = new Set([
  'script-runtime-boundary',
  'style-runtime-boundary',
  'template-runtime-boundary',
  'slot-runtime-boundary',
  'custom-element-runtime-boundary',
  'event-handler-runtime-boundary',
  'inline-style-runtime-boundary',
  'iframe-runtime-boundary',
  'iframe-srcdoc-runtime-boundary',
  'form-runtime-boundary',
  'form-submitter-runtime-boundary',
  'form-control-runtime-boundary',
  'navigation-runtime-boundary',
  'document-base-runtime-boundary',
  'document-metadata-runtime-boundary',
  'resource-loading-runtime-boundary'
]);

const HtmlFrameworkBoundaryReasonCodes = new Set(['framework-directive-boundary', 'custom-element-runtime-boundary']);

const CssDependencyMissingProofReasonCodes = new Set([
  'css-dependency-graph-evidence-missing',
  'css-custom-property-dependency-graph-unproved',
  'css-var-fallback-dependency-graph-unproved',
  'css-animation-name-keyframes-graph-unproved',
  'css-font-face-dependency-graph-unproved',
  'css-url-asset-dependency-graph-unproved'
]);

const CssDependencyAtRuleNames = new Set(['keyframes', 'font-face', 'property', 'page']);
const CssDependencyCodeFragments = ['custom-property', 'var-fallback', 'variable-dependency', 'dependency-graph', 'keyframes', 'animation-name', 'font-face', 'url-asset', 'asset-dependency', 'property', 'page'];
const CssRuntimeDescriptorReasonCodes = new Set(['css-runtime-descriptor-evidence-missing']);
const CssRuntimeEquivalenceReasonCodes = new Set(['css-keyframes-runtime-equivalence-unproved', 'css-font-face-runtime-equivalence-unproved', 'css-property-runtime-equivalence-unproved', 'css-page-runtime-equivalence-unproved']);
const CssDependencySurfacePatterns = [/(^|[;{\s])--[-_A-Za-z][\w-]*\s*:/, /\bvar\s*\(/i, /@(?:-[\w]+-)?keyframes\b/i, /(^|[;{\s])animation(?:-name)?\s*:/i, /@font-face\b/i, /@property\b/i, /@page\b/i, /\burl\s*\(/i];
const RequiredParserEvidenceSideNames = Object.freeze(['base', 'worker', 'head']);

export {
  CssDependencyAtRuleNames,
  CssDependencyCodeFragments,
  CssDependencyMissingProofReasonCodes,
  CssDependencySurfacePatterns,
  CssRuntimeDescriptorReasonCodes,
  CssRuntimeEquivalenceReasonCodes,
  HtmlFrameworkBoundaryReasonCodes,
  HtmlRuntimeBoundaryReasonCodes,
  RequiredParserEvidenceSideNames,
  ScopedCascadeMissingProofReasonCodes
};
