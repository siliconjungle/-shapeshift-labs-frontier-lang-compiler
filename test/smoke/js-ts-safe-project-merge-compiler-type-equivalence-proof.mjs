import { assert } from './helpers.mjs';
import { publicCompilerTypeDeltaConflicts } from '../../src/js-ts-safe-project-merge-graph-delta-compiler-conflicts.js';
import {
  aliasSource,
  boxSource,
  compilerGraph,
  contractSource,
  importsWithAmbiguousAssignabilityOracle,
  importsWithoutCompilerApiSignatureHash,
  importsWithoutCompilerPropertyModifierEvidence,
  importsWithoutCompilerPropertyTypeText,
  importsWithoutCompilerTypeParameterDefaultText,
  importsWithoutDocumentSourceHash,
  optionsSource,
  publicReaderType,
  readerSource,
  serviceSource
} from './js-ts-safe-project-merge-compiler-type-equivalence-helpers.mjs';

const baseFiles = { 'src/reader.ts': readerSource('return input;') };
const variantFiles = { 'src/reader.ts': readerSource('const value = input;', 'return value;') };
const baseGraph = await compilerGraph(baseFiles, undefined, 'reader_base');
const variantGraph = await compilerGraph(variantFiles, undefined, 'reader_variant');
const baseReaderType = publicReaderType(baseGraph, '"src/reader".read');
const variantReaderType = publicReaderType(variantGraph, '"src/reader".read');
assert.notEqual(variantReaderType?.sourceHash, baseReaderType?.sourceHash);
assert.equal(variantReaderType?.apiSignatureHash, baseReaderType?.apiSignatureHash);
assert.equal(variantReaderType?.typeEquivalenceStatus, 'compiler-backed-equivalent');
assert.equal(variantReaderType?.typeEquivalenceSignatureSetHash, baseReaderType?.typeEquivalenceSignatureSetHash);
assert.equal(variantReaderType?.typeEquivalenceProof?.status, 'passed');
assert.equal(variantReaderType?.typeEquivalenceProof?.sourcePath, 'src/reader.ts');
assert.equal(variantReaderType?.typeEquivalenceProof?.sourceHash, variantReaderType?.sourceHash);
assert.equal(variantReaderType?.typeEquivalenceProof?.requiredSignals?.includes('compiler-public-api-source-hash'), true);
assert.equal(variantReaderType?.callableSignatureEquivalenceProof?.sourceHash, variantReaderType?.sourceHash);

const genericBaseFiles = { 'src/box.ts': boxSource('string') };
const genericVariantFiles = { 'src/box.ts': boxSource('string', '  // source-only edit keeps the public generic contract stable') };
const genericBaseGraph = await compilerGraph(genericBaseFiles, undefined, 'generic_base');
const genericVariantGraph = await compilerGraph(genericVariantFiles, undefined, 'generic_variant');
const genericBaseType = publicReaderType(genericBaseGraph, '"src/box".Box');
const genericVariantType = publicReaderType(genericVariantGraph, '"src/box".Box');
assert.notEqual(genericVariantType?.sourceHash, genericBaseType?.sourceHash);
assert.equal(genericVariantType?.apiSignatureHash, genericBaseType?.apiSignatureHash);
assert.equal(genericVariantType?.typeParameterCount, 1);
assert.equal(genericVariantType?.typeParameterDefaultCount, 1);
assert.equal(genericVariantType?.typeEquivalenceStatus, 'compiler-backed-equivalent');
assert.equal(genericVariantType?.typeEquivalenceTypeParameterSetHash, genericBaseType?.typeEquivalenceTypeParameterSetHash);
assert.equal(genericVariantType?.typeEquivalenceProof?.kind, 'typescript-checker-public-api-generic-parameter-equivalence');
assert.equal(genericVariantType?.typeEquivalenceProof?.status, 'passed');
assert.equal(genericVariantType?.typeEquivalenceCheckerEvidence?.typeParameterDefaultTypeTexts?.[0], 'string');

