export function workbenchRouteStyles() {
  return `
.routeSummary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #12171a;
  padding: 10px;
}
.routeSummary strong {
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 13px;
}
.routeSummary span {
  flex: 0 0 auto;
  color: var(--muted);
  font-family: var(--mono);
  font-size: 11px;
}
.routeGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 8px;
  margin-top: 8px;
}
.routeCard {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #14191d;
  padding: 10px;
}
.routeCardHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.routeCardHeader strong {
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 13px;
}
.routeCard p {
  margin: 8px 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}
.routeFacts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  margin: 0 0 8px;
}
.routeFacts div {
  min-width: 0;
}
.routeFacts dt {
  color: var(--faint);
  font-size: 10px;
  text-transform: uppercase;
}
.routeFacts dd {
  margin: 2px 0 0;
  color: var(--text);
  font-family: var(--mono);
  font-size: 11px;
  overflow-wrap: anywhere;
}
.missingEvidenceList {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.missingEvidenceList span {
  border: 1px solid rgba(231, 183, 95, .45);
  border-radius: 999px;
  padding: 3px 6px;
  color: var(--amber);
  font-size: 10px;
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
`;
}
