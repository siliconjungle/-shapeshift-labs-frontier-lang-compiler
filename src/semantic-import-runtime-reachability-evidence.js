function reachabilityOrderEvidence(lines, lineNumber) {
  if (!Array.isArray(lines) || lineNumber <= 1) return [];
  const targetDepth = statementDepthBeforeLine(lines, lineNumber);
  for (let index = lineNumber - 2; index >= 0; index -= 1) {
    const line = lines[index] ?? '', depth = statementDepthBeforeLine(lines, index + 1);
    if (depth < targetDepth) break;
    if (depth > targetDepth || isIgnorableReachabilityLine(line)) continue;
    if (sameDepthControlBoundary(line)) break;
    const completion = unconditionalCompletionRecord(line, index + 1);
    if (completion) return [compactRecord({ kind: 'same-block-unreachable-after-completion', status: 'unreachable', proofLevel: 'lexical-same-block-completion', targetLine: lineNumber, completionKind: completion.kind, completionLine: completion.line, completionText: completion.text, completionLabel: completion.label, staticReachabilityEvidence: true, fullPathReachabilityClaim: false, runtimeEquivalenceClaim: false, semanticEquivalenceClaim: false })];
  }
  const branch = exhaustiveIfElseCompletionRecord(lines, lineNumber, targetDepth);
  if (branch) return [branch];
  const switchCompletion = exhaustiveSwitchCompletionRecord(lines, lineNumber, targetDepth);
  if (switchCompletion) return [switchCompletion];
  const tryFinallyCompletion = tryFinallyCompletionRecord(lines, lineNumber, targetDepth);
  if (tryFinallyCompletion) return [tryFinallyCompletion];
  const nestedBlockCompletion = nestedBlockCompletionRecord(lines, lineNumber, targetDepth);
  return nestedBlockCompletion ? [nestedBlockCompletion] : [];
}

const nestedPathCompletionMaxDepth = 2;

function unconditionalCompletionRecord(line, lineNumber) {
  let text = stripLineCommentOutsideStrings(line).trim();
  if (!text || text.startsWith('/*') || text.startsWith('*')) return undefined;
  while (/^[A-Za-z_$][\w$]*\s*:\s*/.test(text) && !/^(?:case|default)\b/.test(text)) text = text.replace(/^[A-Za-z_$][\w$]*\s*:\s*/, '').trim();
  const match = /^(return|throw|break|continue)\b\s*([A-Za-z_$][\w$]*)?/.exec(text);
  return match ? compactRecord({ kind: match[1], line: lineNumber, label: (match[1] === 'break' || match[1] === 'continue') ? match[2] : undefined, text: normalizeOrderEvidenceText(text.slice(0, statementEnd(text, 0))) }) : undefined;
}

function exhaustiveIfElseCompletionRecord(lines, lineNumber, targetDepth, remainingDepth = nestedPathCompletionMaxDepth) {
  const closeElseLine = previousCodeLine(lines, lineNumber - 1);
  if (!closeElseLine || statementDepthBeforeLine(lines, closeElseLine.lineNumber) !== targetDepth || !/^\s*}\s*$/.test(stripLineCommentOutsideStrings(closeElseLine.text))) return undefined;
  const elseStart = findBranchStartLine(lines, closeElseLine.lineNumber - 1, targetDepth, 'else');
  if (!elseStart) return undefined;
  const branches = [{ start: elseStart, closeLine: closeElseLine.lineNumber }];
  let previousCloseLine = previousBranchCloseLine(lines, elseStart, targetDepth);
  while (previousCloseLine) {
    const start = findBranchStartLine(lines, previousCloseLine - 1, targetDepth);
    if (!start) return undefined;
    branches.unshift({ start, closeLine: previousCloseLine });
    if (start.branchKind === 'if') break;
    previousCloseLine = previousBranchCloseLine(lines, start, targetDepth);
  }
  if (branches[0]?.start.branchKind !== 'if') return undefined;
  const completions = branches.map((branch) => lastTopLevelCompletionInBlock(lines, branch.start.lineNumber + 1, branch.closeLine - 1, targetDepth + 1, remainingDepth));
  if (completions.some((completion) => !completion)) return undefined;
  const elseIfLines = branches.filter((branch) => branch.start.branchKind === 'else-if').map((branch) => branch.start.lineNumber);
  const completionKinds = completions.map(completionKind);
  const completionTexts = completions.map(completionText);
  const boundedNestedPathEvidence = completions.some(completionUsesBoundedNestedPath);
  return compactRecord({ kind: elseIfLines.length ? 'exhaustive-if-chain-unreachable-after-completion' : 'exhaustive-if-else-unreachable-after-completion', status: 'unreachable', proofLevel: boundedNestedPathEvidence ? (elseIfLines.length ? 'lexical-if-chain-bounded-nested-completion' : 'lexical-if-else-bounded-nested-completion') : (elseIfLines.length ? 'lexical-if-chain-completion' : 'lexical-if-else-completion'), targetLine: lineNumber, ifLine: branches[0].start.lineNumber, elseLine: elseStart.lineNumber, elseIfLines: elseIfLines.length ? elseIfLines : undefined, branchLineNumbers: branches.map((branch) => branch.start.lineNumber), completionKind: completionKinds.every((kind) => kind === completionKinds[0]) ? completionKinds[0] : 'mixed', completionText: completionTexts.join(' | '), branchCompletionKinds: completionKinds, branchCompletionTexts: completionTexts, branchCompletionProofLevels: boundedNestedPathEvidence ? completions.map(completionProofLevel) : undefined, boundedNestedPathEvidence: boundedNestedPathEvidence || undefined, staticReachabilityEvidence: true, fullPathReachabilityClaim: false, runtimeEquivalenceClaim: false, semanticEquivalenceClaim: false });
}

