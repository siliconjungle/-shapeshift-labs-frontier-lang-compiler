import {
  jsControlKeyword,
  nativeDeclaration,
  nativeSignatureDeclaration,
  splitParameters
} from './native-region-scanner-core.js';
import { jsRegionKindForDeclarationName } from './native-region-scanner-js-helpers.js';
import { jsStructureDelta } from './native-region-scanner-js-structure.js';

function jsTypeRegionContext(name, declarationLine, lineNumber, regionKind, typeKind) {
  const depth = jsStructureDelta(declarationLine).value;
  if (depth <= 0) return undefined;
  return {
    name,
    typeKind,
    regionKind,
    depth,
    startLine: lineNumber,
    memberStack: []
  };
}

function jsCurrentTypeMemberContext(context) {
  return context.memberStack.at(-1) ?? context;
}

function updateJsTypeRegionContext(context, lineNumber, source) {
  const delta = jsStructureDelta(source).value;
  context.depth += delta;
  for (const memberContext of context.memberStack) {
    if (memberContext.startLine !== lineNumber) memberContext.depth += delta;
  }
  while (context.memberStack.length && context.memberStack.at(-1).depth <= 0) context.memberStack.pop();
}

function jsTypeMemberDeclaration(input, lineNumber, declarationLine, context) {
  const text = String(declarationLine ?? '').trim();
  if (!text || /^[}\])]/.test(text) || text.startsWith('//')) return undefined;
  let match = text.match(/^(?:readonly\s+)?(['"]?)([A-Za-z_$][\w$-]*)\1\??\s*(?:<[^({;]+>)?\s*\(([^)]*)\)\s*(?::\s*([^;,]+))?[;,]?$/);
  if (match && !jsControlKeyword(match[2])) {
    return nativeSignatureDeclaration(input, lineNumber, 'TypeMethodSignature', 'method', `${context.name}.${match[2]}`, {
      owner: context.name,
      propertyName: match[2],
      parameters: splitParameters(match[3]),
      returnType: match[4]?.trim(),
      typeKind: context.typeKind
    }, false, {
      regionKind: jsTypeMemberRegionKind(context, match[2], text),
      metadata: { owner: context.name, propertyName: match[2], typeKind: context.typeKind }
    });
  }
  match = text.match(/^(?:readonly\s+)?(['"]?)([A-Za-z_$][\w$-]*)\1\??\s*:\s*(.+?)[;,]?$/);
  if (!match || jsControlKeyword(match[2])) return undefined;
  const valueType = match[3].trim();
  const functionLike = /=>/.test(valueType) || /^\([^)]*\)\s*=>/.test(valueType);
  const hasNestedTypeLiteralBody = jsTypeMemberValueStartsTypeLiteral(valueType) && jsStructureDelta(text).value > 0;
  return (functionLike ? nativeSignatureDeclaration : nativeDeclaration)(input, lineNumber, functionLike ? 'TypeFunctionPropertySignature' : 'TypePropertySignature', functionLike ? 'function' : 'property', `${context.name}.${match[2]}`, {
    owner: context.name,
    propertyName: match[2],
    valueType,
    typeKind: context.typeKind
  }, hasNestedTypeLiteralBody, {
    regionKind: jsTypeMemberRegionKind(context, match[2], text),
    metadata: { owner: context.name, propertyName: match[2], typeKind: context.typeKind }
  });
}

function jsNestedTypeMemberContextFromDeclaration(declaration, lineNumber, source, parentContext) {
  if (!declaration) return undefined;
  const depth = jsStructureDelta(source).value;
  if (depth <= 0) return undefined;
  const valueType = declaration.fields?.valueType ?? declaration.fields?.returnType;
  const nestedTypeLiteral = jsTypeMemberValueStartsTypeLiteral(valueType);
  return {
    name: nestedTypeLiteral ? declaration.name : parentContext.name,
    typeKind: parentContext.typeKind,
    regionKind: nestedTypeLiteral ? (declaration.regionKind ?? 'property') : parentContext.regionKind,
    depth,
    startLine: lineNumber,
    suppressMembers: !nestedTypeLiteral
  };
}

function jsTypeMemberValueStartsTypeLiteral(valueType) {
  const text = String(valueType ?? '').trim();
  return text.startsWith('{') || /=>\s*\{\s*$/.test(text);
}

function jsTypeMemberRegionKind(context, propertyName) {
  return jsRegionKindForDeclarationName(propertyName) ?? (context.regionKind === 'type' ? 'property' : context.regionKind) ?? 'property';
}

export {
  jsCurrentTypeMemberContext,
  jsNestedTypeMemberContextFromDeclaration,
  jsTypeMemberDeclaration,
  jsTypeRegionContext,
  updateJsTypeRegionContext
};
