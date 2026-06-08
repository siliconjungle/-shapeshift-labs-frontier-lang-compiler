export const UniversalRuntimeCapabilityKinds = Object.freeze([
  'fetch',
  'timers',
  'storage',
  'filesystem',
  'threading',
  'dom',
  'async',
  'ffi'
]);

export const UniversalRuntimeHostProfiles = Object.freeze([
  runtimeHostProfile('javascript:web', 'javascript', 'web', 'browser', 'javascript', {
    fetch: runtimeCapability('fetch', 'native', 'web.fetch'),
    timers: runtimeCapability('timers', 'native', 'web.timers'),
    storage: runtimeCapability('storage', 'native', 'web.storage'),
    filesystem: runtimeCapability('filesystem', 'unavailable', 'web.no-filesystem'),
    threading: runtimeCapability('threading', 'adapter', 'web.workers'),
    dom: runtimeCapability('dom', 'native', 'web.dom'),
    async: runtimeCapability('async', 'native', 'web.promise-event-loop'),
    ffi: runtimeCapability('ffi', 'unavailable', 'web.no-native-ffi')
  }, ['js', 'jsx']),
  runtimeHostProfile('typescript:web', 'typescript', 'web', 'browser', 'typescript', {
    fetch: runtimeCapability('fetch', 'native', 'web.fetch'),
    timers: runtimeCapability('timers', 'native', 'web.timers'),
    storage: runtimeCapability('storage', 'native', 'web.storage'),
    filesystem: runtimeCapability('filesystem', 'unavailable', 'web.no-filesystem'),
    threading: runtimeCapability('threading', 'adapter', 'web.workers'),
    dom: runtimeCapability('dom', 'native', 'web.dom'),
    async: runtimeCapability('async', 'native', 'web.promise-event-loop'),
    ffi: runtimeCapability('ffi', 'unavailable', 'web.no-native-ffi')
  }, ['ts', 'tsx']),
  runtimeHostProfile('javascript:node', 'javascript', 'node', 'node', 'javascript', {
    fetch: runtimeCapability('fetch', 'native', 'node.fetch'),
    timers: runtimeCapability('timers', 'native', 'node.timers'),
    storage: runtimeCapability('storage', 'adapter', 'node.storage-adapter'),
    filesystem: runtimeCapability('filesystem', 'native', 'node.fs'),
    threading: runtimeCapability('threading', 'adapter', 'node.worker-threads'),
    dom: runtimeCapability('dom', 'unavailable', 'node.no-dom'),
    async: runtimeCapability('async', 'native', 'node.promise-event-loop'),
    ffi: runtimeCapability('ffi', 'adapter', 'node.native-addon')
  }, ['nodejs']),
  runtimeHostProfile('rust:cli', 'rust', 'cli', 'native-cli', 'rust', {
    fetch: runtimeCapability('fetch', 'adapter', 'rust.http-client'),
    timers: runtimeCapability('timers', 'native', 'rust.timer'),
    storage: runtimeCapability('storage', 'adapter', 'rust.filesystem-storage'),
    filesystem: runtimeCapability('filesystem', 'native', 'rust.std-fs'),
    threading: runtimeCapability('threading', 'native', 'rust.std-thread'),
    dom: runtimeCapability('dom', 'unavailable', 'rust.no-dom'),
    async: runtimeCapability('async', 'adapter', 'rust.async-runtime'),
    ffi: runtimeCapability('ffi', 'native', 'rust.ffi')
  }, ['rs']),
  runtimeHostProfile('python:cli', 'python', 'cli', 'native-cli', 'python', {
    fetch: runtimeCapability('fetch', 'adapter', 'python.http-client'),
    timers: runtimeCapability('timers', 'native', 'python.timers'),
    storage: runtimeCapability('storage', 'adapter', 'python.persistence'),
    filesystem: runtimeCapability('filesystem', 'native', 'python.filesystem'),
    threading: runtimeCapability('threading', 'native', 'python.threading'),
    dom: runtimeCapability('dom', 'unavailable', 'python.no-dom'),
    async: runtimeCapability('async', 'native', 'python.asyncio'),
    ffi: runtimeCapability('ffi', 'native', 'python.ctypes')
  }, ['py']),
  runtimeHostProfile('c:cli', 'c', 'cli', 'native-cli', 'c', {
    fetch: runtimeCapability('fetch', 'adapter', 'c.http-client'),
    timers: runtimeCapability('timers', 'native', 'c.timers'),
    storage: runtimeCapability('storage', 'adapter', 'c.persistence'),
    filesystem: runtimeCapability('filesystem', 'native', 'c.filesystem'),
    threading: runtimeCapability('threading', 'native', 'c.threads'),
    dom: runtimeCapability('dom', 'unavailable', 'c.no-dom'),
    async: runtimeCapability('async', 'adapter', 'c.event-loop'),
    ffi: runtimeCapability('ffi', 'native', 'c.abi')
  }, ['h']),
  runtimeHostProfile('cpp:cli', 'cpp', 'cli', 'native-cli', 'cpp', {
    fetch: runtimeCapability('fetch', 'adapter', 'cpp.http-client'),
    timers: runtimeCapability('timers', 'native', 'cpp.timers'),
    storage: runtimeCapability('storage', 'adapter', 'cpp.persistence'),
    filesystem: runtimeCapability('filesystem', 'native', 'cpp.filesystem'),
    threading: runtimeCapability('threading', 'native', 'cpp.thread'),
    dom: runtimeCapability('dom', 'unavailable', 'cpp.no-dom'),
    async: runtimeCapability('async', 'adapter', 'cpp.async-runtime'),
    ffi: runtimeCapability('ffi', 'native', 'cpp.abi')
  }, ['cc', 'cxx', 'hpp'])
]);

function runtimeHostProfile(id, language, runtime, host, target, capabilities, aliases = []) {
  return Object.freeze({
    id,
    language,
    aliases,
    runtime,
    host,
    target,
    capabilities: freezeCapabilityMap(capabilities),
    notes: []
  });
}

function runtimeCapability(kind, support, binding, notes = []) {
  return Object.freeze({
    kind,
    support,
    binding,
    notes
  });
}

function freezeCapabilityMap(capabilities) {
  return Object.freeze(Object.fromEntries(Object.entries(capabilities).map(([key, value]) => [key, Object.freeze(value)])));
}
