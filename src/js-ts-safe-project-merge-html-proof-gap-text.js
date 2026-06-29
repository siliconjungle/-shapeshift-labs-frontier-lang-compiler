function htmlProofGapSummary(reasonCode) {
  if (reasonCode === 'html-duplicate-explicit-identity') return 'Duplicate explicit HTML identity keys make structural target admission ambiguous.';
  if (reasonCode === 'script-runtime-boundary') return 'HTML script execution can mutate document, module, network, and global runtime behavior and requires source-bound runtime evidence.';
  if (reasonCode === 'style-runtime-boundary') return 'HTML style blocks affect browser cascade and rendering and require source-bound runtime evidence.';
  if (reasonCode === 'template-runtime-boundary') return 'HTML template content can be cloned, stamped, or consumed by host code and requires source-bound runtime evidence.';
  if (reasonCode === 'slot-runtime-boundary') return 'HTML slots participate in shadow-DOM distribution and require source-bound runtime evidence.';
  if (reasonCode === 'custom-runtime-attribute-boundary') return 'Custom HTML runtime attributes are interpreted by client runtimes and require source-bound runtime evidence.';
  if (reasonCode === 'custom-element-runtime-boundary') return 'Custom element upgrade, lifecycle, attributes, and shadow behavior require source-bound runtime evidence.';
  if (reasonCode === 'framework-directive-boundary') return 'Framework directive attributes are interpreted by framework runtimes and require source-bound runtime evidence.';
  if (reasonCode === 'event-handler-runtime-boundary') return 'HTML event handler attributes execute in the browser runtime and require source-bound runtime evidence.';
  if (reasonCode === 'inline-style-runtime-boundary') return 'HTML inline style attributes affect browser cascade and rendering and require source-bound runtime evidence.';
  if (reasonCode === 'iframe-runtime-boundary' || reasonCode === 'iframe-srcdoc-runtime-boundary') return reasonCode === 'iframe-runtime-boundary' ? 'HTML iframe runtime attributes affect nested browsing-context execution and require source-bound runtime evidence.' : 'HTML iframe srcdoc attributes define nested browsing-context content and require source-bound runtime evidence.';
  if (reasonCode === 'form-runtime-boundary') return 'HTML form runtime attributes affect submission, navigation, encoding, or validation and require source-bound runtime evidence.';
  if (reasonCode === 'form-submitter-runtime-boundary') return 'HTML submitter attributes affect form submission behavior and require source-bound runtime evidence.';
  if (reasonCode === 'form-control-runtime-boundary') return 'HTML form-control attributes affect user input, validation, state, or submission data and require source-bound runtime evidence.';
  if (reasonCode === 'navigation-runtime-boundary') return 'HTML navigation attributes affect browser navigation, downloads, pings, or referrer policy and require source-bound runtime evidence.';
  if (reasonCode === 'document-base-runtime-boundary') return 'HTML base attributes affect URL resolution or navigation targets and require source-bound runtime evidence.';
  if (reasonCode === 'document-metadata-runtime-boundary') return 'HTML metadata attributes can affect document loading, policy, refresh, viewport, or discovery behavior and require source-bound runtime evidence.';
  if (reasonCode === 'resource-loading-runtime-boundary') return 'HTML resource-loading attributes affect fetched resources, selection, privacy, media behavior, or layout and require source-bound runtime evidence.';
  return 'HTML proof gap requires source-bound runtime evidence before structural merge admission.';
}

function htmlProofGapNextProof(reasonCode) {
  if (reasonCode === 'html-duplicate-explicit-identity') return 'Rename duplicate explicit HTML identity keys or supply parser-backed identity evidence with unique explicitIdentityKeys on every side.';
  if (reasonCode === 'script-runtime-boundary') return htmlRuntimeBoundaryProofInstruction('boundary "html-script-runtime"');
  if (reasonCode === 'style-runtime-boundary') return htmlRuntimeBoundaryProofInstruction('boundary "html-style-runtime"');
  if (reasonCode === 'template-runtime-boundary') return htmlRuntimeBoundaryProofInstruction('boundary "html-template-runtime"');
  if (reasonCode === 'slot-runtime-boundary') return htmlRuntimeBoundaryProofInstruction('boundary "html-slot-runtime"');
  if (reasonCode === 'custom-runtime-attribute-boundary') return htmlRuntimeBoundaryProofInstruction('boundary "html-custom-runtime-attribute" and boundaryAttributes for the changed custom runtime attributes');
  if (reasonCode === 'custom-element-runtime-boundary') return htmlRuntimeBoundaryProofInstruction('boundary "html-custom-element-runtime"');
  if (reasonCode === 'framework-directive-boundary') return htmlRuntimeBoundaryProofInstruction('boundary "html-framework-directive" and boundaryAttributes for the changed directive attributes');
  if (reasonCode === 'event-handler-runtime-boundary') return htmlRuntimeBoundaryProofInstruction('boundary and boundaryAttributes');
  if (reasonCode === 'inline-style-runtime-boundary') return htmlRuntimeBoundaryProofInstruction('boundary "html-inline-style-attribute" and boundaryAttributes ["style"]');
  if (reasonCode === 'iframe-runtime-boundary' || reasonCode === 'iframe-srcdoc-runtime-boundary') return htmlRuntimeBoundaryProofInstruction('boundary and boundaryAttributes');
  if (reasonCode === 'form-runtime-boundary' || reasonCode === 'form-submitter-runtime-boundary' || reasonCode === 'form-control-runtime-boundary') return htmlRuntimeBoundaryProofInstruction('boundary and boundaryAttributes');
  if (reasonCode === 'navigation-runtime-boundary' || reasonCode === 'document-base-runtime-boundary' || reasonCode === 'document-metadata-runtime-boundary' || reasonCode === 'resource-loading-runtime-boundary') return htmlRuntimeBoundaryProofInstruction('boundary and boundaryAttributes');
  return 'Attach source-bound HTML parser, identity, and runtime-boundary evidence for the changed file before structural admission.';
}

function htmlRuntimeBoundaryProofInstruction(boundaryClause) { return `Attach htmlRuntimeBoundaryProofsByPath[sourcePath] with kind html-source-bound-runtime-boundary-proof, status passed, sourcePath, reasonCode, side, ${boundaryClause}, exact base/worker/head/output source text or hashes, a runtimeProofCapsule with command, probe id, evidence hash, required runtime signals, telemetry/dom/computed-style/layout/event/layout-shift/screenshot hashes, acceptable cumulative layout shift, and no broad browser/semantic/auto-merge self-claims.`; }

export { htmlProofGapNextProof, htmlProofGapSummary };
