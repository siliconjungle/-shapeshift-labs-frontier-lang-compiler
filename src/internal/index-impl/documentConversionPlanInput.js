const CONSTRAINT_ARRAY_FIELDS = [
  'resourceTransfers',
  'lifetimeConstraints',
  'controlFlowConstraints',
  'callableBoundaryConstraints',
  'adtPatternConstraints',
  'borrowScopeConstraints',
  'borrowCheckerConstraints',
  'dataLayoutConstraints',
  'effectConstraints',
  'concurrencyModelConstraints',
  'errorModelConstraints',
  'evaluationModelConstraints',
  'hostEnvironmentConstraints',
  'memoryModelConstraints',
  'metaprogrammingConstraints',
  'scopeBindingConstraints',
  'moduleConstraints',
  'numericSemanticsConstraints',
  'textSemanticsConstraints',
  'collectionSemanticsConstraints',
  'serializationSemanticsConstraints',
  'dependencySemanticsConstraints',
  'objectModelConstraints',
  'protocolConstraints',
  'typeConstraints'
];

export function mergeDocumentConversionPlanInput(input = {}) {
  const authored = input.document?.metadata?.universalConversionPlan;
  const resourceGraphs = authoredResourceGraphs(input.document);
  const interlinguaRecords = authoredInterlinguaRecords(input.document);
  const dialectRegistry = authoredDialectRegistry(input.document);
  const runtimeCapabilities = authoredRuntimeCapabilities(input.document);
  if ((!authored || typeof authored !== 'object') && !resourceGraphs.length && !interlinguaRecords.length && !dialectRegistry && !runtimeCapabilities) return input;
  const merged = authored && typeof authored === 'object' ? { ...authored, ...input } : { ...input };
  if (input.targets === undefined && authored?.targets) merged.targets = authored.targets;
  if (dialectRegistry && input.universalDialectRegistry === undefined) merged.universalDialectRegistry = dialectRegistry;
  const authoredDialects = [...(authored?.dialects ?? []), ...(dialectRegistry?.dialects ?? [])];
  const authoredExterns = [...(authored?.externs ?? []), ...(dialectRegistry?.externs ?? [])];
  if (authoredDialects.length || input.dialects?.length) {
    merged.dialects = uniqueRecords([...authoredDialects, ...(input.dialects ?? [])]);
  }
  if (authoredExterns.length || input.externs?.length) {
    merged.externs = uniqueRecords([...authoredExterns, ...(input.externs ?? [])]);
  }
  if (resourceGraphs.length) {
    merged.imports = uniqueRecords([
      ...resourceGraphs.map((graph) => resourceGraphImport(graph, authored)),
      ...(input.imports ?? [])
    ]);
  }
  if (interlinguaRecords.length) {
    merged.interlinguaRecords = uniqueRecords([
      ...interlinguaRecords,
      ...(input.interlinguaRecords ?? []),
      ...(input.universalInterlinguaRecords ?? [])
    ]);
  }
  if (runtimeCapabilities) {
    mergeAuthoredRuntimeCapabilities(merged, input, runtimeCapabilities);
  }
  for (const field of CONSTRAINT_ARRAY_FIELDS) {
    const authoredValues = aggregateAuthoredRouteConstraints(authored?.[field] ?? []);
    const inputValues = input[field] ?? [];
    if (authoredValues.length || inputValues.length) merged[field] = [...authoredValues, ...inputValues];
  }
  return merged;
}

function authoredResourceGraphs(document) {
  const graphs = document?.metadata?.semanticResourceGraphs;
  return [...(graphs?.graphs ?? []), ...(graphs?.resourceGraphs ?? [])].filter(Boolean);
}

function authoredInterlinguaRecords(document) {
  const interlingua = document?.metadata?.universalInterlingua;
  return [...(interlingua?.interlinguaRecords ?? []), ...(interlingua?.records ?? []).filter((record) => record?.kind === 'frontier.lang.universalInterlinguaRecord')].filter(Boolean);
}

