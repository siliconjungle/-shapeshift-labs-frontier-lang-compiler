import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment } from '../../native-import-utils.js';
import { compilerAdvancedTypeShapes } from './typeScriptCompilerAdvancedTypeShapes.js';
import { compilerAssignabilityOracleRecord, hasFocusedCompilerApiShape } from './typeScriptCompilerAssignabilityOracle.js';
import { compilerClassApiRecord } from './typeScriptCompilerClassApi.js';
import { compilerEnumShapeRecord } from './typeScriptCompilerEnumShape.js';
import { compilerTypeInferenceSyntaxRecord } from './typeScriptCompilerInferenceSyntax.js';
import { compilerTypeReferenceTargets } from './typeScriptCompilerTypeReferenceTargets.js';

function typeScriptCompilerSymbolRecordForNode(node, input, options = {}, fallbackNode = undefined, idOptions = {}) {
  const checker = options.typeChecker ?? options.checker ?? options.program?.getTypeChecker?.();
  const symbol = safeCall(checker?.getSymbolAtLocation, checker, node) ?? safeCall(checker?.getSymbolAtLocation, checker, fallbackNode);
  if (!symbol) return undefined;
  const aliasedSymbol = safeCall(checker?.getAliasedSymbol, checker, symbol);
  const targetSymbol = aliasedSymbol && aliasedSymbol !== symbol ? aliasedSymbol : undefined;
  const identitySymbol = targetSymbol ?? symbol;
  const fullyQualifiedName = stringValue(safeCall(checker?.getFullyQualifiedName, checker, identitySymbol));
  const localName = compilerSymbolLocalName(symbol, node, options.ts);
  const targetName = targetSymbol ? stringValue(targetSymbol.escapedName ?? targetSymbol.name) : undefined;
  const identity = fullyQualifiedName ?? targetName ?? localName;
  if (!identity) return undefined;
  const compilerSymbol = compactRecord({
    parser: options.parser,
    localName,
    targetName,
    fullyQualifiedName,
    flags: numberValue(symbol.flags),
    targetFlags: numberValue(targetSymbol?.flags),
    declarations: Array.isArray(identitySymbol.declarations) ? identitySymbol.declarations.length : undefined,
    aliased: Boolean(targetSymbol)
  });
  const compilerType = typeScriptCompilerTypeRecordForNode(node, {
    ...options,
    sourcePath: input.sourcePath,
    sourceHash: input.sourceHash
  }, fallbackNode, identitySymbol);
  return {
    identity,
    compilerSymbol,
    compilerSymbolIdentityHash: hashSemanticValue(compilerSymbol),
    compilerType,
    compilerTypeIdentityHash: compilerType ? hashSemanticValue(compilerType) : undefined,
    symbolId: `symbol:${input.language}:compiler:${idOptions.importRole ? 'import:' : ''}${idFragment(identity)}`
  };
}

function typeScriptCompilerTypeRecordForNode(node, options = {}, fallbackNode = undefined, identitySymbol = undefined) {
  const checker = options.typeChecker ?? options.checker ?? options.program?.getTypeChecker?.();
  const type = safeCall(checker?.getTypeAtLocation, checker, node) ?? safeCall(checker?.getTypeAtLocation, checker, fallbackNode);
  if (!type) return undefined;
  const apparentType = safeCall(checker?.getApparentType, checker, type);
  const typeText = stringValue(safeCall(checker?.typeToString, checker, type));
  const apparentTypeText = stringValue(apparentType ? safeCall(checker?.typeToString, checker, apparentType) : undefined);
  const apiSignature = compilerApiSignatureRecord(checker, type, apparentType, node, fallbackNode, options, identitySymbol);
  return compactRecord({
    parser: options.parser,
    typeText,
    apparentTypeText,
    flags: numberValue(type.flags),
    objectFlags: numberValue(type.objectFlags),
    intrinsicName: stringValue(type.intrinsicName),
    ...apiSignature,
    apiSignatureHash: hashSemanticValue({
      kind: 'frontier.lang.typescript.compilerPublicApiSignature.v1',
      parser: options.parser,
      typeText,
      apparentTypeText,
      ...canonicalApiSignatureRecord(apiSignature)
    })
  });
}

