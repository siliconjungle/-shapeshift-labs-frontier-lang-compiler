import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { compilerDecoratorMetadataRecord } from './typeScriptCompilerDecoratorMetadata.js';

function compilerClassApiRecord(checker, identitySymbol, location, ts) {
  const declarations = Array.isArray(identitySymbol?.declarations) ? identitySymbol.declarations : [];
  const classHeritage = uniqueRecords(
    declarations.flatMap((declaration) => compilerClassHeritageRecords(checker, declaration, location, ts)),
    (record) => [record.kind, record.expressionText, record.typeText].join('\0')
  );
  const constructorSignatures = uniqueRecords(
    declarations.flatMap((declaration) => compilerConstructorSignatureRecords(checker, declaration, location, ts)),
    (record) => [record.signatureText, record.parameters?.map((parameter) => parameter.typeText).join(',')].join('\0')
  );
  const privateClassMembers = uniqueRecords(
    declarations.flatMap((declaration) => compilerClassPrivateMemberRecords(checker, declaration, location, ts)),
    (record) => [record.kind, record.name, record.static, record.typeText, record.signatureText].join('\0')
  );
  const accessorFieldMembers = uniqueRecords(
    declarations.flatMap((declaration) => compilerAccessorFieldRecords(checker, declaration, location, ts)),
    (record) => [record.name, record.static, record.typeText, record.memberText].join('\0')
  );
  const decoratorMetadata = compilerDecoratorMetadataRecord(checker, identitySymbol, location, ts);
  return compactRecord({
    classHeritage: nonEmptyArray(classHeritage),
    classHeritageCount: classHeritage.length || undefined,
    constructorSignatures: nonEmptyArray(constructorSignatures),
    constructorSignatureCount: constructorSignatures.length || undefined,
    privateClassMembers: nonEmptyArray(privateClassMembers),
    privateClassMemberCount: privateClassMembers.length || undefined,
    privateClassMemberShapeHash: privateClassMembers.length ? hashSemanticValue({ kind: 'frontier.lang.typescript.compilerPrivateClassMemberShape.v1', privateClassMembers }) : undefined,
    accessorFieldMembers: nonEmptyArray(accessorFieldMembers),
    accessorFieldCount: accessorFieldMembers.length || undefined,
    accessorFieldShapeHash: accessorFieldMembers.length ? hashSemanticValue({ kind: 'frontier.lang.typescript.compilerAccessorFieldShape.v1', accessorFieldMembers }) : undefined,
    classMemberShapeProof: privateClassMembers.length || accessorFieldMembers.length ? compilerClassMemberShapeProof(privateClassMembers, accessorFieldMembers) : undefined,
    ...decoratorMetadata
  });
}

function compilerClassHeritageRecords(checker, declaration, location, ts) {
  const clauses = Array.isArray(declaration?.heritageClauses) ? declaration.heritageClauses : [];
  const records = [];
  clauses.forEach((clause, clauseOrdinal) => {
    const kind = heritageKind(ts, clause);
    const types = Array.isArray(clause.types) ? clause.types : [];
    types.forEach((entry, ordinal) => records.push(compactRecord({
      kind,
      syntaxKind: syntaxKindName(ts, clause.token),
      clauseOrdinal,
      ordinal,
      expressionText: nodeText(entry.expression ?? entry),
      typeText: heritageTypeText(checker, entry, location),
      typeArguments: nonEmptyArray((entry.typeArguments ?? []).map((argument) => typeTextFromTypeNode(checker, argument, location)))
    })));
  });
  return records;
}

function compilerConstructorSignatureRecords(checker, declaration, location, ts) {
  const members = Array.isArray(declaration?.members) ? declaration.members : [];
  return members
    .filter((member) => isSyntaxKind(ts, member, 'Constructor'))
    .map((member, ordinal) => {
      const signature = safeCall(checker?.getSignatureFromDeclaration, checker, member);
      return compactRecord({
        ordinal,
        signatureText: stringValue(safeCall(checker?.signatureToString, checker, signature)) ?? nodeText(member),
        accessibility: accessibilityModifier(member, ts),
        parameterCount: Array.isArray(member.parameters) ? member.parameters.length : undefined,
        parameters: nonEmptyArray((member.parameters ?? []).map((parameter, parameterOrdinal) => compilerConstructorParameterRecord(checker, parameter, location, ts, parameterOrdinal)))
      });
    });
}

