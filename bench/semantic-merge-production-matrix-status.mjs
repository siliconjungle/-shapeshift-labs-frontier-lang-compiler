import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { readmeHighRowProofs, rowProofs, sourceAnchorUrls } from './semantic-merge-production-matrix-data.mjs';

const matrixUrl = new URL('../research/semantic-merge-production-matrix.md', import.meta.url);
const readmeUrl = new URL('../README.md', import.meta.url);
const rootUrl = new URL('../', import.meta.url);

function createSemanticMergeProductionMatrixStatus(options = {}) {
  const markdown = readFileSync(options.matrixUrl ?? matrixUrl, 'utf8');
  const readmeMarkdown = readFileSync(options.readmeUrl ?? readmeUrl, 'utf8');
  const sourceRows = rowsForHeading(markdown, 'Source Anchors');
  const matrixRows = rowsForHeading(markdown, 'Current Matrix');
  const remainingRows = rowsForHeading(markdown, 'Current Remaining Work Table');
  const readmeMatrixRows = rowsForReadmeSemanticMergeMatrix(readmeMarkdown);
  const sourceAnchors = new Map(sourceRows.map((row) => [row.Surface, row]));
  const remainingWork = new Map(remainingRows.map((row) => [row['Work item'], row]));
  const matrixAreas = matrixRows.map((row) => row.Area);
  const duplicateAreas = duplicates(matrixAreas);
  const rows = matrixRows.map((row) => matrixStatusRow(row, sourceAnchors, remainingWork));
  const readmeRows = readmeMatrixRows.map((row) => readmeStatusRow(row, sourceAnchors));
  const statusCounts = countBy(rows, (row) => row.status);
  const readmeStatusCounts = countBy(readmeRows, (row) => normalizeStatus(row.status));
  const readmeHighRows = readmeRows.filter((row) => normalizeStatus(row.status) === 'high');
  const highRowsWithoutExecutableEvidence = rows
    .filter((row) => row.status === 'high' && !row.executableEvidenceFilesPresent)
    .map((row) => row.area);
  const runtimeEquivalenceOverclaimRows = rows
    .filter((row) => row.runtimeEquivalenceGuard.forbiddenClaim || !row.runtimeEquivalenceGuard.caveatPresent)
    .map((row) => row.area);
  const unmappedSourceAnchors = [...sourceAnchors.keys()].filter((anchor) =>
    !rows.some((row) => row.sourceAnchors.some((source) => source.anchor === anchor))
  );
  const unmappedRemainingWork = [...remainingWork.keys()].filter((workItem) =>
    !rows.some((row) => row.remainingWork.some((item) => item.workItem === workItem))
  );
  return {
    kind: 'frontier.lang.semanticMergeProductionMatrixStatus',
    version: 1,
    matrixPath: relativeMatrixPath(options.matrixUrl ?? matrixUrl),
    sourceAnchorCount: sourceRows.length,
    remainingWorkCount: remainingRows.length,
    rowCount: rows.length,
    statusCounts,
    duplicateAreas,
    unmappedMatrixRows: matrixAreas.filter((area) => !rowProofs.has(area)),
    unmappedProofRows: [...rowProofs.keys()].filter((area) => !matrixAreas.includes(area)),
    highRowsWithoutExecutableEvidence,
    runtimeEquivalenceOverclaimRows,
    unmappedSourceAnchors,
    unmappedRemainingWork,
    readmeSemanticMergeMatrix: {
      matrixPath: relativeRootPath(options.readmeUrl ?? readmeUrl),
      rowCount: readmeRows.length,
      statusCounts: readmeStatusCounts,
      unmappedHighRows: readmeHighRows.filter((row) => !row.mapped).map((row) => row.surface),
      highRowsWithoutSourceAnchors: readmeHighRows.filter((row) => !row.sourceAnchorsPresent).map((row) => row.surface),
      highRowsWithoutExecutableEvidence: readmeHighRows.filter((row) => !row.executableEvidenceFilesPresent).map((row) => row.surface),
      runtimeEquivalenceOverclaimRows: readmeRows
        .filter((row) => row.runtimeEquivalenceGuard.forbiddenClaim || !row.runtimeEquivalenceGuard.caveatPresent)
        .map((row) => row.surface),
      rows: readmeRows
    },
    rows
  };
}

