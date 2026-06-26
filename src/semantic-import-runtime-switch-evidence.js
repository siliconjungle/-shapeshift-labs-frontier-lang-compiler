function switchDispatchOrderEvidence(lines, lineNumber) {
  if (!Array.isArray(lines) || !Number.isFinite(Number(lineNumber))) return [];
  const stack = [];
  let pendingSwitch;
  let depth = 0;
  for (let index = 0; index < lineNumber; index += 1) {
    const line = String(lines[index] ?? '');
    const leadingClose = leadingCloseBraceCount(line);
    if (leadingClose) {
      depth = Math.max(0, depth - leadingClose);
      while (stack.length && stack[stack.length - 1].depth > depth) stack.pop();
    }
    const opens = openBraceCount(line);
    const closes = closeBraceCount(line) - leadingClose;
    const switchHead = switchHeadRecord(line);
    if (switchHead) {
      pendingSwitch = undefined;
      if (opens > 0) stack.push(switchContext(switchHead, index + 1, depth + 1));
      else pendingSwitch = switchContext(switchHead, index + 1, depth + 1);
    } else if (pendingSwitch && opens > 0) {
      stack.push({ ...pendingSwitch, depth: depth + 1 });
      pendingSwitch = undefined;
    }
    const current = stack[stack.length - 1];
    const caseHead = caseHeadRecord(line);
    if (current && caseHead) {
      current.caseOrdinal = (current.caseOrdinal ?? 0) + 1;
      const previous = current.currentCase;
      const previousCompletion = current.currentCaseCompletion;
      current.currentCase = { ...caseHead, line: index + 1, ordinal: current.caseOrdinal, previousCase: previous, previousCaseCompletionKind: previousCompletion, fallthroughFromPrevious: Boolean(previous && !previousCompletion) };
      current.currentCaseCompletion = undefined;
    }
    if (index + 1 === Number(lineNumber)) return switchDispatchRecord(current);
    if (current?.currentCase) current.currentCaseCompletion = current.currentCaseCompletion ?? caseCompletionKind(line);
    depth = Math.max(0, depth + opens - Math.max(0, closes));
    while (stack.length && stack[stack.length - 1].depth > depth) stack.pop();
  }
  return [];
}

function loopIterationOrderEvidence(lines, lineNumber) {
  if (!Array.isArray(lines) || !Number.isFinite(Number(lineNumber))) return [];
  const stack = [];
  let pendingLoop;
  let depth = 0;
  for (let index = 0; index < lineNumber; index += 1) {
    const line = String(lines[index] ?? '');
    const leadingClose = leadingCloseBraceCount(line);
    if (leadingClose) {
      depth = Math.max(0, depth - leadingClose);
      while (stack.length && stack[stack.length - 1].depth > depth) stack.pop();
    }
    const opens = openBraceCount(line);
    const closes = closeBraceCount(line) - leadingClose;
    const loopHead = loopHeadRecord(line);
    if (loopHead) {
      pendingLoop = undefined;
      if (opens > 0) stack.push(loopContext(loopHead, index + 1, depth + 1));
      else pendingLoop = loopContext(loopHead, index + 1, depth + 1);
    } else if (pendingLoop && opens > 0) {
      stack.push({ ...pendingLoop, depth: depth + 1 });
      pendingLoop = undefined;
    }
    if (index + 1 === Number(lineNumber)) return loopIterationRecord(stack[stack.length - 1]);
    depth = Math.max(0, depth + opens - Math.max(0, closes));
    while (stack.length && stack[stack.length - 1].depth > depth) stack.pop();
  }
  return [];
}

function controlTransferOrderEvidence(lines, lineNumber) {
  if (!Array.isArray(lines) || !Number.isFinite(Number(lineNumber))) return [];
  const number = Number(lineNumber);
  const record = controlTransferRecord(String(lines[number - 1] ?? ''), number);
  const target = record?.labelText ? labelTargetEvidence(lines, number, record.labelText) : undefined;
  if (record && target) return [{ ...record, ...target }];
  return record ? [record] : [];
}

function switchContext(head, line, depth) {
  return { line, depth, text: head.text, discriminantText: head.discriminantText, caseOrdinal: 0 };
}

function loopContext(head, line, depth) {
  return { line, depth, ...head };
}

