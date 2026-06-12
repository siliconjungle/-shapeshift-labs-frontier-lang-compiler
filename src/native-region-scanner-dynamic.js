import { upperFirst } from './native-import-utils.js';
import {
  nativeDeclaration,
  nativeImportDeclaration,
  nativeMacroLoss,
  sourceLines,
  splitParameters
} from './native-region-scanner-core.js';
import { braceBlockSpan, endKeywordBlockSpan, sqlStatementSpan } from './native-region-scanner-spans.js';

function scanPhp(input) {
  const declarations = [];
  const lines = sourceLines(input.sourceText);
  for (const [index, { line, number }] of lines.entries()) {
    const trimmed = line.trim().replace(/^<\?php\s*/, '');
    let match;
    if ((match = trimmed.match(/^namespace\s+([A-Za-z_][\w\\]*)\s*;/))) {
      declarations.push(nativeDeclaration(input, number, 'NamespaceDefinition', 'namespace', match[1], {}, false));
    } else if ((match = trimmed.match(/^use\s+([A-Za-z_][\w\\]*)(?:\s+as\s+([A-Za-z_]\w*))?\s*;/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'UseDeclaration', 'namespace'));
    } else if ((match = trimmed.match(/^(?:(?:abstract|final|readonly)\s+)*(class|interface|trait|enum)\s+([A-Za-z_]\w*)/))) {
      declarations.push(nativeDeclaration(input, number, `${upperFirst(match[1])}Declaration`, phpSymbolKind(match[1]), match[2], {}, trimmed.includes('{'), spanOptions(input, lines, index, trimmed.includes('{'))));
    } else if ((match = trimmed.match(/^(?:(?:public|protected|private|static|final|abstract)\s+)*function\s+&?\s*([A-Za-z_]\w*)\s*\(([^)]*)\)/))) {
      declarations.push(nativeDeclaration(input, number, 'FunctionDeclaration', 'function', match[1], { parameters: splitParameters(match[2]) }, trimmed.includes('{'), spanOptions(input, lines, index, trimmed.includes('{'))));
    }
  }
  return declarations;
}

function scanScala(input) {
  const declarations = [];
  const lines = sourceLines(input.sourceText);
  for (const [index, { line, number }] of lines.entries()) {
    const trimmed = line.trim();
    let match;
    if ((match = trimmed.match(/^package\s+([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)/))) {
      declarations.push(nativeDeclaration(input, number, 'PackageClause', 'package', match[1], {}, false));
    } else if ((match = trimmed.match(/^import\s+(.+?);?$/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1].trim(), 'Import', 'package'));
    } else if ((match = trimmed.match(/^(?:(?:private|protected|final|sealed|abstract|case|implicit|lazy|override|inline|transparent|open)\s+)*(class|trait|object|enum)\s+([A-Za-z_]\w*)/))) {
      declarations.push(nativeDeclaration(input, number, `${upperFirst(match[1])}Def`, scalaSymbolKind(match[1]), match[2], {}, trimmed.includes('{') || trimmed.includes(':'), spanOptions(input, lines, index, trimmed.includes('{'))));
    } else if ((match = trimmed.match(/^(?:(?:private|protected|final|implicit|override|inline)\s+)*def\s+([A-Za-z_]\w*)\s*(?:\[[^\]]+\])?\s*\(([^)]*)\)/))) {
      declarations.push(nativeDeclaration(input, number, 'DefDef', 'function', match[1], { parameters: splitParameters(match[2]) }, trimmed.includes('{') || trimmed.includes('='), spanOptions(input, lines, index, trimmed.includes('{'))));
    } else if ((match = trimmed.match(/^(?:(?:private|protected|final|implicit|opaque)\s+)*type\s+([A-Za-z_]\w*)\b/))) {
      declarations.push(nativeDeclaration(input, number, 'TypeDef', 'type', match[1], {}, false));
    } else if ((match = trimmed.match(/^(?:(?:private|protected|final|implicit|lazy|override|inline)\s+)*(?:val|var)\s+([A-Za-z_]\w*)\b/))) {
      declarations.push(nativeDeclaration(input, number, 'ValDef', 'variable', match[1], {}, false));
    }
  }
  return declarations;
}

