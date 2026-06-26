import { uniqueStrings } from './js-ts-safe-merge-context.js';
import { hasConditionalChildExpressionOperator, parseDirectChildren, parseJsxSource } from './js-ts-safe-merge-jsx-child-expression-parser.js';

function mergeJsxChildExpressionSources(input) {
  if (![input.baseSourceText, input.workerSourceText, input.headSourceText, input.currentSourceText].every(isString)) {
    return blocked('missing-source-text');
  }
  if (input.currentSourceText !== input.headSourceText) return blocked('jsx-child-expression-current-source-unsupported');
  const parsed = ['base', 'worker', 'head', 'current'].map((side) => parseJsxSource(input[`${side}SourceText`]));
  if (parsed.some((source) => source.reasonCodes.length)) return blocked('jsx-child-expression-parse-blocked');
  const [base, worker, head, current] = parsed;
  const currentEdits = [];
  const workerProofEdits = [];
  const headProofEdits = [];
  let changedElements = 0;
  let childAdditions = 0;
  let keyedChildAdditions = 0;
  let keyedFragmentAdditions = 0;
  for (const baseElement of base.elements) {
    if (baseElement.selfClosing) continue;
    const merged = mergeCandidateElement({
      sourceTexts: input,
      parsed: { base, worker, head, current },
      elements: {
        base: baseElement,
        worker: worker.byKey.get(baseElement.key),
        head: head.byKey.get(baseElement.key),
        current: current.byKey.get(baseElement.key)
      }
    });
    if (merged.status === 'blocked') return blocked(...merged.reasonCodes);
    if (merged.status !== 'merged') continue;
    currentEdits.push(...merged.currentEdits);
    workerProofEdits.push(...merged.workerProofEdits);
    headProofEdits.push(...merged.headProofEdits);
    changedElements += 1;
    childAdditions += merged.childAdditions ?? 0;
    keyedChildAdditions += merged.keyedChildAdditions ?? 0;
    keyedFragmentAdditions += merged.keyedFragmentAdditions ?? 0;
  }
  if (!currentEdits.length) return blocked('no-jsx-child-expression-merge-candidate');
  if (applyEdits(input.baseSourceText, workerProofEdits) !== input.workerSourceText) return blocked('jsx-child-expression-worker-diff-unsupported');
  if (applyEdits(input.baseSourceText, headProofEdits) !== input.headSourceText) return blocked('jsx-child-expression-head-diff-unsupported');
  return {
    ok: true,
    sourceText: applyEdits(input.currentSourceText, currentEdits),
    summary: { elements: changedElements, edits: currentEdits.length, childAdditions, keyedChildAdditions, keyedFragmentAdditions }
  };
}

function mergeCandidateElement(input) {
  const { base, worker, head, current } = input.elements;
  if (![worker, head, current].every(Boolean)) return { status: 'skipped' };
  if (![worker, head, current].every((element) => element.tagName === base.tagName)) {
    return blockedElement('jsx-child-expression-tag-name-changed');
  }
  if (![worker, head, current].every((element) => element.openText === base.openText && element.closeText === base.closeText)) {
    return { status: 'skipped' };
  }
  const children = childrenBySide(input.sourceTexts, input.parsed, input.elements);
  const childReasonCodes = Object.values(children).flatMap((entry) => entry.reasonCodes);
  if (childReasonCodes.length) return blockedElement(...childReasonCodes);
  const tokens = Object.fromEntries(Object.entries(children).map(([side, entry]) => [side, entry.tokens]));
  if (!sameChildShape(tokens.base, tokens.worker) || !sameChildShape(tokens.base, tokens.head) || !sameChildShape(tokens.base, tokens.current)) {
    return mergeChildAdditions(tokens, input.elements);
  }
  return mergeChildTokens(tokens);
}

function childrenBySide(sourceTexts, parsed, elements) {
  return Object.fromEntries(['base', 'worker', 'head', 'current'].map((side) => [
    side,
    parseDirectChildren(sourceTexts[`${side}SourceText`], parsed[side], elements[side])
  ]));
}

