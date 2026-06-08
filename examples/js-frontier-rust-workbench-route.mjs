export function routeExplanationSummary(plan, routes) {
  const missingEvidence = uniqueStrings(routes.flatMap((route) => route.missingEvidence));
  const blockers = uniqueStrings(routes.flatMap((route) => route.blockers));
  const review = uniqueStrings(routes.flatMap((route) => route.review));
  const readiness = aggregateReadiness(routes.map((route) => route.semanticMerge.readiness));
  const routeScores = routes.map((route) => route.semanticMerge.score).filter((score) => Number.isFinite(score));
  return {
    kind: 'frontier.workbench.routeExplanation',
    version: 1,
    planId: plan.id,
    summary: {
      routes: routes.length,
      targetAdapterRoutes: plan.summary.targetAdapterRoutes,
      missingEvidence: missingEvidence.length,
      blockers: blockers.length,
      reviewReasons: review.length,
      autoMergeClaims: plan.summary.autoMergeClaims,
      semanticEquivalenceClaims: plan.summary.semanticEquivalenceClaims
    },
    semanticMerge: {
      readiness,
      ready: readiness === 'ready' && missingEvidence.length === 0 && blockers.length === 0,
      admissionAction: aggregateAdmissionAction(routes.map((route) => route.semanticMerge.admissionAction)),
      score: routeScores.length ? Math.min(...routeScores) : 0,
      risk: aggregateRisk(routes.map((route) => route.semanticMerge.risk)),
      missingEvidence,
      missingEvidenceDetails: missingEvidence.map(evidenceGapDetail),
      blockers,
      review,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    },
    routes
  };
}

export function explainRoute(route, context) {
  const missingEvidence = routeMissingEvidence(route, context.projection);
  const semanticReadiness = routeSemanticMergeReadiness(route, missingEvidence);
  const semanticAdmissionAction = routeSemanticAdmissionAction(route, semanticReadiness, missingEvidence);
  return {
    id: route?.id ?? `conversion_${context.sourceLanguage}_to_${context.target}`,
    sourceLanguage: route?.sourceLanguage ?? context.sourceLanguage,
    target: route?.target ?? context.target,
    mode: route?.mode ?? 'blocked',
    routeAction: route?.routeAction ?? 'blocked',
    readiness: route?.readiness ?? 'blocked',
    priority: route?.priority ?? 'blocker',
    adapter: route?.adapter,
    adapterKind: route?.adapterKind,
    targetPath: context.projection?.targetPath,
    missingEvidence,
    missingEvidenceDetails: missingEvidence.map(evidenceGapDetail),
    blockers: route?.blockers ?? ['No conversion route was planned.'],
    review: route?.review ?? [],
    evidence: {
      imports: route?.evidence?.imports ?? 0,
      importReadiness: route?.evidence?.importReadiness,
      symbols: route?.evidence?.symbols ?? 0,
      sourceMapMappings: route?.evidence?.sourceMapMappings ?? 0,
      parserRows: route?.evidence?.parserRows ?? 0,
      mergeReadyParsers: route?.evidence?.mergeReadyParsers ?? 0,
      targetSupported: route?.evidence?.targetSupported === true,
      targetAdapter: route?.evidence?.targetAdapter ?? route?.adapter,
      projectionEvidenceIds: (context.projection?.evidence ?? []).map((record) => record.id).filter(Boolean)
    },
    semanticMerge: {
      readiness: semanticReadiness,
      score: route?.mergeScore?.value ?? 0,
      risk: routeSemanticRisk(route, semanticReadiness),
      admissionAction: semanticAdmissionAction,
      penalties: uniqueStrings([
        ...(route?.mergeScore?.penalties ?? []),
        ...missingEvidence.map((key) => `Missing evidence: ${key}`)
      ]).slice(0, 6),
      autoMergeClaim: route?.autoMergeClaim === true,
      semanticEquivalenceClaim: route?.semanticEquivalenceClaim === true
    },
    explanation: routeExplanationText(route, missingEvidence, semanticReadiness)
  };
}