function scanDart(input) {
  const declarations = [];
  const lines = sourceLines(input.sourceText);
  for (const [index, { line, number }] of lines.entries()) {
    const trimmed = line.trim();
    let match;
    if ((match = trimmed.match(/^(?:import|export)\s+['"]([^'"]+)['"]/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'UriBasedDirective', 'library'));
    } else if ((match = trimmed.match(/^part\s+['"]([^'"]+)['"]/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'PartDirective', 'library'));
    } else if ((match = trimmed.match(/^(?:(?:abstract|base|final|interface|sealed)\s+)*(class|mixin|enum)\s+([A-Za-z_]\w*)/))) {
      declarations.push(nativeDeclaration(input, number, `${upperFirst(match[1])}Declaration`, dartSymbolKind(match[1]), match[2], {}, trimmed.includes('{'), spanOptions(input, lines, index, trimmed.includes('{'))));
    } else if ((match = trimmed.match(/^extension\s+([A-Za-z_]\w*)\s+on\s+.+\{/))) {
      declarations.push(nativeDeclaration(input, number, 'ExtensionDeclaration', 'implementation', match[1], {}, true, spanOptions(input, lines, index, true)));
    } else if ((match = trimmed.match(/^typedef\s+([A-Za-z_]\w*)\b/))) {
      declarations.push(nativeDeclaration(input, number, 'TypeAlias', 'type', match[1], {}, false));
    } else if ((match = trimmed.match(/^(?:(?:external|static)\s+)*(?:[A-Za-z_]\w*(?:<[^>]+>)?\??|void)\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*(?:async\s*)?(?:\{|=>|;)/))) {
      declarations.push(nativeDeclaration(input, number, 'FunctionDeclaration', 'function', match[1], { parameters: splitParameters(match[2]) }, trimmed.includes('{') || trimmed.includes('=>'), spanOptions(input, lines, index, trimmed.includes('{'))));
    } else if ((match = trimmed.match(/^(?:(?:static|external|late)\s+)*(?:const|final|var)\s+(?:[A-Za-z_]\w*(?:<[^>]+>)?\??\s+)?([A-Za-z_]\w*)\b/))) {
      declarations.push(nativeDeclaration(input, number, 'VariableDeclaration', 'variable', match[1], {}, false));
    }
  }
  return declarations;
}

function scanLua(input) {
  const declarations = [];
  const lines = sourceLines(input.sourceText);
  for (const [index, { line, number }] of lines.entries()) {
    const trimmed = line.trim();
    let match;
    if ((match = trimmed.match(/^(?:local\s+[A-Za-z_]\w*\s*=\s*)?require\s*\(?\s*['"]([^'"]+)['"]\s*\)?/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'RequireCall', 'module'));
    } else if ((match = trimmed.match(/^(?:local\s+)?function\s+([A-Za-z_]\w*(?:[.:][A-Za-z_]\w*)*)\s*\(([^)]*)\)/))) {
      declarations.push(nativeDeclaration(input, number, 'FunctionDeclaration', 'function', match[1], { parameters: splitParameters(match[2]) }, true, endSpanOptions(input, lines, index)));
    } else if ((match = trimmed.match(/^(?:local\s+)?([A-Za-z_]\w*(?:[.:][A-Za-z_]\w*)*)\s*=\s*function\s*\(([^)]*)\)/))) {
      declarations.push(nativeDeclaration(input, number, 'FunctionAssignment', 'function', match[1], { parameters: splitParameters(match[2]) }, true, endSpanOptions(input, lines, index)));
    } else if ((match = trimmed.match(/^local\s+([A-Za-z_]\w*)\s*=\s*(?:\{|\w+)/))) {
      declarations.push(nativeDeclaration(input, number, 'LocalDeclaration', 'variable', match[1], {}, false));
    }
  }
  return declarations;
}

function scanShell(input) {
  const declarations = [];
  const lines = sourceLines(input.sourceText);
  for (const [index, { line, number }] of lines.entries()) {
    const trimmed = line.trim();
    let match;
    if ((match = trimmed.match(/^(?:source|\.)\s+(?:"([^"]+)"|'([^']+)'|([./A-Za-z0-9_-][\w./-]*))(?:\s|$)/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1] ?? match[2] ?? match[3], 'SourceCommand', 'file'));
    } else if ((match = trimmed.match(/^function\s+([A-Za-z_][\w-]*)\s*(?:\(\s*\))?\s*(?:\{|$)/))) {
      declarations.push(nativeDeclaration(input, number, 'FunctionDefinition', 'function', match[1], {}, true, spanOptions(input, lines, index, trimmed.includes('{'))));
    } else if ((match = trimmed.match(/^([A-Za-z_][\w-]*)\s*\(\s*\)\s*(?:\{|$)/))) {
      declarations.push(nativeDeclaration(input, number, 'FunctionDefinition', 'function', match[1], {}, true, spanOptions(input, lines, index, trimmed.includes('{'))));
    } else if ((match = trimmed.match(/^(?:export\s+)?(?:readonly\s+)?([A-Za-z_]\w*)=/))) {
      declarations.push(nativeDeclaration(input, number, 'VariableAssignment', 'variable', match[1], {}, false));
    } else if ((match = trimmed.match(/^alias\s+([A-Za-z_][\w-]*)=/))) {
      declarations.push(nativeDeclaration(input, number, 'AliasDeclaration', 'function', match[1], {}, false));
    }
  }
  return declarations;
}

function scanSql(input) {
  const declarations = [];
  const lines = sourceLines(input.sourceText);
  for (const [index, { line, number }] of lines.entries()) {
    const trimmed = line.trim();
    let match;
    if ((match = trimmed.match(/^CREATE\s+EXTENSION\s+(?:IF\s+NOT\s+EXISTS\s+)?((?:"[^"]+"|`[^`]+`|\[[^\]]+\]|[A-Za-z_][\w$-]*))/i))) {
      declarations.push(nativeImportDeclaration(input, number, normalizeSqlIdentifier(match[1]), 'CreateExtensionStatement', 'extension'));
    } else if ((match = trimmed.match(/^CREATE\s+(?:OR\s+REPLACE\s+)?(?:TEMP(?:ORARY)?\s+)?((?:UNIQUE\s+)?INDEX|MATERIALIZED\s+VIEW|TABLE|VIEW|FUNCTION|PROCEDURE|TRIGGER|SCHEMA|TYPE)\s+(?:IF\s+NOT\s+EXISTS\s+)?((?:"[^"]+"|`[^`]+`|\[[^\]]+\]|[A-Za-z_][\w$]*)(?:\s*\.\s*(?:"[^"]+"|`[^`]+`|\[[^\]]+\]|[A-Za-z_][\w$]*))?)/i))) {
      const objectKind = match[1].toUpperCase().replace(/\s+/g, ' ');
      declarations.push(nativeDeclaration(input, number, sqlLanguageKind(objectKind), sqlSymbolKind(objectKind), normalizeSqlIdentifier(match[2]), { objectKind }, trimmed.includes('('), { span: sqlStatementSpan(input, lines, index) }));
    }
  }
  return declarations;
}

function scanZig(input) {
  const declarations = [];
  const lines = sourceLines(input.sourceText);
  for (const [index, { line, number }] of lines.entries()) {
    const trimmed = line.trim();
    let match;
    if ((match = trimmed.match(/^(?:(?:pub|export)\s+)?(?:const|var)\s+([A-Za-z_]\w*)\s*=\s*@import\(\s*["']([^"']+)["']\s*\)\s*;?/))) {
      declarations.push(nativeImportDeclaration(input, number, match[2], 'ImportDeclaration', 'module'));
    } else if ((match = trimmed.match(/^(?:(?:pub|export)\s+)?usingnamespace\s+@import\(\s*["']([^"']+)["']\s*\)\s*;?/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'UsingNamespaceImport', 'module'));
    } else if ((match = trimmed.match(/^(?:(?:pub|export)\s+)?const\s+([A-Za-z_]\w*)\s*=\s*(?:extern\s+)?(struct|enum|union|opaque|error)\b/))) {
      declarations.push(nativeDeclaration(input, number, `Const${upperFirst(match[2])}Declaration`, 'type', match[1], { zigKind: match[2] }, trimmed.includes('{'), spanOptions(input, lines, index, trimmed.includes('{'))));
    } else if ((match = trimmed.match(/^(?:(?:pub|export|extern|inline)\s+)*(?:fn)\s+([A-Za-z_]\w*)\s*\(([^)]*)\)/))) {
      declarations.push(nativeDeclaration(input, number, 'FnDeclaration', 'function', match[1], { parameters: splitParameters(match[2]) }, trimmed.includes('{'), spanOptions(input, lines, index, trimmed.includes('{'))));
    } else if ((match = trimmed.match(/^(?:(?:pub|export)\s+)?const\s+([A-Za-z_]\w*)\b/))) {
      declarations.push(nativeDeclaration(input, number, 'ConstDeclaration', 'constant', match[1], {}, false));
    } else if ((match = trimmed.match(/^(?:(?:pub|export)\s+)?var\s+([A-Za-z_]\w*)\b/))) {
      declarations.push(nativeDeclaration(input, number, 'VarDeclaration', 'variable', match[1], {}, false));
    }
    if (/^\s*comptime\b|@(?:cImport|compileError|field|hasDecl|hasField|setEvalBranchQuota|This|Type|typeInfo)\b/.test(trimmed)) {
      declarations.push(nativeMacroLoss(input, number, trimmed, 'generatedCode', zigMetaName(trimmed)));
    }
  }
  return declarations;
}

function spanOptions(input, lines, index, hasBraceBody) {
  return hasBraceBody ? { span: braceBlockSpan(input, lines, index) } : {};
}

function endSpanOptions(input, lines, index) {
  return { span: endKeywordBlockSpan(input, lines, index) };
}

function phpSymbolKind(kind) {
  if (kind === 'interface') return 'interface';
  if (kind === 'trait') return 'trait';
  if (kind === 'enum') return 'type';
  return 'class';
}

function scalaSymbolKind(kind) {
  if (kind === 'trait') return 'trait';
  if (kind === 'object') return 'module';
  if (kind === 'enum') return 'type';
  return 'class';
}

function dartSymbolKind(kind) {
  if (kind === 'mixin') return 'trait';
  if (kind === 'enum') return 'type';
  return 'class';
}

function sqlSymbolKind(kind) {
  if (kind === 'FUNCTION' || kind === 'PROCEDURE' || kind === 'TRIGGER') return 'function';
  if (kind.includes('INDEX')) return 'index';
  if (kind === 'SCHEMA') return 'namespace';
  return 'type';
}

function sqlLanguageKind(kind) {
  return `Create${kind.toLowerCase().split(/\s+/).map(upperFirst).join('')}Statement`;
}

function normalizeSqlIdentifier(value) {
  return String(value)
    .split(/\s*\.\s*/)
    .map((part) => part.replace(/^"|"$/g, '').replace(/^`|`$/g, '').replace(/^\[|\]$/g, ''))
    .join('.');
}

function zigMetaName(source) {
  const match = source.match(/@([A-Za-z_]\w*)|^\s*(comptime)\b/);
  return match?.[1] ?? match?.[2] ?? 'comptime';
}

export {
  scanDart,
  scanLua,
  scanPhp,
  scanScala,
  scanShell,
  scanSql,
  scanZig
};