function matrixStatusRow(row, sourceAnchors, remainingWork) {
  const proof = rowProofs.get(row.Area);
  const sourceAnchorRecords = (proof?.anchors ?? []).map((anchor) => ({
    anchor,
    present: sourceAnchors.has(anchor),
    requirementSources: sourceAnchors.get(anchor)?.['Requirement sources'] ?? null,
    urls: sourceAnchorUrls[anchor] ?? []
  }));
  const evidenceFiles = (proof?.evidence ?? []).map((path) => ({
    path,
    present: existsSync(new URL(path, rootUrl))
  }));
  const executableEvidenceFiles = evidenceFiles.filter((file) => isExecutableEvidencePath(file.path));
  const remaining = (proof?.remaining ?? []).map((workItem) => ({
    workItem,
    present: remainingWork.has(workItem),
    priority: remainingWork.get(workItem)?.Priority ?? null,
    suggestedFirstProof: remainingWork.get(workItem)?.['Suggested first proof'] ?? null
  }));
  return {
    area: row.Area,
    status: row.Status,
    currentExecutableEvidence: row['Current executable evidence'],
    remainingWorkText: row['Remaining work'],
    mapped: Boolean(proof),
    sourceAnchors: sourceAnchorRecords,
    evidenceFiles,
    executableEvidenceFiles,
    remainingWork: remaining,
    sourceAnchorsPresent: sourceAnchorRecords.every((anchor) => anchor.present && anchor.urls.length > 0),
    evidenceFilesPresent: evidenceFiles.every((file) => file.present),
    executableEvidenceFilesPresent: executableEvidenceFiles.length > 0 && executableEvidenceFiles.every((file) => file.present),
    remainingWorkPresent: remaining.every((item) => item.present),
    runtimeEquivalenceGuard: runtimeEquivalenceGuardForText(`${row.Area} ${row['Current executable evidence']} ${row['Remaining work']}`),
    partialRowOverstatesCompletion: row.Status === 'partial' &&
      /\bproduction[- ]complete\b|\bfully covered\b/i.test(row['Current executable evidence'])
  };
}

function readmeStatusRow(row, sourceAnchors) {
  const proof = readmeHighRowProofs.get(row.Surface);
  const sourceAnchorRecords = (proof?.anchors ?? []).map((anchor) => ({
    anchor,
    present: sourceAnchors.has(anchor),
    requirementSources: sourceAnchors.get(anchor)?.['Requirement sources'] ?? null,
    urls: sourceAnchorUrls[anchor] ?? []
  }));
  const evidenceFiles = (proof?.evidence ?? []).map((path) => ({
    path,
    present: existsSync(new URL(path, rootUrl))
  }));
  const executableEvidenceFiles = evidenceFiles.filter((file) => isExecutableEvidencePath(file.path));
  return {
    surface: row.Surface,
    status: row.Status,
    currentEvidence: row['Current evidence'],
    mapped: Boolean(proof),
    sourceAnchors: sourceAnchorRecords,
    evidenceFiles,
    executableEvidenceFiles,
    sourceAnchorsPresent: sourceAnchorRecords.every((anchor) => anchor.present && anchor.urls.length > 0),
    evidenceFilesPresent: evidenceFiles.every((file) => file.present),
    executableEvidenceFilesPresent: executableEvidenceFiles.length > 0 && executableEvidenceFiles.every((file) => file.present),
    runtimeEquivalenceGuard: runtimeEquivalenceGuardForText(`${row.Surface} ${row['Current evidence']}`)
  };
}

