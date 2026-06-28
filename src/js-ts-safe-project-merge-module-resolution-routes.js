function moduleEdgeResolutionRoute(reasonCodes, options = {}) {
  if (reasonCodes.includes('package-runtime-condition-host-ambiguous-missing')) {
    return options.hasPackageImportEdge
      ? proofRoute('prove-package-import-host-runtime-resolution', 'supply-package-import-host-runtime-proof')
      : proofRoute('prove-package-export-host-runtime-resolution', 'supply-package-export-host-runtime-proof');
  }
  if (reasonCodes.includes('package-import-runtime-ambiguous-missing')) return proofRoute('prove-package-import-runtime-resolution', 'supply-package-import-runtime-resolution-proof');
  if (reasonCodes.includes('package-export-runtime-ambiguous-missing')) return proofRoute('prove-package-export-runtime-resolution', 'supply-package-export-runtime-resolution-proof');
  if (reasonCodes.includes('package-import-environment-ambiguous-missing')) return proofRoute('prove-package-import-environment-resolution', 'supply-package-import-environment-resolution-proof');
  if (reasonCodes.includes('package-export-environment-ambiguous-missing')) return proofRoute('prove-package-export-environment-resolution', 'supply-package-export-environment-resolution-proof');
  if (reasonCodes.includes('package-runtime-condition-host-resource-import-ambiguous-missing')) return proofRoute('prove-host-resource-package-runtime-resolution', 'supply-host-resource-package-runtime-proof');
  if (reasonCodes.includes('host-dependency-non-literal-missing')) return proofRoute('prove-host-dependency-runtime-resolution', 'supply-host-dependency-runtime-proof');
  if (reasonCodes.includes('dynamic-import-non-literal-missing')) return proofRoute('prove-dynamic-import-runtime-resolution', 'supply-dynamic-import-runtime-proof');
  if (reasonCodes.includes('import-attribute-static-value-missing') || reasonCodes.includes('import-attribute-static-hash-missing') || reasonCodes.includes('import-attribute-static-records-missing')) {
    return proofRoute('prove-import-attribute-static-values', 'supply-import-attribute-static-proof', 'import-attribute-static-proof');
  }
  if (options.targetKind === 'symbol') return proofRoute('prove-output-module-export-resolution', 'supply-output-module-export-proof', 'static-export-graph-proof');
  return proofRoute('prove-output-module-resolution', 'supply-output-module-resolution-proof');
}

function proofRoute(routeId, routeNext, requiredProof = 'module-resolution-proof') {
  return { requiredProof, routeId, routeLane: 'module-export-import-graph', routeNext };
}

export { moduleEdgeResolutionRoute };
