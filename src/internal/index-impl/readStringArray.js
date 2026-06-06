export function readStringArray(value) {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value.flatMap((entry) => readStringArray(entry));
  return String(value).split(',').map((entry) => entry.trim()).filter(Boolean);
}
