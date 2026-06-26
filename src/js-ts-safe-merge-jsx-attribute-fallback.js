import { JsTsSafeMergeStatuses, jsTsSafeMergeGateOrder } from './js-ts-safe-merge-constants.js';
import { createJsTsSafeMergeSemanticArtifacts } from './js-ts-safe-merge-semantic-artifacts.js';
import { uniqueStrings } from './js-ts-safe-merge-context.js';
import { attributeMap, isJsxComponentTag, isJsxSpreadAttribute, parseJsxTags, sameAttributeNames, sameAttrText, sameTagText } from './js-ts-safe-merge-jsx-attribute-parser.js';
import { hasConditionalChildExpressionOperator, parseDirectChildren, parseJsxSource } from './js-ts-safe-merge-jsx-child-expression-parser.js';
import { semanticFallbackChangedExistingDeclarations } from './js-ts-safe-merge-semantic-edit-fallback-utils.js';

function createJsxAttributeSemanticFallbackResult(input, topLevelResult, stagedFallback) {
  const currentSourceText = stagedFallback?.directReplayCurrentSourceText
    ?? stagedFallback?.replayCurrentSourceText
    ?? input.headSourceText;
  const merge = mergeJsxAttributeSources({
    baseSourceText: input.baseSourceText,
    workerSourceText: input.workerSourceText,
    headSourceText: input.headSourceText,
    currentSourceText
  });
  if (!merge.ok) return merge.policyBlocker ? jsxAttributeBlockedResult(input, topLevelResult, merge, stagedFallback) : undefined;
  if (merge.sourceText === currentSourceText) return undefined;
  const resultBase = stagedFallback?.stagedTopLevelResult ?? topLevelResult;
  const language = input.language ?? topLevelResult.language ?? 'tsx';
  const sourcePath = input.sourcePath ?? topLevelResult.sourcePath ?? 'inline.tsx';
  const id = String(input.id ?? topLevelResult.id ?? 'js_ts_safe_merge');
  const artifacts = createJsTsSafeMergeSemanticArtifacts({
    ...input,
    id: `${id}_jsx_attribute`,
    language,
    sourcePath,
    headSourceText: currentSourceText,
    headHash: undefined,
    currentSourceHash: undefined
  }, {
    ...resultBase,
    id: `${String(input.id ?? resultBase.id ?? 'js_ts_safe_merge')}_jsx_attribute`,
    language,
    sourcePath,
    mergedSourceText: merge.sourceText,
    outputSourceText: merge.sourceText
  });
  if (artifacts.status !== 'verified') return undefined;
  const gates = semanticArtifactGates(artifacts);
  return {
    ...resultBase,
    id: String(input.id ?? resultBase.id ?? topLevelResult.id),
    status: JsTsSafeMergeStatuses.merged,
    mergedSourceText: merge.sourceText,
    outputSourceText: merge.sourceText,
    conflicts: [],
    gates,
    admission: {
      status: 'auto-merge-candidate',
      action: 'apply',
      reviewRequired: false,
      autoApplyCandidate: true,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes: []
    },
    summary: {
      ...resultBase.summary,
      changedExistingDeclarations: semanticFallbackChangedExistingDeclarations(topLevelResult, resultBase, stagedFallback),
      conflicts: 0,
      gatesPassed: gates.filter((gate) => gate.status === 'passed').length,
      semanticEditOperations: artifacts.script.summary.operations,
      semanticEditAppliedOperations: artifacts.replay.summary.applied,
      semanticEditReplayStatus: artifacts.replay.status,
      jsxAttributeTags: merge.summary.tags,
      jsxAttributeEdits: merge.summary.edits,
      jsxComponentPropContractCandidates: merge.summary.componentPropContracts.length,
      jsxComponentPropContractAttributes: merge.summary.componentPropContractAttributes,
      composedPhases: 2
    },
    metadata: {
      ...resultBase.metadata,
      composed: {
        phase: stagedFallback
          ? 'staged-top-level-jsx-attribute-semantic-fallback'
          : 'jsx-attribute-semantic-fallback',
        phases: stagedFallback
          ? ['top-level-neutralization', 'top-level-ledger', 'jsx-attribute']
          : ['top-level-ledger', 'jsx-attribute'],
        originalReasonCodes: topLevelResult.admission?.reasonCodes ?? [],
        stagedTopLevelSummary: stagedFallback?.stagedTopLevelResult?.summary,
        neutralization: stagedFallback?.neutralization?.summary,
        jsxAttributeFallback: merge.summary
      }
    },
    semanticArtifacts: artifacts
  };
}