const serviceBaseFiles = { 'src/service.ts': serviceSource('number', 'return 1;') };
const serviceVariantFiles = { 'src/service.ts': serviceSource('number', 'const value = 1;', 'return value;') };
const serviceBaseGraph = await compilerGraph(serviceBaseFiles, undefined, 'service_base');
const serviceVariantGraph = await compilerGraph(serviceVariantFiles, undefined, 'service_variant');
const serviceBaseType = publicReaderType(serviceBaseGraph, '"src/service".Service');
const serviceVariantType = publicReaderType(serviceVariantGraph, '"src/service".Service');
assert.notEqual(serviceVariantType?.sourceHash, serviceBaseType?.sourceHash);
assert.equal(serviceVariantType?.apiSignatureHash, serviceBaseType?.apiSignatureHash);
assert.equal(serviceVariantType?.propertyCount, 2);
assert.equal(serviceVariantType?.typeEquivalenceStatus, 'compiler-backed-equivalent');
assert.equal(serviceVariantType?.typeEquivalencePropertySetHash, serviceBaseType?.typeEquivalencePropertySetHash);
assert.equal(serviceVariantType?.typeEquivalenceProof?.kind, 'typescript-checker-public-api-member-property-signature-equivalence');
assert.equal(serviceVariantType?.typeEquivalenceProof?.status, 'passed');
assert.equal(serviceVariantType?.typeEquivalenceProof?.semanticEquivalenceClaim, false);
assert.equal(serviceVariantType?.typeEquivalenceCheckerEvidence?.propertyNames?.includes('load'), true);
assert.equal(serviceVariantType?.typeEquivalenceCheckerEvidence?.propertyTypeTexts?.includes('(input: string) => number'), true);

const optionsBaseFiles = { 'src/options.ts': optionsSource('string') };
const optionsVariantFiles = { 'src/options.ts': optionsSource('string', '  // source-only edit keeps readonly/optional public members stable') };
const optionsBaseGraph = await compilerGraph(optionsBaseFiles, undefined, 'options_base');
const optionsVariantGraph = await compilerGraph(optionsVariantFiles, undefined, 'options_variant');
const optionsBaseType = publicReaderType(optionsBaseGraph, '"src/options".Options');
const optionsVariantType = publicReaderType(optionsVariantGraph, '"src/options".Options');
assert.notEqual(optionsVariantType?.sourceHash, optionsBaseType?.sourceHash);
assert.equal(optionsVariantType?.apiSignatureHash, optionsBaseType?.apiSignatureHash);
assert.equal(optionsVariantType?.propertyCount, 2);
assert.equal(optionsVariantType?.propertyOptionalCount, 1);
assert.equal(optionsVariantType?.propertyReadonlyCount, 1);
assert.equal(optionsVariantType?.typeEquivalenceStatus, 'compiler-backed-equivalent');
assert.equal(optionsVariantType?.typeEquivalencePropertySetHash, optionsBaseType?.typeEquivalencePropertySetHash);
assert.equal(optionsVariantType?.typeEquivalenceProof?.kind, 'typescript-checker-public-api-member-property-signature-equivalence');
assert.equal(optionsVariantType?.typeEquivalenceProof?.propertyOptionalCount, 1);
assert.equal(optionsVariantType?.typeEquivalenceProof?.propertyReadonlyCount, 1);
assert.equal(optionsVariantType?.typeEquivalenceProof?.semanticEquivalenceClaim, false);
assert.deepEqual(optionsVariantType?.typeEquivalenceCheckerEvidence?.propertyOptionality, [false, true]);
assert.deepEqual(optionsVariantType?.typeEquivalenceCheckerEvidence?.propertyReadonly, [true, false]);

const aliasBaseFiles = { 'src/token.ts': aliasSource('unknown') };
const aliasVariantFiles = { 'src/token.ts': aliasSource('unknown', '// source-only edit keeps the alias assignability oracle stable') };
const aliasBaseGraph = await compilerGraph(aliasBaseFiles, undefined, 'alias_base');
const aliasVariantGraph = await compilerGraph(aliasVariantFiles, undefined, 'alias_variant');
const aliasBaseType = publicReaderType(aliasBaseGraph, '"src/token".Token');
const aliasVariantType = publicReaderType(aliasVariantGraph, '"src/token".Token');
assert.notEqual(aliasVariantType?.sourceHash, aliasBaseType?.sourceHash);
assert.equal(aliasVariantType?.apiSignatureHash, aliasBaseType?.apiSignatureHash);
assert.equal(aliasVariantType?.assignabilityOracleCount, 1);
assert.equal(aliasVariantType?.assignabilityOracleDirectionCount, 2);
assert.equal(aliasVariantType?.assignabilityOracle?.equivalentByBidirectionalAssignability, true);
assert.equal(aliasVariantType?.assignabilityOracle?.semanticEquivalenceClaim, false);
assert.equal(aliasVariantType?.assignabilityOracle?.runtimeEquivalenceClaim, false);
assert.equal(aliasVariantType?.typeEquivalenceStatus, 'compiler-backed-equivalent');
assert.equal(aliasVariantType?.typeEquivalenceAssignabilityOracleHash, aliasBaseType?.typeEquivalenceAssignabilityOracleHash);
assert.equal(aliasVariantType?.typeEquivalenceProof?.kind, 'typescript-checker-public-api-assignability-oracle-equivalence');
assert.equal(aliasVariantType?.typeEquivalenceProof?.status, 'passed');
assert.equal(aliasVariantType?.typeEquivalenceProof?.sourcePath, 'src/token.ts');
assert.equal(aliasVariantType?.typeEquivalenceProof?.sourceHash, aliasVariantType?.sourceHash);
assert.equal(aliasVariantType?.typeEquivalenceProof?.assignabilityOracleScope, 'declared-apparent-type-only');
assert.equal(aliasVariantType?.typeEquivalenceProof?.semanticEquivalenceClaim, false);
assert.deepEqual(aliasVariantType?.typeEquivalenceCheckerEvidence?.assignabilityOracleResults, [true, true]);