function mergeChildTokens(tokens) {
  const currentEdits = [];
  const workerProofEdits = [];
  const headProofEdits = [];
  for (let index = 0; index < tokens.base.length; index += 1) {
    const baseChild = tokens.base[index];
    const workerChild = tokens.worker[index];
    const headChild = tokens.head[index];
    const currentChild = tokens.current[index];
    if (baseChild.kind !== 'expression') {
      const identityConflict = childIdentityConflict(baseChild, workerChild, headChild, currentChild);
      if (identityConflict.length) return blockedElement(...identityConflict);
      if (workerChild.text !== baseChild.text || headChild.text !== baseChild.text || currentChild.text !== headChild.text) return { status: 'skipped' };
      continue;
    }
    const workerChanged = workerChild.text !== baseChild.text;
    const headChanged = headChild.text !== baseChild.text;
    if ((workerChanged || headChanged) && [baseChild, workerChild, headChild, currentChild].some((token) => hasConditionalChildExpressionOperator(token?.text))) {
      return blockedElement('jsx-child-conditional-expression-unsupported');
    }
    if (workerChanged && headChanged && workerChild.text !== headChild.text) return blockedElement('jsx-child-expression-conflict');
    if (currentChild.text !== headChild.text && currentChild.text !== workerChild.text) return blockedElement('jsx-child-expression-current-diverged');
    if (workerChanged && currentChild.text !== workerChild.text) {
      currentEdits.push({ start: currentChild.start, end: currentChild.end, replacement: workerChild.text });
    }
    if (workerChanged) workerProofEdits.push({ start: baseChild.start, end: baseChild.end, replacement: workerChild.text });
    if (headChanged) headProofEdits.push({ start: baseChild.start, end: baseChild.end, replacement: headChild.text });
  }
  return { status: currentEdits.length ? 'merged' : 'skipped', currentEdits, workerProofEdits, headProofEdits };
}

function mergeChildAdditions(tokens, elements) {
  const worker = analyzeChildAdditions(tokens.base, tokens.worker);
  const head = analyzeChildAdditions(tokens.base, tokens.head);
  const current = analyzeChildAdditions(tokens.base, tokens.current);
  const reasonCodes = uniqueStrings([worker, head, current].flatMap((entry) => entry.reasonCodes ?? []));
  if (reasonCodes.length) return blockedElement(...reasonCodes);
  if (![worker, head, current].every((entry) => entry.ok)) return { status: 'skipped' };
  if (!sameAdditionPlan(head, current)) return blockedElement('jsx-child-current-diverged');
  const sameGapReasonCodes = sameGapChildAdditionReasonCodes(tokens.base, worker.additionsByGap, head.additionsByGap);
  if (sameGapReasonCodes.length) return blockedElement(...sameGapReasonCodes);
  const duplicateOutputKeyReasonCodes = duplicateStableChildKeyReasonCodes(plannedMergedChildTokens(tokens.base, worker.additionsByGap, head.additionsByGap));
  if (duplicateOutputKeyReasonCodes.length) return blockedElement(...duplicateOutputKeyReasonCodes);
  const currentEdits = [];
  const workerProofEdits = [];
  const headProofEdits = [];
  let keyedChildAdditions = 0;
  let keyedFragmentAdditions = 0;
  for (let gap = 0; gap <= tokens.base.length; gap += 1) {
    const workerAdditions = worker.additionsByGap.get(gap);
    const workerText = additionText(workerAdditions);
    const headText = additionText(head.additionsByGap.get(gap));
    if (workerText && !headText) {
      const currentPosition = sideInsertionPosition(tokens.current, current.baseTokenIndexes, elements.current, gap);
      const basePosition = baseInsertionPosition(tokens.base, elements.base, gap);
      currentEdits.push({ start: currentPosition, end: currentPosition, replacement: workerText });
      workerProofEdits.push({ start: basePosition, end: basePosition, replacement: workerText });
      keyedChildAdditions += (workerAdditions ?? []).filter((token) => token.stableKey === true).length;
      keyedFragmentAdditions += (workerAdditions ?? []).filter((token) => isKeyedFragmentToken(token)).length;
    }
    if (headText) {
      const basePosition = baseInsertionPosition(tokens.base, elements.base, gap);
      headProofEdits.push({ start: basePosition, end: basePosition, replacement: headText });
    }
  }
  return {
    status: currentEdits.length ? 'merged' : 'skipped',
    currentEdits,
    workerProofEdits,
    headProofEdits,
    childAdditions: currentEdits.length,
    keyedChildAdditions,
    keyedFragmentAdditions
  };
}