function authoredDialectRegistry(document) {
  const registry = document?.metadata?.dialects;
  return registry && typeof registry === 'object' ? registry : undefined;
}

function authoredRuntimeCapabilities(document) {
  const runtime = document?.metadata?.runtimeCapabilities;
  return runtime && typeof runtime === 'object' ? runtime : undefined;
}

function mergeAuthoredRuntimeCapabilities(merged, input, runtime) {
  if (input.universalRuntimeCapabilityMatrix === undefined && runtime.universalRuntimeCapabilityMatrix?.kind === 'frontier.lang.universalRuntimeCapabilityMatrix') {
    merged.universalRuntimeCapabilityMatrix = runtime.universalRuntimeCapabilityMatrix;
  }
  merged.hostProfiles = uniqueRecords([
    ...(runtime.hostProfiles ?? []),
    ...(input.hostProfiles ?? [])
  ]);
  merged.sourceHosts = uniqueHostSelectors([
    ...(runtime.sourceHosts ?? []),
    ...(input.sourceHosts ?? [])
  ]);
  merged.targetHosts = uniqueHostSelectors([
    ...(runtime.targetHosts ?? []),
    ...(input.targetHosts ?? [])
  ]);
  merged.hostCapabilities = uniqueRecords([
    ...(runtime.hostCapabilities ?? []),
    ...(input.hostCapabilities ?? [])
  ]);
  merged.hostBindings = uniqueRecords([
    ...(runtime.hostBindings ?? []),
    ...(input.hostBindings ?? [])
  ]);
  merged.runtimeRequirements = uniqueRecords([
    ...(merged.runtimeRequirements ?? []),
    ...(runtime.runtimeRequirements ?? []),
    ...(input.runtimeRequirements ?? [])
  ]);
  merged.evidence = uniqueRecords([
    ...(runtime.evidence ?? []),
    ...(input.evidence ?? [])
  ]);
  merged.authoredRuntimeCapabilities = runtime;
}

function resourceGraphImport(graph = {}, authored = {}) {
  return {
    id: `authored_resource_graph_import_${graph.id ?? graph.sourcePath ?? 'source'}`,
    language: graph.sourceLanguage ?? authored?.sourceLanguage,
    sourcePath: graph.sourcePath,
    sourceHash: graph.sourceHash,
    resourceGraph: graph,
    semanticResourceGraph: graph,
    evidence: (graph.evidenceIds ?? []).map((id) => ({ id, kind: 'resource-graph-evidence', status: 'referenced' })),
    metadata: { authoredFrontierResourceGraph: true, resourceGraph: graph }
  };
}

function aggregateAuthoredRouteConstraints(records = []) {
  const groups = new Map();
  for (const record of records) {
    const key = routeConstraintKey(record);
    const current = groups.get(key) ?? {};
    mergeRecordInto(current, record);
    groups.set(key, current);
  }
  return [...groups.values()];
}

function routeConstraintKey(record = {}) {
  return [
    record.sourceLanguage ?? '',
    record.target ?? '',
    record.routeId ?? '',
    record.mode ?? '',
    record.metadata?.authoredConversionBlockId ?? ''
  ].join('\0');
}

function mergeRecordInto(target, record = {}) {
  for (const [key, value] of Object.entries(record)) {
    if (Array.isArray(value)) target[key] = uniqueRecords([...(target[key] ?? []), ...value]);
    else if (key === 'metadata') target.metadata = { ...(target.metadata ?? {}), ...value };
    else if (target[key] === undefined) target[key] = value;
  }
}

function uniqueRecords(values) {
  const seen = new Set();
  return values.filter((value) => {
    const key = value && typeof value === 'object' ? value.id ?? JSON.stringify(value) : String(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueHostSelectors(values) {
  const seen = new Set();
  return values.filter((value) => {
    const key = value && typeof value === 'object' ? value.id ?? JSON.stringify(value) : String(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
