import {
  nativeDeclaration,
  splitParameters
} from './native-region-scanner-core.js';
import { jsExportDeclarations, jsImportDeclarations } from './native-region-scanner-js-imports.js';
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
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = undefined;
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

function jsObjectRegionContext(name, declarationLine, lineNumber, regionKind) {
  const initializerKind = jsInitializerKind(declarationLine, name);
  if (initializerKind !== 'object' && initializerKind !== 'array') return undefined;
  const depth = jsContainerDelta(declarationLine);
  if (depth <= 0) return undefined;
  return { name, regionKind: regionKind ?? jsRegionKindForDeclarationName(name, declarationLine), initializerKind, depth, startLine: lineNumber,
    arrayRecords: initializerKind === 'array' && /(?:define|create|make|build)\w*(?:tools?|actions?|handlers?|commands?|events?|effects?|workflows?)/i.test(declarationLine) };
}

function jsInitializerKind(line, name) {
  const initializer = String(line ?? '').split('=').slice(1).join('=').trim();
  if (!initializer) return 'unknown';
  if (/^(?:async\s+)?function\b/.test(initializer) || /=>/.test(initializer)) return 'function';
  if (/^(?:React\.)?(?:forwardRef|memo|lazy|observer)\s*(?:<[^>]+>)?\s*\(/.test(initializer)) return 'function';
  const containerKind = jsContainerInitializerKind(initializer, name, line);
  if (containerKind) return containerKind;
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

function jsExportedContainerDeclaration(input, lineNumber, trimmed) {
  let match = trimmed.match(/^export\s+default\s+(.+)$/);
  if (match) return jsContainerExport(input, lineNumber, 'ExportDefaultContainer', 'default', match[1], { exportDefault: true });
  match = trimmed.match(/^(module\.exports|exports)(?:\.([A-Za-z_$][\w$]*))?\s*=\s*(.+)$/);
  if (!match) return undefined;
  const name = match[2] ? `${match[1]}.${match[2]}` : 'module.exports';
  return jsContainerExport(input, lineNumber, 'CommonJsContainerExport', name, match[3], { export: 'commonjs' });
}

function jsExportedFunctionWrapperDeclaration(input, lineNumber, trimmed) {
  const match = trimmed.match(/^export\s+default\s+(.+)$/);
  if (!match) return undefined;
  const unwrapped = jsUnwrapFunctionWrapperArgument(match[1]);
  if (!unwrapped) return undefined;
  const { wrapper, wrappers, argument } = unwrapped;
  const wrapperFields = { wrapper, ...(wrappers.length > 1 ? { wrappers } : {}) };
  let functionMatch = argument.match(/^(?:async\s+)?function\*?\s*([A-Za-z_$][\w$]*)?\s*(?:<[^({;]+>)?\s*\(([^)]*)\)/);
  if (functionMatch) {
    return nativeDeclaration(input, lineNumber, 'ExportDefaultFunctionWrapperDeclaration', 'function', functionMatch[1] ?? 'default', {
      exportDefault: true,
      ...wrapperFields,
      parameters: splitParameters(functionMatch[2])
    }, true);
  }
  functionMatch = argument.match(/^(?:async\s*)?(?:\(([^)]*)\)|([A-Za-z_$][\w$]*))\s*(?::\s*[^=]+)?=>/);
  if (functionMatch) {
    return nativeDeclaration(input, lineNumber, 'ExportDefaultFunctionWrapperDeclaration', 'function', 'default', {
      exportDefault: true,
      ...wrapperFields,
      parameters: splitParameters(functionMatch[1] ?? functionMatch[2])
    }, true);
  }
  const classMatch = argument.match(/^(?:abstract\s+)?class\b(?:\s+(?!(?:extends|implements)\b)([A-Za-z_$][\w$]*))?/);
  if (classMatch) {
    return nativeDeclaration(input, lineNumber, 'ExportDefaultClassWrapperDeclaration', 'class', classMatch[1] ?? 'default', {
      exportDefault: true,
      ...wrapperFields
    }, true);
  }
  const aliasMatch = argument.match(/^([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*(?:[,)]|$)/);
  if (!aliasMatch) return undefined;
  return nativeDeclaration(input, lineNumber, 'ExportDefaultWrappedAlias', 'variable', 'default', {
    exportDefault: true,
    ...wrapperFields,
    alias: aliasMatch[1],
    initializerKind: 'function-wrapper'
  }, false, {
    metadata: { exportDefault: true, ...wrapperFields, alias: aliasMatch[1], initializerKind: 'function-wrapper' }
  });
}

function jsUnwrapFunctionWrapperArgument(source) {
  const wrappers = [];
  let argument = String(source ?? '').trim();
  let match;
  while ((match = argument.match(/^((?:React\.)?(?:forwardRef|memo|lazy|observer)|Object\.freeze)\s*(?:<[^>]+>)?\s*\(\s*(.+)$/))) {
    wrappers.push(match[1]);
    argument = match[2].trim();
  }
  if (!wrappers.length) return undefined;
  return { wrapper: wrappers[0], wrappers, argument };
}

function jsExportAliasDeclaration(input, lineNumber, trimmed) {
  let match = trimmed.match(/^export\s+default\s+([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*;?$/);
  if (match) return jsAliasExport(input, lineNumber, 'ExportDefaultAlias', 'default', match[1], { exportDefault: true }, trimmed);
  match = trimmed.match(/^module\.exports\s*=\s*([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*;?$/);
  if (match) return jsAliasExport(input, lineNumber, 'CommonJsAliasExport', 'module.exports', match[1], { export: 'commonjs' }, trimmed);
  match = trimmed.match(/^(?:module\.)?exports\.([A-Za-z_$][\w$]*)\s*=\s*([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*;?$/);
  if (!match) return undefined;
  return jsAliasExport(input, lineNumber, 'CommonJsAliasExport', match[1], match[2], { export: 'commonjs' }, trimmed);
}

function jsAliasExport(input, lineNumber, languageKind, name, alias, fields, source) {
  const regionKind = jsRegionKindForDeclarationName(name, source);
  return nativeDeclaration(input, lineNumber, languageKind, 'variable', name, {
    ...fields,
    alias
  }, false, {
    regionKind,
    metadata: { ...fields, alias }
  });
}

function jsContainerExport(input, lineNumber, languageKind, name, initializer, fields) {
  const initializerKind = jsContainerInitializerKind(initializer, name, initializer);
  if (initializerKind !== 'object' && initializerKind !== 'array') return undefined;
  const regionKind = jsRegionKindForDeclarationName(name, initializer);
  const declaration = nativeDeclaration(input, lineNumber, languageKind, jsVariableSymbolKind(regionKind, initializerKind), name, {
    ...fields,
    initializerKind
  }, true, {
    regionKind,
    metadata: { ...fields, initializerKind }
  });
  const context = jsObjectRegionContext(name, `const ${name} = ${initializer}`, lineNumber, regionKind);
  return { declaration, context };
}

function jsContainerInitializerKind(initializer, name, source) {
  const text = String(initializer ?? '').trim();
  if (text.startsWith('{')) return 'object';
  if (text.startsWith('[')) return 'array';
  const match = text.match(/^([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*(?:<[^)]*>)?\(\s*([\[{])/);
  if (!match || !jsContainerWrapperLooksSemantic(match[1], name, source)) return undefined;
  return match[2] === '{' ? 'object' : 'array';
}

function jsContainerWrapperLooksSemantic(callee, name, source) {
  const signal = `${callee ?? ''} ${name ?? ''} ${source ?? ''}`.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();
  return /\b(define|create|make|build|object\.freeze)\b/.test(signal) && /\b(actions?|handlers?|tools?|commands?|events?|effects?|workflows?|config|settings|options|routes?|router|content|docs?|schema|registry|manifest|catalog|menu|nav)\b/.test(signal);
}

function jsContainerDelta(source) {
  let delta = 0;
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
    if (char === '{' || char === '[') delta += 1;
    if (char === '}' || char === ']') delta -= 1;
  }
  return delta;
}

function findUnescapedBacktick(text, startIndex) {
  let escaped = false;
  for (let index = startIndex; index < text.length; index += 1) {
    const char = text[index];
    if (escaped) escaped = false;
    else if (char === '\\') escaped = true;
    else if (char === '`') return index;
  }
  return -1;
}

export { jsCommentOnlyLine, jsContainerDelta, jsDeclarationScanLine };
export { jsExportAliasDeclaration, jsExportedContainerDeclaration, jsExportedFunctionWrapperDeclaration };
export { jsContainerInitializerKind, jsExportDeclarations, jsInitializerKind, jsImportDeclarations, jsObjectRegionContext };
export { jsRegionKindForDeclarationName, jsVariableHasBody, jsVariableSymbolKind };
