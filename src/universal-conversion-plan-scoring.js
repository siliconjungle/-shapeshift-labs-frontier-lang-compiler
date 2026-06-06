import { uniqueStrings } from './native-import-utils.js';

const readinessScore = Object.freeze({ ready: 100, 'ready-with-losses': 76, 'needs-review': 48, blocked: 0 });
const readinessRank = Object.freeze({ ready: 3, 'ready-with-losses': 2, 'needs-review': 1, blocked: 0 });
const actionRank = Object.freeze({ admit: 2, prioritize: 1, reject: 0 });
const modeRank = Object.freeze({
  'preserve-source': 5,
  'target-adapter': 4,
  'stub-only': 3,
  'semantic-index-only': 2,
  blocked: 0
});
const componentWeights = Object.freeze({
  importEvidence: 22,
  parserEvidence: 18,
  semanticIndex: 18,
  projectionPath: 24,
  proofEvidence: 18
});

export function conversionScoreComponents(language, targetCell, readiness, mode, evidence) {
  return {
    importEvidence: scoreComponent('importEvidence', readinessScore[language.imports.readiness] ?? 48, [
      ...(language.imports.total ? [] : ['No source import evidence.']),
      ...(language.imports.readiness === 'ready' ? [] : [`Import readiness is ${language.imports.readiness}.`])
    ], { imports: language.imports.total, losses: language.imports.losses }),
    parserEvidence: scoreComponent('parserEvidence', parserScore(language), [
      ...(language.parser.rows ? [] : ['No parser feature row matched this language.']),
      ...(language.parser.blockingFeatures ?? []).map((feature) => `Parser feature is blocked: ${feature}.`)
    ], { rows: language.parser.rows, mergeReadyParsers: language.parser.mergeReadyParsers.length }),
    semanticIndex: scoreComponent('semanticIndex', semanticIndexScore(language), [
      ...(language.imports.symbols ? [] : ['No semantic symbols were imported.']),
      ...(language.imports.sourceMapMappings ? [] : ['No source-map mappings were imported.'])
    ], { symbols: language.imports.symbols, sourceMapMappings: language.imports.sourceMapMappings }),
    projectionPath: scoreComponent('projectionPath', projectionPathScore(targetCell, mode, readiness), projectionPathReasons(targetCell, mode), {
      mode,
      lossClass: targetCell?.lossClass,
      adapter: targetCell?.adapter,
      readiness
    }),
    proofEvidence: scoreComponent('proofEvidence', proofEvidenceScore(evidence), proofEvidenceReasons(evidence), {
      records: evidence.length,
      passed: evidence.filter((record) => passedEvidence(record)).length,
      failed: evidence.filter((record) => record?.status === 'failed').length
    })
  };
}

export function conversionMergeScore(input) {
  const weighted = Object.values(input.components).reduce((sum, component) => sum + component.weightedScore, 0);
  const weight = Object.values(input.components).reduce((sum, component) => sum + component.weight, 0);
  const uncappedValue = Math.round(weight ? weighted * 100 / weight : 0);
  const action = input.blockers.length || input.readiness === 'blocked' || input.mode === 'blocked' ? 'reject'
    : input.readiness === 'ready' && input.mode !== 'stub-only' && input.mode !== 'semantic-index-only' ? 'admit'
      : 'prioritize';
  const value = action === 'reject' ? Math.min(35, uncappedValue) : uncappedValue;
  return {
    schema: 'frontier.lang.semanticMergeScore.v1',
    version: 1,
    value,
    uncappedValue,
    sortKey: value + (actionRank[action] ?? 0) * 1000 + (modeRank[input.mode] ?? 0) * 100 + (readinessRank[input.readiness] ?? 0) * 10,
    higherIsBetter: true,
    readiness: input.readiness,
    risk: input.readiness === 'blocked' ? 'high' : input.readiness === 'needs-review' ? 'medium' : 'low',
    action,
    components: input.components,
    penalties: uniqueStrings([
      ...(action === 'reject' ? ['Conversion route is rejected until blockers are resolved.'] : []),
      ...Object.values(input.components).flatMap((component) => component.score < 100 ? component.reasons : [])
    ])
  };
}

function parserScore(language) {
  if (!language.parser.rows) return 0;
  return Math.min(100, (readinessScore[language.parser.readiness] ?? 48) + Math.min(16, language.parser.mergeReadyParsers.length * 8));
}

function semanticIndexScore(language) {
  const symbols = language.imports.symbols ?? 0;
  const mappings = language.imports.sourceMapMappings ?? 0;
  if (!symbols) return 0;
  return Math.min(100, 62 + Math.min(22, symbols * 3) + Math.min(16, mappings * 2));
}

function projectionPathScore(targetCell, mode, readiness) {
  if (mode === 'blocked') return 0;
  if (mode === 'preserve-source') return 92;
  if (mode === 'target-adapter') return Math.min(92, (readinessScore[readiness] ?? 48) + (targetCell?.adapter ? 12 : 0));
  if (mode === 'stub-only') return 44;
  if (mode === 'semantic-index-only') return 30;
  return 10;
}

function proofEvidenceScore(evidence) {
  if (!evidence.length) return 45;
  const passed = evidence.filter((record) => passedEvidence(record)).length;
  const failed = evidence.filter((record) => record?.status === 'failed').length;
  return Math.max(0, Math.min(100, 55 + passed * 12 - failed * 35));
}

function projectionPathReasons(targetCell, mode) {
  return uniqueStrings([
    ...(targetCell?.reason ? [targetCell.reason] : []),
    ...(mode === 'blocked' ? ['Projection path is blocked.'] : []),
    ...(mode === 'semantic-index-only' ? ['Semantic index can guide review, but code emission needs a target adapter.'] : [])
  ]);
}

function proofEvidenceReasons(evidence) {
  return uniqueStrings([
    ...(!evidence.length ? ['No proof, oracle, test, or replay evidence was attached to this conversion route.'] : []),
    ...(evidence.filter((record) => record?.status === 'failed').length ? ['At least one attached evidence record failed.'] : [])
  ]);
}

function scoreComponent(key, score, reasons, signals) {
  const normalized = Math.max(0, Math.min(100, Math.round(score)));
  const weight = componentWeights[key];
  return {
    key,
    score: normalized,
    weight,
    weightedScore: normalized * weight / 100,
    status: normalized >= 80 ? 'strong' : normalized >= 50 ? 'partial' : normalized > 0 ? 'weak' : 'blocked',
    reasons: uniqueStrings(reasons),
    signals
  };
}

function passedEvidence(record) {
  return record?.status === 'passed' || record?.status === 'ok' || record?.status === 'success';
}
