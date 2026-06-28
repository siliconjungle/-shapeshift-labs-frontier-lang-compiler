const RealRepoCorpusSurfaceRoutes = Object.freeze({
  imports: matrixSurfaceRoute(['module-export-import'], ['module-export-import-graph']),
  'type-only-imports': matrixSurfaceRoute(['module-export-import'], ['module-export-import-graph']),
  'value-import-dependencies': matrixSurfaceRoute(['module-export-import'], ['module-export-import-graph']),
  'import-specifier-order': matrixSurfaceRoute(['module-export-import'], ['module-export-import-graph']),
  'import-shape-additions': matrixSurfaceRoute(['module-export-import'], ['module-export-import-graph']),
  'new-import-declarations': matrixSurfaceRoute(['module-export-import'], ['module-export-import-graph']),
  exports: matrixSurfaceRoute(['module-export-import'], ['module-export-import-graph']),
  'type-aliases': matrixSurfaceRoute(['type-public-api'], ['type-public-api-graph']),
  'type-interface-members': matrixSurfaceRoute(['type-public-api'], ['type-public-api-graph']),
  overloads: matrixSurfaceRoute(['type-public-api'], ['type-public-api-graph']),
  'exported-types': matrixSurfaceRoute(['type-public-api'], ['type-public-api-graph']),
  'dependency-sensitive-edits': matrixSurfaceRoute(['type-public-api'], ['type-public-api-graph']),
  'tsx-jsx-child-additions': matrixSurfaceRoute(['jsx-tsx-element-prop'], ['jsx-tsx-element-prop-graph']),
  'tsx-jsx-child-expressions': matrixSurfaceRoute(['jsx-tsx-element-prop'], ['jsx-tsx-element-prop-graph']),
  'jsx-component-prop-contracts': matrixSurfaceRoute(['jsx-tsx-element-prop'], ['jsx-tsx-element-prop-graph']),
  'tsx-jsx-attributes': matrixSurfaceRoute(['jsx-tsx-element-prop'], ['jsx-tsx-element-prop-graph']),
  'tsx-jsx-expressions': matrixSurfaceRoute(['jsx-tsx-element-prop'], ['jsx-tsx-element-prop-graph']),
  'control-flow': matrixSurfaceRoute(['control-flow-effect'], ['control-flow-effect-graph']),
  'async-components': matrixSurfaceRoute(['control-flow-effect'], ['control-flow-effect-graph']),
  'import-meta-host-context': matrixSurfaceRoute(['control-flow-effect'], ['control-flow-effect-graph']),
  'comments-trivia': matrixSurfaceRoute(['parser-source-span-trivia'], ['parser-source-span-trivia']),
  'generated-source-map-boundary': matrixSurfaceRoute(['parser-source-span-trivia'], ['parser-source-span-trivia']),
  'object-members': failClosedSurfaceRoute({
    routeId: 'parse-ledger',
    routeLane: 'js-ts-safe-member-merge',
    routeNext: 'reject-object-member-region-unless-a-non-semantic-safe-region-kind-is-declared',
    gateId: 'parse-ledger',
    reasonCode: 'invalid-input',
    conflictCode: 'invalid-input',
    fixtureId: 'unsafe-order-sensitive-member-region',
    fixtureReason: 'object-region-kind-not-safe-listed',
    expectedAdmissionStatus: 'blocked'
  }),
  'order-sensitive-member-regions': failClosedSurfaceRoute({
    routeId: 'preserve-base-order',
    routeLane: 'js-ts-safe-member-merge',
    routeNext: 'reject-order-sensitive-member-region-or-supply-order-preserving-evidence',
    gateId: 'preserve-base-order',
    reasonCode: 'order-sensitive-region-kind',
    conflictCode: 'top-level-order-changed',
    fixtureId: 'unsafe-order-sensitive-member-region',
    fixtureReason: 'order-sensitive-region-kind:route',
    expectedAdmissionStatus: 'blocked'
  })
});

const RealRepoCorpusSurfaceAudit = Object.freeze({
  matrixRows: freezeSorted(uniqueStrings(Object.values(RealRepoCorpusSurfaceRoutes).flatMap((route) => route.matrixRows))),
  productionMatrixRows: freezeSorted(uniqueStrings(Object.values(RealRepoCorpusSurfaceRoutes).flatMap((route) => route.productionMatrixRows))),
  failClosedSurfaces: freezeSorted(Object.entries(RealRepoCorpusSurfaceRoutes)
    .filter(([, route]) => route.failClosedRoutes.length)
    .map(([surface]) => surface)),
  failClosedRouteIds: freezeSorted(uniqueStrings(Object.values(RealRepoCorpusSurfaceRoutes)
    .flatMap((route) => route.failClosedRoutes.map((failClosedRoute) => failClosedRoute.routeId))))
});

function matrixRowsForOracleSurface(surface) {
  return realRepoSurfaceOracleRoute(surface)?.matrixRows ?? [];
}

function productionMatrixRowsForOracleSurface(surface) {
  return realRepoSurfaceOracleRoute(surface)?.productionMatrixRows ?? [];
}

function realRepoSurfaceOracleRoute(surface) {
  return RealRepoCorpusSurfaceRoutes[surface];
}

function createRealRepoSurfaceAuditRows(surfaces) {
  return [...surfaces].sort().map((surface) => {
    const route = realRepoSurfaceOracleRoute(surface);
    return {
      surface,
      evidenceStatus: route ? route.matrixRows.length ? 'matrix-row-mapped' : 'fail-closed-routed' : 'unrouted',
      matrixRows: route?.matrixRows ?? [],
      productionMatrixRows: route?.productionMatrixRows ?? [],
      failClosedRoutes: route?.failClosedRoutes ?? []
    };
  });
}

function matrixSurfaceRoute(matrixRows, productionMatrixRows) {
  return Object.freeze({
    kind: 'matrix-row',
    matrixRows: Object.freeze([...matrixRows]),
    productionMatrixRows: Object.freeze([...productionMatrixRows]),
    failClosedRoutes: Object.freeze([])
  });
}

function failClosedSurfaceRoute(route) {
  return Object.freeze({
    kind: 'fail-closed-route',
    matrixRows: Object.freeze([]),
    productionMatrixRows: Object.freeze([]),
    failClosedRoutes: Object.freeze([Object.freeze({ ...route })])
  });
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))];
}

function freezeSorted(values) {
  return Object.freeze([...values].sort());
}

export {
  RealRepoCorpusSurfaceAudit,
  RealRepoCorpusSurfaceRoutes,
  createRealRepoSurfaceAuditRows,
  matrixRowsForOracleSurface,
  productionMatrixRowsForOracleSurface,
  realRepoSurfaceOracleRoute
};
