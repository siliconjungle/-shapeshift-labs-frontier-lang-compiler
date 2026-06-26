function compilerAssignabilityOracleRecord(checker, type, apparentType, identitySymbol, location, ts) {
  const declaration = boundedAssignabilityAliasDeclaration(identitySymbol, ts);
  if (!declaration || typeof checker?.isTypeAssignableTo !== 'function' || !type || !apparentType) return undefined;
  const directions = [
    compilerAssignabilityOracleDirection(checker, 'declared-to-apparent', type, apparentType),
    compilerAssignabilityOracleDirection(checker, 'apparent-to-declared', apparentType, type)
  ].filter(Boolean);
  const complete = directions.length === 2 && directions.every((direction) => typeof direction.assignable === 'boolean');
  return compactRecord({
    kind: 'typescript-checker-public-api-declared-apparent-assignability-oracle',
    scope: 'public-type-alias-declared-apparent',
    oracle: 'TypeChecker.isTypeAssignableTo',
    declarationKind: 'type-alias',
    declarationCount: Array.isArray(identitySymbol?.declarations) ? identitySymbol.declarations.length : undefined,
    typeNodeText: nodeText(declaration.type),
    declaredTypeText: typeText(checker, type),
    apparentTypeText: typeText(checker, apparentType),
    directions: nonEmptyArray(directions),
    directionCount: directions.length || undefined,
    equivalentByBidirectionalAssignability: complete ? directions.every((direction) => direction.assignable === true) : undefined,
    ambiguous: complete ? undefined : true,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false
  });
}

function compilerAssignabilityOracleDirection(checker, direction, fromType, toType) {
  const assignable = safeCall(checker.isTypeAssignableTo, checker, fromType, toType);
  return compactRecord({
    direction,
    fromTypeText: typeText(checker, fromType),
    toTypeText: typeText(checker, toType),
    assignable: typeof assignable === 'boolean' ? assignable : undefined
  });
}

function boundedAssignabilityAliasDeclaration(identitySymbol, ts) {
  const declarations = Array.isArray(identitySymbol?.declarations) ? identitySymbol.declarations : [];
  return declarations.find((declaration) => (
    isSyntaxKind(ts, declaration, 'TypeAliasDeclaration')
      && isBoundedAssignabilityTypeAliasNode(declaration.type, ts)
  ));
}

function isBoundedAssignabilityTypeAliasNode(node, ts) {
  if (!node) return false;
  const excludedKinds = [
    'ConditionalType',
    'ConstructorType',
    'FunctionType',
    'IndexedAccessType',
    'InferType',
    'IntersectionType',
    'MappedType',
    'TemplateLiteralType',
    'TupleType',
    'TypeLiteral',
    'TypeOperator',
    'UnionType'
  ];
  return !excludedKinds.some((kind) => isSyntaxKind(ts, node, kind));
}

function hasFocusedCompilerApiShape(record) {
  return arrayValue(record.typeParameters).length > 0
    || arrayValue(record.callSignatures).length > 0
    || arrayValue(record.constructSignatures).length > 0
    || arrayValue(record.properties).length > 0
    || arrayValue(record.indexSignatures).length > 0
    || arrayValue(record.advancedTypeShapes).length > 0
    || arrayValue(record.typeReferenceTargets).length > 0
    || objectHasValues(record.classApi)
    || objectHasValues(record.enumShape)
    || objectHasValues(record.typeInferenceSyntax);
}

function safeCall(fn, receiver, ...args) {
  if (typeof fn !== 'function') return undefined;
  try { return fn.apply(receiver, args); } catch { return undefined; }
}

function stringValue(value) {
  return value === undefined || value === null || value === '' ? undefined : String(value);
}

function numberValue(value) { return Number.isFinite(value) ? value : undefined; }
function syntaxKind(ts, name) { return numberValue(ts?.SyntaxKind?.[name]); }
function isSyntaxKind(ts, node, name) { return node?.kind === syntaxKind(ts, name); }
function typeText(checker, type) { return type ? stringValue(safeCall(checker?.typeToString, checker, type)) : undefined; }
function nonEmptyArray(value) { return Array.isArray(value) && value.length ? value : undefined; }
function arrayValue(value) { return Array.isArray(value) ? value : []; }
function nodeText(node) { return stringValue(safeCall(node?.getText, node)); }
function objectHasValues(value) { return value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }

export { compilerAssignabilityOracleRecord, hasFocusedCompilerApiShape };
