function statementEnd(line, start) {
  const semicolon = line.indexOf(';', Math.max(0, start));
  return semicolon === -1 ? line.length : semicolon + 1;
}

function matchingParenIndex(line, open) {
  if (open < 0) return undefined;
  let depth = 0, quote, escaped = false;
  for (let index = open; index < line.length; index += 1) {
    const char = line[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = undefined;
    } else if (char === '\'' || char === '"' || char === '`') quote = char;
    else if (char === '(') depth += 1;
    else if (char === ')' && --depth === 0) return index;
  }
  return undefined;
}

export { matchingParenIndex, statementEnd };