function isExecutableEvidencePath(path) {
  return /\.(?:mjs|cjs|js|ts)$/.test(path);
}

function runtimeEquivalenceGuardForText(text) {
  const relevant = /\b(?:browser|render|layout|paint|cascade|runtime[-/ ]equivalence|semantic[-/ ]equivalence|host[-/ ]equivalence|runtime[-/ ]proof|host[-/ ]proof|runtime\/browser|browser\/runtime|host[-/ ]environment|host[-/ ]behavior|host[-/ ]evidence|runtime-sensitive)\b/i.test(text);
  const forbiddenClaim = /\b(?:full|complete|unbounded|guaranteed|automatic)\s+(?:browser|render|layout|paint|cascade|runtime|semantic|host)[-/ ]equivalence\b/i.test(text);
  const caveatPresent = !relevant || /\b(?:bounded|source-bound|fail(?:s|ed)?[- ]closed|broad-claim rejection|without [^.]*proof|not inferred|does not claim|not (?:a |an )?[^.]*claim|not proved|unproved|false unless|separate [^.]*row|add new rows|dynamic blockers|missing-[a-z-]+ rejection|stale-proof rejection|review\/blocking evidence|stay(?:s)? (?:review|blocked|blocking|fail[- ]closed)|remain(?:s)? (?:review|blocked|blocking|fail[- ]closed|default-off)|default-off|unknown equivalence|exact project binding)\b/i.test(text);
  return { relevant, caveatPresent, forbiddenClaim };
}

function runtimeEquivalenceGuard(row) {
  return runtimeEquivalenceGuardForText(`${row.Area} ${row['Current executable evidence']} ${row['Remaining work']}`);
}

function rowsForReadmeSemanticMergeMatrix(markdown) {
  const lines = markdown.split('\n');
  const start = lines.findIndex((line) => line.trim() === 'Current JS/TS semantic-merge status matrix:');
  if (start < 0) throw new Error('missing README semantic merge matrix heading');
  return rowsForTableAfterLine(lines, start, 'README semantic merge matrix');
}

function rowsForHeading(markdown, heading) {
  const lines = markdown.split('\n');
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start < 0) throw new Error(`missing ${heading} heading`);
  return rowsForTableAfterLine(lines, start, heading);
}

function rowsForTableAfterLine(lines, start, label) {
  const table = [];
  for (const line of lines.slice(start + 1)) {
    const trimmed = line.trim();
    if (!trimmed && table.length === 0) continue;
    if (!trimmed.startsWith('|')) {
      if (table.length > 0) break;
      continue;
    }
    table.push(trimmed);
  }
  if (table.length < 2) throw new Error(`${label}: expected markdown table`);
  const headers = tableCells(table[0]);
  if (table.length === 2) return [];
  return table.slice(2).map((line) => Object.fromEntries(headers.map((header, index) => [header, tableCells(line)[index] ?? ''])));
}

function tableCells(line) {
  return line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
}

function countBy(values, key) {
  const counts = {};
  for (const value of values) {
    const id = key(value);
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}

function duplicates(values) {
  const seen = new Set();
  const duplicate = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicate.add(value);
    seen.add(value);
  }
  return [...duplicate].sort();
}

function normalizeStatus(status) {
  return status.toLowerCase().replace(/\s+/g, '-');
}

function relativeMatrixPath(url) {
  return relativeRootPath(url);
}

function relativeRootPath(url) {
  const path = fileURLToPath(url);
  const root = fileURLToPath(rootUrl);
  return path.startsWith(root) ? path.slice(root.length) : path;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const pretty = process.argv.includes('--pretty');
  console.log(JSON.stringify(createSemanticMergeProductionMatrixStatus(), null, pretty ? 2 : 0));
}

export {
  createSemanticMergeProductionMatrixStatus,
  runtimeEquivalenceGuard,
  runtimeEquivalenceGuardForText,
  readmeHighRowProofs,
  rowProofs,
  sourceAnchorUrls
};
