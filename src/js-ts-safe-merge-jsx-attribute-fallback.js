import { JsTsSafeMergeStatuses } from './js-ts-safe-merge-constants.js';
import { createJsTsSafeMergeSemanticArtifacts } from './js-ts-safe-merge-semantic-artifacts.js';
import { uniqueStrings } from './js-ts-safe-merge-context.js';
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
  if (!merge.ok || merge.sourceText === currentSourceText) return undefined;
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

function mergeJsxAttributeSources(input) {
  if (![input.baseSourceText, input.workerSourceText, input.headSourceText, input.currentSourceText].every(isString)) {
    return blocked('missing-source-text');
  }
  const parsed = ['base', 'worker', 'head', 'current'].map((side) => parseJsxTags(input[`${side}SourceText`]));
  if (parsed.some((source) => source.reasonCodes.length)) return blocked('jsx-attribute-parse-blocked');
  const [base, worker, head, current] = parsed;
  const edits = [];
  let changedTags = 0;
  for (const baseTag of base.tags) {
    const workerTag = worker.byKey.get(baseTag.key);
    const headTag = head.byKey.get(baseTag.key);
    const currentTag = current.byKey.get(baseTag.key);
    if (!workerTag || !headTag || !currentTag) continue;
    if (sameTagText(baseTag, workerTag)) continue;
    const merged = mergeTagAttributes(baseTag, workerTag, headTag, currentTag);
    if (merged.status === 'blocked') return blocked(...merged.reasonCodes);
    for (const edit of merged.edits) edits.push(edit);
    if (merged.edits.length) changedTags += 1;
  }
  if (!edits.length) return blocked('no-jsx-attribute-merge-candidate');
  const sourceText = edits.sort((left, right) => right.start - left.start)
    .reduce((text, edit) => text.slice(0, edit.start) + edit.replacement + text.slice(edit.end), input.currentSourceText);
  return { ok: true, sourceText, summary: { tags: changedTags, edits: edits.length } };
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
  for (const baseAttr of base.attributes) {
    const workerAttr = workerAttrs.get(baseAttr.name);
    const headAttr = headAttrs.get(baseAttr.name);
    const currentAttr = currentAttrs.get(baseAttr.name);
    const workerChanged = !sameAttrText(baseAttr, workerAttr);
    const headChanged = !sameAttrText(baseAttr, headAttr);
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
  return { status: 'merged', edits };
}

function parseJsxTags(sourceText) {
  const tags = [];
  const reasonCodes = [];
  const ordinals = new Map();
  let index = 0;
  while (index < sourceText.length) {
    const start = sourceText.indexOf('<', index);
    if (start === -1) break;
    const parsed = parseOpeningTag(sourceText, start);
    if (!parsed) {
      index = start + 1;
      continue;
    }
    if (parsed.reasonCodes.length) reasonCodes.push(...parsed.reasonCodes);
    const ordinal = (ordinals.get(parsed.tagName) ?? 0) + 1;
    ordinals.set(parsed.tagName, ordinal);
    tags.push({ ...parsed, key: `${parsed.tagName}#${ordinal}` });
    index = parsed.end;
  }
  return { tags, byKey: new Map(tags.map((tag) => [tag.key, tag])), reasonCodes: uniqueStrings(reasonCodes) };
}

function parseOpeningTag(sourceText, start) {
  const afterOpen = start + 1;
  if (/[/!?>]/.test(sourceText[afterOpen] ?? '')) return undefined;
  const nameMatch = /^[A-Za-z_$][\w$]*(?:[.:][A-Za-z_$][\w$]*|-[\w$]+)*/.exec(sourceText.slice(afterOpen));
  if (!nameMatch) return undefined;
  const tagName = nameMatch[0];
  const nameEnd = afterOpen + tagName.length;
  const end = openingTagEnd(sourceText, nameEnd);
  if (end === undefined) return undefined;
  const attributes = parseAttributes(sourceText, nameEnd, end - 1);
  return {
    tagName,
    start,
    end,
    text: sourceText.slice(start, end),
    attributes: attributes.values,
    reasonCodes: attributes.reasonCodes
  };
}

function parseAttributes(sourceText, start, end) {
  const values = [];
  const reasonCodes = [];
  let cursor = start;
  while (cursor < end) {
    while (cursor < end && /\s/.test(sourceText[cursor])) cursor += 1;
    if (sourceText[cursor] === '/') {
      cursor += 1;
      continue;
    }
    const attrStart = cursor;
    const nameMatch = /^[A-Za-z_$][\w$:-]*/.exec(sourceText.slice(cursor, end));
    if (!nameMatch) {
      reasonCodes.push('jsx-attribute-token-unsupported');
      break;
    }
    const name = nameMatch[0];
    cursor += name.length;
    while (cursor < end && /\s/.test(sourceText[cursor])) cursor += 1;
    if (sourceText[cursor] === '=') {
      cursor += 1;
      while (cursor < end && /\s/.test(sourceText[cursor])) cursor += 1;
      cursor = attributeValueEnd(sourceText, cursor, end);
      if (cursor === undefined) return { values, reasonCodes: ['jsx-attribute-value-unterminated'] };
    }
    values.push({ name, start: attrStart, end: cursor, text: sourceText.slice(attrStart, cursor) });
  }
  return { values, reasonCodes: uniqueStrings(reasonCodes) };
}

function openingTagEnd(sourceText, start) {
  let quote;
  let escaped = false;
  let braceDepth = 0;
  for (let index = start; index < sourceText.length; index += 1) {
    const char = sourceText[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '"' || char === '\'' || char === '`') quote = char;
    else if (char === '{') braceDepth += 1;
    else if (char === '}') braceDepth = Math.max(0, braceDepth - 1);
    else if (char === '>' && braceDepth === 0) return index + 1;
  }
  return undefined;
}

function attributeValueEnd(sourceText, start, end) {
  const first = sourceText[start];
  if (first === '"' || first === '\'') return quotedValueEnd(sourceText, start, end, first);
  if (first === '{') return bracedValueEnd(sourceText, start, end);
  let cursor = start;
  while (cursor < end && !/[\s/]/.test(sourceText[cursor])) cursor += 1;
  return cursor;
}

function quotedValueEnd(sourceText, start, end, quote) {
  let escaped = false;
  for (let cursor = start + 1; cursor < end; cursor += 1) {
    const char = sourceText[cursor];
    if (escaped) escaped = false;
    else if (char === '\\') escaped = true;
    else if (char === quote) return cursor + 1;
  }
  return undefined;
}

function bracedValueEnd(sourceText, start, end) {
  let depth = 0;
  let quote;
  let escaped = false;
  for (let cursor = start; cursor < end; cursor += 1) {
    const char = sourceText[cursor];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '"' || char === '\'' || char === '`') quote = char;
    else if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) return cursor + 1;
    }
  }
  return undefined;
}

function attributeMap(tag) {
  const byName = new Map();
  const duplicateNames = [];
  for (const attribute of tag.attributes) {
    if (byName.has(attribute.name)) duplicateNames.push(attribute.name);
    byName.set(attribute.name, attribute);
  }
  return { byName, reasonCodes: duplicateNames.length ? ['jsx-attribute-duplicate-name'] : [] };
}

function sameAttributeNames(left, right) {
  return left.attributes.map((attr) => attr.name).join('\0') === right.attributes.map((attr) => attr.name).join('\0');
}

function sameTagText(left, right) {
  return String(left?.text ?? '').trim() === String(right?.text ?? '').trim();
}

function sameAttrText(left, right) {
  return String(left?.text ?? '').trim() === String(right?.text ?? '').trim();
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
  return { ok: false, reasonCodes: uniqueStrings(reasonCodes) };
}

function blockedTag(...reasonCodes) {
  return { status: 'blocked', reasonCodes: uniqueStrings(reasonCodes) };
}

function isString(value) { return typeof value === 'string'; }

export { createJsxAttributeSemanticFallbackResult };