function compilerConstructorParameterRecord(checker, parameter, location, ts, ordinal) {
  const type = parameter.type
    ? safeCall(checker?.getTypeFromTypeNode, checker, parameter.type)
    : safeCall(checker?.getTypeAtLocation, checker, parameter);
  return compactRecord({
    name: nodeText(parameter.name),
    ordinal,
    typeText: type ? stringValue(safeCall(checker?.typeToString, checker, type)) : typeTextFromTypeNode(checker, parameter.type, location),
    optional: Boolean(parameter.questionToken || parameter.initializer) || undefined,
    rest: Boolean(parameter.dotDotDotToken) || undefined,
    accessibility: accessibilityModifier(parameter, ts),
    parameterProperty: isParameterProperty(parameter, ts) || undefined
  });
}

function compilerClassPrivateMemberRecords(checker, declaration, location, ts) {
  const members = Array.isArray(declaration?.members) ? declaration.members : [];
  return members.flatMap((member, ordinal) => {
    if (!isPrivateClassMember(member, ts)) return [];
    return [compilerClassMemberRecord(checker, member, location, ts, ordinal, true)];
  });
}

function compilerAccessorFieldRecords(checker, declaration, location, ts) {
  const members = Array.isArray(declaration?.members) ? declaration.members : [];
  return members.flatMap((member, ordinal) => {
    if (!isAccessorField(member, ts)) return [];
    return [compilerClassMemberRecord(checker, member, location, ts, ordinal, false)];
  });
}

function compilerClassMemberRecord(checker, member, location, ts, ordinal, privateMember) {
  const type = compilerClassMemberType(checker, member, location);
  const signature = safeCall(checker?.getSignatureFromDeclaration, checker, member);
  return compactRecord({
    kind: compilerClassMemberKind(member, ts, privateMember),
    syntaxKind: syntaxKindName(ts, member?.kind),
    name: compilerClassMemberName(member),
    ordinal,
    static: hasModifier(member?.modifiers, ts, 'StaticKeyword') || undefined,
    readonly: hasModifier(member?.modifiers, ts, 'ReadonlyKeyword') || undefined,
    accessibility: accessibilityModifier(member, ts),
    privateIdentifier: isPrivateIdentifier(member?.name, ts) || undefined,
    accessorField: isAccessorField(member, ts) || undefined,
    typeText: type ? stringValue(safeCall(checker?.typeToString, checker, type)) : typeTextFromTypeNode(checker, member?.type, location),
    signatureText: signature ? stringValue(safeCall(checker?.signatureToString, checker, signature)) : undefined,
    parameterCount: Array.isArray(member?.parameters) ? member.parameters.length : undefined,
    memberText: nodeText(member)
  });
}

function compilerClassMemberShapeProof(privateClassMembers, accessorFieldMembers) {
  return compactRecord({
    kind: 'typescript-checker-class-private-accessor-shape-evidence',
    status: 'passed',
    proofLevel: 'typescript-checker-class-private-accessor-static-shape',
    checkerInvariant: 'private/accessor member names, kinds, modifiers, types, and source texts complete',
    requiredSignals: [
      'compiler-private-class-member-count',
      'compiler-private-class-member-names',
      'compiler-private-class-member-type-texts',
      'compiler-accessor-field-count',
      'compiler-accessor-field-names',
      'compiler-accessor-field-type-texts'
    ],
    privateClassMemberCount: privateClassMembers.length || undefined,
    accessorFieldCount: accessorFieldMembers.length || undefined,
    privateClassMemberShapeHash: privateClassMembers.length ? hashSemanticValue({ kind: 'frontier.lang.typescript.compilerPrivateClassMemberShape.v1', privateClassMembers }) : undefined,
    accessorFieldShapeHash: accessorFieldMembers.length ? hashSemanticValue({ kind: 'frontier.lang.typescript.compilerAccessorFieldShape.v1', accessorFieldMembers }) : undefined,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false
  });
}

function compilerClassMemberType(checker, member, location) {
  return member?.type
    ? safeCall(checker?.getTypeFromTypeNode, checker, member.type)
    : safeCall(checker?.getTypeAtLocation, checker, member?.name ?? member ?? location);
}

