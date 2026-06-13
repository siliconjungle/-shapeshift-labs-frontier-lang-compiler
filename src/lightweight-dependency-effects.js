function lightweightEffectKinds(line) {
  const kinds = [];
  if (/\bawait\b|import\s*\(/.test(line)) kinds.push('async');
  if (hasGlobalNetworkCall(line)) kinds.push('network');
  if (/\b(localStorage|sessionStorage|indexedDB|caches|cookie)\b/.test(line)) kinds.push('storage');
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
  return /\b(document|window|navigator|location|history)\s*\./.test(line)
    || hasGlobalConstructorCall(line, ['Worker', 'SharedWorker']);
}

function hasBareCall(line, names) {
  return names.some((name) => new RegExp(`(?:^|[^\\w$.])${name}\\s*\\(`).test(line));
}

function hasGlobalPropertyCall(line, names) {
  return names.some((name) => new RegExp(`\\b(?:window|globalThis|self)\\s*\\.\\s*${name}\\s*\\(`).test(line));
}

function hasGlobalConstructorCall(line, names) {
  return names.some((name) => new RegExp(`(?:^|[^\\w$.])new\\s+(?:(?:window|globalThis|self)\\s*\\.\\s*)?${name}\\s*\\(`).test(line));
}

export { lightweightEffectKinds };
