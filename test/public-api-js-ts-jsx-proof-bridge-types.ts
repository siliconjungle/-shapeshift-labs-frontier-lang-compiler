import * as compilerApi from '../src/index.js';

const typedJsxHookDependencySourceProof: compilerApi.JsTsProjectJsxHookDependencySourceProof = {
  schema: 'frontier.lang.jsxHookDependencySourceProof.v1',
  kind: 'frontier.lang.jsxHookDependencySourceProof',
  status: 'passed',
  sourcePath: 'src/view.tsx',
  identityKey: 'jsx-render-risk#src/view.tsx#View#Button#1#Button',
  baseSourceHash: 'source:base',
  workerSourceHash: 'source:worker',
  headSourceHash: 'source:head',
  outputSourceHash: 'source:output',
  hookName: 'useMemo',
  hookOrdinal: 1,
  outputDependencyTexts: ['theme', 'locale', 'featureFlag'],
  workerAddedDependencyTexts: ['locale'],
  headAddedDependencyTexts: ['featureFlag'],
  hookDependencySourcePreservationHash: 'proof:hook-dependencies',
  autoMergeClaim: false,
  semanticEquivalenceClaim: false,
  runtimeEquivalenceClaim: false,
  renderEquivalenceClaim: false,
  hookDependencySourcePreservationClaim: true,
  claimScope: 'static-hook-dependency-array-source-preservation-only'
};

const typedJsxEventHandlerSourceProof: compilerApi.JsTsProjectJsxEventHandlerSourceProof = {
  schema: 'frontier.lang.jsxEventHandlerSourceProof.v1',
  kind: 'frontier.lang.jsxEventHandlerSourceProof',
  status: 'passed',
  sourcePath: 'src/view.tsx',
  identityKey: 'jsx-render-risk#src/view.tsx#View#Button#1#Button',
  baseSourceHash: 'source:base',
  workerSourceHash: 'source:worker',
  headSourceHash: 'source:head',
  outputSourceHash: 'source:output',
  outputEventHandlerPropNames: ['onClick', 'onMouseEnter', 'onKeyDown'],
  workerAddedEventHandlerPropNames: ['onMouseEnter'],
  headAddedEventHandlerPropNames: ['onKeyDown'],
  eventHandlerSourcePreservationHash: 'proof:event-handlers',
  autoMergeClaim: false,
  semanticEquivalenceClaim: false,
  runtimeEquivalenceClaim: false,
  renderEquivalenceClaim: false,
  eventHandlerSourcePreservationClaim: true,
  claimScope: 'static-event-handler-source-preservation-only'
};

compilerApi.safeMergeJsTsProject({
  language: 'tsx',
  baseFiles: { 'src/view.tsx': 'export function View() { return <button />; }\n' },
  workerFiles: { 'src/view.tsx': 'export function View() { return <button />; }\n' },
  headFiles: { 'src/view.tsx': 'export function View() { return <button />; }\n' },
  jsxHookDependencySourceProofs: [typedJsxHookDependencySourceProof],
  jsxEventHandlerSourceProof: typedJsxEventHandlerSourceProof
});

void typedJsxHookDependencySourceProof;
void typedJsxEventHandlerSourceProof;