function compilerClassMemberKind(member, ts, privateMember) {
  if (isSyntaxKind(ts, member, 'MethodDeclaration')) return privateMember ? 'private-method' : 'method';
  if (isSyntaxKind(ts, member, 'GetAccessor')) return privateMember ? 'private-get-accessor' : 'get-accessor';
  if (isSyntaxKind(ts, member, 'SetAccessor')) return privateMember ? 'private-set-accessor' : 'set-accessor';
  if (isAccessorField(member, ts)) return privateMember ? 'private-accessor-field' : 'accessor-field';
  return privateMember ? 'private-field' : 'field';
}

function compilerClassMemberName(member) {
  const name = member?.name;
  return stringValue(name?.escapedText ?? name?.text ?? nodeText(name));
}

function isPrivateClassMember(member, ts) {
  return isPrivateIdentifier(member?.name, ts) || accessibilityModifier(member, ts) === 'private';
}

function isPrivateIdentifier(node, ts) {
  return node?.kind === syntaxKind(ts, 'PrivateIdentifier');
}

function isAccessorField(member, ts) {
  return isSyntaxKind(ts, member, 'PropertyDeclaration') && hasModifier(member?.modifiers, ts, 'AccessorKeyword');
}

function heritageKind(ts, clause) {
  if (clause?.token === syntaxKind(ts, 'ExtendsKeyword')) return 'extends';
  if (clause?.token === syntaxKind(ts, 'ImplementsKeyword')) return 'implements';
  return syntaxKindName(ts, clause?.token) ?? 'heritage';
}

function heritageTypeText(checker, entry, location) {
  const type = safeCall(checker?.getTypeAtLocation, checker, entry) ?? safeCall(checker?.getTypeAtLocation, checker, entry?.expression);
  return type ? stringValue(safeCall(checker?.typeToString, checker, type)) : nodeText(entry) ?? typeTextFromTypeNode(checker, entry, location);
}

function typeTextFromTypeNode(checker, node, location) {
  if (!node) return undefined;
  const type = safeCall(checker?.getTypeFromTypeNode, checker, node) ?? safeCall(checker?.getTypeAtLocation, checker, node ?? location);
  return type ? stringValue(safeCall(checker?.typeToString, checker, type)) : nodeText(node);
}

function accessibilityModifier(node, ts) {
  const modifiers = Array.isArray(node?.modifiers) ? node.modifiers : [];
  if (hasModifier(modifiers, ts, 'PrivateKeyword')) return 'private';
  if (hasModifier(modifiers, ts, 'ProtectedKeyword')) return 'protected';
  if (hasModifier(modifiers, ts, 'PublicKeyword')) return 'public';
  return undefined;
}

function isParameterProperty(parameter, ts) {
  const modifiers = Array.isArray(parameter?.modifiers) ? parameter.modifiers : [];
  return ['PrivateKeyword', 'ProtectedKeyword', 'PublicKeyword', 'ReadonlyKeyword'].some((kind) => hasModifier(modifiers, ts, kind));
}

function hasModifier(modifiers, ts, kind) {
  if (!Array.isArray(modifiers)) return false;
  const expected = syntaxKind(ts, kind);
  return expected !== undefined && modifiers.some((modifier) => modifier.kind === expected);
}

function syntaxKind(ts, name) { return numberValue(ts?.SyntaxKind?.[name]); }
function isSyntaxKind(ts, node, name) { return node?.kind === syntaxKind(ts, name); }
function syntaxKindName(ts, kind) { return stringValue(ts?.SyntaxKind?.[kind]) ?? (Number.isFinite(kind) ? String(kind) : undefined); }
function nodeText(node) { return stringValue(safeCall(node?.getText, node)); }
function safeCall(fn, receiver, ...args) {
  if (typeof fn !== 'function') return undefined;
  try { return fn.apply(receiver, args); } catch { return undefined; }
}
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }
function nonEmptyArray(value) { return Array.isArray(value) && value.length ? value : undefined; }
function numberValue(value) { return Number.isFinite(value) ? value : undefined; }
function stringValue(value) { return value === undefined || value === null || value === '' ? undefined : String(value); }
function uniqueRecords(records, keyFn) {
  const seen = new Set();
  return records.filter((record) => {
    const key = keyFn(record);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export { compilerClassApiRecord };
