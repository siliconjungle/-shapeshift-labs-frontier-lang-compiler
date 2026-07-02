import * as compilerApi from '../src/index.js';

const typedNumericSemantics = compilerApi.createUniversalNumericSemanticsConstraintEvidence({
  sourceLanguage: 'rust',
  target: 'typescript',
  sourceNumericSemanticsRecords: [{ kind: 'integer overflow division', width: 32, signedness: 'unsigned' }]
});
typedNumericSemantics.status satisfies compilerApi.UniversalNumericSemanticsConstraintStatus;
typedNumericSemantics.claims.semanticEquivalenceClaim satisfies false;
compilerApi.numericSemanticsConstraintMatches(typedNumericSemantics, { numericSemanticsConstraintMissingKind: 'overflow-behavior' }) satisfies boolean;

const typedTextSemantics = compilerApi.createUniversalTextSemanticsConstraintEvidence({
  sourceLanguage: 'rust',
  target: 'typescript',
  sourceTextSemanticsRecords: [{ kind: 'unicode string regex', encoding: 'utf-8', normalizationForm: 'nfc' }]
});
typedTextSemantics.status satisfies compilerApi.UniversalTextSemanticsConstraintStatus;
typedTextSemantics.claims.semanticEquivalenceClaim satisfies false;
compilerApi.textSemanticsConstraintMatches(typedTextSemantics, { textSemanticsConstraintMissingKind: 'normalization' }) satisfies boolean;

const typedCollectionSemantics = compilerApi.createUniversalCollectionSemanticsConstraintEvidence({
  sourceLanguage: 'rust',
  target: 'typescript',
  sourceCollectionSemanticsRecords: [{ kind: 'map iterator hash', constraintKinds: ['map-key-semantics', 'hash-semantics'] }]
});
typedCollectionSemantics.status satisfies compilerApi.UniversalCollectionSemanticsConstraintStatus;
typedCollectionSemantics.claims.semanticEquivalenceClaim satisfies false;
compilerApi.collectionSemanticsConstraintMatches(typedCollectionSemantics, { collectionSemanticsConstraintMissingKind: 'hash-semantics' }) satisfies boolean;

const typedSerializationSemantics = compilerApi.createUniversalSerializationSemanticsConstraintEvidence({
  sourceLanguage: 'rust',
  target: 'typescript',
  sourceSerializationSemanticsRecords: [{ kind: 'json schema canonical roundtrip', constraintKinds: ['field-naming', 'canonicalization', 'roundtrip-stability'] }]
});
typedSerializationSemantics.status satisfies compilerApi.UniversalSerializationSemanticsConstraintStatus;
typedSerializationSemantics.claims.semanticEquivalenceClaim satisfies false;
compilerApi.serializationSemanticsConstraintMatches(typedSerializationSemantics, { serializationSemanticsConstraintMissingKind: 'canonicalization' }) satisfies boolean;

const typedDependencySemantics = compilerApi.createUniversalDependencySemanticsConstraintEvidence({
  sourceLanguage: 'typescript',
  target: 'rust',
  sourceDependencySemanticsRecords: ['lockfile-integrity', { kind: 'npm package-lock peer dependency integrity', manifestName: 'package.json', managerName: 'pnpm', constraintKinds: ['package-manager', 'lockfile-integrity', 'peer-dependency'] }]
});
typedDependencySemantics.status satisfies compilerApi.UniversalDependencySemanticsConstraintStatus;
typedDependencySemantics.claims.semanticEquivalenceClaim satisfies false;
compilerApi.dependencySemanticsConstraintMatches(typedDependencySemantics, { dependencySemanticsConstraintMissingKind: 'lockfile-integrity' }) satisfies boolean;

const typedLayoutStyle = compilerApi.createUniversalLayoutStyleConstraintEvidence({
  sourceLanguage: 'css',
  target: 'swiftui',
  sourceLayoutStyleRecords: [{ kind: 'css-rule', selector: '.button', property: 'color', value: 'red', display: 'flex', sourceMapIds: ['map_style'], proofObligationIds: ['proof_style'] }]
});
typedLayoutStyle.status satisfies compilerApi.UniversalLayoutStyleConstraintStatus;
typedLayoutStyle.claims.layoutStyleEquivalenceClaim satisfies false;
typedLayoutStyle.claims.computedStyleEquivalenceClaim satisfies false;
typedLayoutStyle.claims.renderEquivalenceClaim satisfies false;
typedLayoutStyle.claims.autoMergeClaim satisfies false;
compilerApi.layoutStyleConstraintMatches(typedLayoutStyle, { layoutStyleConstraintMissingKind: 'selector-target', layoutStyleConstraintSourceMapId: 'map_style' }) satisfies boolean;

const typedLayoutStylePlanQuery: compilerApi.UniversalConversionPlanConstraintQuery = {
  layoutStyleConstraintMissingKind: 'selector-target'
};
const typedLayoutStyleArtifactQuery: compilerApi.UniversalConversionArtifactQuery = {
  layoutStyleConstraintMissingEvidence: 'translation-layout-style:selector-target'
};

void typedNumericSemantics;
void typedTextSemantics;
void typedCollectionSemantics;
void typedSerializationSemantics;
void typedDependencySemantics;
void typedLayoutStyle;
void typedLayoutStylePlanQuery;
void typedLayoutStyleArtifactQuery;
