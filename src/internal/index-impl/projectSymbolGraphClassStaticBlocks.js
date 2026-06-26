import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment, uniqueStrings } from '../../native-import-utils.js';
import { maskNonCode } from '../../js-ts-semantic-scope-use-def-scan.js';

function classStaticBlockRuntimeRecordsForImport(imported, semanticIndex, publicKeys = new Set()) {
  const sourceText = nativeImportSourceText(imported);
  if (typeof sourceText !== 'string' || !sourceText.includes('static')) return [];
  const sourcePath = imported?.sourcePath ?? imported?.nativeSource?.sourcePath ?? imported?.nativeAst?.sourcePath;
  const sourceHash = imported?.nativeSource?.sourceHash ?? imported?.nativeAst?.sourceHash ?? imported?.sourceHash;
  const language = imported?.language ?? imported?.nativeSource?.language ?? imported?.nativeAst?.language;
  const publicNames = new Set((semanticIndex?.symbols ?? []).filter((symbol) => symbol?.kind === 'export').map((symbol) => symbol.name));
  return classStaticBlockRecords(sourceText, sourcePath).map((block) => {
    const publicContract = block.exported || publicNames.has(block.className) || publicKeys.has(runtimePublicKey(sourcePath, block.className)) || undefined;
    const runtimeOrderEvidence = classStaticBlockRuntimeOrderEvidence(block);
    const signatureHash = hashSemanticValue({
      kind: 'frontier.lang.projectClassStaticBlockRuntimeRegionSignature.v1',
      className: block.className,
      ordinal: block.ordinal,
      runtimeOrderEvidence,
      text: block.text
    });
    const id = `runtime_region_class_static_${idFragment(hashSemanticValue([sourcePath, block.className, block.ordinal, block.start, block.end]))}`;
    return compactRecord({
      id,
      key: ['class-static-block', sourcePath ?? 'memory', block.className, block.ordinal].join('#'),
      regionKind: 'effect',
      runtimeKind: 'class-static-block',
      runtimeKinds: ['class-static-block'],
      sourcePath,
      sourceHash,
      sourceSpan: sourceSpanForBlock(block, sourcePath, sourceHash),
      precision: 'block',
      spanKind: 'class-static-block',
      symbolName: block.className,
      symbolKind: 'class',
      line: block.line,
      ordinal: block.ordinal,
      runtimeOrderEvidence,
      signatureHash,
      publicContract,
      evidenceIds: uniqueStrings([`class-static-block:${sourcePath}:${block.className}:${block.ordinal}`])
    });
  });
}

function classStaticBlockRecords(sourceText, sourcePath) {
  const masked = maskNonCode(sourceText).code;
  const lineStarts = lineStartsFor(sourceText);
  const records = [];
  const classPattern = /\b(export\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)[^{]*\{/g;
  for (const match of masked.matchAll(classPattern)) {
    const classOpen = masked.indexOf('{', match.index);
    const classClose = matchingBraceIndex(masked, classOpen);
    if (classOpen < 0 || classClose === undefined) continue;
    const body = masked.slice(classOpen + 1, classClose);
    let ordinal = 0;
    for (const staticMatch of body.matchAll(/\bstatic\s*\{/g)) {
      const start = classOpen + 1 + staticMatch.index;
      const open = masked.indexOf('{', start);
      const end = matchingBraceIndex(masked, open);
      if (open < 0 || end === undefined || end > classClose) continue;
      ordinal += 1;
      const location = lineColumnAt(lineStarts, start);
      records.push(compactRecord({
        sourcePath,
        className: match[2],
        exported: Boolean(match[1]),
        ordinal,
        start,
        end: end + 1,
        line: location.line,
        column: location.column,
        text: sourceText.slice(start, end + 1),
        statementCount: classStaticBlockStatementCount(sourceText.slice(open + 1, end))
      }));
    }
  }
  return records;
}

function classStaticBlockRuntimeOrderEvidence(block) {
  return compactRecord({
    schema: 'frontier.lang.runtimeOrderEvidence.v1',
    source: 'lexical-source-scan',
    runtimeScope: 'class-static-initialization',
    regionKind: 'effect',
    runtimeKinds: ['class-static-block'],
    line: block.line,
    runtimeOrderIndex: block.ordinal,
    classStaticBlockOrder: [compactRecord({
      kind: 'class-static-block',
      className: block.className,
      ordinal: block.ordinal,
      line: block.line,
      statementCount: block.statementCount,
      text: normalizeText(block.text)
    })]
  });
}

function sourceSpanForBlock(block, sourcePath, sourceHash) {
  const starts = lineStartsFor(block.text);
  const endLine = block.line + starts.length - 1;
  const lastLineStart = starts[starts.length - 1] ?? 0;
  return {
    sourceId: sourceHash,
    path: sourcePath,
    startLine: block.line,
    endLine,
    startColumn: block.column,
    endColumn: endLine === block.line ? block.column + block.text.length : block.text.length - lastLineStart + 1
  };
}

function classStaticBlockStatementCount(body) {
  return String(body ?? '').split(';').map((part) => part.trim()).filter(Boolean).length;
}

function matchingBraceIndex(text, open) {
  if (open < 0) return undefined;
  let depth = 0;
  for (let index = open; index < text.length; index += 1) {
    if (text[index] === '{') depth += 1;
    else if (text[index] === '}' && --depth === 0) return index;
  }
  return undefined;
}

function lineStartsFor(sourceText) {
  const starts = [0];
  for (let index = 0; index < String(sourceText).length; index += 1) {
    if (sourceText[index] === '\n') starts.push(index + 1);
  }
  return starts;
}

function lineColumnAt(lineStarts, offset) {
  let lineIndex = 0;
  while (lineIndex + 1 < lineStarts.length && lineStarts[lineIndex + 1] <= offset) lineIndex += 1;
  return { line: lineIndex + 1, column: offset - lineStarts[lineIndex] + 1 };
}

function runtimePublicKey(sourcePath, symbolName) { return sourcePath && symbolName ? `${sourcePath}\0${symbolName}` : undefined; }
function nativeImportSourceText(imported) { return imported?.metadata?.sourcePreservation?.sourceText ?? imported?.nativeSource?.metadata?.sourcePreservation?.sourceText ?? imported?.nativeAst?.metadata?.sourcePreservation?.sourceText ?? imported?.sourceText; }
function normalizeText(value) { return String(value ?? '').replace(/\s+/g, ' ').trim(); }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }

export { classStaticBlockRuntimeRecordsForImport };
