function compilerAdvancedTypeShapes(checker, identitySymbol, location, ts) {
  const declarations = Array.isArray(identitySymbol?.declarations) ? identitySymbol.declarations : [];
  const records = [];
  for (const declaration of declarations) {
    visitTypeNodes(ts, declaration, (node) => {
      const record = advancedTypeShapeRecord(checker, node, location, ts);
      if (record) records.push(record);
    });
  }
  return uniqueRecords(records, (record) => [record.kind, record.nodeText, record.typeText].join('\0'));
}

function advancedTypeShapeRecord(checker, node, location, ts) {
  if (isSyntaxKind(ts, node, 'ConditionalType')) {
    return compactRecord({
      kind: 'conditional-type',
      syntaxKind: syntaxKindName(ts, node.kind),
      nodeText: nodeText(node),
      typeText: typeTextFromTypeNode(checker, node, location),
      checkTypeText: typeTextFromTypeNode(checker, node.checkType, location),
      extendsTypeText: typeTextFromTypeNode(checker, node.extendsType, location),
      trueTypeText: typeTextFromTypeNode(checker, node.trueType, location),
      falseTypeText: typeTextFromTypeNode(checker, node.falseType, location)
    });
  }
  if (isSyntaxKind(ts, node, 'MappedType')) {
    return compactRecord({
      kind: 'mapped-type',
      syntaxKind: syntaxKindName(ts, node.kind),
      nodeText: nodeText(node),
      typeText: typeTextFromTypeNode(checker, node, location),
      mappedConstraintTypeText: typeTextFromTypeNode(checker, node.typeParameter?.constraint, location),
      mappedValueTypeText: typeTextFromTypeNode(checker, node.type, location)
    });
  }
  if (isSyntaxKind(ts, node, 'IndexedAccessType')) {
    return compactRecord({
      kind: 'indexed-access-type',
      syntaxKind: syntaxKindName(ts, node.kind),
      nodeText: nodeText(node),
      typeText: typeTextFromTypeNode(checker, node, location),
      objectTypeText: typeTextFromTypeNode(checker, node.objectType, location),
      indexTypeText: typeTextFromTypeNode(checker, node.indexType, location)
    });
  }
  if (isSyntaxKind(ts, node, 'TypeOperator') && node.operator === syntaxKind(ts, 'KeyOfKeyword')) {
    return compactRecord({
      kind: 'keyof-type-operator',
      syntaxKind: syntaxKindName(ts, node.kind),
      nodeText: nodeText(node),
      typeText: typeTextFromTypeNode(checker, node, location),
      keyofTargetTypeText: typeTextFromTypeNode(checker, node.type, location)
    });
  }
  if (isSyntaxKind(ts, node, 'TemplateLiteralType')) {
    return compactRecord({
      kind: 'template-literal-type',
      syntaxKind: syntaxKindName(ts, node.kind),
      nodeText: nodeText(node),
      typeText: typeTextFromTypeNode(checker, node, location),
      templateHeadText: literalText(node.head?.text) ?? nodeText(node.head),
      templateSpanCount: arrayValue(node.templateSpans).length || undefined,
      templateSpanTexts: nonEmptyArray(arrayValue(node.templateSpans).map((span) => nodeText(span))),
      templateSpanTypeTexts: nonEmptyArray(arrayValue(node.templateSpans).map((span) => typeTextFromTypeNode(checker, span.type, location))),
      templateLiteralTexts: nonEmptyArray([
        literalText(node.head?.text) ?? nodeText(node.head),
        ...arrayValue(node.templateSpans).map((span) => literalText(span.literal?.text) ?? nodeText(span.literal))
      ].filter((value) => value !== undefined))
    });
  }
  if (isSyntaxKind(ts, node, 'InferType')) {
    return compactRecord({
      kind: 'infer-type',
      syntaxKind: syntaxKindName(ts, node.kind),
      nodeText: nodeText(node),
      typeText: typeTextFromTypeNode(checker, node, location),
      typeParameterText: nodeText(node.typeParameter),
      typeParameterName: stringValue(node.typeParameter?.name?.escapedText ?? node.typeParameter?.name?.text),
      constraintTypeText: typeTextFromTypeNode(checker, node.typeParameter?.constraint, location)
    });
  }
  if ((isSyntaxKind(ts, node, 'UnionType') || isSyntaxKind(ts, node, 'IntersectionType')) && isTopLevelTypeAliasShape(ts, node)) {
    const shapeKind = isSyntaxKind(ts, node, 'UnionType') ? 'union-type' : 'intersection-type';
    return compactRecord({
      kind: shapeKind,
      syntaxKind: syntaxKindName(ts, node.kind),
      nodeText: nodeText(node),
      typeText: typeTextFromTypeNode(checker, node, location),
      memberTypeTexts: nonEmptyArray(arrayValue(node.types).map((typeNode) => typeTextFromTypeNode(checker, typeNode, location))),
      memberNodeTexts: nonEmptyArray(arrayValue(node.types).map((typeNode) => nodeText(typeNode)))
    });
  }
  if (isSyntaxKind(ts, node, 'TupleType') && isTopLevelTypeAliasShape(ts, node)) {
    return compactRecord({
      kind: 'tuple-type',
      syntaxKind: syntaxKindName(ts, node.kind),
      nodeText: nodeText(node),
      typeText: typeTextFromTypeNode(checker, node, location),
      tupleElementTexts: nonEmptyArray(arrayValue(node.elements).map((element) => nodeText(element))),
      tupleElementTypeTexts: nonEmptyArray(arrayValue(node.elements).map((element) => tupleElementTypeText(checker, element, location, ts)))
    });
  }
  return undefined;
}