function findBranchStartLine(lines, startLineNumber, targetDepth, expectedKind) {
  for (let lineNumber = startLineNumber; lineNumber >= 1; lineNumber -= 1) {
    if (statementDepthBeforeLine(lines, lineNumber) < targetDepth) return undefined;
    if (statementDepthBeforeLine(lines, lineNumber) !== targetDepth) continue;
    const text = stripLineCommentOutsideStrings(lines[lineNumber - 1]).trim();
    const branchKind = branchStartKind(text);
    if (branchKind && (!expectedKind || branchKind === expectedKind)) return { lineNumber, text, branchKind };
  }
  return undefined;
}

function branchStartKind(text) { if (!/[{]\s*$/.test(text)) return undefined; if (/^if\b/.test(text)) return 'if'; if (/^}?\s*else\s+if\b/.test(text)) return 'else-if'; if (/^}?\s*else\b/.test(text)) return 'else'; return undefined; }

function previousBranchCloseLine(lines, branchStart, targetDepth) {
  if (/^\s*}/.test(stripLineCommentOutsideStrings(branchStart.text))) return branchStart.lineNumber;
  const closeLine = previousCodeLine(lines, branchStart.lineNumber - 1);
  return closeLine && statementDepthBeforeLine(lines, closeLine.lineNumber) === targetDepth && /^\s*}\s*$/.test(stripLineCommentOutsideStrings(closeLine.text)) ? closeLine.lineNumber : undefined;
}

function lastTopLevelCompletionInBlock(lines, startLineNumber, endLineNumber, depth, remainingDepth = nestedPathCompletionMaxDepth) {
  const tail = previousCodeLineInRange(lines, startLineNumber, endLineNumber);
  if (!tail || statementDepthBeforeLine(lines, tail.lineNumber) !== depth) return undefined;
  const completion = unconditionalCompletionRecord(tail.text, tail.lineNumber);
  if (completion) return completion;
  return remainingDepth > 0 ? nestedTailCompletionRecord(lines, tail.lineNumber, depth, remainingDepth - 1) : undefined;
}

function nestedTailCompletionRecord(lines, closeLineNumber, targetDepth, remainingDepth) {
  const closeLine = { lineNumber: closeLineNumber, text: lines[closeLineNumber - 1] };
  if (!/^\s*}\s*$/.test(stripLineCommentOutsideStrings(closeLine.text))) return undefined;
  return exhaustiveIfElseCompletionRecord(lines, closeLineNumber + 1, targetDepth, remainingDepth)
    ?? exhaustiveSwitchCompletionRecord(lines, closeLineNumber + 1, targetDepth, remainingDepth)
    ?? tryFinallyCompletionRecord(lines, closeLineNumber + 1, targetDepth, remainingDepth)
    ?? nestedBlockCompletionRecord(lines, closeLineNumber + 1, targetDepth, remainingDepth);
}

