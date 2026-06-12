import { idFragment, upperFirst } from './native-import-utils.js';
import {
  nativeDeclaration,
  nativeImportDeclaration,
  nativeMacroLoss,
  sourceLines,
  splitParameters,
  splitTypeParameters
} from './native-region-scanner-core.js';
import { braceBlockSpan } from './native-region-scanner-spans.js';

function scanRust(input) {
  const declarations = [];
  const lines = sourceLines(input.sourceText);
  for (const [index, { line, number }] of lines.entries()) {
    const trimmed = line.trim();
    let match;
    if ((match = trimmed.match(/^(?:pub(?:\([^)]*\))?\s+)?(?:async\s+)?fn\s+([A-Za-z_]\w*)\s*\(([^)]*)\)/))) {
      declarations.push(nativeDeclaration(input, number, 'ItemFn', 'function', match[1], { parameters: splitParameters(match[2]) }, trimmed.includes('{'), { span: trimmed.includes('{') ? braceBlockSpan(input, lines, index) : undefined }));
    } else if ((match = trimmed.match(/^(?:pub(?:\([^)]*\))?\s+)?struct\s+([A-Za-z_]\w*)/))) {
      declarations.push(nativeDeclaration(input, number, 'ItemStruct', 'type', match[1], {}, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^(?:pub(?:\([^)]*\))?\s+)?enum\s+([A-Za-z_]\w*)/))) {
      declarations.push(nativeDeclaration(input, number, 'ItemEnum', 'type', match[1], {}, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^(?:pub(?:\([^)]*\))?\s+)?trait\s+([A-Za-z_]\w*)/))) {
      declarations.push(nativeDeclaration(input, number, 'ItemTrait', 'trait', match[1], {}, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^impl(?:\s*<[^>]+>)?\s+(.+?)\s*\{/))) {
      declarations.push(nativeDeclaration(input, number, 'ItemImpl', 'implementation', idFragment(match[1]), { target: match[1].trim() }, true));
    } else if ((match = trimmed.match(/^(?:pub(?:\([^)]*\))?\s+)?mod\s+([A-Za-z_]\w*)/))) {
      declarations.push(nativeDeclaration(input, number, 'ItemMod', 'module', match[1], {}, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^use\s+(.+?);/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'ItemUse', 'module'));
    } else if (/^[A-Za-z_]\w*!\s*[({[]/.test(trimmed)) {
      declarations.push(nativeMacroLoss(input, number, trimmed, 'macroExpansion'));
    }
  }
  return declarations;
}

function scanCLike(input) {
  const declarations = [];
  const lines = sourceLines(input.sourceText);
  for (const [index, { line, number }] of lines.entries()) {
    const trimmed = line.trim();
    let match;
    if ((match = trimmed.match(/^#\s*include\s+[<"]([^>"]+)[>"]/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'IncludeDirective', 'header'));
    } else if ((match = trimmed.match(/^#\s*define\s+([A-Za-z_]\w*)/))) {
      declarations.push(nativeMacroLoss(input, number, trimmed, 'preprocessor', match[1]));
    } else if ((match = trimmed.match(/^typedef\s+struct(?:\s+([A-Za-z_]\w*))?/))) {
      declarations.push(nativeDeclaration(input, number, 'TypedefStructDeclaration', 'type', match[1] ?? `anonymous_struct_${number}`, {}, trimmed.includes('{'), { span: trimmed.includes('{') ? braceBlockSpan(input, lines, index) : undefined }));
    } else if ((match = trimmed.match(/^(?:struct|enum)\s+([A-Za-z_]\w*)/))) {
      declarations.push(nativeDeclaration(input, number, 'TagDeclaration', 'type', match[1], {}, trimmed.includes('{'), { span: trimmed.includes('{') ? braceBlockSpan(input, lines, index) : undefined }));
    } else if ((match = trimmed.match(/^(?:[A-Za-z_][\w\s*:&<>]+)\s+([A-Za-z_]\w*)\s*\(([^;{}]*)\)\s*(?:;|\{)?$/))) {
      declarations.push(nativeDeclaration(input, number, 'FunctionDeclaration', 'function', match[1], { parameters: splitParameters(match[2]) }, trimmed.endsWith('{'), { span: trimmed.endsWith('{') ? braceBlockSpan(input, lines, index) : undefined }));
    }
  }
  return declarations;
}

function scanGo(input) {
  const declarations = [];
  let inImportBlock = false;
  const lines = sourceLines(input.sourceText);
  for (const [index, { line, number }] of lines.entries()) {
    const trimmed = line.trim();
    let match;
    if (inImportBlock) {
      if (trimmed === ')') {
        inImportBlock = false;
      } else if ((match = trimmed.match(/^(?:(?:[A-Za-z_]\w*|[_.])\s+)?["']([^"']+)["']/))) {
        declarations.push(nativeImportDeclaration(input, number, match[1], 'ImportSpec', 'package'));
      }
      continue;
    }
    if ((match = trimmed.match(/^package\s+([A-Za-z_]\w*)/))) {
      declarations.push(nativeDeclaration(input, number, 'PackageClause', 'package', match[1], {}, false));
    } else if (/^import\s*\(/.test(trimmed)) {
      inImportBlock = true;
    } else if ((match = trimmed.match(/^import\s+(?:(?:[A-Za-z_]\w*|[_.])\s+)?["']([^"']+)["']/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'ImportSpec', 'package'));
    } else if ((match = trimmed.match(/^type\s+([A-Za-z_]\w*)\s*=\s*(.+)$/))) {
      declarations.push(nativeDeclaration(input, number, 'TypeAlias', 'type', match[1], { target: match[2].trim() }, false));
    } else if ((match = trimmed.match(/^type\s+([A-Za-z_]\w*)\s+(struct|interface)\b/))) {
      declarations.push(nativeDeclaration(input, number, match[2] === 'struct' ? 'TypeSpecStruct' : 'TypeSpecInterface', 'type', match[1], {}, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^func\s+\(([^)]*)\)\s*([A-Za-z_]\w*)(?:\s*\[([^\]]+)\])?\s*\(([^)]*)\)/))) {
      const receiver = parseGoReceiver(match[1]);
      declarations.push(nativeDeclaration(input, number, 'MethodDecl', 'method', goReceiverMethodName(receiver, match[2]), {
        methodName: match[2],
        receiver,
        typeParameters: splitTypeParameters(match[3]),
        parameters: splitParameters(match[4])
      }, trimmed.includes('{'), { span: trimmed.includes('{') ? braceBlockSpan(input, lines, index) : undefined }));
    } else if ((match = trimmed.match(/^func\s+([A-Za-z_]\w*)(?:\s*\[([^\]]+)\])?\s*\(([^)]*)\)/))) {
      declarations.push(nativeDeclaration(input, number, 'FuncDecl', 'function', match[1], {
        typeParameters: splitTypeParameters(match[2]),
        parameters: splitParameters(match[3])
      }, trimmed.includes('{'), { span: trimmed.includes('{') ? braceBlockSpan(input, lines, index) : undefined }));
    } else if ((match = trimmed.match(/^var\s+([A-Za-z_]\w*)\b/))) {
      declarations.push(nativeDeclaration(input, number, 'VarDecl', 'variable', match[1], {}, false));
    } else if ((match = trimmed.match(/^const\s+([A-Za-z_]\w*)\b/))) {
      declarations.push(nativeDeclaration(input, number, 'ConstDecl', 'constant', match[1], {}, false));
    }
  }
  return declarations;
}

function scanSwift(input) {
  const declarations = [];
  const protocols = new Set();
  const lines = sourceLines(input.sourceText);
  for (const [index, { line, number }] of lines.entries()) {
    const trimmed = line.trim();
    const declarationLine = trimmed.replace(/^(?:@[A-Za-z_][\w.]+(?:\([^)]*\))?\s+)*/, '');
    let match;
    if ((match = declarationLine.match(/^import\s+(?:(?:struct|class|enum|protocol|func|var)\s+)?([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'ImportDecl', 'module'));
    } else if ((match = declarationLine.match(/^(?:(?:public|private(?:\([^)]*\))?|fileprivate|internal|open|final|indirect)\s+)*(struct|class|enum|protocol|actor)\s+([A-Za-z_]\w*)/))) {
      if (match[1] === 'protocol') protocols.add(match[2]);
      declarations.push(nativeDeclaration(input, number, `${upperFirst(match[1])}Decl`, swiftSymbolKind(match[1]), match[2], {}, declarationLine.includes('{'), { span: declarationLine.includes('{') ? braceBlockSpan(input, lines, index) : undefined }));
    } else if ((match = declarationLine.match(/^(?:(?:public|private(?:\([^)]*\))?|fileprivate|internal|open)\s+)*extension\s+([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)(.*)$/))) {
      const extensionFields = parseSwiftExtensionTail(match[2]);
      const isProtocolExtension = protocols.has(match[1]) || /Protocol$/.test(match[1]);
      declarations.push(nativeDeclaration(input, number, isProtocolExtension ? 'ProtocolExtensionDecl' : 'ExtensionDecl', 'implementation', `${match[1]}.${isProtocolExtension ? 'protocolExtension' : 'extension'}`, {
        extendedType: match[1],
        ...extensionFields
      }, declarationLine.includes('{'), { span: declarationLine.includes('{') ? braceBlockSpan(input, lines, index) : undefined }));
    } else if ((match = declarationLine.match(/^(?:(?:public|private(?:\([^)]*\))?|fileprivate|internal|open|static|class|mutating|nonmutating|override|required|convenience|isolated|nonisolated)\s+)*func\s+([A-Za-z_]\w*|`[^`]+`)(?:\s*<([^>]+)>)?\s*\(([^)]*)\)/))) {
      declarations.push(nativeDeclaration(input, number, 'FunctionDecl', 'function', unquoteSwiftIdentifier(match[1]), {
        typeParameters: splitTypeParameters(match[2]),
        parameters: splitParameters(match[3])
      }, declarationLine.includes('{'), { span: declarationLine.includes('{') ? braceBlockSpan(input, lines, index) : undefined }));
    } else if ((match = declarationLine.match(/^(?:(?:public|private(?:\([^)]*\))?|fileprivate|internal|open|static|class|final|lazy|weak|unowned|override|required|nonisolated)\s+)*(let|var)\s+([A-Za-z_]\w*)\b(?::\s*([^={]+))?/))) {
      declarations.push(nativeDeclaration(input, number, 'PropertyDecl', 'property', match[2], {
        binding: match[1],
        valueType: match[3]?.trim()
      }, declarationLine.includes('{') || declarationLine.includes('=>'), { span: declarationLine.includes('{') ? braceBlockSpan(input, lines, index) : undefined }));
    } else if ((match = declarationLine.match(/^(?:(?:public|private(?:\([^)]*\))?|fileprivate|internal|open)\s+)*typealias\s+([A-Za-z_]\w*)\b(?:\s*=\s*(.+))?/))) {
      declarations.push(nativeDeclaration(input, number, 'TypealiasDecl', 'type', match[1], { target: match[2]?.trim() }, false));
    }
  }
  return declarations;
}

function parseGoReceiver(raw) {
  const value = String(raw ?? '').trim();
  const match = value.match(/^(?:(\w+)\s+)?(.+)$/);
  const rawType = String(match?.[2] ?? value).trim();
  return {
    raw: value,
    ...(match?.[1] ? { name: match[1] } : {}),
    rawType,
    type: normalizeGoReceiverType(rawType)
  };
}

function normalizeGoReceiverType(rawType) {
  return String(rawType ?? '')
    .trim()
    .replace(/^[*&\s]+/, '')
    .replace(/\[[^\]]+\]/g, '')
    .replace(/\s+/g, ' ');
}

function goReceiverMethodName(receiver, methodName) {
  return receiver?.type ? `${receiver.type}.${methodName}` : methodName;
}

function parseSwiftExtensionTail(rawTail) {
  let tail = String(rawTail ?? '').split('{')[0].trim();
  const fields = {};
  const whereMatch = tail.match(/\bwhere\b(.+)$/);
  if (whereMatch) {
    fields.constraints = whereMatch[1].trim();
    tail = tail.slice(0, whereMatch.index).trim();
  }
  if (tail.startsWith(':')) {
    fields.conformances = tail.slice(1).split(',').map((part) => part.trim()).filter(Boolean);
  }
  return fields;
}

function unquoteSwiftIdentifier(identifier) {
  return String(identifier).replace(/^`|`$/g, '');
}

function swiftSymbolKind(kind) {
  if (kind === 'protocol') return 'protocol';
  if (kind === 'extension') return 'implementation';
  if (kind === 'struct' || kind === 'enum' || kind === 'actor') return 'type';
  return 'class';
}

export {
  scanCLike,
  scanGo,
  scanRust,
  scanSwift
};
