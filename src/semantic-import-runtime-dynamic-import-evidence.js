function dynamicImportEvidenceRecords(line, start, end) {
  const expression = String(line ?? '');
  const records = [];
  for (const call of dynamicImportCalls(expression)) {
    if (!rangesOverlap(start, end, call.start, call.end) && !rangesOverlap(start, end, call.argumentStart, call.argumentEnd)) continue;
    const specifier = normalizeOrderEvidenceText(call.argumentText);
    const specifierKind = dynamicImportSpecifierKind(specifier, call.closed);
    const staticSpecifier = dynamicImportStaticSpecifierEvidence(specifier, specifierKind);
    records.push(compactRecord({
      kind: 'dynamic-import',
      ordinal: records.length + 1,
      text: normalizeOrderEvidenceText(call.text),
      specifierText: specifier,
      specifierKind,
      dynamicImportStaticSpecifierEvidence: staticSpecifier,
      dynamicImportRuntimeResolutionClaim: false,
      dynamicImportResolutionProofRequired: !staticSpecifier,
      runtimeEquivalenceClaim: false
    }));
  }
  return records;
}

function dynamicImportCalls(expression) {
  const text = String(expression ?? '');
  const records = [];
  let quote;
  let escaped = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '\'' || char === '"' || char === '`') { quote = char; continue; }
    const match = dynamicImportAt(text, index);
    if (!match) continue;
    records.push(match);
    index = Math.max(index, match.end - 1);
  }
  return records;
}

function dynamicImportAt(text, index) {
  if (text.slice(index, index + 6) !== 'import' || isIdentifierPart(text[index - 1]) || isIdentifierPart(text[index + 6])) return undefined;
  let cursor = index + 6;
  while (/\s/.test(text[cursor] ?? '')) cursor += 1;
  if (text[cursor] !== '(') return undefined;
  const close = matchingParenIndex(text, cursor);
  const end = close === undefined ? statementEnd(text, cursor) : close + 1;
  return {
    start: index,
    text: text.slice(index, end),
    argumentText: firstCallArgumentText(text, cursor + 1, close ?? end),
    argumentStart: cursor + 1,
    argumentEnd: close ?? end,
    end,
    closed: close !== undefined
  };
}

function firstCallArgumentText(text, start, end) {
  let depth = 0;
  let quote;
  let escaped = false;
  for (let index = start; index < end; index += 1) {
    const char = text[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '\'' || char === '"' || char === '`') { quote = char; continue; }
    if (char === '(' || char === '[' || char === '{') depth += 1;
    else if (char === ')' || char === ']' || char === '}') depth = Math.max(0, depth - 1);
    else if (char === ',' && depth === 0) return text.slice(start, index);
  }
  return text.slice(start, end);
}

function dynamicImportSpecifierKind(specifierText, closed) {
  const text = String(specifierText ?? '').trim();
  if (!closed || !text) return 'unparsed';
  if (isStaticStringLiteral(text) || isStaticTemplateLiteral(text)) return 'literal';
  if (text.startsWith('`')) return 'template';
  if (/^[A-Za-z_$][\w$]*$/.test(text)) return 'identifier';
  if (/^[A-Za-z_$][\w$]*(?:(?:\.|\?\.)[A-Za-z_$][\w$]*|\[[^\]]+\])+$/.test(text)) return 'member';
  if (/\?/.test(text) && /:/.test(text)) return 'conditional';
  if (/[+\-*/%]|\|\||&&|\?\?/.test(text)) return 'binary';
  if (/\)\s*$/.test(text)) return 'call';
  return 'expression';
}

function dynamicImportStaticSpecifierEvidence(specifierText, specifierKind) {
  if (specifierKind !== 'literal') return false;
  return isStaticStringLiteral(specifierText) || isStaticTemplateLiteral(specifierText);
}

function dynamicImportSignatureEvidence(record) {
  return compactRecord({
    specifierKind: record?.specifierKind,
    specifierText: record?.specifierText,
    dynamicImportStaticSpecifierEvidence: record?.dynamicImportStaticSpecifierEvidence,
    dynamicImportRuntimeResolutionClaim: record?.dynamicImportRuntimeResolutionClaim,
    dynamicImportResolutionProofRequired: record?.dynamicImportResolutionProofRequired,
    runtimeEquivalenceClaim: record?.runtimeEquivalenceClaim
  });
}

function matchingParenIndex(line, open) {
  if (open < 0) return undefined;
  let depth = 0;
  let quote;
  let escaped = false;
  for (let index = open; index < line.length; index += 1) {
    const char = line[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '\'' || char === '"' || char === '`') { quote = char; continue; }
    if (char === '(') depth += 1;
    else if (char === ')' && --depth === 0) return index;
  }
  return undefined;
}

function rangesOverlap(leftStart, leftEnd, rightStart, rightEnd) { return Math.max(leftStart, rightStart) < Math.min(leftEnd, rightEnd); }
function normalizeOrderEvidenceText(value) { return String(value ?? '').replace(/\s+/g, ' ').trim(); }
function isStaticStringLiteral(value) { const text = String(value ?? '').trim(), quote = text[0]; return (quote === '\'' || quote === '"') && text.endsWith(quote); }
function isStaticTemplateLiteral(value) { const text = String(value ?? '').trim(); return text.startsWith('`') && text.endsWith('`') && !text.includes('${'); }
function isIdentifierPart(char) { return /[A-Za-z0-9_$]/.test(char ?? ''); }
function statementEnd(line, start) { const semicolon = line.indexOf(';', start); return semicolon === -1 ? line.length : semicolon + 1; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0))); }

export { dynamicImportEvidenceRecords, dynamicImportSignatureEvidence };