function exhaustiveSwitchCompletionRecord(lines, lineNumber, targetDepth, remainingDepth = nestedPathCompletionMaxDepth) {
  const closeLine = previousCodeLine(lines, lineNumber - 1);
  if (!closeLine || statementDepthBeforeLine(lines, closeLine.lineNumber) !== targetDepth || !/^\s*}\s*$/.test(stripLineCommentOutsideStrings(closeLine.text))) return undefined;
  const switchStart = findMatchingSwitchStartLine(lines, closeLine.lineNumber, targetDepth);
  if (!switchStart) return undefined;

  const labels = switchCaseLabels(lines, switchStart.lineNumber + 1, closeLine.lineNumber - 1, targetDepth + 1);
  if (!labels.length || !labels.some((label) => label.kind === 'default')) return undefined;

  const completions = labels.map((label, index) => {
    const nextLine = labels[index + 1]?.lineNumber ?? closeLine.lineNumber;
    return lastTopLevelCompletionInBlock(lines, label.lineNumber + 1, nextLine - 1, targetDepth + 1, remainingDepth);
  });
  if (completions.some((completion) => !completion || !completionKindsAllowed(completion, switchExitCompletionKinds))) return undefined;

  const defaultLabel = labels.find((label) => label.kind === 'default');
  const completionKinds = completions.map(completionKind);
  const completionTexts = completions.map(completionText);
  const boundedNestedPathEvidence = completions.some(completionUsesBoundedNestedPath);
  return compactRecord({ kind: 'exhaustive-switch-unreachable-after-completion', status: 'unreachable', proofLevel: boundedNestedPathEvidence ? 'lexical-switch-default-bounded-nested-completion' : 'lexical-switch-default-completion', targetLine: lineNumber, switchLine: switchStart.lineNumber, defaultLine: defaultLabel?.lineNumber, labelLineNumbers: labels.map((label) => label.lineNumber), caseLines: labels.filter((label) => label.kind === 'case').map((label) => label.lineNumber), completionKind: completionKinds.every((kind) => kind === completionKinds[0]) ? completionKinds[0] : 'mixed', completionText: completionTexts.join(' | '), branchCompletionKinds: completionKinds, branchCompletionTexts: completionTexts, branchCompletionProofLevels: boundedNestedPathEvidence ? completions.map(completionProofLevel) : undefined, boundedNestedPathEvidence: boundedNestedPathEvidence || undefined, staticReachabilityEvidence: true, fullPathReachabilityClaim: false, runtimeEquivalenceClaim: false, semanticEquivalenceClaim: false });
}

const switchExitCompletionKinds = new Set(['return', 'throw']);

function tryFinallyCompletionRecord(lines, lineNumber, targetDepth, remainingDepth = nestedPathCompletionMaxDepth) {
  const closeLine = previousCodeLine(lines, lineNumber - 1);
  if (!closeLine || statementDepthBeforeLine(lines, closeLine.lineNumber) !== targetDepth || !/^\s*}\s*$/.test(stripLineCommentOutsideStrings(closeLine.text))) return undefined;
  const finallyStart = findFinallyStartLine(lines, closeLine.lineNumber - 1, targetDepth);
  if (!finallyStart) return undefined;
  const tryStart = findTryStartLineBeforeFinally(lines, finallyStart, targetDepth);
  if (!tryStart) return undefined;

  const completion = lastTopLevelCompletionInBlock(lines, finallyStart.lineNumber + 1, closeLine.lineNumber - 1, targetDepth + 1, remainingDepth);
  if (!completion || !completionKindsAllowed(completion, tryFinallyExitCompletionKinds)) return undefined;
  const boundedNestedPathEvidence = completionUsesBoundedNestedPath(completion);

  return compactRecord({ kind: 'try-finally-unreachable-after-finalizer-completion', status: 'unreachable', proofLevel: boundedNestedPathEvidence ? 'lexical-try-finally-finalizer-bounded-nested-completion' : 'lexical-try-finally-finalizer-completion', targetLine: lineNumber, tryLine: tryStart.lineNumber, catchLines: tryStart.catchLines.length ? tryStart.catchLines : undefined, finallyLine: finallyStart.lineNumber, completionKind: completionKind(completion), completionLine: completionLine(completion), completionText: completionText(completion), completionProofLevel: boundedNestedPathEvidence ? completionProofLevel(completion) : undefined, boundedNestedPathEvidence: boundedNestedPathEvidence || undefined, staticReachabilityEvidence: true, fullPathReachabilityClaim: false, runtimeEquivalenceClaim: false, semanticEquivalenceClaim: false });
}

const tryFinallyExitCompletionKinds = new Set(['return', 'throw']);

