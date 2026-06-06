import {
  uniqueStrings
} from './native-import-utils.js';
import {
  NativeParserFeatureCoverageStatuses
} from './coverage-matrix-profiles.js';

const nativeParserMacroMetaprogrammingLossKinds = new Set([
  'macroExpansion',
  'macroHygiene',
  'preprocessor',
  'conditionalCompilation',
  'metaprogramming',
  'reflection',
  'generatedCode'
]);

const nativeParserTypeCoverageLossKinds = new Set([
  'typeInference',
  'overloadResolution',
  'overloadTypeInference',
  'unsupportedSemantic'
]);

export function nativeParserSyntaxFeature(context) {
  const blockingSyntaxLosses = context.losses.filter((loss) => loss.severity === 'error' && (loss.kind === 'unsupportedSyntax' || loss.kind === 'parserDiagnostic'));
  const exactAst = context.adapterCoverage.effective.exactAst ?? 0;
  const sourceRanges = context.adapterCoverage.effective.sourceRanges ?? 0;
  const parserDiagnostics = context.adapterCoverage.effective.parserDiagnostics ?? 0;
  let status = 'missing';
  const reasons = [];
  if (blockingSyntaxLosses.length) {
    status = 'blocked';
    reasons.push('Parser diagnostics or unsupported syntax errors block syntax coverage.');
  } else if (exactAst > 0 && (sourceRanges > 0 || context.sourceMapMappings > 0)) {
    status = 'full';
    reasons.push('Exact parser AST and source-range evidence are available.');
  } else if (exactAst > 0 || sourceRanges > 0 || context.nativeAstNodes > 1 || context.sourceMapMappings > 0) {
    status = 'partial';
    reasons.push('Syntax evidence exists, but exact AST/source-range coverage is incomplete.');
  } else if (context.adapters.length || context.parserProfile) {
    status = 'evidence-required';
    reasons.push('Parser slot is declared, but no observed syntax import evidence is attached.');
  } else {
    reasons.push('No syntax parser coverage is declared or observed.');
  }
  return nativeParserFeatureCoverage('syntax', status, {
    capabilities: {
      exactAst,
      sourceRanges,
      parserDiagnostics,
      nativeAstNodes: context.nativeAstNodes,
      sourceMapMappings: context.sourceMapMappings
    },
    gaps: nativeParserFeatureCapabilityGaps(context.adapterCoverage, ['exactAst', 'sourceRanges', 'parserDiagnostics']),
    lossKinds: nativeParserFeatureLossKindCounts(context.losses, ['unsupportedSyntax', 'parserDiagnostic']),
    reasons,
    notes: ['Syntax coverage covers parser AST/CST structure, diagnostics, source ranges, and source-map anchors.']
  });
}

export function nativeParserSemanticFeature(context) {
  const declarations = (context.adapterCoverage.effective.semanticDeclarations ?? 0) + context.semanticEvidence.declarations;
  const symbols = (context.adapterCoverage.effective.semanticSymbols ?? 0) + context.semanticEvidence.symbols;
  let status = 'missing';
  const reasons = [];
  if (symbols > 0 && declarations > 0) {
    status = 'full';
    reasons.push('Declaration and symbol evidence are available.');
  } else if (symbols > 0 || declarations > 0 || context.nativeAstNodes > 1) {
    status = 'partial';
    reasons.push('Semantic evidence is present, but declaration/symbol coverage is incomplete.');
  } else if (context.adapters.length || context.imports.length) {
    status = 'evidence-required';
    reasons.push('Import evidence exists, but no semantic declarations or symbols were observed.');
  } else {
    reasons.push('No semantic index evidence is declared or observed.');
  }
  return nativeParserFeatureCoverage('semantic', status, {
    capabilities: {
      declarations,
      symbols,
      semanticIndexLevel: nativeParserFeatureSemanticLevel(context.adapterCoverage, context.semanticEvidence)
    },
    gaps: nativeParserFeatureCapabilityGaps(context.adapterCoverage, ['semanticDeclarations', 'semanticSymbols']),
    lossKinds: nativeParserFeatureLossKindCounts(context.losses, ['partialSemanticIndex', 'unsupportedSemantic']),
    reasons,
    notes: ['Semantic coverage covers declaration and symbol evidence. References, types, and control flow are reported separately.']
  });
}

