export function renderWorkbenchHtml(initialState) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Frontier Lang TypeScript to Rust Workbench</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <main class="appShell" data-frontier-app="lang-workbench">
    <header class="topbar">
      <div class="brand">
        <span class="brandMark">F</span>
        <div>
          <h1>Frontier Lang Workbench</h1>
          <p>TypeScript -> Frontier graph -> Rust</p>
        </div>
      </div>
      <div class="topActions">
        <div class="modeGroup" role="group" aria-label="Source language">
          <button data-source-mode="typescript" aria-pressed="true">TS source</button>
          <button data-source-mode="rust" aria-pressed="false">Rust source</button>
        </div>
        <button class="runButton" id="runButton">Run</button>
        <button class="iconButton" id="resetButton" title="Reset source" aria-label="Reset source">↺</button>
        <button class="iconButton" id="copyButton" title="Copy projection" aria-label="Copy projection">⧉</button>
      </div>
    </header>

    <section class="statusStrip" data-view-panel="status">
      <div><span class="label">Readiness</span><strong id="readinessValue">-</strong></div>
      <div><span class="label">Symbols</span><strong id="symbolValue">-</strong></div>
      <div><span class="label">Mappings</span><strong id="mappingValue">-</strong></div>
      <div><span class="label">Mode</span><strong id="modeValue">-</strong></div>
    </section>

    <section class="workspace">
      <section class="pane sourcePane" data-view-panel="source">
        <div class="paneHeader">
          <h2>TypeScript</h2>
          <span id="typescriptStatus">source</span>
        </div>
        <div class="paneBody editorBody">
          <textarea id="typescriptInput" spellcheck="false" aria-label="TypeScript source"></textarea>
        </div>
      </section>

      <section class="pane graphPane" data-view-panel="frontier">
        <div class="paneHeader">
          <h2>Frontier</h2>
          <div class="segmented" role="tablist" aria-label="Frontier view">
            <button data-frontier-tab="graph" aria-pressed="true">Graph</button>
            <button data-frontier-tab="json" aria-pressed="false">JSON</button>
          </div>
        </div>
        <div id="graphView" class="paneBody graphView"></div>
        <pre id="frontierJson" class="paneBody codeBlock" hidden></pre>
      </section>

      <section class="pane outputPane" data-view-panel="rust">
        <div class="paneHeader">
          <h2>Rust</h2>
          <span id="rustStatus">target</span>
        </div>
        <div class="paneBody editorBody">
          <textarea id="rustInput" spellcheck="false" aria-label="Rust source"></textarea>
        </div>
      </section>
    </section>
  </main>
  <script type="application/json" id="initial-state">${escapeScriptJson(initialState)}</script>
  <script src="/client.js" type="module"></script>
</body>
</html>`;
}

function escapeScriptJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
