function pythonBlockSpan(input, lines, index) {
  const baseIndent = indentationLength(lines[index]?.line);
  let end = index;
  for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
    const line = lines[cursor].line;
    if (line.trim() && indentationLength(line) <= baseIndent) break;
    end = cursor;
  }
  return lineSpan(input, lines[index], lines[end] ?? lines[index]);
}

function braceBlockSpan(input, lines, index) {
  let depth = 0;
  let seenOpen = false;
  let end = index;
  for (let cursor = index; cursor < lines.length; cursor += 1) {
    for (const char of lines[cursor].line) {
      if (char === '{') {
        seenOpen = true;
        depth += 1;
      } else if (char === '}') depth -= 1;
    }
    end = cursor;
    if (seenOpen && depth <= 0) break;
  }
  return lineSpan(input, lines[index], lines[end] ?? lines[index]);
}

function endKeywordBlockSpan(input, lines, index) {
  let depth = 0;
  let end = index;
  for (let cursor = index; cursor < lines.length; cursor += 1) {
    const trimmed = lines[cursor].line.trim();
    if (endBlockStart(trimmed)) depth += 1;
    if (/^end\b/.test(trimmed)) depth -= 1;
    end = cursor;
    if (depth <= 0 && cursor > index) break;
  }
  return lineSpan(input, lines[index], lines[end] ?? lines[index]);
}

function lineSpan(input, startLine, endLine) {
  return { sourceId: input.sourceHash, path: input.sourcePath, startLine: startLine.number, endLine: endLine.number, startColumn: 1, endColumn: endLine.line.length + 1 };
}

function indentationLength(line) { return String(line ?? '').match(/^\s*/)?.[0].length ?? 0; }

function endBlockStart(line) {
  return /^(?:class|module|def|defp?|defmodule|function|if|unless|case|while|for|begin|try|receive)\b/.test(line);
}

export { braceBlockSpan, endKeywordBlockSpan, pythonBlockSpan };