export function nativeParserTypeFeature(context) {
  const types = (context.adapterCoverage.effective.types ?? 0) + context.semanticEvidence.types;
  const typeLossKinds = nativeParserFeaturePresentLossKinds(context, nativeParserTypeCoverageLossKinds);
  let status = 'missing';
  const reasons = [];
  if (types > 0) {
    status = 'full';
    reasons.push('Resolved or declared type evidence is available.');
  } else if (typeLossKinds.length > 0 || context.semanticEvidence.symbols > 0) {
    status = 'evidence-required';
    reasons.push('Type-sensitive coverage needs compiler or language-server evidence.');
  } else {
    reasons.push('No type evidence is declared or observed.');
  }
  return nativeParserFeatureCoverage('type', status, {
    capabilities: { types },
    gaps: nativeParserFeatureCapabilityGaps(context.adapterCoverage, ['types']),
    lossKinds: nativeParserFeatureLossKindCounts(context.losses, [...nativeParserTypeCoverageLossKinds]),
    reasons,
    notes: ['Type coverage covers declared/inferred type facts and overload or inference evidence.']
  });
}

export function nativeParserControlFlowFeature(context) {
  const controlFlow = (context.adapterCoverage.effective.controlFlow ?? 0) + context.semanticEvidence.controlFlow;
  let status = 'missing';
  const reasons = [];
  if (controlFlow > 0) {
    status = 'full';
    reasons.push('Control-flow or CFG evidence is available.');
  } else if (context.imports.length || context.adapters.length) {
    status = 'evidence-required';
    reasons.push('Control-flow evidence was not observed for this parser row.');
  } else {
    reasons.push('No control-flow evidence is declared or observed.');
  }
  return nativeParserFeatureCoverage('controlFlow', status, {
    capabilities: { controlFlow },
    gaps: nativeParserFeatureCapabilityGaps(context.adapterCoverage, ['controlFlow']),
    lossKinds: {},
    reasons,
    notes: ['Control-flow coverage covers call/branch/CFG facts supplied by host parsers or semantic indexers.']
  });
}

export function nativeParserMacroMetaprogrammingFeature(context, dependencies = {}) {
  const macroLossKinds = nativeParserFeaturePresentLossKinds(context, nativeParserMacroMetaprogrammingLossKinds);
  const macroLosses = context.losses.filter((loss) => nativeParserMacroMetaprogrammingLossKinds.has(loss.kind));
  const featureEvidence = dependencies.summarizeNativeImportFeatureEvidence(macroLosses, { evidence: context.evidence });
  const generatedRanges = context.adapterCoverage.effective.generatedRanges ?? 0;
  let status = 'not-applicable';
  const reasons = [];
  if (!macroLossKinds.length) {
    reasons.push('No macro, preprocessor, generator, or metaprogramming coverage risk is declared for this parser row.');
  } else if (macroLosses.some((loss) => loss.severity === 'error')) {
    status = 'blocked';
    reasons.push('Macro or metaprogramming evidence includes blocking loss records.');
  } else if (featureEvidence.missingRequiredEvidence.length > 0 || generatedRanges === 0) {
    status = 'evidence-required';
    reasons.push('Macro/metaprogramming coverage requires generated-range and policy evidence before merge admission.');
  } else {
    status = 'partial';
    reasons.push('Macro/metaprogramming risk has attached evidence, but this facade still treats generated behavior as review-required.');
  }
  return nativeParserFeatureCoverage('macroMetaprogramming', status, {
    capabilities: {
      generatedRanges,
      policyKinds: featureEvidence.policyKinds,
      highestRisk: featureEvidence.highestRisk
    },
    gaps: nativeParserFeatureCapabilityGaps(context.adapterCoverage, ['generatedRanges']),
    lossKinds: nativeParserFeatureLossKindCounts(context.losses, [...nativeParserMacroMetaprogrammingLossKinds]),
    reasons: uniqueStrings([...reasons, ...featureEvidence.reasons]),
    notes: ['Macro/metaprogramming coverage covers macros, preprocessors, generated code, reflection, and conditional compilation evidence.']
  });
}

