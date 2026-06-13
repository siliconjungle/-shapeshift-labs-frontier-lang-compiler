import { assert } from './helpers.mjs';
import {
  createSemanticImportSidecar,
  importNativeSource
} from './compiler-api.mjs';

const imported = importNativeSource({
  language: 'tsx',
  sourcePath: 'src/react-wrapper-names.tsx',
  sourceText: 'export const Button = React.memo(React.forwardRef(function ButtonImpl(props, ref) {\n  if (!props.ready) return null;\n  return <button ref={ref}>{props.label}</button>;\n}));\nexport default observer(memo(function PanelImpl(props) {\n  if (!props.ready) return null;\n  return <section>{props.title}</section>;\n}));\n'
});
const symbolsById = new Map(imported.semanticIndex.symbols.map((symbol) => [symbol.id, symbol]));
const buttonSymbol = imported.semanticIndex.symbols.find((symbol) => symbol.name === 'Button' && symbol.kind === 'function');
const panelSymbol = imported.semanticIndex.symbols.find((symbol) => symbol.name === 'PanelImpl');
assert.equal(Boolean(buttonSymbol), true);
assert.equal(Boolean(panelSymbol), true);
assert.equal(buttonSymbol.definitionSpan.startLine, 1);
assert.equal(buttonSymbol.definitionSpan.endLine, 4);
assert.equal(panelSymbol.definitionSpan.startLine, 5);
assert.equal(panelSymbol.definitionSpan.endLine, 8);
assert.equal(imported.semanticIndex.facts.some((fact) => fact.predicate === 'controlFlow'
  && symbolsById.get(fact.subjectId)?.name === 'Button'
  && fact.value.kind === 'branch'
  && fact.value.line === 2), true);
assert.equal(imported.semanticIndex.facts.some((fact) => fact.predicate === 'controlFlow'
  && symbolsById.get(fact.subjectId)?.name === 'PanelImpl'
  && fact.value.kind === 'branch'
  && fact.value.line === 6), true);

const sidecar = createSemanticImportSidecar(imported, {
  generatedAt: 137,
  targetPath: 'dist/react-wrapper-names.js'
});
assert.equal(sidecar.ownershipRegions.some((region) => region.symbolName === 'Button'
  && region.regionKind === 'body'
  && region.sourceSpan.endLine === 4), true);
assert.equal(sidecar.ownershipRegions.some((region) => region.symbolName === 'PanelImpl'
  && region.regionKind === 'body'
  && region.sourceSpan.startLine === 5
  && region.sourceSpan.endLine === 8), true);
assert.equal(sidecar.patchHints.some((hint) => hint.ownershipKey.includes('PanelImpl') && hint.sourceSpan.endLine === 8), true);