function switchDispatchRecord(current) {
  if (!current) return [];
  return [compactRecord({
    kind: 'switch-dispatch',
    switchLine: current.line,
    switchText: current.text,
    discriminantText: current.discriminantText,
    caseLine: current.currentCase?.line,
    caseText: current.currentCase?.text,
    caseKind: current.currentCase?.kind,
    caseOrdinal: current.currentCase?.ordinal,
    previousCaseLine: current.currentCase?.previousCase?.line,
    previousCaseText: current.currentCase?.previousCase?.text,
    previousCaseKind: current.currentCase?.previousCase?.kind,
    previousCaseOrdinal: current.currentCase?.previousCase?.ordinal,
    previousCaseCompletionKind: current.currentCase?.previousCaseCompletionKind,
    fallthroughFromPrevious: current.currentCase?.fallthroughFromPrevious || undefined
  })];
}

function loopIterationRecord(current) {
  if (!current) return [];
  return [compactRecord({
    kind: 'loop-iteration',
    loopKind: current.loopKind,
    loopLine: current.line,
    loopText: current.text,
    iteratorText: current.iteratorText,
    iterableText: current.iterableText,
    initializerText: current.initializerText,
    conditionText: current.conditionText,
    updateText: current.updateText
  })];
}

function controlTransferRecord(line, lineNumber) {
  const match = /\b(break|continue)\b\s*([A-Za-z_$][\w$]*)?/.exec(String(line ?? ''));
  if (!match) return undefined;
  return compactRecord({
    kind: 'control-transfer',
    transferKind: match[1],
    line: lineNumber,
    labelText: match[2],
    text: normalizeOrderEvidenceText(line.slice(match.index, statementEnd(line, match.index)))
  });
}

function labelTargetEvidence(lines, lineNumber, labelText) {
  const stack = [];
  let depth = 0;
  for (let index = 0; index < lineNumber - 1; index += 1) {
    const line = String(lines[index] ?? '');
    const leadingClose = leadingCloseBraceCount(line);
    if (leadingClose) {
      depth = Math.max(0, depth - leadingClose);
      while (stack.length && stack[stack.length - 1].depth > depth) stack.pop();
    }
    const label = labelRecord(lines, index, depth);
    if (label) stack.push(label);
    depth = Math.max(0, depth + openBraceCount(line) - Math.max(0, closeBraceCount(line) - leadingClose));
    while (stack.length && stack[stack.length - 1].depth > depth) stack.pop();
  }
  const current = [...stack].reverse().find((record) => record.labelText === labelText);
  return current ? compactRecord({
    labelLine: current.labelLine,
    labelTargetLine: current.labelTargetLine,
    labelTargetKind: current.labelTargetKind,
    labelTargetText: current.labelTargetText
  }) : undefined;
}

function labelRecord(lines, index, depth) {
  const line = String(lines[index] ?? '');
  const match = /^\s*([A-Za-z_$][\w$]*)\s*:\s*(.*)$/.exec(line);
  if (!match || match[1] === 'case' || match[1] === 'default') return undefined;
  const sameLineTarget = normalizeOrderEvidenceText(match[2]);
  const next = sameLineTarget ? { line: index + 1, text: sameLineTarget } : nextNonEmptyLine(lines, index + 1);
  if (!next?.text) return undefined;
  return compactRecord({
    labelText: match[1],
    labelLine: index + 1,
    labelTargetLine: next.line,
    labelTargetKind: labelTargetKind(next.text),
    labelTargetText: labelTargetText(next.text),
    depth: depth + Math.max(1, openBraceCount(next.text))
  });
}

function nextNonEmptyLine(lines, start) {
  for (let index = start; index < lines.length; index += 1) {
    const text = normalizeOrderEvidenceText(lines[index]);
    if (text) return { line: index + 1, text };
  }
  return undefined;
}