function jsxAttributeBlockedResult(input, topLevelResult, merge, stagedFallback) {
  const reasonCodes = uniqueStrings(merge.reasonCodes);
  const gates = jsTsSafeMergeGateOrder.map((id, index) => ({
    id,
    status: index === 0 ? 'blocked' : 'skipped',
    reasonCodes: index === 0 ? reasonCodes : []
  }));
  return {
    ...topLevelResult,
    id: String(input.id ?? topLevelResult.id),
    status: JsTsSafeMergeStatuses.blocked,
    mergedSourceText: undefined,
    outputSourceText: undefined,
    conflicts: [{
      code: 'jsx-attribute-policy-blocked',
      gateId: 'parse-ledger',
      message: 'JSX attribute merge policy could not prove stable prop identity and render ordering.',
      side: 'worker',
      sourcePath: input.sourcePath ?? topLevelResult.sourcePath,
      details: { reasonCodes }
    }],
    gates,
    admission: {
      status: 'blocked',
      action: 'human-review',
      reviewRequired: true,
      autoApplyCandidate: false,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes
    },
    summary: {
      ...topLevelResult.summary,
      changedExistingDeclarations: semanticFallbackChangedExistingDeclarations(topLevelResult, topLevelResult, stagedFallback),
      conflicts: 1,
      gatesPassed: 0,
      jsxAttributePolicyBlocked: true,
      composedPhases: 2
    },
    metadata: {
      ...topLevelResult.metadata,
      composed: {
        phase: stagedFallback ? 'staged-top-level-jsx-attribute-policy-blocked' : 'jsx-attribute-policy-blocked',
        phases: stagedFallback
          ? ['top-level-neutralization', 'top-level-ledger', 'jsx-attribute-policy']
          : ['top-level-ledger', 'jsx-attribute-policy'],
        originalReasonCodes: topLevelResult.admission?.reasonCodes ?? [],
        stagedTopLevelSummary: stagedFallback?.stagedTopLevelResult?.summary,
        neutralization: stagedFallback?.neutralization?.summary,
        jsxAttributePolicy: { reasonCodes }
      }
    },
    semanticArtifacts: topLevelResult.semanticArtifacts
  };
}

function mergeJsxAttributeSources(input) {
  if (![input.baseSourceText, input.workerSourceText, input.headSourceText, input.currentSourceText].every(isString)) {
    return blocked('missing-source-text');
  }
  const parsed = ['base', 'worker', 'head', 'current'].map((side) => parseJsxTags(input[`${side}SourceText`]));
  if (parsed.some((source) => source.reasonCodes.length)) return blocked('jsx-attribute-parse-blocked');
  const [base, worker, head, current] = parsed;
  if (![worker, head, current].every((source) => sameJsxTagIdentitySequence(base.tags, source.tags))) {
    return blocked('jsx-attribute-element-identity-changed');
  }
  const conditionalChildExpressionRanges = Object.fromEntries(['base', 'worker', 'head', 'current'].map((side) => [
    side,
    jsxConditionalChildExpressionRanges(input[`${side}SourceText`])
  ]));
  const edits = [];
  const componentPropContracts = [];
  let changedTags = 0;
  for (const baseTag of base.tags) {
    const workerTag = worker.byKey.get(baseTag.key);
    const headTag = head.byKey.get(baseTag.key);
    const currentTag = current.byKey.get(baseTag.key);
    if (!workerTag || !headTag || !currentTag) continue;
    if (sameTagText(baseTag, workerTag)) continue;
    if (tagInConditionalChildExpression({ base: baseTag, worker: workerTag, head: headTag, current: currentTag }, conditionalChildExpressionRanges)) {
      return blocked('jsx-child-conditional-expression-unsupported');
    }
    const merged = mergeTagAttributes(baseTag, workerTag, headTag, currentTag);
    if (merged.status === 'blocked') return blocked(...merged.reasonCodes);
    for (const edit of merged.edits) edits.push(edit);
    for (const contract of merged.componentPropContracts ?? []) componentPropContracts.push(contract);
    if (merged.edits.length) changedTags += 1;
  }
  if (!edits.length) return blocked('no-jsx-attribute-merge-candidate');
  const sourceText = edits.sort((left, right) => right.start - left.start)
    .reduce((text, edit) => text.slice(0, edit.start) + edit.replacement + text.slice(edit.end), input.currentSourceText);
  return {
    ok: true,
    sourceText,
    summary: {
      tags: changedTags,
      edits: edits.length,
      componentPropContracts,
      componentPropContractAttributes: componentPropContracts.reduce((total, contract) => total + contract.attributeCount, 0)
    }
  };
}