function nestedBlockCompletionRecord(lines, lineNumber, targetDepth, remainingDepth = nestedPathCompletionMaxDepth) {
  const closeLine = previousCodeLine(lines, lineNumber - 1);
  if (!closeLine || statementDepthBeforeLine(lines, closeLine.lineNumber) !== targetDepth || !/^\s*}\s*$/.test(stripLineCommentOutsideStrings(closeLine.text))) return undefined;
  const blockStart = findPlainBlockStartLine(lines, closeLine.lineNumber, targetDepth);
  if (!blockStart) return undefined;
  const completion = lastTopLevelCompletionInBlock(lines, blockStart.lineNumber + 1, closeLine.lineNumber - 1, targetDepth + 1, remainingDepth);
  if (!completion) return undefined;
  return compactRecord({ kind: 'nested-block-unreachable-after-completion', status: 'unreachable', proofLevel: completionUsesBoundedNestedPath(completion) ? 'lexical-bounded-nested-block-nested-completion' : 'lexical-bounded-nested-block-completion', targetLine: lineNumber, blockLine: blockStart.lineNumber, completionKind: completionKind(completion), completionLine: completionLine(completion), completionText: completionText(completion), completionProofLevel: completionProofLevel(completion), boundedNestedPathEvidence: true, staticReachabilityEvidence: true, fullPathReachabilityClaim: false, runtimeEquivalenceClaim: false, semanticEquivalenceClaim: false });
}