function labelTargetKind(text) {
  if (loopHeadRecord(text)) return 'loop';
  if (switchHeadRecord(text)) return 'switch';
  if (/^\{/.test(String(text ?? ''))) return 'block';
  return 'statement';
}

function labelTargetText(text) {
  return loopHeadRecord(text)?.text ?? switchHeadRecord(text)?.text ?? normalizeOrderEvidenceText(text);
}

function switchHeadRecord(line) {
  for (const match of String(line ?? '').matchAll(/\bswitch\b/g)) {
    const open = line.indexOf('(', match.index);
    const close = matchingParenIndex(line, open);
    if (open >= 0 && close !== undefined) return {
      text: normalizeOrderEvidenceText(line.slice(match.index, close + 1)),
      discriminantText: normalizeOrderEvidenceText(line.slice(open + 1, close))
    };
  }
  return undefined;
}

function loopHeadRecord(line) {
  return parenthesizedLoopHead(line, /\bfor\s+await\b/g, 'for-await')
    ?? parenthesizedLoopHead(line, /\bfor\b/g, 'for')
    ?? parenthesizedLoopHead(line, /\bwhile\b/g, 'while')
    ?? doLoopHead(line);
}

function parenthesizedLoopHead(line, pattern, keywordKind) {
  for (const match of String(line ?? '').matchAll(pattern)) {
    const open = line.indexOf('(', match.index);
    const close = matchingParenIndex(line, open);
    if (open < 0 || close === undefined) continue;
    const headerText = normalizeOrderEvidenceText(line.slice(open + 1, close));
    const text = normalizeOrderEvidenceText(line.slice(match.index, close + 1));
    if (keywordKind === 'while') return { loopKind: 'while', text, conditionText: headerText };
    return forLoopHeaderRecord(keywordKind, text, headerText);
  }
  return undefined;
}

function forLoopHeaderRecord(keywordKind, text, headerText) {
  const ofMatch = headerText.match(/^(.*?)\s+of\s+(.+)$/);
  if (ofMatch) return { loopKind: keywordKind === 'for-await' ? 'for-await-of' : 'for-of', text, iteratorText: normalizeOrderEvidenceText(ofMatch[1]), iterableText: normalizeOrderEvidenceText(ofMatch[2]) };
  const inMatch = headerText.match(/^(.*?)\s+in\s+(.+)$/);
  if (inMatch) return { loopKind: 'for-in', text, iteratorText: normalizeOrderEvidenceText(inMatch[1]), iterableText: normalizeOrderEvidenceText(inMatch[2]) };
  const parts = headerText.split(';').map(normalizeOrderEvidenceText);
  return { loopKind: keywordKind, text, initializerText: parts[0], conditionText: parts[1], updateText: parts[2] };
}

function doLoopHead(line) {
  const match = /\bdo\b/.exec(String(line ?? ''));
  return match ? { loopKind: 'do', text: 'do' } : undefined;
}

function caseHeadRecord(line) {
  const match = /\b(case|default)\b/.exec(String(line ?? ''));
  if (!match) return undefined;
  const colon = line.indexOf(':', match.index);
  return {
    kind: match[1] === 'default' ? 'default' : 'case',
    text: normalizeOrderEvidenceText(line.slice(match.index, colon === -1 ? statementEnd(line, match.index) : colon + 1))
  };
}

function caseCompletionKind(line) {
  const text = String(line ?? '');
  if (/\bbreak\b/.test(text)) return 'break';
  if (/\bcontinue\b/.test(text)) return 'continue';
  if (/\breturn\b/.test(text)) return 'return';
  if (/\bthrow\b/.test(text)) return 'throw';
  return undefined;
}

function leadingCloseBraceCount(line) { const match = String(line ?? '').match(/^\s*}+/); return match ? match[0].replace(/\s/g, '').length : 0; }
function openBraceCount(line) { return countCharsOutsideStrings(line, '{'); }
function closeBraceCount(line) { return countCharsOutsideStrings(line, '}'); }
function normalizeOrderEvidenceText(value) { return String(value ?? '').replace(/\s+/g, ' ').trim(); }
function statementEnd(line, start) { const semicolon = String(line ?? '').indexOf(';', start); return semicolon === -1 ? String(line ?? '').length : semicolon + 1; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }

function countCharsOutsideStrings(line, target) {
  let count = 0;
  let quote;
  let escaped = false;
  for (const char of String(line ?? '')) {
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '\'' || char === '"' || char === '`') { quote = char; continue; }
    if (char === target) count += 1;
  }
  return count;
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

export { controlTransferOrderEvidence, loopIterationOrderEvidence, switchDispatchOrderEvidence };
