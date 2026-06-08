import {
  braceDelta,
  jsControlKeyword,
  nativeDeclaration,
  nativeImportDeclaration,
  sourceLines,
  splitParameters
} from './native-region-scanner-core.js';
import {
  jsCommentOnlyLine,
  jsContainerDelta,
  jsDeclarationScanLine,
  jsExportedContainerDeclaration,
  jsInitializerKind,
  jsImportDeclarations,
  jsObjectPropertyDeclaration,
  jsObjectRegionContext,
  jsRegionKindForDeclarationName,
  jsRouteRecordDeclaration,
  jsVariableHasBody,
  jsVariableSymbolKind
} from './native-region-scanner-js-helpers.js';

function scanJavaScriptLike(input) {
  const declarations = [];
  const lines = sourceLines(input.sourceText);
  const pushDeclaration = (declaration) => {
    if (declaration) declarations.push(jsDeclarationWithSourceSpan(input, declaration, lines));
  };
  const pushDeclarations = (items) => {
    for (const declaration of items ?? []) pushDeclaration(declaration);
  };
  let currentClass;
  let classDepth = 0;
  let currentObject;
  const lexicalState = { inBlockComment: false, inTemplateString: false };
  for (const { line, number } of lines) {
    const scanLine = jsDeclarationScanLine(line, lexicalState);
    const trimmed = scanLine.trim();
    if (!trimmed || jsCommentOnlyLine(trimmed)) continue;
    const declarationLine = trimmed.replace(/^(?:export\s+)?(?:declare\s+)?/, '');
    let match;
    if (currentObject) {
      const routeRecord = jsRouteRecordDeclaration(input, number, trimmed, currentObject);
      if (routeRecord) {
        pushDeclaration(routeRecord);
      } else {
        const property = jsObjectPropertyDeclaration(input, number, trimmed, currentObject);
        if (property) pushDeclaration(property);
      }
    }
    const importDeclarations = jsImportDeclarations(input, number, trimmed);
    if (importDeclarations.length) {
      pushDeclarations(importDeclarations);
    } else if ((match = trimmed.match(/^import\s*\(\s*['"]([^'"]+)['"]\s*\)/))) {
      pushDeclaration(nativeImportDeclaration(input, number, match[1], 'DynamicImportExpression', 'module'));
    } else if ((match = declarationLine.match(/^(?:async\s+)?function\*?\s+([A-Za-z_$][\w$]*)\s*(?:<[^({;]+>)?\s*\(([^)]*)\)\s*(?::\s*[^={]+)?/))) {
      pushDeclaration(nativeDeclaration(input, number, 'FunctionDeclaration', 'function', match[1], { parameters: splitParameters(match[2]) }, declarationLine.includes('{')));
    } else if ((match = trimmed.match(/^export\s+default\s+(?:async\s+)?function\*?\s*([A-Za-z_$][\w$]*)?\s*(?:<[^({;]+>)?\s*\(([^)]*)\)\s*(?::\s*[^={]+)?/))) {
      pushDeclaration(nativeDeclaration(input, number, 'ExportDefaultFunctionDeclaration', 'function', match[1] ?? 'default', { parameters: splitParameters(match[2]), exportDefault: true }, trimmed.includes('{')));
    } else if ((match = declarationLine.match(/^(?:default\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/))) {
      pushDeclaration(nativeDeclaration(input, number, declarationLine.startsWith('default ') ? 'ExportDefaultClassDeclaration' : 'ClassDeclaration', 'class', match[1], { exportDefault: declarationLine.startsWith('default ') || undefined }, declarationLine.includes('{')));
      pushDeclarations(jsInlineClassMemberDeclarations(input, number, declarationLine, match[1]));
      if (jsStructureDelta(declarationLine).value > 0) {
        currentClass = match[1];
        classDepth = 0;
      }
    } else if ((match = declarationLine.match(/^interface\s+([A-Za-z_$][\w$]*)/))) {
      pushDeclaration(nativeDeclaration(input, number, 'InterfaceDeclaration', 'interface', match[1], {}, declarationLine.includes('{')));
    } else if ((match = declarationLine.match(/^(?:const\s+)?enum\s+([A-Za-z_$][\w$]*)/))) {
      pushDeclaration(nativeDeclaration(input, number, 'EnumDeclaration', 'type', match[1], {}, declarationLine.includes('{')));
    } else if ((match = declarationLine.match(/^(?:namespace|module)\s+([A-Za-z_$][\w$.]*)/))) {
      pushDeclaration(nativeDeclaration(input, number, 'ModuleDeclaration', 'module', match[1], {}, declarationLine.includes('{')));
    } else if ((match = declarationLine.match(/^type\s+([A-Za-z_$][\w$]*)\s*=/))) {
      pushDeclaration(nativeDeclaration(input, number, 'TypeAliasDeclaration', 'type', match[1], {}, false));
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
      currentObject = jsObjectRegionContext(match[1], declarationLine, number, regionKind);
    } else if ((match = jsExportedContainerDeclaration(input, number, trimmed))) {
      pushDeclaration(match.declaration);
      currentObject = match.context;
    } else if ((match = trimmed.match(/^(?:module\.)?exports\.([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?function\*?\s*\(([^)]*)\)/))) {
      pushDeclaration(nativeDeclaration(input, number, 'CommonJsFunctionExport', 'function', match[1], { parameters: splitParameters(match[2]) }, true));
    } else if ((match = trimmed.match(/^(?:module\.)?exports\.([A-Za-z_$][\w$]*)\s*=/))) {
      const regionKind = jsRegionKindForDeclarationName(match[1], trimmed);
      pushDeclaration(nativeDeclaration(input, number, 'CommonJsExport', 'variable', match[1], { export: 'commonjs' }, false, { regionKind }));
    } else if (currentClass && (match = declarationLine.match(/^(?:(?:public|private|protected|static|async|override|readonly|abstract|accessor|get|set)\s+)*(?:async\s+)?(?:get\s+|set\s+)?([A-Za-z_$][\w$]*)\??\s*(?:<[^({;]+>)?\s*\(([^)]*)\)\s*(?::\s*[^={]+)?(?:\{|=>|$)/)) && !jsControlKeyword(match[1])) {
      pushDeclaration(nativeDeclaration(input, number, 'MethodDefinition', 'method', `${currentClass}.${match[1]}`, {
        methodName: match[1],
        owner: currentClass,
        parameters: splitParameters(match[2])
      }, declarationLine.includes('{') || declarationLine.includes('=>')));
    } else if (currentClass && (match = declarationLine.match(/^(?:(?:public|private|protected|static|readonly|declare|accessor)\s+)*([A-Za-z_$][\w$]*)[?!]?\s*(?::\s*([^=;{]+))?(?:[=;]|$)/))) {
      pushDeclaration(nativeDeclaration(input, number, 'PropertyDefinition', 'property', `${currentClass}.${match[1]}`, {
        propertyName: match[1],
        owner: currentClass,
        valueType: match[2]?.trim()
      }, false));
    }
    if (currentClass) {
      classDepth += braceDelta(trimmed);
      if (classDepth <= 0) {
        currentClass = undefined;
        classDepth = 0;
      }
    }
    if (currentObject) {
      if (number !== currentObject.startLine) currentObject.depth += jsContainerDelta(trimmed);
      if (currentObject.depth <= 0) currentObject = undefined;
    }
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
      endColumn: declaration.span?.endColumn ?? endLineText.length + 1
    }
  };
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

function jsStructureDelta(source) {
  let value = 0;
  let opened = false;
  let quote;
  let escaped = false;
  for (const char of String(source ?? '')) {
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '\'' || char === '"' || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{' || char === '[' || char === '(') {
      value += 1;
      opened = true;
    } else if (char === '}' || char === ']' || char === ')') {
      value -= 1;
    }
  }
  return { value, opened };
}

function jsInlineClassMemberDeclarations(input, lineNumber, declarationLine, className) {
  const open = declarationLine.indexOf('{');
  const close = declarationLine.lastIndexOf('}');
  if (open < 0 || close <= open) return [];
  const body = declarationLine.slice(open + 1, close);
  const declarations = [];
  for (const match of body.matchAll(/(?:(?:public|private|protected|static|async|override|readonly|abstract|accessor|get|set)\s+)*(?:async\s+)?(?:get\s+|set\s+)?([A-Za-z_$][\w$]*)\??\s*(?:<[^({;]+>)?\s*\(([^)]*)\)\s*(?::\s*[^={;]+)?\s*(?:\{|=>)/g)) {
    if (jsControlKeyword(match[1])) continue;
    declarations.push(nativeDeclaration(input, lineNumber, 'MethodDefinition', 'method', `${className}.${match[1]}`, {
      methodName: match[1],
      owner: className,
      parameters: splitParameters(match[2])
    }, true));
  }
  return declarations;
}

export { scanJavaScriptLike };
