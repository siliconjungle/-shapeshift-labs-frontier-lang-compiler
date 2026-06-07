import {
  braceDelta,
  jsControlKeyword,
  nativeDeclaration,
  nativeImportDeclaration,
  sourceLines,
  splitParameters
} from './native-region-scanner-core.js';

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
      const initializerKind = jsInitializerKind(declarationLine);
      const regionKind = jsRegionKindForDeclarationName(match[1], declarationLine);
      declarations.push(nativeDeclaration(input, number, 'VariableDeclaration', jsVariableSymbolKind(regionKind, initializerKind), match[1], {
        initializerKind
      }, jsVariableHasBody(initializerKind, declarationLine), {
        regionKind,
        metadata: { initializerKind }
      }));
      currentObject = jsObjectRegionContext(match[1], declarationLine, number, regionKind);
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

function jsCommentOnlyLine(trimmed) {
  return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
}

function jsDeclarationScanLine(line, state) {
  let text = String(line ?? '');
  if (state.inTemplateString) {
    const close = findUnescapedBacktick(text, 0);
    if (close < 0) return '';
    text = text.slice(close + 1);
    state.inTemplateString = false;
  }
  if (state.inBlockComment) {
    const close = text.indexOf('*/');
    if (close < 0) return '';
    text = text.slice(close + 2);
    state.inBlockComment = false;
  }
  let output = '';
  let quote;
  let escaped = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quote) {
      output += char;
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = undefined;
      }
      continue;
    }
    if (char === '/' && next === '/') break;
    if (char === '/' && next === '*') {
      const close = text.indexOf('*/', index + 2);
      if (close < 0) {
        state.inBlockComment = true;
        break;
      }
      index = close + 1;
      continue;
    }
    if (char === '\'' || char === '"') {
      quote = char;
      output += char;
      continue;
    }
    if (char === '`') {
      const close = findUnescapedBacktick(text, index + 1);
      if (close < 0) {
        state.inTemplateString = true;
        output += '``';
        break;
      }
      output += text.slice(index, close + 1);
      index = close;
      continue;
    }
    output += char;
  }
  return output;
}

function findUnescapedBacktick(text, startIndex) {
  let escaped = false;
  for (let index = startIndex; index < text.length; index += 1) {
    const char = text[index];
    if (escaped) {
      escaped = false;
    } else if (char === '\\') {
      escaped = true;
    } else if (char === '`') {
      return index;
    }
  }
  return -1;
}

function jsObjectRegionContext(name, declarationLine, lineNumber, regionKind) {
  const initializerKind = jsInitializerKind(declarationLine);
  if (initializerKind !== 'object' && initializerKind !== 'array') return undefined;
  const depth = jsContainerDelta(declarationLine);
  if (depth <= 0) return undefined;
  return {
    name,
    regionKind: regionKind ?? jsRegionKindForDeclarationName(name, declarationLine),
    initializerKind,
    depth,
    startLine: lineNumber
  };
}