function tupleElementTypeText(checker, element, location, ts) {
  if (isSyntaxKind(ts, element, 'NamedTupleMember')) return typeTextFromTypeNode(checker, element.type, location);
  if (isSyntaxKind(ts, element, 'OptionalType')) return typeTextFromTypeNode(checker, element.type, location);
  if (isSyntaxKind(ts, element, 'RestType')) return typeTextFromTypeNode(checker, element.type, location);
  return typeTextFromTypeNode(checker, element, location);
}

function visitTypeNodes(ts, node, visit) {
  if (!node || typeof node !== 'object') return;
  visit(node);
  if (typeof ts?.forEachChild === 'function') {
    ts.forEachChild(node, (child) => visitTypeNodes(ts, child, visit));
    return;
  }
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach((child) => visitTypeNodes(ts, child, visit));
    else if (value && typeof value === 'object' && Number.isFinite(value.kind)) visitTypeNodes(ts, value, visit);
  }
}

function typeTextFromTypeNode(checker, node, location) {
  const type = safeCall(checker?.getTypeFromTypeNode, checker, node) ?? safeCall(checker?.getTypeAtLocation, checker, node ?? location);
  return type ? stringValue(safeCall(checker?.typeToString, checker, type)) : nodeText(node);
}

function syntaxKind(ts, name) { return numberValue(ts?.SyntaxKind?.[name]); }
function isSyntaxKind(ts, node, name) { return node?.kind === syntaxKind(ts, name); }
function isTopLevelTypeAliasShape(ts, node) {
  const parent = node?.parent;
  return isSyntaxKind(ts, parent, 'TypeAliasDeclaration')
    || (isSyntaxKind(ts, parent, 'TypeOperator') && isSyntaxKind(ts, parent?.parent, 'TypeAliasDeclaration'));
}
function syntaxKindName(ts, kind) { return stringValue(ts?.SyntaxKind?.[kind]) ?? (Number.isFinite(kind) ? String(kind) : undefined); }
function nodeText(node) { return stringValue(safeCall(node?.getText, node)); }
function safeCall(fn, receiver, ...args) {
  if (typeof fn !== 'function') return undefined;
  try { return fn.apply(receiver, args); } catch { return undefined; }
}
function stringValue(value) { return value === undefined || value === null || value === '' ? undefined : String(value); }
function literalText(value) { return value === undefined || value === null ? undefined : String(value); }
function numberValue(value) { return Number.isFinite(value) ? value : undefined; }
function arrayValue(value) { return Array.isArray(value) ? value : []; }
function nonEmptyArray(value) { return Array.isArray(value) && value.length ? value : undefined; }
function uniqueRecords(records, keyFn) {
  const seen = new Set();
  return records.filter((record) => {
    const key = keyFn(record);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }

export { compilerAdvancedTypeShapes };
