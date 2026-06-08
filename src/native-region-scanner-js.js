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
  jsObjectPropertyDeclaration,
  jsObjectRegionContext,
  jsRegionKindForDeclarationName,
  jsRouteRecordDeclaration,
  jsVariableHasBody,
  jsVariableSymbolKind
} from './native-region-scanner-js-helpers.js';

function scanJavaScriptLike(input) {
  const declarations = [];
  let currentClass;
  let classDepth = 0;
  let currentObject;
  const lexicalState = { inBlockComment: false, inTemplateString: false };
  for (const { line, number } of sourceLines(input.sourceText)) {
    const scanLine = jsDeclarationScanLine(line, lexicalState);
    const trimmed = scanLine.trim();
    if (!trimmed || jsCommentOnlyLine(trimmed)) continue;
    const declarationLine = trimmed.replace(/^(?:export\s+)?(?:declare\s+)?/, '');
    let match;
    if (currentObject) {
      const routeRecord = jsRouteRecordDeclaration(input, number, trimmed, currentObject);
      if (routeRecord) {
        declarations.push(routeRecord);
      } else {
        const property = jsObjectPropertyDeclaration(input, number, trimmed, currentObject);
        if (property) declarations.push(property);
      }
    }
    if ((match = trimmed.match(/^import\s+(?:.+?\s+from\s+)?['"]([^'"]+)['"]/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'ImportDeclaration', 'module'));
    } else if ((match = trimmed.match(/^import\s*\(\s*['"]([^'"]+)['"]\s*\)/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'DynamicImportExpression', 'module'));
    } else if ((match = trimmed.match(/^export\s+(?:\*\s+from|\{[^}]*\}\s+from)\s+['"]([^'"]+)['"]/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'ExportFromDeclaration', 'module'));
    } else if ((match = declarationLine.match(/^(?:async\s+)?function\*?\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/))) {
      declarations.push(nativeDeclaration(input, number, 'FunctionDeclaration', 'function', match[1], { parameters: splitParameters(match[2]) }, declarationLine.includes('{')));
    } else if ((match = trimmed.match(/^export\s+default\s+(?:async\s+)?function\*?\s*([A-Za-z_$][\w$]*)?\s*\(([^)]*)\)/))) {
      declarations.push(nativeDeclaration(input, number, 'ExportDefaultFunctionDeclaration', 'function', match[1] ?? 'default', { parameters: splitParameters(match[2]), exportDefault: true }, trimmed.includes('{')));
    } else if ((match = declarationLine.match(/^(?:default\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/))) {
      declarations.push(nativeDeclaration(input, number, declarationLine.startsWith('default ') ? 'ExportDefaultClassDeclaration' : 'ClassDeclaration', 'class', match[1], { exportDefault: declarationLine.startsWith('default ') || undefined }, declarationLine.includes('{')));
      if (declarationLine.includes('{') && !declarationLine.includes('}')) {
        currentClass = match[1];
        classDepth = 0;
      }
    } else if ((match = declarationLine.match(/^interface\s+([A-Za-z_$][\w$]*)/))) {
      declarations.push(nativeDeclaration(input, number, 'InterfaceDeclaration', 'interface', match[1], {}, declarationLine.includes('{')));
    } else if ((match = declarationLine.match(/^(?:const\s+)?enum\s+([A-Za-z_$][\w$]*)/))) {
      declarations.push(nativeDeclaration(input, number, 'EnumDeclaration', 'type', match[1], {}, declarationLine.includes('{')));
    } else if ((match = declarationLine.match(/^(?:namespace|module)\s+([A-Za-z_$][\w$.]*)/))) {
      declarations.push(nativeDeclaration(input, number, 'ModuleDeclaration', 'module', match[1], {}, declarationLine.includes('{')));
    } else if ((match = declarationLine.match(/^type\s+([A-Za-z_$][\w$]*)\s*=/))) {
      declarations.push(nativeDeclaration(input, number, 'TypeAliasDeclaration', 'type', match[1], {}, false));
    } else if ((match = declarationLine.match(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(?([^=;]*)\)?\s*=>/))) {
      declarations.push(nativeDeclaration(input, number, 'VariableFunctionDeclaration', 'function', match[1], { parameters: splitParameters(match[2]) }, true));
    } else if ((match = declarationLine.match(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\b/))) {
      const initializerKind = jsInitializerKind(declarationLine, match[1]);
      const regionKind = jsRegionKindForDeclarationName(match[1], declarationLine);
      declarations.push(nativeDeclaration(input, number, 'VariableDeclaration', jsVariableSymbolKind(regionKind, initializerKind), match[1], {
        initializerKind
      }, jsVariableHasBody(initializerKind, declarationLine), {
        regionKind,
        metadata: { initializerKind }
      }));
      currentObject = jsObjectRegionContext(match[1], declarationLine, number, regionKind);
    } else if ((match = jsExportedContainerDeclaration(input, number, trimmed))) {
      declarations.push(match.declaration);
      currentObject = match.context;
    } else if ((match = trimmed.match(/^(?:module\.)?exports\.([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?function\*?\s*\(([^)]*)\)/))) {
      declarations.push(nativeDeclaration(input, number, 'CommonJsFunctionExport', 'function', match[1], { parameters: splitParameters(match[2]) }, true));
    } else if ((match = trimmed.match(/^(?:module\.)?exports\.([A-Za-z_$][\w$]*)\s*=/))) {
      const regionKind = jsRegionKindForDeclarationName(match[1], trimmed);
      declarations.push(nativeDeclaration(input, number, 'CommonJsExport', 'variable', match[1], { export: 'commonjs' }, false, { regionKind }));
    } else if (currentClass && (match = declarationLine.match(/^(?:(?:public|private|protected|static|async|override|readonly|abstract|accessor|get|set)\s+)*(?:async\s+)?(?:get\s+|set\s+)?([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*(?::\s*[^={]+)?(?:\{|=>|$)/)) && !jsControlKeyword(match[1])) {
      declarations.push(nativeDeclaration(input, number, 'MethodDefinition', 'method', `${currentClass}.${match[1]}`, {
        methodName: match[1],
        owner: currentClass,
        parameters: splitParameters(match[2])
      }, declarationLine.includes('{') || declarationLine.includes('=>')));
    } else if (currentClass && (match = declarationLine.match(/^(?:(?:public|private|protected|static|readonly|declare|accessor)\s+)*([A-Za-z_$][\w$]*)\s*(?::\s*([^=;{]+))?(?:[=;]|$)/))) {
      declarations.push(nativeDeclaration(input, number, 'PropertyDefinition', 'property', `${currentClass}.${match[1]}`, {
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

export { scanJavaScriptLike };
