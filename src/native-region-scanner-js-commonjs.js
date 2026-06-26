import { nativeExportDeclaration } from './native-region-scanner-core.js';

export function jsCommonJsExportDeclarations(input, lineNumber, trimmed) {
  let match = trimmed.match(/^Object\.assign\(\s*(?:module\.)?exports\s*,\s*(\{.*\})\s*\)\s*;?$/);
  if (match) return jsCommonJsObjectLiteralExportDeclarations(input, lineNumber, match[1]);
  match = trimmed.match(/^Object\.defineProperties\(\s*(?:module\.)?exports\s*,\s*(\{.*\})\s*\)\s*;?$/);
  if (match) return jsCommonJsDefinePropertiesExportDeclarations(input, lineNumber, match[1]);
  match = trimmed.match(/^Object\.defineProperty\(\s*(?:module\.)?exports\s*,\s*(['"])([^'"]+)\1\s*,\s*(\{.*\})\s*\)\s*;?$/);
  if (match) return jsCommonJsDescriptorExportDeclaration(input, lineNumber, match[2], match[3]);
  match = trimmed.match(/^module\.exports\s*=\s*(.+?)\s*;?$/);
  if (match) {
    const localName = jsCommonJsExportLocalName(match[1]);
    const assignment = nativeExportDeclaration(input, lineNumber, 'module.exports', 'CommonJsExportAssignment', {
      exportKind: 'assignment',
      ...(localName ? { localName } : {}),
      commonJs: true
    }, {
      name: 'module.exports',
      metadata: {
        exportKind: 'assignment',
        exportedName: 'module.exports',
        ...(localName ? { localName } : {}),
        commonJs: true,
        publicContract: true
      }
    });
    return [assignment, ...jsCommonJsObjectLiteralExportDeclarations(input, lineNumber, match[1])];
  }
  match = trimmed.match(/^(?:module\.)?exports(?:\.([A-Za-z_$][\w$]*)|\[\s*(['"])([^'"]+)\2\s*\])\s*=\s*(.+?)\s*;?$/);
  if (!match) return [];
  const exportedName = match[1] ?? match[3];
  if (exportedName === '__esModule') return [];
  const localName = jsCommonJsExportLocalName(match[4]);
  return [nativeExportDeclaration(input, lineNumber, exportedName, 'CommonJsNamedExportAssignment', {
    exportKind: 'commonjs-named',
    ...(localName ? { localName } : {}),
    commonJs: true
  }, {
    name: exportedName,
    metadata: {
      exportKind: 'commonjs-named',
      exportedName,
      ...(localName ? { localName } : {}),
      commonJs: true,
      publicContract: true
    }
  })];
}

function jsCommonJsDescriptorExportDeclaration(input, lineNumber, exportedName, descriptorSource) {
  if (exportedName === '__esModule') return [];
  const localName = jsCommonJsDescriptorLocalName(descriptorSource);
  return [nativeExportDeclaration(input, lineNumber, exportedName, 'CommonJsDescriptorExportProperty', {
    exportKind: 'commonjs-named',
    ...(localName ? { localName } : {}),
    commonJs: true
  }, {
    name: exportedName,
    metadata: {
      exportKind: 'commonjs-named',
      exportedName,
      ...(localName ? { localName } : {}),
      commonJs: true,
      publicContract: true
    }
  })];
}

function jsCommonJsDescriptorLocalName(source) {
  const text = String(source ?? '');
  return jsCommonJsExportLocalName(text.match(/\bvalue\s*:\s*([^,}]+)/)?.[1])
    ?? jsCommonJsExportLocalName(text.match(/\bget\s*:\s*\(\)\s*=>\s*\{\s*return\s+([^;}]+)/)?.[1])
    ?? jsCommonJsExportLocalName(text.match(/\bget\s*:\s*\(\)\s*=>\s*([^,}]+)/)?.[1])
    ?? jsCommonJsExportLocalName(text.match(/\bget\s*:\s*function(?:\s+[A-Za-z_$][\w$]*)?\s*\(\)\s*\{\s*return\s+([^;}]+)/)?.[1])
    ?? jsCommonJsExportLocalName(text.match(/\bget\s*\(\)\s*\{\s*return\s+([^;}]+)/)?.[1]);
}

function jsCommonJsObjectLiteralExportDeclarations(input, lineNumber, source) {
  const text = String(source ?? '').trim();
  if (!text.startsWith('{') || !text.endsWith('}')) return [];
  return splitTopLevelObjectProperties(text.slice(1, -1))
    .map((entry) => jsCommonJsObjectLiteralExport(input, lineNumber, entry))
    .filter(Boolean);
}

function jsCommonJsObjectLiteralExport(input, lineNumber, entry) {
  if (!entry || entry.startsWith('...') || entry.startsWith('[')) return undefined;
  const match = entry.match(/^((?:[A-Za-z_$][\w$]*)|(?:"[^"]+"|'[^']+'))\s*(?::\s*(.+))?$/);
  if (!match) return undefined;
  const exportedName = unquote(match[1]);
  if (exportedName === '__esModule') return undefined;
  const localName = match[2] ? jsCommonJsExportLocalName(match[2]) : /^[A-Za-z_$]/.test(exportedName) ? exportedName : undefined;
  return nativeExportDeclaration(input, lineNumber, exportedName, 'CommonJsObjectExportProperty', {
    exportKind: 'commonjs-named',
    ...(localName ? { localName } : {}),
    commonJs: true
  }, {
    name: exportedName,
    metadata: {
      exportKind: 'commonjs-named',
      exportedName,
      ...(localName ? { localName } : {}),
      commonJs: true,
      publicContract: true
    }
  });
}

function jsCommonJsDefinePropertiesExportDeclarations(input, lineNumber, source) {
  const text = String(source ?? '').trim();
  if (!text.startsWith('{') || !text.endsWith('}')) return [];
  return splitTopLevelObjectProperties(text.slice(1, -1))
    .map((entry) => jsCommonJsDefinePropertiesExport(input, lineNumber, entry))
    .filter(Boolean);
}

function jsCommonJsDefinePropertiesExport(input, lineNumber, entry) {
  if (!entry || entry.startsWith('...') || entry.startsWith('[')) return undefined;
  const match = entry.match(/^((?:[A-Za-z_$][\w$]*)|(?:"[^"]+"|'[^']+'))\s*:\s*(\{.*\})$/);
  if (!match) return undefined;
  return jsCommonJsDescriptorExportDeclaration(input, lineNumber, unquote(match[1]), match[2])[0];
}

function splitTopLevelObjectProperties(body) {
  const entries = [];
  let start = 0, depth = 0, quote;
  for (let index = 0; index < body.length; index += 1) {
    const char = body[index], previous = body[index - 1];
    if (quote) {
      if (char === quote && previous !== '\\') quote = undefined;
    } else if (char === '"' || char === "'") quote = char;
    else if (char === '{' || char === '[' || char === '(') depth += 1;
    else if (char === '}' || char === ']' || char === ')') depth = Math.max(0, depth - 1);
    else if (char === ',' && depth === 0) {
      entries.push(body.slice(start, index).trim());
      start = index + 1;
    }
  }
  entries.push(body.slice(start).trim());
  return entries;
}

function jsCommonJsExportLocalName(source) {
  const text = String(source ?? '').trim();
  return text.match(/^(?:async\s+)?function\*?\s+([A-Za-z_$][\w$]*)/)?.[1]
    ?? text.match(/^(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/)?.[1]
    ?? text.match(/^([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\b/)?.[1];
}

function unquote(value) {
  const text = String(value ?? '');
  return (text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))
    ? text.slice(1, -1)
    : text;
}
