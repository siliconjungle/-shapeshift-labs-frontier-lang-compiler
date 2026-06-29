export * from './declarations/compile.js';
export * from './declarations/native-import-losses.js';
export * from './declarations/native-parser-formats.js';
export * from './declarations/native-parser-features.js';
export * from './declarations/native-import-coverage.js';
export * from './declarations/projection-coverage.js';
export * from './declarations/projection-readiness.js';
export * from './declarations/universal-capability.js';
export * from './declarations/universal-representation-coverage.js';
export * from './declarations/universal-conversion-artifacts.js';
export * from './declarations/universal-conversion-plan.js';
export * from './declarations/universal-runtime-capabilities.js';
export * from './declarations/universal-dialects.js';
export * from './declarations/language-adapter-package-contracts.js';
export * from './declarations/native-import-contracts.js';
export * from './declarations/source-preservation.js';
export * from './declarations/semantic-sidecar-admission.js';
export * from './declarations/semantic-merge-candidates.js';
export * from './declarations/semantic-merge-conflicts.js';
export * from './declarations/semantic-edit-script.js';
export * from './declarations/semantic-structural-diff.js';
export * from './declarations/semantic-lineage.js';
export * from './declarations/semantic-history.js';
export * from './declarations/semantic-edit-bundle.js';
export * from './declarations/semantic-patch-bundle-index.js';
export * from './declarations/semantic-patch-bundle.js';
export * from './declarations/semantic-patch-bundle-overlaps.js';
export * from './declarations/semantic-patch-bundle-composition.js';
export * from './declarations/semantic-transform-identity.js';
export * from './declarations/bidirectional-target-change.js';
export * from './declarations/bidirectional-target-change-source-edit.js';
export * from './declarations/semantic-impact.js';
export * from './declarations/semantic-graph-layers.js';
export * from './declarations/semantic-sidecar.js';
export * from './declarations/semantic-sidecar-example.js';
export * from './declarations/js-ts-semantic-merge.js';
export * from './declarations/js-ts-project-merge-declaration-emit-parity.js';
export * from './declarations/js-ts-project-merge-declarations.js';
export * from './declarations/js-ts-project-merge-diagnostics.js';
export * from './declarations/js-ts-project-merge-project-reference-proof.js';
export * from './declarations/js-ts-project-merge-tsconfig.js';
export * from './declarations/js-ts-project-merge-jsx-event-handler.js';
export * from './declarations/js-ts-project-merge-jsx-hook-dependency.js';
export * from './declarations/js-ts-project-merge-jsx-render-branch.js';
export * from './declarations/js-ts-project-merge-semantic-equivalence-proof.js';
export {
  createJsxSemanticMergeEvidence,
  parseJsxSemanticTree,
  queryJsxElementRecords,
  summarizeJsxSemanticTree
} from '@shapeshift-labs/frontier-lang-jsx';
export type {
  SourceSpan as JsxSourceSpan,
  JsxProofGap,
  JsxPropRecord,
  JsxElementRecord,
  JsxSemanticTree,
  JsxSemanticMergeEvidence
} from '@shapeshift-labs/frontier-lang-jsx';
export {
  createSvgSemanticMergeEvidence,
  parseSvgSemanticTree,
  querySvgReferenceGraph,
  summarizeSvgSemanticTree
} from '@shapeshift-labs/frontier-lang-svg';
export type {
  SourceSpan as SvgSourceSpan,
  SvgProofGap,
  SvgElementRecord,
  SvgDefinitionRecord,
  SvgReferenceRecord,
  SvgReferenceGraph,
  SvgSemanticTree,
  SvgSemanticMergeEvidence
} from '@shapeshift-labs/frontier-lang-svg';
export {
  createPackageManifestSemanticMergeEvidence,
  parsePackageManifestSemanticTree,
  queryPackageDependencyRecords,
  summarizePackageManifestSemanticTree
} from '@shapeshift-labs/frontier-lang-package';
export type {
  SourceSpan as PackageManifestSourceSpan,
  PackageManifestProofGap,
  PackageManifestSemanticRecord,
  PackageManifestSemanticTree,
  PackageManifestSemanticMergeEvidence
} from '@shapeshift-labs/frontier-lang-package';
export {
  createRustSemanticMergeEvidence,
  parseRustSemanticTree,
  queryRustItemRecords,
  summarizeRustSemanticTree
} from '@shapeshift-labs/frontier-lang-rust';
export type {
  RustSemanticMergeEvidence,
  RustSemanticProofGap,
  RustSemanticRecord,
  RustSemanticTree,
  RustSemanticTreeSummary,
  RustSourceSpan
} from '@shapeshift-labs/frontier-lang-rust';
export * from './declarations/native-diff.js';
export * from './declarations/semantic-slice.js';
export * from './declarations/semantic-slice-admission.js';
export * from './declarations/adapter-coverage.js';
export * from './declarations/import-adapter-core.js';
export * from './declarations/import-adapter-options-native.js';
export * from './declarations/import-adapter-options-platform.js';
export * from './declarations/target-adapters.js';
export * from './declarations/native-project-admission.js';
export * from './declarations/native-project-module-resolution.js';
export * from './declarations/native-project-source-evidence.js';
export * from './declarations/native-project-jsx-graph.js';
export * from './declarations/native-project-css-modules.js';
export * from './declarations/native-project-compiler-callable-signatures.js';
export * from './declarations/native-project-compiler-composite-types.js';
export * from './declarations/native-project-compiler-index-signature.js';
export * from './declarations/native-project-compiler-assignability-oracle.js';
export * from './declarations/native-project-compiler-public-api-source-binding.js';
export * from './declarations/native-project-compiler-type-reference-targets.js';
export * from './declarations/native-project-compiler-enum-proof.js';
export * from './declarations/native-project-compiler-class-member-runtime-proof.js';
export * from './declarations/native-project-compiler-scope.js';
export * from './declarations/native-project-scope-template-reference.js';
export * from './declarations/native-project-decorator-metadata.js';
export * from './declarations/native-project-runtime-effect-target.js';
export * from './declarations/native-project-runtime-mutation-target.js';
export * from './declarations/native-project-runtime-resource-management.js';
export * from './declarations/native-project-runtime-reachability.js';
export * from './declarations/native-project-runtime-promise-combinator.js';
export * from './declarations/native-project-runtime-promise-chain.js';
export * from './declarations/native-project-runtime-yield-delegation.js';
export * from './declarations/native-project-runtime-executable-effect-evidence.js';
export * from './declarations/native-project-module-declarations.js';
export * from './declarations/native-project.js';
export * from './declarations/roundtrip.js';
export * from './declarations/runtime.js';
