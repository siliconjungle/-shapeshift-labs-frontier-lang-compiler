import { assert } from './helpers.mjs';
import {
  compileFrontierSource,
  compilerApi,
  createUniversalAstFromDocument,
  createUniversalConversionPlanFromFrontierSource
} from './compiler-api.mjs';

const source = `
module PluginSurfaceProbe @id("mod_plugin_surface_probe")

appHost WorkbenchHost @id("app_surface_workbench") {
  role host
  sourcePath app.frontier
  sourceHash sha256:host
  evidence previewProbe @id("evidence_preview_probe") kind browser-probe status passed path reports/preview.json
  mount dashboard @id("app_mount_dashboard") kind region path /dashboard view view_dashboard target react evidence evidence_preview_probe
  provides shell @id("app_provide_shell") surface view view view_dashboard mount app_mount_dashboard capability host.fetch|host.storage evidence evidence_preview_probe
  requires fetch @id("app_require_fetch") capability host.fetch category network permission network proofGap app-host-capability-adapter-boundary evidence evidence_preview_probe
  route dashboard @id("app_route_dashboard") path /dashboard view view_dashboard action action_refresh mount app_mount_dashboard evidence evidence_preview_probe
  gate preview @id("app_gate_preview") kind browser-probe command "npm run preview:probe" required subject view_dashboard evidence evidence_preview_probe
  gap pluginAbi @id("app_gap_plugin_abi") code plugin-abi-compatibility-boundary summary "Plugin ABI requires host/runtime compatibility proof."
}

plugin WeatherWidget @id("plugin_weather_widget") {
  role plugin
  host app_surface_workbench
  sourcePath plugins/weather.frontier
  sourceHash sha256:plugin
  evidence sandboxProbe @id("evidence_sandbox_probe") kind sandbox-probe status passed path reports/sandbox.json
  provides weatherPanel @id("plugin_provide_weather") surface view view view_weather_panel mount app_mount_dashboard capability host.fetch proofGap plugin-projection-runtime-boundary evidence evidence_sandbox_probe
  requires fetch @id("plugin_require_fetch") capability host.fetch category network permission network adapter host_fetch_adapter proofGap plugin-capability-grant-boundary evidence evidence_sandbox_probe
  gate sandbox @id("plugin_gate_sandbox") kind sandbox command "npm run sandbox:probe" required subject view_weather_panel evidence evidence_sandbox_probe
  gap sandbox @id("plugin_gap_sandbox") code plugin-sandbox-safety-boundary summary "Sandbox safety requires runtime proof."
}
`;

const compiled = compileFrontierSource(source, { target: 'javascript', emitOnError: true });
assert.equal(compiled.document.metadata.applicationSurfaces.surfaceIds[0], 'app_surface_workbench');
assert.equal(compiled.document.metadata.applicationSurfaces.surfaceIds[1], 'plugin_weather_widget');
assert.equal(compiled.document.metadata.applicationSurfaces.claims.pluginCompatibilityClaim, false);
assert.equal(compiled.document.metadata.applicationSurfaces.claims.sandboxSafetyClaim, false);
assert.equal(compiled.document.metadata.applicationSurfaces.evidenceIds.includes('evidence_preview_probe'), true);
assert.equal(compiled.document.metadata.applicationSurfaces.evidenceIds.includes('evidence_sandbox_probe'), true);
assert.equal(compiled.document.metadata.universalAst.applicationSurfaceIds[1], 'plugin_weather_widget');

const documentCompile = compilerApi.compileFrontierDocument(compiled.document, { target: 'javascript', emitOnError: true });
assert.equal(documentCompile.document.metadata.applicationSurfaces.summary.requiredCapabilityCount, 2);
assert.equal(documentCompile.document.metadata.applicationSurfaces.summary.gateCount, 2);

const universalAst = createUniversalAstFromDocument(compiled.document);
assert.equal(universalAst.applicationSurfaceIds[0], 'app_surface_workbench');
assert.equal(universalAst.applicationSurfaces[1].claims.runtimeEquivalenceClaim, false);
assert.equal(universalAst.applicationSurfaces[0].records.find((record) => record.id === 'app_route_dashboard').sourcePath, 'app.frontier');
assert.equal(universalAst.applicationSurfaces[0].records.find((record) => record.id === 'app_mount_dashboard').sourcePath, 'app.frontier');
assert.equal(universalAst.applicationSurfaces[1].records.find((record) => record.id === 'plugin_require_fetch').adapterId, 'host_fetch_adapter');
assert.equal(universalAst.metadata.applicationSurfaceSummary.providedSurfaceCount, 2);
assert.equal(universalAst.metadata.authoredApplicationSurfaceIds[1], 'plugin_weather_widget');

const sourcePlan = createUniversalConversionPlanFromFrontierSource(source, {
  fileName: 'plugin-surface.frontier',
  target: 'javascript'
});
assert.equal(sourcePlan.metadata.authoredFrontierSource.applicationSurfaceIds[0], 'app_surface_workbench');
assert.equal(sourcePlan.metadata.authoredFrontierSource.applicationSurfaceMountIds[0], 'app_mount_dashboard');
assert.equal(sourcePlan.metadata.authoredFrontierSource.applicationSurfaceRequiredCapabilityIds.includes('plugin_require_fetch'), true);
assert.equal(sourcePlan.metadata.authoredFrontierSource.applicationSurfaceGateIds.includes('plugin_gate_sandbox'), true);
assert.equal(sourcePlan.metadata.authoredFrontierSource.applicationSurfaceProofGapCodes.includes('plugin-sandbox-safety-boundary'), true);
