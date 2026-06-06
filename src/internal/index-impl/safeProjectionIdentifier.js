export function safeProjectionIdentifier(name) {
  const text = String(name ?? 'value').split('.').at(-1).replace(/[^A-Za-z0-9_$]/g, '_');
  const identifier = text || 'value';
  return /^[A-Za-z_$]/.test(identifier) ? identifier : `_${identifier}`;
}