function routeMissingEvidence(route, projection) {
  const missing = new Set(route?.missingEvidence ?? []);
  if ((route?.evidence?.mergeReadyParsers ?? 0) === 0) missing.add('merge-ready-parser');
  if (!hasProofEvidence(projection?.evidence ?? [])) missing.add('proof-or-replay-evidence');
  if (!hasRuntimeAdapterEvidence(projection?.evidence ?? [])) missing.add('runtime-adapter-evidence');
  return [...missing].sort();
}

function routeExplanationText(route, missingEvidence, semanticReadiness) {
  if (!route) return 'No conversion route was planned for this target.';
  const adapter = route.adapter ? ` through ${route.adapter}` : '';
  const evidence = missingEvidence.length ? ` missing ${missingEvidence.join(', ')}` : ' with required evidence attached';
  return `${route.sourceLanguage} -> ${route.target} uses ${route.mode}${adapter}; semantic merge readiness is ${semanticReadiness}${evidence}.`;
}

function evidenceGapDetail(key) {
  const details = {
    'merge-ready-parser': {
      key,
      label: 'Merge-ready parser evidence',
      status: 'missing',
      summary: 'Attach exact parser, source range, token/trivia, and feature coverage evidence before merge admission.'
    },
    'proof-or-replay-evidence': {
      key,
      label: 'Proof or replay evidence',
      status: 'missing',
      summary: 'Attach proof, oracle, replay, or behavior test evidence for the projected route.'
    },
    'runtime-adapter-evidence': {
      key,
      label: 'Runtime adapter evidence',
      status: 'missing',
      summary: 'Attach runtime adapter evidence for imports, effects, host APIs, package modules, and target runtime shims.'
    },
    'source-preservation-hash': {
      key,
      label: 'Source preservation hash',
      status: 'missing',
      summary: 'Attach exact source preservation evidence so source text can be traced to merge candidates.'
    },
    'target-adapter': {
      key,
      label: 'Target adapter',
      status: 'missing',
      summary: 'Add a source-to-target projection adapter for emitted target code.'
    },
    'target-adapter-evidence': {
      key,
      label: 'Target adapter evidence',
      status: 'missing',
      summary: 'Attach run evidence from the host-owned target projection adapter.'
    }
  };
  return details[key] ?? { key, label: key, status: 'missing', summary: 'Attach route evidence before merge admission.' };
}

function hasProofEvidence(evidence) {
  return evidence.some((record) => /proof|oracle|replay|behavior|test|verification/.test(String(record.kind ?? record.metadata?.kind ?? record.type ?? '')));
}

function hasRuntimeAdapterEvidence(evidence) {
  return evidence.some((record) => {
    const capabilities = record.metadata?.capabilities ?? [];
    return record.metadata?.runtimeAdapterEvidence === true
      || capabilities.includes('runtime-adapter')
      || /runtime/.test(String(record.kind ?? record.metadata?.kind ?? record.type ?? ''));
  });
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))];
}

function aggregateReadiness(values) {
  const rank = { ready: 0, 'ready-with-losses': 1, 'needs-review': 2, blocked: 3 };
  return values.reduce((current, value) => (rank[value] ?? 3) > (rank[current] ?? 3) ? value : current, 'ready');
}

function routeSemanticMergeReadiness(route, missingEvidence) {
  const base = route?.mergeScore?.readiness ?? route?.readiness ?? 'blocked';
  if (!missingEvidence.length || base === 'blocked') return base;
  return aggregateReadiness([base, 'needs-review']);
}

function routeSemanticAdmissionAction(route, readiness, missingEvidence) {
  if ((route?.mergeScore?.action ?? route?.admissionAction) === 'reject' || readiness === 'blocked') return 'reject';
  if (readiness === 'ready' && missingEvidence.length === 0) return route?.mergeScore?.action ?? 'admit';
  return 'prioritize';
}

function routeSemanticRisk(route, readiness) {
  if (readiness === 'blocked') return 'high';
  if (readiness === 'needs-review') return 'medium';
  return route?.mergeScore?.risk ?? 'low';
}

function aggregateAdmissionAction(values) {
  if (values.includes('reject')) return 'reject';
  if (values.includes('prioritize')) return 'prioritize';
  return values[0] ?? 'prioritize';
}

function aggregateRisk(values) {
  if (values.includes('high')) return 'high';
  if (values.includes('medium')) return 'medium';
  return values[0] ?? 'low';
}
