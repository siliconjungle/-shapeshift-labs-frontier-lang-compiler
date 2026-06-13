import {
  braceDelta,
  nativeDeclaration, nativeImportDeclaration, nativeSignatureDeclaration,
  sourceLines,
  splitParameters
} from './native-region-scanner-core.js';
import {
  jsCommentOnlyLine,
  jsDeclarationScanLine,
  jsExportAliasDeclaration, jsExportDeclarations,
  jsExportedContainerDeclaration,
  jsExportedFunctionWrapperDeclaration,
  jsInitializerKind,
  jsImportDeclarations,
  jsObjectRegionContext,
  jsRegionKindForDeclarationName,
  jsVariableHasBody,
  jsVariableSymbolKind
} from './native-region-scanner-js-helpers.js';
import { jsStructureDelta } from './native-region-scanner-js-structure.js';
import {
  jsCurrentTypeMemberContext,
  jsNestedTypeMemberContextFromDeclaration,
  jsTypeMemberDeclaration,
  jsTypeRegionContext,
  updateJsTypeRegionContext
} from './native-region-scanner-js-types.js';
import {
  jsArrayObjectContextFromLine, jsContextAllowsPropertyScan, jsCurrentObjectContext,
  jsInlineNestedObjectDeclarations, jsNestedObjectContextFromDeclaration,
  jsObjectPropertyDeclaration, jsRouteRecordDeclaration,
  updateJsArrayObjectContextName, updateJsObjectContextStack
} from './native-region-scanner-js-nested.js';
import {
  jsClassMemberDeclaration,
  jsInlineClassMemberDeclarations
} from './native-region-scanner-js-class.js';