const contractBaseFiles = { 'src/reader-contract.ts': contractSource('number') };
const contractChangedFiles = { 'src/reader-contract.ts': contractSource('string') };
const contractBaseGraph = await compilerGraph(contractBaseFiles, undefined, 'contract_base');
const changedWithProofGraph = await compilerGraph(contractChangedFiles, undefined, 'contract_changed_proof');
const changedWithoutProofGraph = await compilerGraph(contractChangedFiles, importsWithoutCompilerApiSignatureHash, 'contract_changed_missing_proof');
const missingProofConflicts = publicCompilerTypeDeltaConflicts(contractBaseGraph, changedWithoutProofGraph, changedWithoutProofGraph, changedWithoutProofGraph);
const missingProofConflict = missingProofConflicts.find((conflict) => conflict.details?.reasonCode === 'typescript-public-api-type-equivalence-proof-missing');
assert.equal(missingProofConflicts.length, 1);
assert.equal(Boolean(missingProofConflict), true);
assert.equal(missingProofConflict.details.typeEquivalenceEvidence.missingRecords.length > 0, true);
assert.equal(missingProofConflict.details.typeEquivalenceEvidence.missingRecords[0].typeEquivalenceReasonCodes.includes('typescript-compiler-api-signature-hash-missing'), true);
assert.equal(publicCompilerTypeDeltaConflicts(contractBaseGraph, changedWithProofGraph, changedWithProofGraph, undefined).length, 0);

const changedWithoutSourceBoundProofGraph = await compilerGraph(contractChangedFiles, importsWithoutDocumentSourceHash, 'contract_changed_missing_source_bound_proof');
const missingSourceBoundProofConflicts = publicCompilerTypeDeltaConflicts(contractBaseGraph, changedWithoutSourceBoundProofGraph, changedWithoutSourceBoundProofGraph, changedWithoutSourceBoundProofGraph);
const missingSourceBoundProofConflict = missingSourceBoundProofConflicts.find((conflict) => conflict.details?.reasonCode === 'typescript-public-api-type-equivalence-proof-missing');
assert.equal(missingSourceBoundProofConflicts.length, 1);
assert.equal(Boolean(missingSourceBoundProofConflict), true);
assert.equal(missingSourceBoundProofConflict.details.typeEquivalenceEvidence.missingRecords.length > 0, true);
assert.equal(missingSourceBoundProofConflict.details.typeEquivalenceEvidence.missingRecords[0].sourceHash, undefined);
assert.equal(missingSourceBoundProofConflict.details.typeEquivalenceEvidence.missingRecords[0].typeEquivalenceProofSourceHash, undefined);
assert.equal(missingSourceBoundProofConflict.details.typeEquivalenceEvidence.missingRecords[0].typeEquivalenceReasonCodes.includes('typescript-compiler-public-api-source-hash-missing'), true);