function compilerApiSignatureRecord(checker, type, apparentType, node, fallbackNode, options, identitySymbol) {
  const location = fallbackNode ?? node;
  const signatureType = type ?? apparentType;
  const propertyType = apparentType ?? type;
  const typeParameters = compilerTypeParameterRecords(checker, identitySymbol, location, options.ts);
  const callSignatures = compilerSignatureRecords(checker, signatureType, signatureKind(options.ts, 'Call', 0), location, options.ts);
  const constructSignatures = compilerSignatureRecords(checker, signatureType, signatureKind(options.ts, 'Construct', 1), location, options.ts);
  const properties = compilerPropertyRecords(checker, propertyType, location, options.ts);
  const indexSignatures = compilerIndexSignatureRecords(checker, propertyType);
  const advancedTypeShapes = compilerAdvancedTypeShapes(checker, identitySymbol, location, options.ts);
  const typeReferenceTargets = compilerTypeReferenceTargets(checker, identitySymbol, location, options.ts);
  const classApi = compilerClassApiRecord(checker, identitySymbol, location, options.ts);
  const enumShape = compilerEnumShapeRecord(checker, identitySymbol, location, options.ts, options);
  const typeInferenceSyntax = compilerTypeInferenceSyntaxRecord(checker, identitySymbol, location, options.ts);
  const assignabilityOracle = hasFocusedCompilerApiShape({ typeParameters, callSignatures, constructSignatures, properties, indexSignatures, advancedTypeShapes, typeReferenceTargets, classApi, enumShape, typeInferenceSyntax })
    ? undefined
    : compilerAssignabilityOracleRecord(checker, type, apparentType, identitySymbol, location, options.ts);
  return compactRecord({
    typeParameters: nonEmptyArray(typeParameters),
    typeParameterCount: typeParameters.length || undefined,
    typeParameterDefaultCount: typeParameters.filter((parameter) => parameter.hasDefault).length || undefined,
    typeParameterConstraintCount: typeParameters.filter((parameter) => parameter.hasConstraint).length || undefined,
    callSignatures: nonEmptyArray(callSignatures),
    constructSignatures: nonEmptyArray(constructSignatures),
    properties: nonEmptyArray(properties),
    indexSignatures: nonEmptyArray(indexSignatures),
    indexSignatureCount: indexSignatures.length || undefined,
    indexSignatureReadonlyCount: indexSignatures.filter((signature) => signature.readonly === true).length || undefined,
    advancedTypeShapes: nonEmptyArray(advancedTypeShapes),
    advancedTypeShapeKinds: nonEmptyArray(uniqueStrings(advancedTypeShapes.map((shape) => shape.kind))),
    advancedTypeShapeCount: advancedTypeShapes.length || undefined,
    typeReferenceTargets: nonEmptyArray(typeReferenceTargets),
    typeReferenceTargetCount: typeReferenceTargets.length || undefined,
    conditionalTypeCount: countAdvancedTypeShapeKind(advancedTypeShapes, 'conditional-type') || undefined,
    mappedTypeCount: countAdvancedTypeShapeKind(advancedTypeShapes, 'mapped-type') || undefined,
    indexedAccessTypeCount: countAdvancedTypeShapeKind(advancedTypeShapes, 'indexed-access-type') || undefined,
    keyofTypeOperatorCount: countAdvancedTypeShapeKind(advancedTypeShapes, 'keyof-type-operator') || undefined,
    templateLiteralTypeCount: countAdvancedTypeShapeKind(advancedTypeShapes, 'template-literal-type') || undefined,
    inferTypeCount: countAdvancedTypeShapeKind(advancedTypeShapes, 'infer-type') || undefined,
    ...enumShape,
    ...typeInferenceSyntax,
    assignabilityOracleCount: assignabilityOracle ? 1 : undefined,
    assignabilityOracleDirectionCount: assignabilityOracle?.directionCount,
    assignabilityOracleHash: assignabilityOracle ? hashSemanticValue({ kind: 'frontier.lang.typescript.compilerPublicApiAssignabilityOracle.v1', assignabilityOracle }) : undefined,
    assignabilityOracle,
    ...classApi
  });
}

