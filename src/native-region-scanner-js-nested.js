import { jsControlKeyword, nativeDeclaration, splitParameters } from './native-region-scanner-core.js';
import { jsContainerDelta, jsContainerInitializerKind, jsRegionKindForDeclarationName } from './native-region-scanner-js-helpers.js';

function jsCurrentObjectContext(stack) {
  return stack[stack.length - 1];
}

function jsContextAllowsPropertyScan(context) {
  return context?.initializerKind === 'object';
}

function jsArrayObjectContextFromLine(context, lineNumber, source) {
  if (context?.initializerKind !== 'array' || context.arrayRecords !== true || !String(source ?? '').trim().startsWith('{')) return undefined;
  const depth = jsContainerDelta(source);
  if (depth <= 0) return undefined;
  const index = (context.nextItemIndex ?? 0) + 1;
  context.nextItemIndex = index;
  return { name: `${context.name}.${index}`, ownerName: context.name, regionKind: context.regionKind, initializerKind: 'object', arrayItem: true, depth, startLine: lineNumber };
}

function updateJsArrayObjectContextName(context, source) {
  if (!context?.arrayItem) return;
  const match = String(source ?? '').trim().match(/^(?:name|id|key|slug|tool|command)\s*:\s*(['"`])([^'"`]+)\1/);
  if (match) context.name = `${context.ownerName}.${match[2]}`;
}

function jsNestedObjectContextFromDeclaration(declaration, lineNumber, source) {
  const initializerKind = declaration?.fields?.initializerKind ?? declaration?.metadata?.initializerKind;
  if (initializerKind !== 'object' && initializerKind !== 'array') return undefined;
  const depth = jsContainerDelta(source);
  if (depth <= 0) return undefined;
  return {
    name: declaration.name,
    regionKind: declaration.regionKind ?? declaration.metadata?.regionKind,
    initializerKind,
    depth,
    startLine: lineNumber
  };
}

function jsInlineNestedObjectDeclarations(input, lineNumber, source, parentDeclaration, depth = 0) {
  const parentInitializerKind = parentDeclaration?.fields?.initializerKind ?? parentDeclaration?.metadata?.initializerKind;
  if (depth > 4 || parentInitializerKind !== 'object') return [];
  const body = inlineObjectBody(source);
  if (body === undefined) return [];
  const declarations = [];
  for (const entry of splitTopLevelEntries(body)) {
    const parsed = parseObjectEntry(entry);
    if (!parsed) continue;
    const initializerKind = parsed.method ? 'function' : nestedInitializerKind(parsed.value);
    const name = `${parentDeclaration.name}.${parsed.key}`;
    const regionKind = initializerKind === 'function' ? 'body' : nestedPropertyRegionKind(parentDeclaration, parsed.key, parsed.value);
    const declaration = nativeDeclaration(input, lineNumber, initializerKind === 'function' ? 'NestedObjectFunctionProperty' : 'NestedObjectProperty', initializerKind === 'function' ? 'function' : 'property', name, {
      owner: parentDeclaration.name,
      propertyName: parsed.key,
      initializerKind
    }, initializerKind === 'object' || initializerKind === 'array' || initializerKind === 'function', {
      regionKind,
      metadata: { owner: parentDeclaration.name, propertyName: parsed.key, initializerKind }
    });
    declarations.push(declaration);
    declarations.push(...jsInlineNestedObjectDeclarations(input, lineNumber, parsed.value, declaration, depth + 1));
  }
  return declarations;
}

function updateJsObjectContextStack(stack, lineNumber, source) {
  const delta = jsContainerDelta(source);
  for (const context of stack) {
    if (context.startLine !== lineNumber) context.depth += delta;
  }
  while (stack.length && stack[stack.length - 1].depth <= 0) stack.pop();
}

function jsObjectPropertyDeclaration(input, lineNumber, trimmed, context) {
  if (/^[}\])]/.test(trimmed) || trimmed.startsWith('...')) return undefined;
  const methodMatch = trimmed.match(/^(?:(?:async|get|set)\s+)?(?:\[\s*(['"`])([^'"`]+)\1\s*\]|(['"`]?)([A-Za-z_$][\w$-]*)\3)\s*\(([^)]*)\)\s*(?:[:\w\s<>\[\]]*)?(?:\{|=>|,|$)/);
  const methodName = methodMatch?.[2] ?? methodMatch?.[4];
  if (methodMatch && !jsControlKeyword(methodName)) {
    const name = `${context.name}.${methodName}`;
    return nativeDeclaration(input, lineNumber, 'ObjectMethod', 'function', name, {
      owner: context.name,
      propertyName: methodName,
      parameters: splitParameters(methodMatch[5])
    }, true, {
      regionKind: 'body',
      metadata: { owner: context.name, propertyName: methodName, initializerKind: 'function' }
    });
  }
  const propertyMatch = trimmed.match(/^(?:\[\s*(['"`])([^'"`]+)\1\s*\]|(['"`])([^'"`]+)\3|([A-Za-z_$][\w$-]*))\s*:\s*(.+?)(?:,)?$/);
  if (!propertyMatch) return undefined;
  const propertyName = propertyMatch[2] ?? propertyMatch[4] ?? propertyMatch[5];
  if (!propertyName || jsControlKeyword(propertyName)) return undefined;
  const value = propertyMatch[6].trim();
  const initializerKind = jsPropertyInitializerKind(value);
  const functionLike = initializerKind === 'function';
  const name = `${context.name}.${propertyName}`;
  return nativeDeclaration(input, lineNumber, functionLike ? 'ObjectFunctionProperty' : 'ObjectProperty', functionLike ? 'function' : 'property', name, {
    owner: context.name,
    propertyName,
    initializerKind
  }, functionLike || initializerKind === 'object' || initializerKind === 'array', {
    regionKind: functionLike ? 'body' : jsPropertyRegionKind(context, propertyName, value),
    metadata: { owner: context.name, propertyName, initializerKind }
  });
}

function jsRouteRecordDeclaration(input, lineNumber, trimmed, context) {
  if (context.regionKind !== 'route') return undefined;
  const match = trimmed.match(/^(?:\{\s*)?(?:path|route|href|url)\s*:\s*(['"`])([^'"`]+)\1/);
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
  const containerKind = jsContainerInitializerKind(text, undefined, text);
  if (containerKind) return containerKind;
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

function inlineObjectBody(source) {
  const text = String(source ?? '');
  const open = text.indexOf('{');
  if (open < 0) return undefined;
  let quote;
  let escaped = false;
  let depth = 0;
  for (let index = open; index < text.length; index += 1) {
    const char = text[index];
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
    if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(open + 1, index);
    }
  }
  return undefined;
}

function splitTopLevelEntries(body) {
  const entries = [];
  let quote;
  let escaped = false;
  let depth = 0;
  let start = 0;
  const text = String(body ?? '');
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '\'' || char === '"' || char === '`') quote = char;
    else if (char === '{' || char === '[' || char === '(') depth += 1;
    else if (char === '}' || char === ']' || char === ')') depth -= 1;
    else if (char === ',' && depth === 0) {
      entries.push(text.slice(start, index).trim());
      start = index + 1;
    }
  }
  entries.push(text.slice(start).trim());
  return entries.filter(Boolean);
}

function parseObjectEntry(entry) {
  if (!entry || entry.startsWith('...')) return undefined;
  const match = entry.match(/^(?:\[\s*(['"`])([^'"`]+)\1\s*\]|(['"`])([^'"`]+)\3|([A-Za-z_$][\w$-]*))\s*:\s*(.+)$/s);
  if (match) return { key: match[2] ?? match[4] ?? match[5], value: match[6].trim() };
  const methodMatch = entry.match(/^(?:(?:async|get|set)\s+)?(?:\[\s*(['"`])([^'"`]+)\1\s*\]|(['"`]?)([A-Za-z_$][\w$-]*)\3)\s*\(([^)]*)\)\s*(?:[:\w\s<>\[\]]*)?(?:\{|=>|$)/s);
  if (!methodMatch) return undefined;
  return { key: methodMatch[2] ?? methodMatch[4], value: entry.trim(), method: true };
}

function nestedInitializerKind(value) {
  const text = String(value ?? '').trim();
  if (text.startsWith('{')) return 'object';
  if (text.startsWith('[')) return 'array';
  if (/^(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/.test(text)) return 'function';
  if (/^['"`]/.test(text)) return 'string';
  if (/^(?:true|false)\b/.test(text)) return 'boolean';
  if (/^[0-9]/.test(text)) return 'number';
  return 'expression';
}

function nestedPropertyRegionKind(parentDeclaration, propertyName, value) {
  return jsRegionKindForDeclarationName(propertyName, value)
    ?? parentDeclaration.regionKind
    ?? parentDeclaration.metadata?.ownershipRegionKind
    ?? parentDeclaration.metadata?.regionKind
    ?? 'property';
}

export {
  jsArrayObjectContextFromLine,
  jsContextAllowsPropertyScan,
  jsCurrentObjectContext,
  jsInlineNestedObjectDeclarations,
  jsNestedObjectContextFromDeclaration,
  jsObjectPropertyDeclaration,
  jsRouteRecordDeclaration,
  updateJsArrayObjectContextName,
  updateJsObjectContextStack
};
