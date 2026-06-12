import { nativeDeclaration, nativeImportDeclaration, sourceLines, splitParameters } from './native-region-scanner-core.js';
import { pythonBlockSpan } from './native-region-scanner-spans.js';

function scanPython(input) {
  const declarations = [];
  const lines = sourceLines(input.sourceText);
  const blockStack = [];
  let decorators = [];
  for (const [index, { line, number }] of lines.entries()) {
    const trimmed = line.trim();
    if (!trimmed) {
      decorators = [];
      continue;
    }
    const indent = indentationLength(line);
    while (blockStack.length && indent <= blockStack[blockStack.length - 1].indent) blockStack.pop();

    let match;
    if ((match = trimmed.match(/^@([A-Za-z_][\w.]*(?:\([^)]*\))?)/))) {
      decorators.push(match[1]);
      continue;
    }
    if ((match = trimmed.match(/^(?:async\s+)?def\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*:/))) {
      const owner = blockStack[blockStack.length - 1]?.kind === 'class' ? blockStack[blockStack.length - 1].name : undefined;
      const name = owner ? `${owner}.${match[1]}` : match[1];
      declarations.push(nativeDeclaration(input, number, 'FunctionDef', owner ? 'method' : 'function', name, {
        parameters: splitParameters(match[2]),
        ...(owner ? { owner, methodName: match[1] } : {}),
        ...(decorators.length ? { decorators } : {})
      }, true, {
        span: pythonBlockSpan(input, lines, index),
        metadata: {
          ...(owner ? { owner, methodName: match[1] } : {}),
          ...(decorators.length ? { decorators } : {})
        }
      }));
      blockStack.push({ kind: 'def', name, indent });
    } else if ((match = trimmed.match(/^class\s+([A-Za-z_]\w*)/))) {
      const owner = blockStack[blockStack.length - 1]?.kind === 'class' ? blockStack[blockStack.length - 1].name : undefined;
      const name = owner ? `${owner}.${match[1]}` : match[1];
      declarations.push(nativeDeclaration(input, number, 'ClassDef', 'class', name, {
        ...(owner ? { owner } : {}),
        ...(decorators.length ? { decorators } : {})
      }, true, {
        span: pythonBlockSpan(input, lines, index),
        metadata: {
          ...(owner ? { owner } : {}),
          ...(decorators.length ? { decorators } : {})
        }
      }));
      blockStack.push({ kind: 'class', name, indent });
    } else if ((match = trimmed.match(/^(?:from\s+([A-Za-z_][\w.]*)\s+import\s+.+|import\s+([A-Za-z_][\w.]*))/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1] ?? match[2], 'Import', 'module'));
    }
    decorators = [];
  }
  return declarations;
}

function indentationLength(line) { return String(line ?? '').match(/^\s*/)?.[0].length ?? 0; }

export { scanPython };
