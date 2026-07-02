import { assert } from './helpers.mjs';
import {
  compileFrontierSource,
  createUniversalAstFromDocument,
  createUniversalConversionPlanFromFrontierSource,
  queryUniversalConversionPlan
} from './compiler-api.mjs';

const source = `
module RuntimeCapabilityProbe @id("mod_runtime_capability_probe")

conversion WebToRust @id("conversion_web_rust") {
  sourceLanguage javascript
  target rust
}

runtimeCapabilities WebToRustRuntime @id("runtime_caps_web_rust") {
  sourceHost web @id("runtime_host_js_web") language javascript runtime web host browser target javascript alias js|jsx evidence evidence_runtime_fetch
  targetHost rust @id("runtime_host_rust_cli") language rust runtime cli host native-cli target rust alias rs evidence evidence_runtime_fetch
  hostBinding webFetchBinding @id("runtime_binding_web_fetch") host runtime_host_js_web capability fetch kind native-api apiName fetch globalName window.fetch evidence evidence_runtime_fetch
  hostBinding rustFetchBinding @id("runtime_binding_rust_fetch") host runtime_host_rust_cli capability fetch kind package package reqwest symbol Client evidence evidence_runtime_fetch
  hostCapability webFetch @id("runtime_cap_web_fetch") host runtime_host_js_web capability fetch support native binding runtime_binding_web_fetch evidence evidence_runtime_fetch
  hostCapability rustFetch @id("runtime_cap_rust_fetch") host runtime_host_rust_cli capability fetch support adapter binding runtime_binding_rust_fetch evidence evidence_runtime_fetch
  requirement fetchAdapter @id("runtime_requirement_fetch_adapter") sourceHost runtime_host_js_web targetHost runtime_host_rust_cli capability fetch hostCapability runtime_cap_rust_fetch binding runtime_binding_rust_fetch requiredSignals source-hash|target-hash|runtime-command|probe-id|telemetry-hash|network-trace-hash proofEvidence evidence_runtime_fetch evidence evidence_runtime_fetch missingEvidence target-adapter-fixture proofGap rust-fetch-adapter-boundary readiness needs-review reason "Fetch adapter needs replay proof."
  evidence fetchProbe @id("evidence_runtime_fetch") kind runtime-adapter-proof status passed capability fetch sourceHost runtime_host_js_web targetHost runtime_host_rust_cli runtimeProofSignals source-hash|target-hash|runtime-command|probe-id|telemetry-hash|network-trace-hash command "npm run probe:fetch" probeId fetch-probe telemetryHash hash_telemetry networkTraceHash hash_network
  gap domProbe @id("runtime_gap_dom_probe") code runtime-dom-proof status missing summary "DOM proof is not provided."
}
`;

const compiled = compileFrontierSource(source, { target: 'javascript', emitOnError: true });
assert.equal(compiled.document.metadata.runtimeCapabilities.id, 'runtime_caps_web_rust');
assert.equal(compiled.document.metadata.runtimeCapabilities.hostProfileIds.includes('runtime_host_js_web'), true);
assert.equal(compiled.document.metadata.runtimeCapabilityMatrix.hostBindingIds.includes('runtime_binding_rust_fetch'), true);
assert.equal(compiled.document.metadata.runtimeCapabilities.hostCapabilityIds.includes('runtime_cap_rust_fetch'), true);
assert.equal(compiled.document.metadata.runtimeCapabilities.runtimeRequirementIds[0], 'runtime_requirement_fetch_adapter');
assert.equal(compiled.document.metadata.runtimeCapabilities.evidenceIds[0], 'evidence_runtime_fetch');
assert.equal(compiled.document.metadata.runtimeCapabilities.claims.runtimeEquivalenceClaim, false);

const ast = createUniversalAstFromDocument(compiled.document);
assert.equal(ast.runtimeCapabilityIds[0], 'runtime_caps_web_rust');
assert.equal(ast.metadata.authoredRuntimeCapabilityIds[0], 'runtime_caps_web_rust');
assert.equal(ast.metadata.runtimeCapabilitySummary.runtimeRequirementCount, 1);

const plan = createUniversalConversionPlanFromFrontierSource(source, {
  fileName: 'runtime-capability.frontier',
  generatedAt: 1001
});
assert.equal(plan.metadata.authoredFrontierSource.runtimeCapabilityId, 'runtime_caps_web_rust');
assert.equal(plan.metadata.authoredFrontierSource.runtimeCapabilityHostProfileIds.includes('runtime_host_rust_cli'), true);
assert.equal(plan.metadata.authoredFrontierSource.runtimeCapabilitySourceHostIds[0], 'runtime_host_js_web');
assert.equal(plan.metadata.authoredFrontierSource.runtimeCapabilityTargetHostIds[0], 'runtime_host_rust_cli');
assert.equal(plan.metadata.authoredFrontierSource.runtimeCapabilityHostCapabilityIds.includes('runtime_cap_rust_fetch'), true);
assert.equal(plan.metadata.authoredFrontierSource.runtimeCapabilityHostBindingIds.includes('runtime_binding_rust_fetch'), true);
assert.equal(plan.metadata.authoredFrontierSource.runtimeCapabilityRequirementIds[0], 'runtime_requirement_fetch_adapter');
assert.equal(plan.metadata.authoredFrontierSource.runtimeCapabilityEvidenceIds[0], 'evidence_runtime_fetch');
assert.equal(plan.metadata.authoredFrontierSource.runtimeCapabilityProofGapCodes[0], 'runtime-dom-proof');

const route = queryUniversalConversionPlan(plan, {
  sourceHostId: 'runtime_host_js_web',
  targetHostId: 'runtime_host_rust_cli',
  runtimeProofCapability: 'fetch',
  runtimeProofStatus: 'satisfied',
  runtimeProofProvidedSignal: 'network-trace-hash'
}).bestRoute;
assert.equal(Boolean(route), true);
assert.equal(route.runtime.source.id, 'runtime_host_js_web');
assert.equal(route.runtime.target.id, 'runtime_host_rust_cli');
assert.equal(route.runtime.requiredCapabilities[0], 'fetch');
assert.equal(route.runtime.proofObligations[0].status, 'satisfied');
assert.equal(route.runtime.proofObligations[0].evidenceIds.includes('evidence_runtime_fetch'), true);
assert.equal(route.translationAdmission.runtimeProofStatuses.includes('satisfied'), true);
assert.equal(queryUniversalConversionPlan(plan, {
  runtimeProofMissingSignal: 'network-trace-hash'
}).found, false);
