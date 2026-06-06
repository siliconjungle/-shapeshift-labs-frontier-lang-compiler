export function oneLine(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}
