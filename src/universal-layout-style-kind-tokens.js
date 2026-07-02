export function layoutStyleKindForToken(token) {
  const kinds = [];
  if (/selector|css-selector|dom-target/.test(token)) kinds.push('selector-target');
  if (/style-property|css-property|property|declaration-property|color|background|font|margin|padding|border|width|height/.test(token)) kinds.push('style-property');
  if (/declared-style-value|style-value|css-value|declaration-value/.test(token)) kinds.push('declared-style-value');
  if (/computed-style|computed-value|resolved-style/.test(token)) kinds.push('computed-style');
  if (/cascade-layer|layer|cascade/.test(token)) kinds.push('cascade-layer');
  if (/specificity/.test(token)) kinds.push('specificity');
  if (/media-query|media/.test(token)) kinds.push('media-query');
  if (/container-query|container/.test(token)) kinds.push('container-query');
  if (/box-model|box/.test(token)) kinds.push('box-model');
  if (/layout-kind|layout-mode|flow-layout|grid|flex|block|inline/.test(token)) kinds.push('layout-kind');
  if (/display/.test(token)) kinds.push('display');
  if (/position|absolute|relative|fixed|sticky/.test(token)) kinds.push('position');
  if (/stacking-context|z-index|zindex/.test(token)) kinds.push('stacking-context');
  if (/writing-mode/.test(token)) kinds.push('writing-mode');
  if (/direction|rtl|ltr/.test(token)) kinds.push('direction');
  if (/viewport|responsive/.test(token)) kinds.push('viewport');
  if (/render-tree|render-object|layout-tree/.test(token)) kinds.push('render-tree');
  if (/style-rule|css-rule|rule/.test(token)) kinds.push('style-rule');
  if (/layout-snapshot|layout-proof|rect|bounding-box/.test(token)) kinds.push('layout-snapshot');
  if (/bitmap-snapshot|visual-snapshot|screenshot|pixel/.test(token)) kinds.push('bitmap-snapshot');
  if (/accessibility-tree|a11y|aria|accessible/.test(token)) kinds.push('accessibility-tree');
  if (/focus-order|keyboard-flow|tab-order/.test(token)) kinds.push('focus-order');
  if (/source-map|source-mapping/.test(token)) kinds.push('source-map');
  if (/proof|evidence|fail-closed|layout-style-proof/.test(token)) kinds.push('layout-style-proof');
  if (!kinds.length && (token === 'layout' || token === 'style' || token === 'layout-style' || token === 'css')) kinds.push('layout-style');
  return kinds;
}