export function nativeParserSourcePreservationFeature(context) {
  const exactSource = context.sourcePreservation.exactSourceAvailable;
  const tokens = context.sourcePreservation.tokens + (context.adapterCoverage.effective.tokens ?? 0);
  const trivia = context.sourcePreservation.trivia + (context.adapterCoverage.effective.trivia ?? 0);
  const sourceRanges = context.adapterCoverage.effective.sourceRanges ?? 0;
  let status = 'missing';
  const reasons = [];
  if (exactSource > 0 && (tokens > 0 || trivia > 0 || sourceRanges > 0)) {
    status = 'full';
    reasons.push('Exact source text and token/trivia or source-range evidence are available.');
  } else if (exactSource > 0 || tokens > 0 || trivia > 0 || sourceRanges > 0) {
    status = 'partial';
    reasons.push('Source-preservation evidence exists, but exact source, tokens, trivia, or ranges are incomplete.');
  } else if (context.imports.length || context.adapters.length) {
    status = 'evidence-required';
    reasons.push('Import or adapter evidence exists, but no exact source-preservation record was observed.');
  } else {
    reasons.push('No source-preservation evidence is declared or observed.');
  }
  return nativeParserFeatureCoverage('sourcePreservation', status, {
    capabilities: {
      exactSourceAvailable: exactSource,
      tokens,
      trivia,
      comments: context.sourcePreservation.comments,
      whitespace: context.sourcePreservation.whitespace,
      directives: context.sourcePreservation.directives,
      sourceRanges
    },
    gaps: nativeParserFeatureCapabilityGaps(context.adapterCoverage, ['tokens', 'trivia', 'sourceRanges']),
    lossKinds: nativeParserFeatureLossKindCounts(context.losses, ['sourcePreservation', 'commentsTrivia', 'sourceMapApproximation']),
    reasons,
    notes: ['Source-preservation coverage covers exact source text, token/trivia retention, comments, whitespace, directives, and source ranges.']
  });
}

function nativeParserFeatureCoverage(category, status, input = {}) {
  const normalizedStatus = NativeParserFeatureCoverageStatuses.includes(status) ? status : 'missing';
  return Object.freeze({
    category,
    status: normalizedStatus,
    readiness: nativeParserFeatureReadinessForStatus(normalizedStatus),
    mergeReady: nativeParserFeatureStatusMergeReady(normalizedStatus),
    supported: normalizedStatus === 'full' || normalizedStatus === 'partial' || normalizedStatus === 'not-applicable',
    capabilities: Object.freeze(input.capabilities ?? {}),
    gaps: Object.freeze(uniqueStrings(input.gaps ?? [])),
    lossKinds: Object.freeze(input.lossKinds ?? {}),
    reasons: Object.freeze(uniqueStrings(input.reasons ?? [])),
    notes: Object.freeze(uniqueStrings(input.notes ?? []))
  });
}

function nativeParserFeatureReadinessForStatus(status) {
  if (status === 'full' || status === 'not-applicable') return 'ready';
  if (status === 'partial') return 'ready-with-losses';
  if (status === 'blocked') return 'blocked';
  return 'needs-review';
}

export function nativeParserFeatureStatusMergeReady(status) {
  return status === 'full' || status === 'not-applicable';
}

function nativeParserFeatureSemanticLevel(adapterCoverage, semanticEvidence) {
  if ((adapterCoverage.effective.types ?? 0) > 0 || (adapterCoverage.effective.controlFlow ?? 0) > 0 || semanticEvidence.types > 0 || semanticEvidence.controlFlow > 0 || semanticEvidence.references > 0) {
    return 'semantic-index';
  }
  if ((adapterCoverage.effective.semanticDeclarations ?? 0) > 0 || (adapterCoverage.effective.semanticSymbols ?? 0) > 0 || semanticEvidence.declarations > 0 || semanticEvidence.symbols > 0) {
    return 'declaration-index';
  }
  return 'native-ast';
}

function nativeParserFeatureCapabilityGaps(adapterCoverage, capabilities) {
  const gaps = new Set();
  for (const capability of capabilities) {
    if ((adapterCoverage.effective?.[capability] ?? 0) === 0) gaps.add(capability);
  }
  for (const capability of Object.keys(adapterCoverage.gaps ?? {})) {
    if (capabilities.includes(capability)) gaps.add(capability);
  }
  return [...gaps];
}

function nativeParserFeatureLossKindCounts(losses, kinds) {
  const wanted = new Set(kinds);
  const counts = {};
  for (const loss of losses) {
    if (!wanted.has(loss?.kind)) continue;
    counts[loss.kind] = (counts[loss.kind] ?? 0) + 1;
  }
  return counts;
}

function nativeParserFeaturePresentLossKinds(context, kindSet) {
  return uniqueStrings([
    ...(context.profile.knownLossKinds ?? []),
    ...Object.keys(context.lossSummary.byKind ?? {})
  ].filter((kind) => kindSet.has(kind)));
}
