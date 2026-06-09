import { nativeDeclaration } from './native-region-scanner-core.js';
import { jsContainerDelta, jsRegionKindForDeclarationName } from './native-region-scanner-js-helpers.js';

function jsCurrentObjectContext(stack) {
  return stack[stack.length - 1];
}

function jsContextAllowsPropertyScan(context) {
  return context?.initializerKind === 'object';
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
    const initializerKind = nestedInitializerKind(parsed.value);
    const name = `${parentDeclaration.name}.${parsed.key}`;
    const regionKind = nestedPropertyRegionKind(parentDeclaration, parsed.key, parsed.value);
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
  if (!entry || entry.startsWith('...') || entry.startsWith('[')) return undefined;
  const match = entry.match(/^(?:(['"])([^'"]+)\1|([A-Za-z_$][\w$-]*))\s*:\s*(.+)$/s);
  if (!match) return undefined;
  return { key: match[2] ?? match[3], value: match[4].trim() };
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
  jsContextAllowsPropertyScan,
  jsCurrentObjectContext,
  jsInlineNestedObjectDeclarations,
  jsNestedObjectContextFromDeclaration,
  updateJsObjectContextStack
};