const genericContractBaseFiles = { 'src/box-contract.ts': boxSource('string') };
const genericContractChangedFiles = { 'src/box-contract.ts': boxSource('number') };
const genericContractBaseGraph = await compilerGraph(genericContractBaseFiles, undefined, 'generic_contract_base');
const genericChangedWithProofGraph = await compilerGraph(genericContractChangedFiles, undefined, 'generic_contract_changed_proof');
const genericChangedWithoutProofGraph = await compilerGraph(genericContractChangedFiles, importsWithoutCompilerTypeParameterDefaultText, 'generic_contract_changed_missing_proof');
const genericMissingProofConflicts = publicCompilerTypeDeltaConflicts(genericContractBaseGraph, genericChangedWithoutProofGraph, genericChangedWithoutProofGraph, genericChangedWithoutProofGraph);
const genericMissingProofConflict = genericMissingProofConflicts.find((conflict) => conflict.details?.reasonCode === 'typescript-public-api-type-equivalence-proof-missing');
assert.equal(genericMissingProofConflicts.length, 1);
assert.equal(Boolean(genericMissingProofConflict), true);
assert.equal(genericMissingProofConflict.details.typeEquivalenceEvidence.requiredEvidence, 'typescript-checker-public-api-type-equivalence');
assert.equal(genericMissingProofConflict.details.typeEquivalenceEvidence.missingRecords.length > 0, true);
assert.equal(genericMissingProofConflict.details.typeEquivalenceEvidence.missingRecords[0].typeEquivalenceReasonCodes.includes('typescript-compiler-type-parameter-default-type-texts-missing'), true);
assert.equal(publicCompilerTypeDeltaConflicts(genericContractBaseGraph, genericChangedWithProofGraph, genericChangedWithProofGraph, undefined).length, 0);

const classContractBaseFiles = { 'src/service-contract.ts': serviceSource('number', 'return 1;') };
const classContractChangedFiles = { 'src/service-contract.ts': serviceSource('string', 'return "";') };
const classContractBaseGraph = await compilerGraph(classContractBaseFiles, undefined, 'class_contract_base');
const classChangedWithProofGraph = await compilerGraph(classContractChangedFiles, undefined, 'class_contract_changed_proof');
const classChangedWithoutProofGraph = await compilerGraph(classContractChangedFiles, importsWithoutCompilerPropertyTypeText, 'class_contract_changed_missing_property_proof');
const classMissingProofConflicts = publicCompilerTypeDeltaConflicts(classContractBaseGraph, classChangedWithoutProofGraph, classChangedWithoutProofGraph, classChangedWithoutProofGraph);
const classMissingProofConflict = classMissingProofConflicts.find((conflict) => conflict.details?.reasonCode === 'typescript-public-api-type-equivalence-proof-missing');
assert.equal(classMissingProofConflicts.length, 1);
assert.equal(Boolean(classMissingProofConflict), true);
assert.equal(classMissingProofConflict.details.typeEquivalenceEvidence.missingRecords.length > 0, true);
assert.equal(classMissingProofConflict.details.typeEquivalenceEvidence.missingRecords[0].typeEquivalenceReasonCodes.includes('typescript-compiler-member-property-type-texts-missing'), true);
assert.equal(classMissingProofConflict.details.typeEquivalenceEvidence.missingRecords[0].semanticEquivalenceClaim, false);
assert.equal(publicCompilerTypeDeltaConflicts(classContractBaseGraph, classChangedWithProofGraph, classChangedWithProofGraph, undefined).length, 0);

const optionsContractBaseFiles = { 'src/options-contract.ts': optionsSource('string') };
const optionsContractChangedFiles = { 'src/options-contract.ts': optionsSource('number') };
const optionsContractBaseGraph = await compilerGraph(optionsContractBaseFiles, undefined, 'options_contract_base');
const optionsChangedWithProofGraph = await compilerGraph(optionsContractChangedFiles, undefined, 'options_contract_changed_proof');
const optionsChangedWithoutProofGraph = await compilerGraph(optionsContractChangedFiles, importsWithoutCompilerPropertyModifierEvidence, 'options_contract_changed_missing_modifier_proof');
const optionsMissingProofConflicts = publicCompilerTypeDeltaConflicts(optionsContractBaseGraph, optionsChangedWithoutProofGraph, optionsChangedWithoutProofGraph, optionsChangedWithoutProofGraph);
const optionsMissingProofConflict = optionsMissingProofConflicts.find((conflict) => conflict.details?.reasonCode === 'typescript-public-api-type-equivalence-proof-missing');
assert.equal(optionsMissingProofConflicts.length, 1);
assert.equal(Boolean(optionsMissingProofConflict), true);
assert.equal(optionsMissingProofConflict.details.typeEquivalenceEvidence.missingRecords.length > 0, true);
assert.equal(optionsMissingProofConflict.details.typeEquivalenceEvidence.missingRecords[0].typeEquivalenceReasonCodes.includes('typescript-compiler-member-property-optionality-missing'), true);
assert.equal(optionsMissingProofConflict.details.typeEquivalenceEvidence.missingRecords[0].typeEquivalenceReasonCodes.includes('typescript-compiler-member-property-readonly-missing'), true);
assert.equal(optionsMissingProofConflict.details.typeEquivalenceEvidence.missingRecords[0].semanticEquivalenceClaim, false);
assert.equal(publicCompilerTypeDeltaConflicts(optionsContractBaseGraph, optionsChangedWithProofGraph, optionsChangedWithProofGraph, undefined).length, 0);