function mergeTagAttributes(base, worker, head, current) {
  if (![worker, head, current].every((tag) => tag.tagName === base.tagName)) return blockedTag('jsx-tag-name-changed');
  const maps = [base, worker, head, current].map(attributeMap);
  if (maps.some((map) => map.reasonCodes.length)) return blockedTag('jsx-attribute-duplicate-name');
  if (![worker, head, current].every((tag) => sameAttributeNames(base, tag))) {
    return blockedTag('jsx-attribute-shape-changed');
  }
  const [, workerAttrs, headAttrs, currentAttrs] = maps.map((map) => map.byName);
  const edits = [];
  const changedAttributes = [];
  let workerSpread = false, headSpread = false, workerNamed = false, headNamed = false;
  for (const baseAttr of base.attributes) {
    const workerAttr = workerAttrs.get(baseAttr.name);
    const headAttr = headAttrs.get(baseAttr.name);
    const currentAttr = currentAttrs.get(baseAttr.name);
    const workerChanged = !sameAttrText(baseAttr, workerAttr);
    const headChanged = !sameAttrText(baseAttr, headAttr);
    if (baseAttr.name === 'key' && (workerChanged || headChanged)) {
      return blockedTag('jsx-attribute-key-identity-changed');
    }
    if (workerChanged || headChanged) {
      changedAttributes.push(baseAttr.name);
      const spread = isJsxSpreadAttribute(baseAttr);
      workerSpread ||= spread && workerChanged; headSpread ||= spread && headChanged;
      workerNamed ||= !spread && workerChanged; headNamed ||= !spread && headChanged;
    }
    if (workerChanged && headChanged && !sameAttrText(workerAttr, headAttr)) {
      return blockedTag('jsx-attribute-conflict');
    }
    if (!sameAttrText(currentAttr, headAttr) && !sameAttrText(currentAttr, workerAttr)) {
      return blockedTag('jsx-attribute-current-diverged');
    }
    if (workerChanged && !sameAttrText(currentAttr, workerAttr)) {
      edits.push({ start: currentAttr.start, end: currentAttr.end, replacement: workerAttr.text });
    }
  }
  if ((workerSpread && headNamed) || (headSpread && workerNamed)) return blockedTag('jsx-attribute-spread-explicit-precedence-unsupported');
  const contractAttributes = uniqueStrings(changedAttributes);
  const componentPropContracts = isJsxComponentTag(base.tagName) && contractAttributes.length
    ? [{
        tagName: base.tagName,
        tagKey: base.key,
        attributes: contractAttributes,
        attributeCount: contractAttributes.length
      }]
    : [];
  return { status: 'merged', edits, componentPropContracts };
}

function jsxConditionalChildExpressionRanges(sourceText) {
  const parsed = parseJsxSource(sourceText);
  if (parsed.reasonCodes.length) return [];
  return parsed.elements.flatMap((element) => {
    if (element.selfClosing) return [];
    const children = parseDirectChildren(sourceText, parsed, element);
    if (children.reasonCodes.length) return [];
    return children.tokens
      .filter((token) => token.kind === 'expression' && hasConditionalChildExpressionOperator(token.text))
      .map((token) => ({ start: token.start, end: token.end }));
  });
}

function tagInConditionalChildExpression(tagsBySide, rangesBySide) {
  return Object.entries(tagsBySide).some(([side, tag]) => (rangesBySide[side] ?? []).some((range) => range.start < tag.start && tag.end < range.end));
}

function semanticArtifactGates(artifacts) {
  return [
    gate('semantic-edit-script', artifacts.script?.admission?.status === 'auto-merge-candidate', artifacts.script?.admission?.reasonCodes),
    gate('semantic-edit-projection', artifacts.projection?.status === 'projected', artifacts.projection?.admission?.reasonCodes),
    gate('semantic-edit-replay', artifacts.replay?.status === 'accepted-clean', artifacts.replay?.admission?.reasonCodes),
    gate('semantic-edit-already-applied', artifacts.alreadyAppliedReplay?.status === 'already-applied', artifacts.alreadyAppliedReplay?.admission?.reasonCodes)
  ];
}

function gate(id, passed, reasonCodes = []) {
  return { id, status: passed ? 'passed' : 'blocked', reasonCodes: passed ? [] : uniqueStrings(reasonCodes) };
}

function blocked(...reasonCodes) {
  const normalized = uniqueStrings(reasonCodes);
  return {
    ok: false,
    reasonCodes: normalized,
    policyBlocker: normalized.some((reason) => jsxAttributePolicyBlockers.has(reason))
  };
}

function blockedTag(...reasonCodes) {
  return { status: 'blocked', reasonCodes: uniqueStrings(reasonCodes) };
}

function isString(value) { return typeof value === 'string'; }
function sameJsxTagIdentitySequence(leftTags, rightTags) {
  return jsxTagIdentitySequence(leftTags) === jsxTagIdentitySequence(rightTags);
}
function jsxTagIdentitySequence(tags = []) {
  return tags.map((tag, index) => {
    const keyAttr = tag.attributes.find((attribute) => attribute.name === 'key');
    return [tag.tagName, stableJsxKeyAttrText(keyAttr) ?? `ordinal:${index + 1}`].join('#');
  }).join('\0');
}
function stableJsxKeyAttrText(attribute) {
  if (!attribute) return undefined;
  const match = /^key\s*=\s*(?:"([^"]*)"|'([^']*)')\s*$/.exec(String(attribute.text ?? '').trim());
  if (!match) return undefined;
  return `key:${match[1] ?? match[2] ?? ''}`;
}

const jsxAttributePolicyBlockers = new Set([
  'jsx-attribute-conflict',
  'jsx-attribute-current-diverged',
  'jsx-attribute-duplicate-name',
  'jsx-attribute-key-identity-changed',
  'jsx-attribute-shape-changed',
  'jsx-attribute-spread-explicit-precedence-unsupported',
  'jsx-child-conditional-expression-unsupported'
]);

export { createJsxAttributeSemanticFallbackResult };
