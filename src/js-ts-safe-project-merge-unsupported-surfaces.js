import { compactRecord } from './js-ts-safe-merge-context.js';
import { maskNonCode } from './js-ts-semantic-scope-use-def-scan.js';

const DecoratorRuntimeExecutionRoute = Object.freeze({
  routeId: 'prove-decorator-runtime-execution-equivalence',
  routeLane: 'decorator-runtime-boundaries',
  routeNext: 'supply-decorator-runtime-execution-proof',
  failClosed: true,
  blocksSemanticEquivalence: true
});
const GeneratorRuntimeProtocolRoute = Object.freeze({
  routeId: 'prove-generator-runtime-protocol-equivalence',
  routeLane: 'generator-runtime-boundaries',
  routeNext: 'supply-generator-runtime-protocol-proof',
  failClosed: true,
  blocksSemanticEquivalence: true
});
const AsyncGeneratorRuntimeProtocolRoute = Object.freeze({
  routeId: 'prove-async-generator-runtime-protocol-equivalence',
  routeLane: 'generator-runtime-boundaries',
  routeNext: 'supply-async-generator-runtime-protocol-proof',
  failClosed: true,
  blocksSemanticEquivalence: true
});
const ClassPrivateAccessorRuntimeRoute = Object.freeze({ routeId: 'prove-class-private-accessor-runtime-equivalence', routeLane: 'class-private-accessor-runtime-boundaries', routeNext: 'supply-class-private-accessor-runtime-proof', failClosed: true, blocksSemanticEquivalence: true });

