function lightweightEffectKinds(line) {
  const kinds = [];
  if (hasTaggedTemplate(line)) kinds.push('tagged-template');
  else if (hasTemplateInterpolation(line)) kinds.push('template-interpolation');
  else if (hasTemplateLiteral(line)) kinds.push('template-literal');
  if (/\b(await|async)\b|import\s*\(/.test(line)) kinds.push('async');
  if (/\byield\b|\bfunction\s*\*/.test(line)) kinds.push('generator');
  if (hasGlobalNetworkCall(line)) kinds.push('network');
  if (/\b(localStorage|sessionStorage|indexedDB|caches|cookie)\b/.test(line)) kinds.push('storage');
  if (hasImportMetaHostContext(line)) kinds.push('host-context');
  if (hasGlobalSchedulerCall(line)) kinds.push('scheduler');
  if (/\b(console|process|Deno|Bun)\s*\./.test(line)) kinds.push('host');
  if (hasBrowserEffect(line)) kinds.push('browser');
  return kinds;
}

function hasGlobalNetworkCall(line) {
  return hasBareCall(line, ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource'])
    || hasGlobalPropertyCall(line, ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource']);
}

function hasGlobalSchedulerCall(line) {
  const names = [
    'setTimeout',
    'setInterval',
    'clearTimeout',
    'clearInterval',
    'requestAnimationFrame',
    'cancelAnimationFrame',
    'requestIdleCallback',
    'cancelIdleCallback',
    'queueMicrotask',
    'setImmediate',
    'clearImmediate'
  ];
  return hasBareCall(line, names) || hasGlobalPropertyCall(line, names);
}

function hasBrowserEffect(line) {
  return /\b(document|window|navigator|location|history)\s*(?:\.|\?\.|\[)/.test(line)
    || hasGlobalConstructorCall(line, ['Worker', 'SharedWorker']);
}

function hasImportMetaHostContext(line) { return /\bimport\s*\.\s*meta\b/.test(line); }

function hasTaggedTemplate(line) {
  const tick = String(line ?? '').indexOf('`');
  if (tick < 0) return false;
  const match = /([A-Za-z_$][\w$]*(?:(?:\s*\.\s*[A-Za-z_$][\w$]*)|\s*\[[^\]]+\])*)$/.exec(line.slice(0, tick).trimEnd());
  return Boolean(match && !templatePrefixKeywords.has(match[1].trim()));
}

function hasTemplateInterpolation(line) {
  return /`[^`]*\$\{/.test(line);
}

function hasTemplateLiteral(line) {
  return /`/.test(line);
}

function hasBareCall(line, names) {
  return names.some((name) => new RegExp(`(?:^|[^\\w$.])${name}\\s*(?:\\?\\.)?\\s*\\(`).test(line));
}

function hasGlobalPropertyCall(line, names) {
  return names.some((name) => new RegExp(`\\b(?:window|globalThis|self)\\s*(?:(?:\\.|\\?\\.)\\s*${name}|(?:\\?\\.)?\\s*\\[\\s*['"\`]${name}['"\`]\\s*\\])\\s*(?:\\?\\.)?\\s*\\(`).test(line));
}

function hasGlobalConstructorCall(line, names) {
  return names.some((name) => new RegExp(`(?:^|[^\\w$.])new\\s+(?:(?:window|globalThis|self)\\s*\\.\\s*)?${name}\\s*\\(`).test(line));
}

const templatePrefixKeywords = new Set(['return', 'yield', 'await', 'throw', 'case', 'delete', 'typeof', 'void', 'new']);

export { lightweightEffectKinds };