function jsInitializerKind(line) {
  const initializer = String(line ?? '').split('=').slice(1).join('=').trim();
  if (!initializer) return 'unknown';
  if (/^(?:async\s+)?function\b/.test(initializer) || /=>/.test(initializer)) return 'function';
  if (/^(?:React\.)?(?:forwardRef|memo|lazy|observer)\s*(?:<[^>]+>)?\s*\(/.test(initializer)) return 'function';
  if (initializer.startsWith('{')) return 'object';
  if (initializer.startsWith('[')) return 'array';
  if (/^new\s+/.test(initializer)) return 'instance';
  if (/^['"`]/.test(initializer)) return 'string';
  if (/^(?:true|false)\b/.test(initializer)) return 'boolean';
  if (/^[0-9]/.test(initializer)) return 'number';
  return 'expression';
}

function jsVariableHasBody(initializerKind, declarationLine) {
  return initializerKind === 'function'
    || initializerKind === 'object'
    || initializerKind === 'array'
    || /\{/.test(String(declarationLine ?? ''));
}

function jsVariableSymbolKind(regionKind, initializerKind) {
  if (regionKind === 'route') return 'route';
  if (initializerKind === 'function') return 'function';
  return 'variable';
}

function jsRegionKindForDeclarationName(name, source = '') {
  const raw = `${name ?? ''} ${source ?? ''}`;
  const text = raw.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();
  const compact = raw.toLowerCase();
  if (/\b(routes?|router|screens?|pages?|navigation|navitems?|menuitems?)\b/.test(text) || /(route|router|screen|page|navigation|navitem|menuitem)/.test(compact)) return 'route';
  if (/\b(config|settings|options|flags?|schema|manifest|registry|catalog)\b/.test(text) || /(config|settings|options|flags|schema|manifest|registry|catalog)/.test(compact)) return 'config';
  if (/\b(content|copy|docs?|legal|messages?|strings?|i18n|locale|translations?)\b/.test(text) || /(content|copy|docs|legal|messages|strings|i18n|locale|translations)/.test(compact)) return 'content';
  return undefined;
}

function jsObjectPropertyDeclaration(input, lineNumber, trimmed, context) {
  if (/^[}\])]/.test(trimmed) || trimmed.startsWith('...')) return undefined;
  const methodMatch = trimmed.match(/^(?:(?:async|get|set)\s+)?(['"]?)([A-Za-z_$][\w$-]*)\1\s*\(([^)]*)\)\s*(?:[:\w\s<>\[\]]*)?(?:\{|=>|,|$)/);
  if (methodMatch && !jsControlKeyword(methodMatch[2])) {
    const name = `${context.name}.${methodMatch[2]}`;
    return nativeDeclaration(input, lineNumber, 'ObjectMethod', 'function', name, {
      owner: context.name,
      propertyName: methodMatch[2],
      parameters: splitParameters(methodMatch[3])
    }, true, {
      regionKind: jsPropertyRegionKind(context, methodMatch[2], 'function'),
      metadata: { owner: context.name, propertyName: methodMatch[2], initializerKind: 'function' }
    });
  }
  const propertyMatch = trimmed.match(/^(?:(['"])([^'"]+)\1|([A-Za-z_$][\w$-]*))\s*:\s*(.+?)(?:,)?$/);
  if (!propertyMatch) return undefined;
  const propertyName = propertyMatch[2] ?? propertyMatch[3];
  if (!propertyName || jsControlKeyword(propertyName)) return undefined;
  const value = propertyMatch[4].trim();
  const initializerKind = jsPropertyInitializerKind(value);
  const functionLike = initializerKind === 'function';
  const name = `${context.name}.${propertyName}`;
  return nativeDeclaration(input, lineNumber, functionLike ? 'ObjectFunctionProperty' : 'ObjectProperty', functionLike ? 'function' : 'property', name, {
    owner: context.name,
    propertyName,
    initializerKind
  }, functionLike || initializerKind === 'object' || initializerKind === 'array', {
    regionKind: jsPropertyRegionKind(context, propertyName, value),
    metadata: {
      owner: context.name,
      propertyName,
      initializerKind
    }
  });
}

function jsRouteRecordDeclaration(input, lineNumber, trimmed, context) {
  if (context.regionKind !== 'route') return undefined;
  const match = trimmed.match(/\b(?:path|route|href|url)\s*:\s*(['"`])([^'"`]+)\1/);
  if (!match) return undefined;
  const routePath = match[2];
  return nativeDeclaration(input, lineNumber, 'RouteRecord', 'route', `${context.name}.${routePath}`, {
    owner: context.name,
    routePath
  }, true, {
    regionKind: 'route',
    metadata: { owner: context.name, routePath, initializerKind: 'object' }
  });
}

function jsPropertyInitializerKind(value) {
  const text = String(value ?? '').trim();
  if (/^(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/.test(text)) return 'function';
  if (text.startsWith('{')) return 'object';
  if (text.startsWith('[')) return 'array';
  if (/^['"`]/.test(text)) return 'string';
  if (/^(?:true|false)\b/.test(text)) return 'boolean';
  if (/^[0-9]/.test(text)) return 'number';
  return 'expression';
}

function jsPropertyRegionKind(context, propertyName, value) {
  const named = jsRegionKindForDeclarationName(propertyName, value);
  if (named) return named;
  if (context.regionKind === 'route') return 'route';
  if (context.regionKind === 'content') return 'content';
  if (context.regionKind === 'config') return 'config';
  return 'property';
}

function jsContainerDelta(source) {
  let delta = 0;
  for (const char of String(source ?? '')) {
    if (char === '{' || char === '[') delta += 1;
    if (char === '}' || char === ']') delta -= 1;
  }
  return delta;
}

export { scanJavaScriptLike };
