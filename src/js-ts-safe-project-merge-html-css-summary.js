function htmlCssProjectSummary(files) {
  const htmlFiles = files.filter(isHtmlProjectFile), cssFiles = files.filter(isCssProjectFile), htmlCssFiles = [...htmlFiles, ...cssFiles];
  return {
    htmlFiles: htmlFiles.length, cssFiles: cssFiles.length, htmlCssFiles: htmlCssFiles.length,
    htmlMergedFiles: htmlFiles.filter(isMerged).length, cssMergedFiles: cssFiles.filter(isMerged).length, htmlCssMergedFiles: htmlCssFiles.filter(isMerged).length,
    htmlBlockedFiles: htmlFiles.filter(isBlocked).length, cssBlockedFiles: cssFiles.filter(isBlocked).length, htmlCssBlockedFiles: htmlCssFiles.filter(isBlocked).length,
    htmlCssBrowserRuntimeProofs: htmlCssFiles.filter(hasBrowserRuntimeProof).length
  };
}

function isHtmlProjectFile(file) { return String(file?.language ?? '').toLowerCase() === 'html' || /\.html?$/i.test(stripQuery(file?.sourcePath)); }
function isCssProjectFile(file) { return String(file?.language ?? '').toLowerCase() === 'css' || stripQuery(file?.sourcePath).toLowerCase().endsWith('.css'); }
function isMerged(file) { return file.status === 'merged'; }
function isBlocked(file) { return file.status === 'blocked'; }
function stripQuery(sourcePath) { return String(sourcePath ?? '').replace(/[?#].*$/, ''); }
function hasBrowserRuntimeProof(file) {
  const admission = file?.result?.admission ?? file?.admission ?? {};
  return admission.browserRuntimeEquivalenceClaim === true || admission.browserCascadeEquivalenceClaim === true || admission.browserRenderEquivalenceClaim === true;
}

export { htmlCssProjectSummary };