function analyzeChildAdditions(baseTokens, sideTokens) {
  const duplicateKeyReasonCodes = duplicateStableChildKeyReasonCodes(sideTokens);
  if (duplicateKeyReasonCodes.length) return { ok: false, reasonCodes: duplicateKeyReasonCodes };
  const additionsByGap = new Map();
  const baseTokenIndexes = new Map();
  let baseIndex = 0;
  for (let sideIndex = 0; sideIndex < sideTokens.length; sideIndex += 1) {
    const sideToken = sideTokens[sideIndex];
    const baseToken = baseTokens[baseIndex];
    if (baseToken && sameToken(sideToken, baseToken)) {
      baseTokenIndexes.set(baseIndex, sideIndex);
      baseIndex += 1;
      continue;
    }
    if (isReorderedExistingChild(sideToken, baseTokens, baseIndex)) {
      return { ok: false, reasonCodes: ['jsx-child-reorder-unsupported'] };
    }
    const safety = addedChildSafety(sideToken);
    if (!safety.ok) return safety.reasonCodes.length ? { ok: false, reasonCodes: safety.reasonCodes } : { ok: false };
    const gap = baseIndex;
    additionsByGap.set(gap, [...(additionsByGap.get(gap) ?? []), sideToken]);
  }
  return { ok: baseIndex === baseTokens.length, additionsByGap, baseTokenIndexes };
}

function sameAdditionPlan(left, right) {
  const gaps = new Set([...left.additionsByGap.keys(), ...right.additionsByGap.keys()]);
  for (const gap of gaps) {
    if (additionText(left.additionsByGap.get(gap)) !== additionText(right.additionsByGap.get(gap))) return false;
  }
  return true;
}

function sameGapChildAdditionReasonCodes(baseTokens, workerAdditionsByGap, headAdditionsByGap) {
  for (let gap = 0; gap <= baseTokens.length; gap += 1) {
    const workerText = additionText(workerAdditionsByGap.get(gap));
    const headText = additionText(headAdditionsByGap.get(gap));
    if (workerText && headText && workerText !== headText) return ['jsx-child-addition-same-gap-conflict'];
  }
  return [];
}

function plannedMergedChildTokens(baseTokens, workerAdditionsByGap, headAdditionsByGap) {
  const merged = [];
  for (let gap = 0; gap <= baseTokens.length; gap += 1) {
    const headAdditions = headAdditionsByGap.get(gap);
    const workerAdditions = workerAdditionsByGap.get(gap);
    if (headAdditions?.length) merged.push(...headAdditions);
    else if (workerAdditions?.length) merged.push(...workerAdditions);
    if (gap < baseTokens.length) merged.push(baseTokens[gap]);
  }
  return merged;
}

function baseInsertionPosition(tokens, element, gap) {
  if (gap < tokens.length) return tokens[gap].start;
  return element.closeStart;
}

function sideInsertionPosition(tokens, baseTokenIndexes, element, gap) {
  if (baseTokenIndexes.has(gap)) return tokens[baseTokenIndexes.get(gap)].start;
  return element.closeStart;
}

function additionText(tokens = []) {
  return tokens.map((token) => token.text).join('');
}

