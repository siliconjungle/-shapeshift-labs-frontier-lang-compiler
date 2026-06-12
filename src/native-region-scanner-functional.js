import { idFragment, upperFirst } from './native-import-utils.js';
import {
  nativeDeclaration,
  nativeImportDeclaration,
  nativeMacroLoss,
  sourceLines,
  splitParameters
} from './native-region-scanner-core.js';
import { endKeywordBlockSpan } from './native-region-scanner-spans.js';

function scanElixir(input) {
  const declarations = [];
  let currentModule;
  const lines = sourceLines(input.sourceText);
  for (const [index, { line, number }] of lines.entries()) {
    const trimmed = line.trim();
    let match;
    let recordedMeta = false;
    if ((match = trimmed.match(/^defmodule\s+([A-Z]\w*(?:\.[A-Z]\w*)*)\s+do\b/))) {
      currentModule = match[1];
      declarations.push(nativeDeclaration(input, number, 'ModuleDefinition', 'module', match[1], {}, true, endSpanOptions(input, lines, index)));
    } else if ((match = trimmed.match(/^(?:alias|import|require)\s+([A-Z]\w*(?:\.[A-Z]\w*)*)/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'ImportDirective', 'module'));
    } else if ((match = trimmed.match(/^use\s+([A-Z]\w*(?:\.[A-Z]\w*)*)/))) {
      declarations.push(nativeMacroLoss(input, number, trimmed, 'macroExpansion', match[1]));
      recordedMeta = true;
    } else if ((match = trimmed.match(/^(defmacro|defmacrop|defguard|defguardp|defdelegate)\s+([A-Za-z_]\w*[!?]?)/))) {
      declarations.push(nativeMacroLoss(input, number, trimmed, 'macroExpansion', match[2]));
      recordedMeta = true;
    } else if ((match = trimmed.match(/^defp?\s+([A-Za-z_]\w*[!?]?)\s*(?:\(([^)]*)\)|([^,]*))?/))) {
      const hasDoBlock = /\bdo\b/.test(trimmed);
      declarations.push(nativeDeclaration(input, number, 'FunctionDefinition', 'function', match[1], { parameters: splitParameters(match[2] ?? match[3]) }, hasDoBlock, hasDoBlock ? endSpanOptions(input, lines, index) : {}));
    } else if (trimmed.startsWith('defstruct')) {
      declarations.push(nativeDeclaration(input, number, 'StructDefinition', 'type', currentModule ?? `struct_${number}`, {}, true));
    } else if ((match = trimmed.match(/^@(type|typep|opaque|callback)\s+([A-Za-z_]\w*[!?]?)/))) {
      declarations.push(nativeDeclaration(input, number, `${upperFirst(match[1])}Attribute`, match[1] === 'callback' ? 'function' : 'type', match[2], {}, false));
    }
    if (!recordedMeta && /(?:\bquote\s+do\b|\bunquote(?:_splicing)?\b|@(?:before_compile|after_compile|on_definition|derive)\b)/.test(trimmed)) {
      declarations.push(nativeMacroLoss(input, number, trimmed, 'macroExpansion', elixirMetaName(trimmed)));
    }
  }
  return declarations;
}

function endSpanOptions(input, lines, index) {
  return { span: endKeywordBlockSpan(input, lines, index) };
}