function compilerTypeParameterRecords(checker, identitySymbol, location, ts) {
  const declaration = (Array.isArray(identitySymbol?.declarations) ? identitySymbol.declarations : [])
    .find((item) => Array.isArray(item?.typeParameters) && item.typeParameters.length > 0);
  if (!declaration) return [];
  return declaration.typeParameters.map((parameter, ordinal) => {
    const parameterSymbol = safeCall(checker?.getSymbolAtLocation, checker, parameter.name) ?? parameter.symbol;
    const parameterType = safeCall(checker?.getTypeAtLocation, checker, parameter.name ?? parameter);
    const constraintType = parameter.constraint ? safeCall(checker?.getTypeFromTypeNode, checker, parameter.constraint) : undefined;
    const defaultType = parameter.default ? safeCall(checker?.getTypeFromTypeNode, checker, parameter.default) : undefined;
    return compactRecord({
      name: stringValue(parameter.name?.escapedText ?? parameter.name?.text),
      ordinal,
      typeText: parameterType ? stringValue(safeCall(checker?.typeToString, checker, parameterType)) : undefined,
      constraintTypeText: constraintType ? stringValue(safeCall(checker?.typeToString, checker, constraintType)) : undefined,
      defaultTypeText: defaultType ? stringValue(safeCall(checker?.typeToString, checker, defaultType)) : undefined,
      flags: numberValue(parameterSymbol?.flags),
      hasConstraint: parameter.constraint ? true : undefined,
      hasDefault: parameter.default ? true : undefined,
      variance: typeParameterVariance(ts, parameter)
    });
  });
}

function compilerSignatureRecords(checker, type, kind, location, ts) {
  const signatures = safeCall(checker?.getSignaturesOfType, checker, type, kind);
  if (!Array.isArray(signatures) || !signatures.length) return [];
  return signatures.map((signature) => compactRecord({
    signatureText: stringValue(safeCall(checker?.signatureToString, checker, signature)),
    returnTypeText: compilerReturnTypeText(checker, signature),
    parameters: nonEmptyArray(compilerSignatureParameterRecords(checker, signature, location, ts))
  }));
}

function compilerSignatureParameterRecords(checker, signature, location, ts) {
  const parameters = Array.isArray(signature?.parameters)
    ? signature.parameters
    : safeCall(signature?.getParameters, signature);
  if (!Array.isArray(parameters)) return [];
  return parameters.map((parameter) => {
    const parameterType = safeCall(checker?.getTypeOfSymbolAtLocation, checker, parameter, location);
    return compactRecord({
      name: stringValue(parameter.escapedName ?? parameter.name),
      typeText: parameterType ? stringValue(safeCall(checker?.typeToString, checker, parameterType)) : undefined,
      flags: numberValue(parameter.flags),
      optional: hasSymbolFlag(parameter, ts, 'Optional')
    });
  });
}

function compilerReturnTypeText(checker, signature) {
  const returnType = safeCall(checker?.getReturnTypeOfSignature, checker, signature);
  return returnType ? stringValue(safeCall(checker?.typeToString, checker, returnType)) : undefined;
}

function compilerPropertyRecords(checker, type, location, ts) {
  const properties = safeCall(checker?.getPropertiesOfType, checker, type);
  if (!Array.isArray(properties) || !properties.length) return [];
  return properties
    .map((property) => {
      const declaration = Array.isArray(property.declarations) ? property.declarations[0] : undefined;
      const propertyType = safeCall(checker?.getTypeOfSymbolAtLocation, checker, property, declaration ?? location);
      return compactRecord({
        name: stringValue(property.escapedName ?? property.name),
        typeText: propertyType ? stringValue(safeCall(checker?.typeToString, checker, propertyType)) : undefined,
        flags: numberValue(property.flags),
        optional: hasSymbolFlag(property, ts, 'Optional'),
        readonly: compilerPropertyReadonly(property, ts),
        declarations: Array.isArray(property.declarations) ? property.declarations.length : undefined
      });
    })
    .sort((left, right) => String(left.name ?? '').localeCompare(String(right.name ?? '')));
}

function compilerIndexSignatureRecords(checker, type) {
  const indexInfos = safeCall(checker?.getIndexInfosOfType, checker, type);
  if (!Array.isArray(indexInfos) || !indexInfos.length) return [];
  return indexInfos.map((info, ordinal) => compactRecord({
    ordinal,
    keyTypeText: info?.keyType ? stringValue(safeCall(checker?.typeToString, checker, info.keyType)) : undefined,
    valueTypeText: info?.type ? stringValue(safeCall(checker?.typeToString, checker, info.type)) : undefined,
    readonly: typeof info?.isReadonly === 'boolean' ? info.isReadonly : undefined,
    declarationText: nodeText(info?.declaration)
  })).sort((left, right) => String(left.keyTypeText ?? '').localeCompare(String(right.keyTypeText ?? '')));
}

function countAdvancedTypeShapeKind(records, kind) { return records.filter((record) => record.kind === kind).length; }

function safeCall(fn, receiver, ...args) {
  if (typeof fn !== 'function') return undefined;
  try { return fn.apply(receiver, args); } catch { return undefined; }
}

