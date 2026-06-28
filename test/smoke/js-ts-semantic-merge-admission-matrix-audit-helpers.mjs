function assertPartialMatrixAuditRows(matrixAudit, assert) {
  assert.equal(matrixAudit.partialRows > 0, true, 'matrix audit has partial rows');
  for (const surface of matrixAudit.surfaces.filter((entry) => entry.status === 'partial')) {
    assert.equal(Array.isArray(surface.proofLevels) && surface.proofLevels.length > 0, true, `${surface.surface}: partial row proof levels`);
    assert.equal(Array.isArray(surface.routeIds) && surface.routeIds.length > 0, true, `${surface.surface}: partial row route ids`);
    assert.equal(surface.semanticEquivalenceClaim ?? false, false, `${surface.surface}: partial row semantic equivalence claim`);
    for (const proofLevel of surface.proofLevels) {
      assert.equal(Object.hasOwn(surface.proofStatuses, proofLevel), true, `${surface.surface}: proof status ${proofLevel}`);
      assert.equal(
        ['passed', 'failed', 'missing', 'absent', 'present', 'skipped', 'unknown'].includes(surface.proofStatuses[proofLevel]),
        true,
        `${surface.surface}: executable proof status ${proofLevel}`
      );
    }
    if ((surface.missingSignals ?? []).length) {
      assert.equal(Array.isArray(surface.missingRouteIds) && surface.missingRouteIds.length > 0, true, `${surface.surface}: missing route ids`);
    }
  }
}

export { assertPartialMatrixAuditRows };
