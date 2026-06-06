export function lineColumnForOffset(source, offset) {
  const text = String(source ?? '');
  const safeOffset = Math.max(0, Math.min(offset, text.length));
  let line = 1;
  let column = 1;
  for (let index = 0; index < safeOffset; index += 1) {
    if (text[index] === '\n') {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }
  return { line, column };
}