function scanJavaScriptLike(input) {
  const declarations = [];
  const lines = sourceLines(input.sourceText);
  const pushDeclaration = (declaration) => {
    if (!declaration) return undefined;
    const declarationWithSpan = jsDeclarationWithSourceSpan(input, declaration, lines);
    declarations.push(declarationWithSpan);
    return declarationWithSpan;
  };
  const pushDeclarations = (items) => {
    for (const declaration of items ?? []) pushDeclaration(declaration);
  };
  let currentClass;
  let classDepth = 0;
  const objectStack = [];
  let currentType;
  const lexicalState = { inBlockComment: false, inTemplateString: false };
  for (const { line, number } of lines) {
    const scanLine = jsDeclarationScanLine(line, lexicalState);
    const trimmed = scanLine.trim();
    if (!trimmed || jsCommentOnlyLine(trimmed)) continue;
    const declarationLine = trimmed.replace(/^(?:export\s+)?(?:declare\s+)?/, '');
    let match;
    if (currentType && number !== currentType.startLine) {
      const typeContext = jsCurrentTypeMemberContext(currentType);
      if (!typeContext.suppressMembers) {
        const typeMember = pushDeclaration(jsTypeMemberDeclaration(input, number, declarationLine, typeContext));
        const nestedTypeContext = jsNestedTypeMemberContextFromDeclaration(typeMember, number, declarationLine, typeContext);
        if (nestedTypeContext) currentType.memberStack.push(nestedTypeContext);
      }
    }
    const currentObject = jsCurrentObjectContext(objectStack);
    if (currentObject) {
      const arrayItemContext = jsArrayObjectContextFromLine(currentObject, number, trimmed);
      if (arrayItemContext) objectStack.push(arrayItemContext);
      const routeRecord = jsRouteRecordDeclaration(input, number, trimmed, currentObject);
      if (routeRecord) {
        pushDeclaration(routeRecord);
      } else if (jsContextAllowsPropertyScan(currentObject)) {
        updateJsArrayObjectContextName(currentObject, trimmed);
        const property = jsObjectPropertyDeclaration(input, number, trimmed, currentObject);
        if (property) {
          pushDeclaration(property);
          pushDeclarations(jsInlineNestedObjectDeclarations(input, number, trimmed, property));
          const nestedContext = jsNestedObjectContextFromDeclaration(property, number, trimmed);
          if (nestedContext) objectStack.push(nestedContext);
        }
      }
    }
    const importDeclarations = jsImportDeclarations(input, number, trimmed);
    if (importDeclarations.length) {
      pushDeclarations(importDeclarations);
    } else if ((match = trimmed.match(/^import\s*\(\s*['"]([^'"]+)['"]\s*\)/))) {
      pushDeclaration(nativeImportDeclaration(input, number, match[1], 'DynamicImportExpression', 'module'));
    } else if ((match = declarationLine.match(/^(?:async\s+)?function\*?\s+([A-Za-z_$][\w$]*)\s*(?:<[^({;]+>)?\s*\(([^)]*)\)\s*(?::\s*[^={]+)?/))) {
      const hasBody = declarationLine.includes('{');
      pushDeclaration((hasBody ? nativeDeclaration : nativeSignatureDeclaration)(input, number, 'FunctionDeclaration', 'function', match[1], { parameters: splitParameters(match[2]) }, hasBody));
    } else if ((match = trimmed.match(/^export\s+default\s+(?:async\s+)?function\*?\s*([A-Za-z_$][\w$]*)?\s*(?:<[^({;]+>)?\s*\(([^)]*)\)\s*(?::\s*[^={]+)?/))) {
      pushDeclaration(nativeDeclaration(input, number, 'ExportDefaultFunctionDeclaration', 'function', match[1] ?? 'default', { parameters: splitParameters(match[2]), exportDefault: true }, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^export\s+default\s+(?:async\s*)?(?:<[^=]+>\s*)?(?:\(([^)]*)\)|([A-Za-z_$][\w$]*))\s*(?::\s*[^=]+)?=>/))) {
      pushDeclaration(nativeDeclaration(input, number, 'ExportDefaultArrowFunctionDeclaration', 'function', 'default', {
        parameters: splitParameters(match[1] ?? match[2]),
        exportDefault: true
      }, true));
    } else if ((match = declarationLine.match(/^(default\s+)?(?:abstract\s+)?class\b(?:\s+(?!(?:extends|implements)\b)([A-Za-z_$][\w$]*))?/)) && (match[1] || match[2])) {
      const className = match[2] ?? 'default';
      const exportDefault = Boolean(match[1]);
      pushDeclaration(nativeDeclaration(input, number, exportDefault ? 'ExportDefaultClassDeclaration' : 'ClassDeclaration', 'class', className, { exportDefault: exportDefault || undefined }, declarationLine.includes('{')));
      pushDeclarations(jsInlineClassMemberDeclarations(input, number, declarationLine, className));
      if (jsStructureDelta(declarationLine).value > 0) {
        currentClass = className;
        classDepth = 0;
      }
    } else if ((match = declarationLine.match(/^interface\s+([A-Za-z_$][\w$]*)/))) {
      const regionKind = 'type';
      pushDeclaration(nativeDeclaration(input, number, 'InterfaceDeclaration', 'interface', match[1], {}, declarationLine.includes('{'), { regionKind }));
      currentType = jsTypeRegionContext(match[1], declarationLine, number, regionKind, 'interface');
    } else if ((match = declarationLine.match(/^(?:const\s+)?enum\s+([A-Za-z_$][\w$]*)/))) {
      pushDeclaration(nativeDeclaration(input, number, 'EnumDeclaration', 'type', match[1], {}, declarationLine.includes('{')));
    } else if ((match = declarationLine.match(/^(?:namespace|module)\s+([A-Za-z_$][\w$.]*)/))) {
      pushDeclaration(nativeDeclaration(input, number, 'ModuleDeclaration', 'module', match[1], {}, declarationLine.includes('{')));
    } else if ((match = declarationLine.match(/^type\s+([A-Za-z_$][\w$]*)(?:\s*<[^=]+>)?\s*=/))) {
      const regionKind = 'type';
      const hasTypeBody = declarationLine.includes('{');
      pushDeclaration(nativeDeclaration(input, number, 'TypeAliasDeclaration', 'type', match[1], {}, hasTypeBody, { regionKind }));
      currentType = jsTypeRegionContext(match[1], declarationLine, number, regionKind, 'type');
    } else if ((match = declarationLine.match(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::\s*[^=]+)?=\s*(?:async\s*)?(?:<[^=]+>\s*)?(?:\(([^)]*)\)|([A-Za-z_$][\w$]*))\s*(?::\s*[^=]+)?=>/))) {
      pushDeclaration(nativeDeclaration(input, number, 'VariableFunctionDeclaration', 'function', match[1], { parameters: splitParameters(match[2] ?? match[3]) }, true));
    } else if ((match = declarationLine.match(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\b/))) {
      const initializerKind = jsInitializerKind(declarationLine, match[1]);
      const regionKind = jsRegionKindForDeclarationName(match[1], declarationLine);
      pushDeclaration(nativeDeclaration(input, number, 'VariableDeclaration', jsVariableSymbolKind(regionKind, initializerKind), match[1], {
        initializerKind
      }, jsVariableHasBody(initializerKind, declarationLine), {
        regionKind,
        metadata: { initializerKind }
      }));
      pushDeclarations(jsInlineNestedObjectDeclarations(input, number, declarationLine, declarations[declarations.length - 1]));
      const objectContext = jsObjectRegionContext(match[1], declarationLine, number, regionKind);
      if (objectContext) objectStack.push(objectContext);
    } else if ((match = jsExportedFunctionWrapperDeclaration(input, number, trimmed))) {
      pushDeclaration(match);
    } else if ((match = jsExportedContainerDeclaration(input, number, trimmed))) {
      pushDeclaration(match.declaration);
      pushDeclarations(jsInlineNestedObjectDeclarations(input, number, trimmed, match.declaration));
      if (match.context) objectStack.push(match.context);
    } else if ((match = jsExportAliasDeclaration(input, number, trimmed))) {
      pushDeclaration(match);
    } else if ((match = trimmed.match(/^module\.exports\s*=\s*(?:async\s+)?function\*?\s*([A-Za-z_$][\w$]*)?\s*(?:<[^({;]+>)?\s*\(([^)]*)\)/))) {
      pushDeclaration(nativeDeclaration(input, number, 'CommonJsDefaultFunctionExport', 'function', match[1] ?? 'module.exports', {
        export: 'commonjs',
        parameters: splitParameters(match[2])
      }, true));
    } else if ((match = trimmed.match(/^module\.exports\s*=\s*(?:async\s*)?(?:<[^=]+>\s*)?(?:\(([^)]*)\)|([A-Za-z_$][\w$]*))\s*(?::\s*[^=]+)?=>/))) {
      pushDeclaration(nativeDeclaration(input, number, 'CommonJsDefaultArrowFunctionExport', 'function', 'module.exports', {
        export: 'commonjs',
        parameters: splitParameters(match[1] ?? match[2])
      }, true));
    } else if ((match = trimmed.match(/^module\.exports\s*=\s*(?:abstract\s+)?class\b(?:\s+(?!(?:extends|implements)\b)([A-Za-z_$][\w$]*))?/))) {
      const className = match[1] ?? 'module.exports';
      pushDeclaration(nativeDeclaration(input, number, 'CommonJsDefaultClassExport', 'class', className, { export: 'commonjs' }, trimmed.includes('{')));
      pushDeclarations(jsInlineClassMemberDeclarations(input, number, trimmed, className));
      if (jsStructureDelta(trimmed).value > 0) {
        currentClass = className;
        classDepth = 0;
      }
    } else if ((match = trimmed.match(/^(?:module\.)?exports\.([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?function\*?\s*\(([^)]*)\)/))) {
      pushDeclaration(nativeDeclaration(input, number, 'CommonJsFunctionExport', 'function', match[1], { parameters: splitParameters(match[2]) }, true));
    } else if ((match = trimmed.match(/^(?:module\.)?exports\.([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:<[^=]+>\s*)?(?:\(([^)]*)\)|([A-Za-z_$][\w$]*))\s*(?::\s*[^=]+)?=>/))) {
      pushDeclaration(nativeDeclaration(input, number, 'CommonJsFunctionExport', 'function', match[1], { parameters: splitParameters(match[2] ?? match[3]) }, true));
    } else if ((match = trimmed.match(/^(?:module\.)?exports\.([A-Za-z_$][\w$]*)\s*=\s*(?:abstract\s+)?class\b(?:\s+(?!(?:extends|implements)\b)([A-Za-z_$][\w$]*))?/))) {
      const className = match[2] ?? match[1];
      pushDeclaration(nativeDeclaration(input, number, 'CommonJsClassExport', 'class', className, { export: 'commonjs', exportName: match[1] }, trimmed.includes('{')));
      pushDeclarations(jsInlineClassMemberDeclarations(input, number, trimmed, className));
      if (jsStructureDelta(trimmed).value > 0) {
        currentClass = className;
        classDepth = 0;
      }
    } else if ((match = trimmed.match(/^(?:module\.)?exports\.([A-Za-z_$][\w$]*)\s*=/))) {
      const regionKind = jsRegionKindForDeclarationName(match[1], trimmed);
      pushDeclaration(nativeDeclaration(input, number, 'CommonJsExport', 'variable', match[1], { export: 'commonjs' }, false, { regionKind }));
    } else if (currentClass) {
      pushDeclaration(jsClassMemberDeclaration(input, number, declarationLine, currentClass));
    }
    pushDeclarations(jsExportDeclarations(input, number, trimmed));
    if (currentClass) {
      classDepth += braceDelta(trimmed);
      if (classDepth <= 0) {
        currentClass = undefined;
        classDepth = 0;
      }
    }
    if (currentType) {
      if (number !== currentType.startLine) updateJsTypeRegionContext(currentType, number, trimmed);
      if (currentType.depth <= 0) currentType = undefined;
    }
    updateJsObjectContextStack(objectStack, number, trimmed);
  }
  return declarations;
}

function jsDeclarationWithSourceSpan(input, declaration, lines) {
  const startLine = declaration.span?.startLine ?? 1;
  const endLine = declaration.metadata?.hasBody ? jsBalancedDeclarationEndLine(input, lines, startLine) : startLine;
  const endLineText = lines[Math.max(0, endLine - 1)]?.line ?? '';
  return {
    ...declaration,
    span: {
      ...declaration.span,
      sourceId: declaration.span?.sourceId ?? input.sourceHash,
      path: declaration.span?.path ?? input.sourcePath,
      startLine,
      endLine,
      startColumn: declaration.span?.startColumn ?? 1,
      endColumn: declarationEndColumn(declaration, startLine, endLine, endLineText)
    }
  };
}

function declarationEndColumn(declaration, startLine, endLine, endLineText) {
  if (endLine !== startLine) return endLineText.length + 1;
  return declaration.span?.endColumn ?? endLineText.length + 1;
}

function jsBalancedDeclarationEndLine(input, lines, startLine) {
  const state = { inBlockComment: false, inTemplateString: false };
  let depth = 0;
  let opened = false;
  for (let index = Math.max(0, startLine - 1); index < lines.length; index += 1) {
    const scanLine = jsDeclarationScanLine(lines[index].line, state);
    const delta = jsStructureDelta(scanLine);
    if (delta.opened) opened = true;
    depth += delta.value;
    if (opened && depth <= 0) return lines[index].number;
  }
  return startLine;
}

export { scanJavaScriptLike };