function stringValue(value) {
  return value === undefined || value === null || value === '' ? undefined : String(value);
}

function numberValue(value) { return Number.isFinite(value) ? value : undefined; }
function compilerSymbolLocalName(symbol, node, ts) {
  return isPrivateIdentifier(node, ts)
    ? nodeText(node)
    : stringValue(symbol.escapedName ?? symbol.name);
}
function signatureKind(ts, name, fallback) { return numberValue(ts?.SignatureKind?.[name]) ?? fallback; }
function typeParameterVariance(ts, parameter) {
  const modifiers = Array.isArray(parameter?.modifiers) ? parameter.modifiers : [];
  const inKeyword = numberValue(ts?.SyntaxKind?.InKeyword);
  const outKeyword = numberValue(ts?.SyntaxKind?.OutKeyword);
  const hasIn = inKeyword !== undefined && modifiers.some((modifier) => modifier.kind === inKeyword);
  const hasOut = outKeyword !== undefined && modifiers.some((modifier) => modifier.kind === outKeyword);
  if (hasIn && hasOut) return 'in out';
  if (hasIn) return 'in';
  if (hasOut) return 'out';
  return undefined;
}
function compilerPropertyReadonly(property, ts) {
  const readonlyFlag = numberValue(ts?.ModifierFlags?.Readonly);
  const modifierFlags = numberValue(safeCall(ts?.getDeclarationModifierFlagsFromSymbol, ts, property));
  if (readonlyFlag !== undefined && modifierFlags !== undefined) return Boolean(modifierFlags & readonlyFlag);
  const declarations = Array.isArray(property?.declarations) ? property.declarations : [];
  const readonlyKeyword = numberValue(ts?.SyntaxKind?.ReadonlyKeyword);
  if (readonlyKeyword === undefined || !declarations.length) return undefined;
  return declarations.some((declaration) => (
    Array.isArray(declaration?.modifiers)
      && declaration.modifiers.some((modifier) => modifier.kind === readonlyKeyword)
  ));
}
function hasSymbolFlag(symbol, ts, flagName) {
  const flag = numberValue(ts?.SymbolFlags?.[flagName]);
  return flag !== undefined && numberValue(symbol?.flags) !== undefined ? Boolean(symbol.flags & flag) : undefined;
}
function canonicalApiSignatureRecord(record) {
  return compactRecord({
    ...record,
    typeParameters: nonEmptyArray(arrayValue(record.typeParameters).map(({ flags: _flags, ...parameter }) => parameter)),
    callSignatures: nonEmptyArray(arrayValue(record.callSignatures).map(canonicalSignatureRecord)),
    constructSignatures: nonEmptyArray(arrayValue(record.constructSignatures).map(canonicalSignatureRecord)),
    properties: nonEmptyArray(arrayValue(record.properties).map(({ flags: _flags, ...property }) => property)),
    indexSignatures: nonEmptyArray(arrayValue(record.indexSignatures)),
    typeReferenceTargets: nonEmptyArray(arrayValue(record.typeReferenceTargets).map(canonicalTypeReferenceTargetRecord))
  });
}
function canonicalTypeReferenceTargetRecord(target) {
  return compactRecord({
    kind: target.kind,
    typeReferenceName: target.typeReferenceName,
    targetStatus: target.targetStatus,
    targetAliased: target.targetAliased,
    targetSymbolName: target.targetSymbolName,
    targetFullyQualifiedName: target.targetFullyQualifiedName,
    targetSymbolFlags: target.targetSymbolFlags,
    targetDeclarationKind: target.targetDeclarationKind,
    typeArgumentCount: target.typeArgumentCount
  });
}
function canonicalSignatureRecord(signature) {
  return compactRecord({
    ...signature,
    parameters: nonEmptyArray(arrayValue(signature.parameters).map(({ flags: _flags, ...parameter }) => parameter))
  });
}
function nonEmptyArray(value) { return Array.isArray(value) && value.length ? value : undefined; }
function arrayValue(value) { return Array.isArray(value) ? value : []; }
function nodeText(node) { return stringValue(safeCall(node?.getText, node)); }
function isPrivateIdentifier(node, ts) {
  const privateIdentifier = numberValue(ts?.SyntaxKind?.PrivateIdentifier);
  return privateIdentifier !== undefined
    ? node?.kind === privateIdentifier
    : nodeText(node)?.startsWith('#') === true;
}
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }

export { typeScriptCompilerSymbolRecordForNode };