const aliasContractBaseFiles = { 'src/token-contract.ts': aliasSource('unknown') };
const aliasContractChangedFiles = { 'src/token-contract.ts': aliasSource('never') };
const aliasContractBaseGraph = await compilerGraph(aliasContractBaseFiles, undefined, 'alias_contract_base');
const aliasChangedWithProofGraph = await compilerGraph(aliasContractChangedFiles, undefined, 'alias_contract_changed_proof');
const aliasChangedWithAmbiguousProofGraph = await compilerGraph(aliasContractChangedFiles, importsWithAmbiguousAssignabilityOracle, 'alias_contract_changed_ambiguous_assignability_oracle');
const aliasAmbiguousProofConflicts = publicCompilerTypeDeltaConflicts(aliasContractBaseGraph, aliasChangedWithAmbiguousProofGraph, aliasChangedWithAmbiguousProofGraph, aliasChangedWithAmbiguousProofGraph);
const aliasAmbiguousProofConflict = aliasAmbiguousProofConflicts.find((conflict) => conflict.details?.reasonCode === 'typescript-public-api-type-equivalence-proof-missing');
assert.equal(aliasAmbiguousProofConflicts.length, 1);
assert.equal(Boolean(aliasAmbiguousProofConflict), true);
assert.equal(aliasAmbiguousProofConflict.details.typeEquivalenceEvidence.missingRecords.length > 0, true);
assert.equal(aliasAmbiguousProofConflict.details.typeEquivalenceEvidence.missingRecords[0].typeEquivalenceReasonCodes.includes('typescript-compiler-assignability-oracle-result-missing'), true);
assert.equal(aliasAmbiguousProofConflict.details.typeEquivalenceEvidence.missingRecords[0].typeEquivalenceReasonCodes.includes('typescript-compiler-assignability-oracle-unambiguous-result-missing'), true);
assert.equal(aliasAmbiguousProofConflict.details.typeEquivalenceEvidence.missingRecords[0].typeEquivalenceProofSourceHash, aliasAmbiguousProofConflict.details.typeEquivalenceEvidence.missingRecords[0].sourceHash);
assert.equal(aliasAmbiguousProofConflict.details.typeEquivalenceEvidence.missingRecords[0].semanticEquivalenceClaim, false);
assert.equal(aliasAmbiguousProofConflict.details.typeEquivalenceEvidence.missingRecords[0].assignabilityOracle.ambiguous, true);
assert.equal(publicCompilerTypeDeltaConflicts(aliasContractBaseGraph, aliasChangedWithProofGraph, aliasChangedWithProofGraph, undefined).length, 0);

const parityAndTypeProofConflicts = publicCompilerTypeDeltaConflicts(optionsContractBaseGraph, optionsChangedWithoutProofGraph, optionsChangedWithoutProofGraph, optionsChangedWithoutProofGraph, { declarationEmitParityProof: { status: 'failed', reasonCodes: ['typescript-public-api-declaration-emit-parity-mismatch'] } });
const parityAndTypeProofConflict = parityAndTypeProofConflicts.find((conflict) => conflict.details?.reasonCode === 'typescript-public-api-declaration-emit-parity-mismatch');
assert.equal(parityAndTypeProofConflicts.length, 1);
assert.equal(Boolean(parityAndTypeProofConflict), true);
assert.equal(parityAndTypeProofConflict.details.conflictCode, 'project-public-compiler-type-delta-conflict');
assert.equal(parityAndTypeProofConflict.details.declarationEmitParityEvidence.requiredEvidence, 'typescript-checker-public-api-declaration-emit-parity');
assert.equal(parityAndTypeProofConflict.details.typeEquivalenceEvidence.requiredEvidence, 'typescript-checker-public-api-type-equivalence');
assert.equal(parityAndTypeProofConflict.details.declarationEmitParityEvidence.semanticEquivalenceClaim, false);
assert.equal(parityAndTypeProofConflict.details.typeEquivalenceEvidence.missingRecords[0].semanticEquivalenceClaim, false);
