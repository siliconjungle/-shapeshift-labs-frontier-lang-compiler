export function workbenchStyles() {
  return `
:root {
  color-scheme: dark;
  --topbar-height: 58px;
  --status-height: 46px;
  --chrome-height: calc(var(--topbar-height) + var(--status-height));
  --bg: #08090a;
  --panel: #111417;
  --panel-2: #171b20;
  --panel-3: #20262c;
  --line: #303941;
  --text: #f4f7f2;
  --muted: #aab3aa;
  --faint: #758075;
  --green: #61d394;
  --amber: #e7b75f;
  --red: #e46c69;
  --blue: #6db4e8;
  --violet: #a78bfa;
  --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  --ui: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* { box-sizing: border-box; }
html, body { height: 100%; margin: 0; }
body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--ui);
  overflow: hidden;
}

.appShell {
  height: 100vh;
  overflow: hidden;
}

.topbar, .statusStrip, .paneHeader {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--line);
}

.topbar {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 20;
  height: var(--topbar-height);
  justify-content: space-between;
  padding: 0 14px;
  background: #0c0e10;
}

.brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
.brandMark {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #151b17;
  color: var(--green);
  font-weight: 800;
}
.brand h1 { margin: 0; font-size: 15px; line-height: 1.1; letter-spacing: 0; }
.brand p { margin: 4px 0 0; color: var(--muted); font-size: 12px; }

.topActions { display: flex; align-items: center; gap: 8px; }
.iconButton, .segmented button, .modeGroup button, .runButton {
  height: 32px;
  border: 1px solid var(--line);
  background: var(--panel-2);
  color: var(--text);
  border-radius: 8px;
}
.iconButton { width: 34px; font-size: 16px; cursor: pointer; }
.runButton { min-width: 64px; padding: 0 14px; cursor: pointer; color: var(--green); }
.modeGroup { display: flex; }
.modeGroup button {
  width: 84px;
  border-radius: 0;
  font-size: 12px;
  cursor: pointer;
}
.modeGroup button:first-child { border-radius: 7px 0 0 7px; }
.modeGroup button:last-child { border-radius: 0 7px 7px 0; border-left: 0; }
.modeGroup button[aria-pressed="true"] { background: #213127; color: var(--green); }
.iconButton:hover, .segmented button:hover, .modeGroup button:hover, .runButton:hover { background: var(--panel-3); }

.statusStrip {
  position: fixed;
  inset: var(--topbar-height) 0 auto 0;
  z-index: 19;
  height: var(--status-height);
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  background: #0f1214;
}
.statusStrip div {
  min-width: 0;
  padding: 8px 14px;
  border-right: 1px solid var(--line);
}
.label {
  display: block;
  color: var(--faint);
  font-size: 10px;
  text-transform: uppercase;
}
.statusStrip strong { font-size: 13px; font-weight: 650; }

.workspace {
  position: fixed;
  inset: var(--chrome-height) 0 0 0;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(270px, 0.95fr) minmax(330px, 1.1fr) minmax(300px, 1fr);
  overflow: hidden;
}
.pane {
  min-width: 0;
  min-height: 0;
  height: 100%;
  display: grid;
  grid-template-rows: 44px minmax(0, 1fr);
  border-right: 1px solid var(--line);
  background: var(--panel);
  overflow: hidden;
}
.pane:last-child { border-right: 0; }
.pane.isSource .paneHeader { box-shadow: inset 0 -2px 0 var(--green); }
.paneHeader {
  justify-content: space-between;
  padding: 0 12px;
  background: var(--panel-2);
}
.paneHeader h2 { margin: 0; font-size: 13px; letter-spacing: 0; }
.paneHeader span { color: var(--muted); font-size: 12px; font-family: var(--mono); }

textarea, .codeBlock {
  width: 100%;
  height: 100%;
  min-height: 0;
  max-height: 100%;
  margin: 0;
  border: 0;
  resize: none;
  outline: none;
  background: #0d1012;
  color: #edf2ea;
  font-family: var(--mono);
  font-size: 13px;
  line-height: 1.48;
  padding: 14px;
  overflow: auto;
  overscroll-behavior: contain;
  white-space: pre;
}

.graphView {
  grid-row: 2;
  grid-column: 1;
  min-height: 0;
  max-height: 100%;
  overflow: auto;
  overscroll-behavior: contain;
  padding: 12px;
}
#frontierJson {
  grid-row: 2;
  grid-column: 1;
  min-width: 0;
}
.graphGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
}
.nodeCard {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #14191d;
  padding: 10px;
}
.nodeCard strong {
  display: block;
  overflow-wrap: anywhere;
  font-size: 13px;
}
.nodeCard span { color: var(--muted); font-size: 12px; }
.chipRow { display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0; }
.chip {
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 4px 8px;
  color: var(--muted);
  font-size: 11px;
}
.chip.ready { color: var(--green); border-color: rgba(97, 211, 148, .45); }
.chip.review { color: var(--amber); border-color: rgba(231, 183, 95, .45); }
.chip.blocked { color: var(--red); border-color: rgba(228, 108, 105, .45); }
.sectionTitle {
  margin: 12px 0 8px;
  color: var(--muted);
  font-size: 11px;
  text-transform: uppercase;
}
.edgeList {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.edgeList li {
  border-left: 2px solid var(--blue);
  background: rgba(109, 180, 232, .08);
  padding: 6px 8px;
  color: var(--muted);
  font-size: 12px;
  overflow-wrap: anywhere;
}
.boundsGrid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.boundCard {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #12171a;
  padding: 10px;
}
.boundCard strong {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
}
.boundCard ul {
  margin: 0;
  padding-left: 16px;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.45;
}
.segmented { display: flex; gap: 0; }
.segmented button {
  width: 58px;
  border-radius: 0;
  font-size: 12px;
}
.segmented button:first-child { border-radius: 7px 0 0 7px; }
.segmented button:last-child { border-radius: 0 7px 7px 0; border-left: 0; }
.segmented button[aria-pressed="true"] { background: #213127; color: var(--green); }

@media (max-width: 980px) {
  :root {
    --topbar-height: 96px;
    --status-height: 88px;
  }
  body { overflow: hidden; }
  .topbar {
    align-items: flex-start;
    gap: 10px;
    padding: 10px 14px;
  }
  .workspace {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(3, minmax(0, 1fr));
    overflow: hidden;
  }
  .pane {
    height: 100%;
    min-height: 0;
    border-right: 0;
    border-bottom: 1px solid var(--line);
  }
  .statusStrip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .topActions { flex-wrap: wrap; justify-content: flex-end; }
  .boundsGrid { grid-template-columns: 1fr; }
}
`;
}