function sameToken(left, right) {
  return left?.kind === right?.kind && left?.text === right?.text && left?.tagName === right?.tagName;
}

function addedChildSafety(token) {
  if (token?.kind !== 'element' || /^\s*$/.test(token.text)) return { ok: false, reasonCodes: [] };
  if (isFragmentToken(token) && !isKeyedFragmentToken(token)) {
    return { ok: false, reasonCodes: ['jsx-child-fragment-addition-unsupported'] };
  }
  if (token.hasSpreadProp) return { ok: false, reasonCodes: ['jsx-child-spread-prop-addition-unsupported'] };
  if (isJsxComponentTag(token.tagName) && token.stableKey !== true) {
    return { ok: false, reasonCodes: ['jsx-child-component-addition-missing-key'] };
  }
  return { ok: true, reasonCodes: [] };
}

function sameChildShape(left, right) {
  return childShape(left) === childShape(right);
}

function childShape(children) {
  return children.map((child) => {
    if (child.kind === 'element') return `element:${child.tagName}`;
    if (child.kind === 'expression') return 'expression';
    return `text:${child.text}`;
  }).join('\0');
}

function childIdentityConflict(baseChild, ...sideChildren) {
  if (baseChild?.kind !== 'element' || !baseChild.childIdentityKey) return [];
  return sideChildren
    .filter((child) => child?.kind === 'element' && child.childIdentityKey && child.childIdentityKey !== baseChild.childIdentityKey)
    .map(() => 'jsx-child-key-identity-changed');
}

function isReorderedExistingChild(sideToken, baseTokens, baseIndex) {
  if (!sideToken?.childIdentityKey) return false;
  return baseTokens.slice(baseIndex + 1).some((token) => token.childIdentityKey === sideToken.childIdentityKey);
}

function duplicateStableChildKeyReasonCodes(tokens) {
  const seen = new Set();
  for (const token of tokens) {
    if (token?.kind !== 'element' || !token.childIdentityKey) continue;
    if (seen.has(token.childIdentityKey)) return ['jsx-child-duplicate-key'];
    seen.add(token.childIdentityKey);
  }
  return [];
}

function isFragmentToken(token) {
  const tagName = String(token?.tagName ?? '');
  return token?.fragmentKind === 'shorthand' || tagName === 'Fragment' || tagName === 'React.Fragment';
}

function isKeyedFragmentToken(token) {
  return isFragmentToken(token) && token?.fragmentKind !== 'shorthand' && token?.stableKey === true;
}

function isJsxComponentTag(tagName) {
  const firstSegment = String(tagName ?? '').split(/[.:]/)[0] ?? '';
  return /^[A-Z]/.test(firstSegment);
}

function applyEdits(sourceText, edits) {
  return edits.slice()
    .sort((left, right) => right.start - left.start)
    .reduce((text, edit) => text.slice(0, edit.start) + edit.replacement + text.slice(edit.end), sourceText);
}

function blocked(...reasonCodes) {
  const normalized = uniqueStrings(reasonCodes);
  return {
    ok: false,
    reasonCodes: normalized,
    policyBlocker: normalized.some((reason) => jsxChildPolicyBlockers.has(reason))
  };
}

function blockedElement(...reasonCodes) {
  return { status: 'blocked', reasonCodes: uniqueStrings(reasonCodes) };
}

function isString(value) { return typeof value === 'string'; }

const jsxChildPolicyBlockers = new Set([
  'jsx-child-addition-same-gap-conflict',
  'jsx-child-component-addition-missing-key',
  'jsx-child-current-diverged',
  'jsx-child-duplicate-key',
  'jsx-child-conditional-expression-unsupported',
  'jsx-child-expression-conflict',
  'jsx-child-fragment-addition-unsupported',
  'jsx-child-key-identity-changed',
  'jsx-child-reorder-unsupported',
  'jsx-child-spread-prop-addition-unsupported'
]);

export { mergeJsxChildExpressionSources };
