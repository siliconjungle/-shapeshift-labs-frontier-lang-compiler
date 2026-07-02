import { assert } from './helpers.mjs';
import {
  compileFrontierSource,
  compilerApi,
  createUniversalAstFromDocument,
  createUniversalConversionPlanFromFrontierSource
} from './compiler-api.mjs';

const source = `
module PackageCanvasProbe @id("mod_package_canvas_probe")

packageManifest AppPackage @id("pkg_manifest_app") {
  sourcePath package.json
  sourceHash sha256:package
  packageManager npm@11.0.0
  evidence packageProbe @id("evidence_package_probe") kind test status passed path reports/package.json
  metadata name @id("pkg_meta_name") value "@example/app" evidence evidence_package_probe
  dependency react @id("pkg_dep_react") section dependencies range ^19.0.0 evidence evidence_package_probe
  dependency typescript @id("pkg_dep_typescript") section peerDependencies range ^5.9.0 proofGap package-peer-compatibility-boundary evidence evidence_package_probe
  script test @id("pkg_script_test") command "vitest --run" proofGap package-script-runtime-boundary evidence evidence_package_probe
  export root @id("pkg_export_root") section exports name . target ./dist/index.js proofGap package-conditional-resolution-boundary evidence evidence_package_probe
  gap workspace @id("pkg_gap_workspace") code package-workspace-graph-boundary summary "Workspace expansion requires repository graph evidence."
}

canvasSurface PreviewCanvas @id("canvas_surface_preview") {
  sourcePath src/draw.js
  sourceHash sha256:draw
  evidence canvasProbe @id("evidence_canvas_probe") kind browser-probe status passed path reports/canvas.json
  element preview @id("canvas_element_preview") name canvas category html-canvas order 1 identity canvas:preview attributes data-frontier-key=preview|width=100 evidence evidence_canvas_probe
  command context @id("canvas_command_context") name getContext category context context 2d order 2 proofGap canvas-context-runtime-boundary evidence evidence_canvas_probe
  state fillStyle @id("canvas_state_fill_style") name fillStyle category state order 3 proofGap canvas-stateful-render-order-boundary evidence evidence_canvas_probe
  command fill @id("canvas_command_fill") name fillRect category draw context 2d order 4 proofGap canvas-stateful-render-order-boundary evidence evidence_canvas_probe
  command offscreen @id("canvas_command_offscreen") name transferControlToOffscreen category offscreen order 5 proofGap canvas-offscreen-worker-boundary evidence evidence_canvas_probe
  trace drawFrame @id("canvas_trace_draw_frame") commands getContext|fillStyle|fillRect|transferControlToOffscreen evidence evidence_canvas_probe
  gap image @id("canvas_gap_image") code canvas-image-resource-boundary summary "Image drawing needs bitmap/resource evidence."
}
`;

const compiled = compileFrontierSource(source, { target: 'javascript', emitOnError: true });
assert.equal(compiled.document.metadata.packageManifests.manifestIds[0], 'pkg_manifest_app');
assert.equal(compiled.document.metadata.packageManifests.claims.packageInstallEquivalenceClaim, false);
assert.equal(compiled.document.metadata.canvasSurfaces.surfaceIds[0], 'canvas_surface_preview');
assert.equal(compiled.document.metadata.canvasSurfaces.claims.browserRuntimeEquivalenceClaim, false);
assert.equal(compiled.document.metadata.universalAst.packageManifestIds[0], 'pkg_manifest_app');
assert.equal(compiled.document.metadata.universalAst.canvasSurfaceIds[0], 'canvas_surface_preview');

const documentCompile = compilerApi.compileFrontierDocument(compiled.document, { target: 'javascript', emitOnError: true });
assert.equal(documentCompile.document.metadata.packageManifests.summary.dependencyCount, 2);
assert.equal(documentCompile.document.metadata.canvasSurfaces.summary.offscreenCommandCount, 1);

const universalAst = createUniversalAstFromDocument(compiled.document);
assert.equal(universalAst.packageManifestIds[0], 'pkg_manifest_app');
assert.equal(universalAst.packageManifests[0].claims.packageInstallEquivalenceClaim, false);
assert.equal(universalAst.canvasSurfaceIds[0], 'canvas_surface_preview');
assert.equal(universalAst.canvasSurfaces[0].claims.browserRuntimeEquivalenceClaim, false);
assert.equal(universalAst.metadata.packageManifestSummary.dependencyCount, 2);
assert.equal(universalAst.metadata.canvasSurfaceSummary.commandTraceCount, 1);

const sourcePlan = createUniversalConversionPlanFromFrontierSource(source, {
  fileName: 'package-canvas.frontier',
  target: 'javascript'
});
assert.equal(sourcePlan.metadata.authoredFrontierSource.packageManifestIds[0], 'pkg_manifest_app');
assert.equal(sourcePlan.metadata.authoredFrontierSource.packageManifestProofGapCodes.includes('package-workspace-graph-boundary'), true);
assert.equal(sourcePlan.metadata.authoredFrontierSource.canvasSurfaceIds[0], 'canvas_surface_preview');
assert.equal(sourcePlan.metadata.authoredFrontierSource.canvasSurfaceCommandTraceIds[0], 'canvas_trace_draw_frame');
assert.equal(sourcePlan.metadata.authoredFrontierSource.canvasSurfaceProofGapCodes.includes('canvas-image-resource-boundary'), true);