function scanErlang(input) {
  const declarations = [];
  const seenFunctions = new Set();
  for (const { line, number } of sourceLines(input.sourceText)) {
    const trimmed = line.trim();
    let match;
    let recordedMacro = false;
    if ((match = trimmed.match(/^-module\(([a-z][A-Za-z0-9_@]*)\)\./))) {
      declarations.push(nativeDeclaration(input, number, 'ModuleAttribute', 'module', match[1], {}, false));
    } else if ((match = trimmed.match(/^-include(?:_lib)?\(["']([^"']+)["']\)\./))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'IncludeAttribute', 'module'));
    } else if ((match = trimmed.match(/^-import\(([a-z][A-Za-z0-9_@]*)\s*,/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'ImportAttribute', 'module'));
    } else if ((match = trimmed.match(/^-behaviou?r\(([a-z][A-Za-z0-9_@]*)\)\./))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'BehaviourAttribute', 'module'));
    } else if ((match = trimmed.match(/^-record\(([a-z][A-Za-z0-9_@]*)\s*,/))) {
      declarations.push(nativeDeclaration(input, number, 'RecordAttribute', 'type', match[1], {}, false));
    } else if ((match = trimmed.match(/^-(type|opaque)\s+([a-z][A-Za-z0-9_@]*)\s*\(/))) {
      declarations.push(nativeDeclaration(input, number, `${upperFirst(match[1])}Attribute`, 'type', match[2], {}, false));
    } else if ((match = trimmed.match(/^-callback\s+([a-z][A-Za-z0-9_@]*)\s*\(/))) {
      declarations.push(nativeDeclaration(input, number, 'CallbackAttribute', 'function', match[1], {}, false));
    } else if ((match = trimmed.match(/^-define\(([^,\s)]+)/))) {
      declarations.push(nativeMacroLoss(input, number, trimmed, 'preprocessor', match[1]));
      recordedMacro = true;
    } else if (/^-compile\([^)]*parse_transform/.test(trimmed)) {
      declarations.push(nativeMacroLoss(input, number, trimmed, 'generatedCode', 'parse_transform'));
      recordedMacro = true;
    } else if ((match = trimmed.match(/^([a-z][A-Za-z0-9_@]*|'[^']+')\s*\(([^)]*)\)\s*(?:when\s+.*?)?->/))) {
      const name = erlangAtomName(match[1]);
      if (!seenFunctions.has(name)) {
        seenFunctions.add(name);
        declarations.push(nativeDeclaration(input, number, 'FunctionClause', 'function', name, { parameters: splitParameters(match[2]) }, true));
      }
    }
    if (!recordedMacro && /(^|[^A-Za-z0-9_])\?[A-Za-z_]\w*/.test(trimmed)) {
      declarations.push(nativeMacroLoss(input, number, trimmed, 'macroExpansion', erlangMacroName(trimmed)));
    }
  }
  return declarations;
}

function scanHaskell(input) {
  const declarations = [];
  const seenFunctions = new Set();
  for (const { line, number } of sourceLines(input.sourceText)) {
    const trimmed = line.trim();
    let match;
    if (/^#\s*(?:if|ifdef|ifndef|else|elif|endif|define|include)\b/.test(trimmed)) {
      declarations.push(nativeMacroLoss(input, number, trimmed, 'preprocessor', haskellMetaName(trimmed)));
    } else if ((match = trimmed.match(/^\{-#\s+LANGUAGE\s+(.+?)#-\}/))) {
      const extensions = match[1].split(',').map((part) => part.trim());
      if (extensions.some((extension) => /^(TemplateHaskell|QuasiQuotes|CPP)$/.test(extension))) {
        declarations.push(nativeMacroLoss(input, number, trimmed, extensions.includes('CPP') ? 'preprocessor' : 'macroExpansion', extensions.join('_')));
      }
    } else if (/^\$\(|\[[a-zA-Z]*\||\b\$\([^)]+\)/.test(trimmed)) {
      declarations.push(nativeMacroLoss(input, number, trimmed, 'macroExpansion', haskellMetaName(trimmed)));
    } else if ((match = trimmed.match(/^module\s+([A-Z][A-Za-z0-9_.']*)\b/))) {
      declarations.push(nativeDeclaration(input, number, 'ModuleDeclaration', 'module', match[1], {}, false));
    } else if ((match = trimmed.match(/^import\s+(?:safe\s+)?(?:qualified\s+)?([A-Z][A-Za-z0-9_.']*)/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'ImportDeclaration', 'module'));
    } else if ((match = trimmed.match(/^foreign\s+import\s+([A-Za-z_]\w*)/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'ForeignImportDeclaration', 'foreign'));
    } else if ((match = trimmed.match(/^(data|newtype|type)\s+([A-Z][A-Za-z0-9_']*)\b/))) {
      declarations.push(nativeDeclaration(input, number, `${upperFirst(match[1])}Declaration`, 'type', match[2], {}, /(?:where|=)/.test(trimmed)));
    } else if ((match = trimmed.match(/^class\s+(?:\([^)]*\)\s*=>\s*)?([A-Z][A-Za-z0-9_']*)\b/))) {
      declarations.push(nativeDeclaration(input, number, 'ClassDeclaration', 'type', match[1], {}, /\bwhere\b/.test(trimmed)));
    } else if ((match = trimmed.match(/^([a-z_][A-Za-z0-9_']*)\s*::\s*(.+)$/))) {
      seenFunctions.add(match[1]);
      declarations.push(nativeDeclaration(input, number, 'FunctionSignature', 'function', match[1], { signature: match[2].trim() }, false));
    } else if ((match = trimmed.match(/^([a-z_][A-Za-z0-9_']*)\b[^=]*=/))) {
      if (!seenFunctions.has(match[1])) {
        seenFunctions.add(match[1]);
        declarations.push(nativeDeclaration(input, number, 'FunctionBinding', 'function', match[1], {}, true));
      }
    }
  }
  return declarations;
}

function scanR(input) {
  const declarations = [];
  for (const { line, number } of sourceLines(input.sourceText)) {
    const trimmed = line.trim();
    let match;
    if ((match = trimmed.match(/^(?:library|require)\s*\(\s*["']?([A-Za-z_][\w.-]*)["']?/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'LibraryCall', 'package'));
    } else if ((match = trimmed.match(/^importFrom\s*\(\s*["']?([A-Za-z_][\w.-]*)["']?/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'ImportFromCall', 'package'));
    } else if ((match = trimmed.match(/^source\s*\(\s*["']([^"']+)["']/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'SourceCall', 'module'));
    } else if ((match = trimmed.match(/^([A-Za-z_][\w.]*)\s*(?:<-|=)\s*function\s*\(([^)]*)\)/))) {
      declarations.push(nativeDeclaration(input, number, 'FunctionAssignment', 'function', match[1], { parameters: splitParameters(match[2]) }, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^([A-Za-z_][\w.]*)\s*<-\s*R6Class\s*\(\s*["']([^"']+)["']/))) {
      declarations.push(nativeDeclaration(input, number, 'R6ClassDeclaration', 'class', match[2] || match[1], { binding: match[1] }, true));
      declarations.push(nativeMacroLoss(input, number, trimmed, 'dynamicRuntime', match[2] || match[1]));
    } else if ((match = trimmed.match(/^setClass\s*\(\s*["']([^"']+)["']/))) {
      declarations.push(nativeDeclaration(input, number, 'S4ClassDeclaration', 'class', match[1], {}, true));
      declarations.push(nativeMacroLoss(input, number, trimmed, 'dynamicRuntime', match[1]));
    } else if ((match = trimmed.match(/^setGeneric\s*\(\s*["']([^"']+)["']/))) {
      declarations.push(nativeDeclaration(input, number, 'S4GenericDeclaration', 'function', match[1], {}, true));
      declarations.push(nativeMacroLoss(input, number, trimmed, 'dynamicRuntime', match[1]));
    } else if ((match = trimmed.match(/^setMethod\s*\(\s*["']([^"']+)["']/))) {
      declarations.push(nativeDeclaration(input, number, 'S4MethodDeclaration', 'method', match[1], {}, true));
      declarations.push(nativeMacroLoss(input, number, trimmed, 'dynamicDispatch', match[1]));
    } else if ((match = trimmed.match(/^([A-Z][A-Za-z0-9_.]*)\s*(?:<-|=)\s*/))) {
      declarations.push(nativeDeclaration(input, number, 'ConstantAssignment', 'constant', match[1], {}, false));
    }
    if (/(?:eval|parse|substitute|quote|bquote|assign)\s*\(|<<-|\{\{|!!!|!!/.test(trimmed)) {
      declarations.push(nativeMacroLoss(input, number, trimmed, 'dynamicRuntime', rMetaName(trimmed)));
    }
  }
  return declarations;
}

function scanGenericDeclarations(input) {
  return sourceLines(input.sourceText)
    .filter(({ line }) => /\b(function|class|struct|enum|trait|interface|def)\b/.test(line))
    .map(({ line, number }) => nativeDeclaration(input, number, 'NativeDeclaration', 'variable', idFragment(line.trim()).slice(0, 40), { source: line.trim() }, true));
}

function elixirMetaName(source) {
  const match = source.match(/@([A-Za-z_]\w*)|\b(unquote(?:_splicing)?|quote)\b/);
  return match?.[1] ?? match?.[2] ?? 'macro';
}

function erlangAtomName(value) {
  return String(value).startsWith("'") ? String(value).slice(1, -1) : String(value);
}

function erlangMacroName(source) {
  const match = source.match(/\?([A-Za-z_]\w*)/);
  return match?.[1] ?? 'macro';
}

function haskellMetaName(source) {
  return idFragment(source).slice(0, 40);
}

function rMetaName(source) {
  const match = source.match(/([A-Za-z_][\w.]*)\s*\(/);
  return match?.[1] ?? 'dynamic';
}

export {
  scanElixir,
  scanErlang,
  scanGenericDeclarations,
  scanHaskell,
  scanR
};
