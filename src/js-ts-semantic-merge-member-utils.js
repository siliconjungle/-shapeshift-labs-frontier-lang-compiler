function normalizeMemberText(text) {
  return String(text ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean).map(String))];
}

export {
  normalizeMemberText,
  uniqueStrings
};
