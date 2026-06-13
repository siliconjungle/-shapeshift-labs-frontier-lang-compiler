function jsStructureDelta(source) {
  let value = 0;
  let opened = false;
  let quote;
  let escaped = false;
  for (const char of String(source ?? '')) {
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '\'' || char === '"' || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{' || char === '[' || char === '(') {
      value += 1;
      opened = true;
    } else if (char === '}' || char === ']' || char === ')') {
      value -= 1;
    }
  }
  return { value, opened };
}

export { jsStructureDelta };