const surfaceChecks = [
  { kind: 'explicit-resource-management', pattern: /\b(?:await\s+)?using\s+[A-Za-z_$][\w$]*\s*=/g },
  { kind: 'decorator', pattern: /^[ \t]*@[A-Za-z_$][\w$]*(?:[.(\s]|$)/gm, startOffset: (match) => match[0].indexOf('@') },
  { kind: 'accessor-field', pattern: /\baccessor\s+#?[A-Za-z_$][\w$]*/g },
  { kind: 'private-class-element', pattern: /#[A-Za-z_$][\w$]*/g },
  { kind: 'class-static-block', pattern: /\bstatic\s*\{/g },
  { kind: 'enum-declaration', pattern: /\b(?:const\s+)?enum\s+[A-Za-z_$][\w$]*\s*\{/g },
  { kind: 'namespace-declaration', pattern: /\b(?:namespace|module)\s+[A-Za-z_$][\w$]*(?:\s*\.\s*[A-Za-z_$][\w$]*)*\s*\{/g },
  { kind: 'ambient-module-declaration', pattern: /\bdeclare\s+module\s+(?:(?:['"][^'"\n]+['"]\s*)|(?:[A-Za-z_$][\w$]*\s*))?\{/g },
  { kind: 'global-augmentation', pattern: /\bdeclare\s+global\s*\{/g },
  { kind: 'export-assignment', pattern: /\bexport\s*=\s*[A-Za-z_$][\w$]*/g },
  { kind: 'import-meta-expression', pattern: /\bimport\s*\.\s*meta\b/g },
  { kind: 'satisfies-expression', pattern: /(?:[A-Za-z_$][\w$.)\]]|\})\s+satisfies\b/g },
  { kind: 'as-const-assertion', pattern: /\bas\s+const\b/g },
  { kind: 'const-type-parameter', pattern: /<\s*const\s+[A-Za-z_$][\w$]*/g },
  { kind: 'async-generator-function', pattern: /\basync\s+function\s*\*\s*(?:[A-Za-z_$][\w$]*\s*)?\(/g },
  { kind: 'generator-function', pattern: /(?<!async\s)\bfunction\s*\*\s*(?:[A-Za-z_$][\w$]*\s*)?\(/g }
];

const focusedSurfaceReviewEntries = [
  ['explicit-resource-management', 'explicit-resource-management-acquisition-disposal-order-evidence', 'control-flow-effect-graph', 'using and await using acquisition plus reverse lexical disposal-order evidence can bound ordering.', 'resource-management-disposal-effect-equivalence-not-claimed', 'Disposal side effects and executable effect equivalence remain unproved.', { routeId: 'prove-resource-management-disposal-effect-equivalence', routeLane: 'control-flow-effect-graph-runtime-resource-management', routeNext: 'supply-resource-management-disposal-proof', failClosed: true, blocksSemanticEquivalence: true }],
  ['decorator', 'typescript-decorator-static-metadata-evidence', 'type-public-api-graph', 'TypeScript compiler-backed decorator target and expression metadata can bound static shape.', 'decorator-execution-equivalence-not-claimed', 'Decorator execution, side effects, and runtime ordering remain unproved.', DecoratorRuntimeExecutionRoute],
  ['accessor-field', 'typescript-accessor-field-static-shape-evidence', 'type-public-api-graph', 'TypeScript compiler-backed accessor-field static shape records and proof hashes can bound public shape.', 'accessor-field-runtime-equivalence-not-claimed', 'Accessor initialization and getter/setter runtime behavior remain unproved.', ClassPrivateAccessorRuntimeRoute],
  ['private-class-element', 'typescript-private-class-member-static-shape-evidence', 'type-public-api-graph', 'TypeScript compiler-backed private class member static shape records and proof hashes can bound class shape.', 'private-class-member-runtime-equivalence-not-claimed', 'Private member initialization, access, and runtime behavior remain unproved.', ClassPrivateAccessorRuntimeRoute],
  ['class-static-block', 'class-static-block-initialization-order-evidence', 'control-flow-effect-graph', 'Class static block initialization-order evidence can bound public runtime-region ordering.', 'class-static-block-executable-runtime-equivalence-not-claimed', 'Executable static initialization side effects and runtime equivalence remain unproved.'],
  ['enum-declaration', 'typescript-enum-runtime-shape-evidence', 'type-public-api-graph', 'TypeScript compiler-backed enum runtime-shape, member-value, and source-bound computed-value proof evidence can bound emitted enum shape.', 'enum-runtime-evaluation-equivalence-not-claimed', 'Broad executable enum runtime evaluation remains unproved beyond source-bound computed-value traces.'],
  ['namespace-declaration', 'typescript-namespace-static-module-shape-evidence', 'module-export-import-graph', 'Namespace static module-shape records and proof hashes can bound declaration shape.', 'namespace-runtime-evaluation-equivalence-not-claimed', 'Namespace runtime evaluation and merging semantics remain unproved.'],
  ['ambient-module-declaration', 'typescript-ambient-module-static-shape-evidence', 'module-export-import-graph', 'Ambient module static shape records and proof hashes can bound declaration shape.', 'ambient-module-compatibility-equivalence-not-claimed', 'Ambient module compatibility across external consumers remains unproved.'],
  ['global-augmentation', 'typescript-global-augmentation-static-shape-evidence', 'module-export-import-graph', 'Global augmentation static shape records can bound declared global surface changes.', 'global-augmentation-compatibility-equivalence-not-claimed', 'Global compatibility and host/runtime interaction remain unproved.', { routeId: 'prove-global-augmentation-compatibility', routeLane: 'module-runtime-global-augmentation', routeNext: 'supply-source-bound-global-augmentation-compatibility-proof', failClosed: true, blocksSemanticEquivalence: true }],
  ['export-assignment', 'typescript-export-assignment-static-module-shape-evidence', 'module-export-import-graph', 'Export-assignment static module-shape records can bound CommonJS-style export shape.', 'export-assignment-runtime-interop-equivalence-not-claimed', 'CommonJS/ESM runtime interop behavior remains unproved.'],
  ['import-meta-expression', 'import-meta-host-context-member-evidence', 'control-flow-effect-graph', 'Static import.meta member and host-context evidence can bound observed host-dependent reads.', 'import-meta-host-context-equivalence-not-claimed', 'Host runtime resolution and executable import.meta equivalence remain unproved.'],
  ['satisfies-expression', 'typescript-satisfies-static-inference-syntax-evidence', 'type-public-api-graph', 'Static compiler-backed inference syntax evidence can bound satisfies-expression syntax participation.', 'satisfies-inference-semantics-equivalence-not-claimed', 'Broad inference semantics and executable behavior remain unproved.'],
  ['as-const-assertion', 'typescript-as-const-static-inference-syntax-evidence', 'type-public-api-graph', 'Static compiler-backed inference syntax evidence can bound as const assertion participation.', 'as-const-inference-semantics-equivalence-not-claimed', 'Broad literal inference semantics and executable behavior remain unproved.'],
  ['const-type-parameter', 'typescript-const-type-parameter-static-inference-syntax-evidence', 'type-public-api-graph', 'Static compiler-backed inference syntax evidence can bound const type-parameter participation.', 'const-type-parameter-inference-semantics-equivalence-not-claimed', 'Broad generic inference semantics and executable behavior remain unproved.'],
  ['async-generator-function', 'async-generator-await-yield-order-evidence', 'control-flow-effect-graph', 'Async generator await/yield order evidence can bound suspension ordering.', 'async-generator-runtime-protocol-equivalence-not-claimed', 'Async iterator protocol behavior, cancellation, backpressure, and executable scheduling remain unproved.', AsyncGeneratorRuntimeProtocolRoute],
  ['generator-function', 'generator-yield-order-evidence', 'control-flow-effect-graph', 'Generator yield order evidence can bound iterator suspension ordering.', 'generator-runtime-protocol-equivalence-not-claimed', 'Iterator protocol behavior, delegation, cancellation, and executable scheduling remain unproved.', GeneratorRuntimeProtocolRoute],
  ['top-level-await', 'top-level-await-module-runtime-scope-evidence', 'control-flow-effect-graph', 'Module-scope top-level await runtime-scope evidence can bound await suspension-order participation.', 'top-level-await-executable-suspension-order-equivalence-not-claimed', 'Executable suspension order and host module-loading behavior remain unproved.']
];

const focusedSurfaceReviews = Object.freeze(Object.fromEntries(
  focusedSurfaceReviewEntries.map(([kind, evidenceKind, evidenceScope, evidenceSummary, proofGapCode, proofGapSummary, proofGapRoute]) => [
    kind,
    focusedSurfaceReview(evidenceKind, evidenceScope, evidenceSummary, proofGapCode, proofGapSummary, proofGapRoute)
  ])
));

const surfaceEvidenceLimit = 50;

function unsupportedJsTsSurfaceEvidence(id, files = [], fileResults = []) {
  const surfaces = unsupportedSurfaceRecords(files, fileResults);
  return evidenceRecord({
    id,
    suffix: 'unsupported_js_ts_surface_review',
    level: 'unsupported-js-ts-surface-review',
    status: 'unknown',
    scope: 'project',
    claimKind: 'unsupported-surface-upper-bound',
    summary: surfaces.length
      ? `Observed ${surfaces.length} unsupported or focused-evidence-only JS/TS surface marker(s); remaining proof gaps must be closed before any broad semantic equivalence claim.`
      : 'Unsupported or focused-evidence-only JS/TS semantic surfaces require explicit external evidence before any broad semantic equivalence claim.',
    metadata: {
      partialMatrixRowsRemain: true,
      requiresHumanOrExternalProof: true,
      missingSignal: 'unsupported-js-ts-surface-proof-not-available',
      nextAction: 'Supply the remaining focused unsupported-surface proof gaps or keep semanticEquivalenceClaim false.',
      executableSemanticEquivalence: 'not-claimed',
      surfaceReviewClaim: 'bounded-evidence-only',
      surfaceEvidenceStatus: surfaces.length ? 'observed' : 'not-observed-by-lightweight-scan',
      observedUnsupportedSurfaces: uniqueStrings(surfaces.map((surface) => surface.observedSurfaceKind)),
      surfaceFocusedEvidenceKinds: uniqueStrings(surfaces.map((surface) => surface.boundedEvidence?.kind)),
      surfaceProofGapCodes: uniqueStrings(surfaces.map((surface) => surface.remainingProofGap?.code)),
      surfaceProofGapRouteIds: nonEmptyArray(uniqueStrings(surfaces.map((surface) => surface.remainingProofGap?.routeId))),
      surfaceProofGapRouteLanes: nonEmptyArray(uniqueStrings(surfaces.map((surface) => surface.remainingProofGap?.routeLane))),
      surfaceReasonCodes: uniqueStrings(surfaces.map((surface) => surface.reasonCode)),
      surfaceEvidenceCount: surfaces.length || undefined,
      surfaceEvidenceLimit: surfaces.length ? surfaceEvidenceLimit : undefined,
      surfaceEvidenceTruncated: surfaces.length > surfaceEvidenceLimit || undefined,
      surfaceEvidence: surfaces.length ? surfaces.slice(0, surfaceEvidenceLimit) : undefined
    }
  });
}

function unsupportedSurfaceRecords(files, fileResults) {
  const sources = [...sourceEntries(files), ...resultEntries(fileResults)];
  const seen = new Set();
  return sources.flatMap((entry) => unsupportedSurfaceRecordsForEntry(entry, seen));
}

function unsupportedSurfaceRecordsForEntry(entry, seen) {
  const masked = maskNonCode(entry.sourceText).code;
  const lineStarts = lineStartsFor(entry.sourceText);
  return [
    ...surfaceChecks.flatMap((check) => {
      check.pattern.lastIndex = 0;
      return [...masked.matchAll(check.pattern)].flatMap((match) => {
        const start = match.index + Math.max(0, Number(check.startOffset?.(match) ?? 0));
        const end = match.index + match[0].length;
        const key = `${entry.sourcePath}\0${entry.stage}\0${check.kind}\0${start}\0${end}`;
        if (seen.has(key)) return [];
        seen.add(key);
        const location = lineColumnAt(lineStarts, start);
        return [compactRecord({
          sourcePath: entry.sourcePath,
          stage: entry.stage,
          kind: check.kind,
          ...focusedSurfaceRecordFields(check.kind),
          start,
          end,
          line: location.line,
          column: location.column,
          excerpt: excerptFor(entry.sourceText, start, end)
        })];
      });
    }),
    ...topLevelAwaitSurfaceRecords(entry, masked, lineStarts, seen)
  ];
}

function topLevelAwaitSurfaceRecords(entry, masked, lineStarts, seen) {
  const records = [];
  let offset = 0;
  let braceDepth = 0;
  for (const line of masked.split(/(?<=\n)/)) {
    const depthBeforeLine = braceDepth;
    if (depthBeforeLine === 0) {
      const awaitMatch = topLevelAwaitMatch(line);
      if (awaitMatch) {
        const record = unsupportedSurfaceRecord(
          entry,
          seen,
          lineStarts,
          'top-level-await',
          offset + awaitMatch.index,
          offset + awaitMatch.index + awaitMatch.length
        );
        if (record) records.push(record);
      }
    }
    braceDepth = nextBraceDepth(braceDepth, line);
    offset += line.length;
  }
  return records;
}

function topLevelAwaitMatch(line) {
  const match = /(?:^|[^\w$])await\b/.exec(line);
  if (!match) return undefined;
  const index = match.index + match[0].indexOf('await');
  const before = line.slice(0, index).trim();
  if (before.includes('=>')) return undefined;
  if (!before || /^(?:export\s+)?(?:const|let|var)\s+[A-Za-z_$][\w$]*(?:\s*:\s*[^=]+)?\s*=$/.test(before) || /^export\s+default$/.test(before)) {
    return { index, length: 'await'.length };
  }
  return undefined;
}

function nextBraceDepth(depth, line) {
  let current = depth;
  for (const char of line) {
    if (char === '{') current += 1;
    else if (char === '}') current = Math.max(0, current - 1);
  }
  return current;
}

function unsupportedSurfaceRecord(entry, seen, lineStarts, kind, start, end) {
  const key = `${entry.sourcePath}\0${entry.stage}\0${kind}\0${start}\0${end}`;
  if (seen.has(key)) return undefined;
  seen.add(key);
  const location = lineColumnAt(lineStarts, start);
  return compactRecord({
    sourcePath: entry.sourcePath,
    stage: entry.stage,
    kind,
    ...focusedSurfaceRecordFields(kind),
    start,
    end,
    line: location.line,
    column: location.column,
    excerpt: excerptFor(entry.sourceText, start, end)
  });
}

function focusedSurfaceReview(evidenceKind, evidenceScope, evidenceSummary, proofGapCode, proofGapSummary, proofGapRoute = undefined) {
  return {
    boundedEvidence: {
      kind: evidenceKind,
      status: 'bounded-evidence-available',
      scope: evidenceScope,
      summary: evidenceSummary
    },
    remainingProofGap: compactRecord({
      code: proofGapCode,
      status: 'not-claimed',
      summary: proofGapSummary,
      ...(proofGapRoute ?? {})
    })
  };
}

function focusedSurfaceRecordFields(kind) {
  const review = focusedSurfaceReviews[kind] ?? focusedSurfaceReview(
    'unsupported-js-ts-surface-focused-evidence-unmapped',
    'unsupported-js-ts-surface-review',
    'No focused evidence descriptor is mapped for this observed surface.',
    'unsupported-js-ts-surface-proof-gap-not-claimed',
    'The remaining proof gap is unmapped and semantic equivalence remains unproved.'
  );
  return {
    observedSurfaceKind: kind,
    boundedEvidence: review.boundedEvidence,
    remainingProofGap: {
      ...review.remainingProofGap,
      proofClaim: false,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    },
    proofGapCode: review.remainingProofGap.code,
    reasonCode: review.remainingProofGap.code
  };
}

function sourceEntries(files = []) {
  return files.flatMap((file) => [
    sourceEntry(file, 'base', file.baseSourceText),
    sourceEntry(file, 'worker', file.workerSourceText),
    sourceEntry(file, 'head', file.headSourceText)
  ].filter(Boolean));
}

function resultEntries(fileResults = []) {
  return fileResults.map((file) => sourceEntry(file, 'output', file.outputSourceText)).filter(Boolean);
}

function sourceEntry(file, stage, sourceText) {
  return typeof sourceText === 'string'
    ? { sourcePath: file.sourcePath, stage, sourceText }
    : undefined;
}

function lineStartsFor(sourceText) {
  const starts = [0];
  for (let index = 0; index < sourceText.length; index += 1) {
    if (sourceText[index] === '\n') starts.push(index + 1);
  }
  return starts;
}

function lineColumnAt(lineStarts, offset) {
  let low = 0;
  let high = lineStarts.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (lineStarts[mid] <= offset) low = mid + 1;
    else high = mid - 1;
  }
  const lineIndex = Math.max(0, high);
  return { line: lineIndex + 1, column: offset - lineStarts[lineIndex] + 1 };
}

function excerptFor(sourceText, start, end) {
  const text = sourceText.slice(start, Math.min(sourceText.length, Math.max(end, start + 80)));
  return text.replace(/\s+/g, ' ').trim() || undefined;
}

function evidenceRecord(input) {
  return {
    id: `${input.id}_proof_${input.suffix}`,
    kind: 'js-ts-project-merge-proof-evidence',
    level: input.level,
    status: input.status,
    scope: input.scope,
    claimKind: input.claimKind ?? 'evidence',
    evidenceOnly: true,
    proofClaim: false,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    summary: input.summary,
    metadata: compactRecord({
      ...(input.metadata ?? {}),
      proofClaim: false,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    })
  };
}

function uniqueStrings(values) {
  return [...new Set((values ?? []).filter((value) => typeof value === 'string' && value.length > 0))];
}
function nonEmptyArray(value) { return Array.isArray(value) && value.length ? value : undefined; }

export { unsupportedJsTsSurfaceEvidence };