function findFinallyStartLine(lines, startLineNumber, targetDepth) {
  for (let lineNumber = startLineNumber; lineNumber >= 1; lineNumber -= 1) {
    const depth = statementDepthBeforeLine(lines, lineNumber);
    if (depth < targetDepth) return undefined;
    if (depth !== targetDepth) continue;
    const text = stripLineCommentOutsideStrings(lines[lineNumber - 1]).trim();
    if (/^}?\s*finally\b.*[{]\s*$/.test(text)) return { lineNumber, text };
    if (/[{]\s*$/.test(text)) return undefined;
  }
  return undefined;
}

function findTryStartLineBeforeFinally(lines, finallyStart, targetDepth) {
  const catchLines = [];
  for (let lineNumber = finallyStart.lineNumber - 1; lineNumber >= 1; lineNumber -= 1) {
    const depth = statementDepthBeforeLine(lines, lineNumber);
    if (depth < targetDepth) return undefined;
    if (depth !== targetDepth) continue;
    const text = stripLineCommentOutsideStrings(lines[lineNumber - 1]).trim();
    if (/^try\b.*[{]\s*$/.test(text)) return { lineNumber, text, catchLines };
    if (/^}?\s*catch\b.*[{]\s*$/.test(text)) {
      catchLines.unshift(lineNumber);
      continue;
    }
    if (/^\s*}\s*$/.test(text)) continue;
    return undefined;
  }
  return undefined;
}

function findPlainBlockStartLine(lines, closeLineNumber, targetDepth) {
  for (let lineNumber = closeLineNumber - 1; lineNumber >= 1; lineNumber -= 1) {
    const depth = statementDepthBeforeLine(lines, lineNumber);
    if (depth < targetDepth) return undefined;
    if (depth !== targetDepth) continue;
    const text = stripLineCommentOutsideStrings(lines[lineNumber - 1]).trim();
    if (plainBlockStartLine(text)) return { lineNumber, text };
    if (/[{]\s*$/.test(text)) return undefined;
  }
  return undefined;
}

function plainBlockStartLine(text) { return /^(?:[A-Za-z_$][\w$]*\s*:\s*)?\{\s*$/.test(text); }

function findMatchingSwitchStartLine(lines, closeLineNumber, targetDepth) {
  for (let lineNumber = closeLineNumber - 1; lineNumber >= 1; lineNumber -= 1) {
    const depth = statementDepthBeforeLine(lines, lineNumber);
    if (depth < targetDepth) break;
    if (depth !== targetDepth) continue;
    const text = stripLineCommentOutsideStrings(lines[lineNumber - 1]).trim();
    if (/[{]\s*$/.test(text)) return /^switch\b/.test(text) ? { lineNumber, text } : undefined;
  }
  return undefined;
}

function switchCaseLabels(lines, startLineNumber, endLineNumber, depth) {
  const labels = [];
  for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber += 1) {
    if (statementDepthBeforeLine(lines, lineNumber) !== depth) continue;
    const text = stripLineCommentOutsideStrings(lines[lineNumber - 1]).trim();
    const kind = switchCaseLabelKind(text);
    if (kind) labels.push({ kind, lineNumber, text });
  }
  return labels;
}

function switchCaseLabelKind(text) { if (/^case\b.*:\s*$/.test(text)) return 'case'; if (/^default\s*:\s*$/.test(text)) return 'default'; return undefined; }

function previousCodeLine(lines, lineNumber) { for (let index = lineNumber - 1; index >= 0; index -= 1) if (!isIgnorableReachabilityLine(lines[index])) return { lineNumber: index + 1, text: lines[index] }; return undefined; }

function previousCodeLineInRange(lines, startLineNumber, endLineNumber) { for (let index = endLineNumber - 1; index >= startLineNumber - 1; index -= 1) if (!isIgnorableReachabilityLine(lines[index])) return { lineNumber: index + 1, text: lines[index] }; return undefined; }

function completionKind(completion) { return completion?.completionKind ?? completion?.kind; }

function completionLine(completion) { return completion?.completionLine ?? completion?.line; }

function completionText(completion) { return completion?.completionText ?? completion?.text; }

function completionProofLevel(completion) { return completion?.proofLevel ?? 'lexical-same-block-completion'; }

function completionUsesBoundedNestedPath(completion) { return Boolean(completion) && (completion.boundedNestedPathEvidence === true || completion.line === undefined); }

function completionKindsAllowed(completion, allowedKinds) { const kinds = completionExitKinds(completion); return kinds.length > 0 && kinds.every((kind) => allowedKinds.has(kind)); }

function completionExitKinds(completion) {
  const branchKinds = completion?.branchCompletionKinds;
  if (Array.isArray(branchKinds) && branchKinds.length && branchKinds.every((kind) => kind !== 'mixed')) return branchKinds;
  const kind = completionKind(completion);
  return kind && kind !== 'mixed' ? [kind] : [];
}

function statementDepthBeforeLine(lines, lineNumber) {
  let depth = 0;
  for (let index = 0; index < lineNumber - 1; index += 1) depth = statementDepthAfterLine(lines[index], depth);
  return Math.max(0, depth - leadingCloseBraceCount(lines[lineNumber - 1] ?? ''));
}
function statementDepthAfterLine(line, depth) { const leadingClose = leadingCloseBraceCount(line), adjusted = Math.max(0, depth - leadingClose); return Math.max(0, adjusted + openBraceCount(line) - Math.max(0, closeBraceCount(line) - leadingClose)); }
function isIgnorableReachabilityLine(line) { const text = stripLineCommentOutsideStrings(line).trim(); return !text || text.startsWith('/*') || text.startsWith('*'); }
function sameDepthControlBoundary(line) { const text = stripLineCommentOutsideStrings(line).trim(); return /^(?:case\b|default\s*:|catch\b|finally\b|else\b)/.test(text) || /^}\s*(?:else|catch|finally)\b/.test(text); }
function stripLineCommentOutsideStrings(line) {
  const text = String(line ?? '');
  let quote, escaped = false;
  for (let index = 0; index < text.length - 1; index += 1) {
    const char = text[index], next = text[index + 1];
    if (quote) { if (escaped) escaped = false; else if (char === '\\') escaped = true; else if (char === quote) quote = undefined; continue; }
    if (char === '\'' || char === '"' || char === '`') { quote = char; continue; }
    if (char === '/' && next === '/') return text.slice(0, index);
  }
  return text;
}
function leadingCloseBraceCount(line) { const match = String(line ?? '').match(/^\s*}+/); return match ? match[0].replace(/\s/g, '').length : 0; }
function openBraceCount(line) { return countCharsOutsideStrings(line, '{'); }
function closeBraceCount(line) { return countCharsOutsideStrings(line, '}'); }
function countCharsOutsideStrings(line, target) {
  let count = 0, quote, escaped = false;
  for (const char of String(line ?? '')) {
    if (quote) { if (escaped) escaped = false; else if (char === '\\') escaped = true; else if (char === quote) quote = undefined; continue; }
    if (char === '\'' || char === '"' || char === '`') { quote = char; continue; }
    if (char === target) count += 1;
  }
  return count;
}
function normalizeOrderEvidenceText(value) { return String(value ?? '').replace(/\s+/g, ' ').trim(); }
function statementEnd(line, start) { const semicolon = String(line ?? '').indexOf(';', start); return semicolon === -1 ? String(line ?? '').length : semicolon + 1; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && value !== '')); }

export { reachabilityOrderEvidence };
