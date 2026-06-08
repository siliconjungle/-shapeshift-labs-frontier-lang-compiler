import {
  normalizeNativeLanguageId,
  uniqueStrings
} from './native-import-utils.js';
import {
  nativeLanguageCompileTarget,
  normalizeProjectionMatrixTargets
} from './coverage-matrix-profiles.js';

export function normalizeRuntimeHostProfiles(profiles) {
  return (profiles ?? []).map((profile) => {
    const language = normalizeNativeLanguageId(profile.language);
    const runtime = normalizeRuntimeId(profile.runtime ?? profile.host ?? 'host');
    const id = profile.id ?? `${language}:${runtime}`;
    const aliases = uniqueStrings((profile.aliases ?? []).map(normalizeNativeLanguageId));
    const capabilities = Object.fromEntries(Object.entries(profile.capabilities ?? {})
      .map(([kind, value]) => {
        const normalizedKind = normalizeRuntimeCapabilityKind(value?.kind ?? kind);
        return [normalizedKind, {
          kind: normalizedKind,
          support: normalizeCapabilitySupport(value?.support),
          binding: String(value?.binding ?? `${id}.${normalizedKind}`),
          notes: uniqueStrings(value?.notes ?? [])
        }];
      }));
    return {
      id,
      language,
      aliases,
      languageIds: uniqueStrings([language, ...aliases]),
      runtime,
      host: String(profile.host ?? runtime),
      target: normalizeProjectionMatrixTargets([profile.target ?? nativeLanguageCompileTarget(language, aliases) ?? language])[0] ?? language,
      capabilities,
      notes: uniqueStrings(profile.notes ?? [])
    };
  });
}

export function runtimeSourceHosts(input, hostProfiles) {
  const explicit = normalizeHostSelectors(input.sourceHosts ?? input.sourceRuntimeHosts, hostProfiles);
  if (explicit.length) return explicit;
  const languages = uniqueStrings([
    ...(input.sourceLanguages ?? input.languages ?? []).map((entry) => entry?.language ?? entry),
    ...(input.imports ?? []).map((entry) => entry?.language ?? entry?.nativeAst?.language ?? entry?.nativeSource?.language),
    ...runtimeRequirementRecords(input).map((entry) => entry.sourceLanguage ?? entry.language)
  ].map(normalizeNativeLanguageId));
  return (languages.length ? languages : ['javascript'])
    .map((language) => defaultHostForLanguage(language, hostProfiles, input.sourceRuntimes?.[language] ?? input.sourceRuntime))
    .filter(Boolean);
}

export function runtimeTargetHosts(input, hostProfiles, context) {
  const explicit = normalizeHostSelectors(input.targetHosts ?? input.targetRuntimeHosts, hostProfiles);
  if (explicit.length) return explicit;
  const targets = normalizeProjectionMatrixTargets(input.targets ?? context.compileTargets ?? []);
  const targetList = targets.length ? targets : ['javascript'];
  return targetList.map((target) => defaultHostForTarget(target, hostProfiles, input.targetRuntimes?.[target] ?? input.targetRuntime));
}

function normalizeHostSelectors(value, hostProfiles) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((entry) => resolveHostSelector(entry, hostProfiles)).filter(Boolean);
  if (typeof value === 'object') return Object.values(value).map((entry) => resolveHostSelector(entry, hostProfiles)).filter(Boolean);
  return [resolveHostSelector(value, hostProfiles)].filter(Boolean);
}

function resolveHostSelector(value, hostProfiles) {
  if (!value) return undefined;
  if (typeof value === 'object') return normalizeRuntimeHostProfiles([value])[0];
  const normalized = normalizeRuntimeId(value);
  return hostProfiles.find((profile) => profile.id === normalized)
    ?? hostProfiles.find((profile) => `${profile.language}:${profile.runtime}` === normalized)
    ?? hostProfiles.find((profile) => profile.language === normalized)
    ?? genericHostProfile(normalized, normalized);
}

function defaultHostForLanguage(language, hostProfiles, runtime) {
  const normalizedLanguage = normalizeNativeLanguageId(language);
  const normalizedRuntime = normalizeRuntimeId(runtime);
  return hostProfiles.find((profile) => profile.language === normalizedLanguage && (!normalizedRuntime || profile.runtime === normalizedRuntime || profile.id === normalizedRuntime))
    ?? hostProfiles.find((profile) => profile.languageIds.includes(normalizedLanguage))
    ?? genericHostProfile(`${normalizedLanguage}:host`, normalizedLanguage);
}

function defaultHostForTarget(target, hostProfiles, runtime) {
  const normalizedTarget = normalizeProjectionMatrixTargets([target])[0] ?? normalizeNativeLanguageId(target);
  const normalizedRuntime = normalizeRuntimeId(runtime);
  return hostProfiles.find((profile) => profile.target === normalizedTarget && (!normalizedRuntime || profile.runtime === normalizedRuntime || profile.id === normalizedRuntime))
    ?? hostProfiles.find((profile) => profile.language === normalizedTarget)
    ?? genericHostProfile(`${normalizedTarget}:host`, normalizedTarget);
}

function genericHostProfile(id, language) {
  const normalizedLanguage = normalizeNativeLanguageId(language);
  const normalizedId = String(id || `${normalizedLanguage}:host`);
  return {
    id: normalizedId,
    language: normalizedLanguage,
    aliases: [],
    languageIds: [normalizedLanguage],
    runtime: normalizedId.includes(':') ? normalizedId.split(':').at(-1) : 'host',
    host: 'host',
    target: normalizedLanguage,
    capabilities: {},
    notes: ['No built-in runtime host profile was available; callers may provide hostProfiles for stronger adapter planning.']
  };
}

export function normalizeRuntimeRequirements(input, hostProfiles) {
  const records = [
    ...runtimeRequirementRecords(input),
    ...runtimeRequirementRecordsFromImports(input.imports)
  ];
  return records.flatMap((record) => normalizeRuntimeRequirementRecord(record, hostProfiles));
}

function runtimeRequirementRecords(input) {
  if (!input) return [];
  const value = input.runtimeRequirements ?? input.requiredRuntimeCapabilities ?? input.effects ?? [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') {
    return Object.entries(value).map(([key, capabilities]) => ({
      sourceLanguage: key,
      capabilities
    }));
  }
  return [value];
}

function runtimeRequirementRecordsFromImports(imports) {
  return (imports ?? []).flatMap((imported) => {
    const value = imported?.runtimeRequirements
      ?? imported?.metadata?.runtimeRequirements
      ?? imported?.metadata?.runtimeCapabilities
      ?? imported?.metadata?.effects;
    const records = Array.isArray(value) ? value : value ? [value] : [];
    return records.map((record) => typeof record === 'string'
      ? { sourceLanguage: imported?.language ?? imported?.nativeAst?.language, capabilities: [record] }
      : { sourceLanguage: imported?.language ?? imported?.nativeAst?.language, ...record });
  });
}

function normalizeRuntimeRequirementRecord(record, hostProfiles) {
  if (!record) return [];
  if (typeof record === 'string') return [{ capability: normalizeRuntimeCapabilityKind(record) }].filter((entry) => entry.capability);
  const capabilities = uniqueStrings([
    ...(Array.isArray(record.capabilities) ? record.capabilities : []),
    ...(Array.isArray(record.requiredCapabilities) ? record.requiredCapabilities : []),
    record.capability,
    record.kind
  ].map(normalizeRuntimeCapabilityKind).filter(Boolean));
  const sourceHost = resolveHostSelector(record.sourceHost ?? record.sourceRuntimeHost, hostProfiles);
  const targetHost = resolveHostSelector(record.targetHost ?? record.targetRuntimeHost, hostProfiles);
  return capabilities.map((capability) => ({
    capability,
    sourceLanguage: normalizeNativeLanguageId(record.sourceLanguage ?? record.language ?? sourceHost?.language),
    sourceRuntime: normalizeRuntimeId(record.sourceRuntime ?? record.runtime ?? sourceHost?.runtime),
    sourceHostId: sourceHost?.id,
    target: normalizeProjectionMatrixTargets(record.target ? [record.target] : [])[0],
    targetRuntime: normalizeRuntimeId(record.targetRuntime ?? targetHost?.runtime),
    targetHostId: targetHost?.id,
    reason: record.reason,
    evidenceIds: uniqueStrings(record.evidenceIds ?? [])
  }));
}

export function normalizeRuntimeCapabilityKind(value) {
  if (!value) return '';
  const text = String(value).trim().toLowerCase();
  if (text === 'http' || text === 'network' || text === 'networking') return 'fetch';
  if (text === 'timer' || text === 'clock' || text === 'scheduler') return 'timers';
  if (text === 'localstorage' || text === 'local-storage' || text === 'persistence') return 'storage';
  if (text === 'file' || text === 'files' || text === 'fs') return 'filesystem';
  if (text === 'threads' || text === 'workers' || text === 'worker') return 'threading';
  if (text === 'browser-dom' || text === 'document') return 'dom';
  if (text === 'promise' || text === 'promises' || text === 'await') return 'async';
  if (text === 'native-ffi' || text === 'abi') return 'ffi';
  return text;
}

export function normalizeRuntimeId(value) {
  if (!value) return '';
  return String(value).trim().toLowerCase();
}

function normalizeCapabilitySupport(value) {
  const support = String(value ?? 'native').trim().toLowerCase();
  if (support === 'native' || support === 'adapter' || support === 'unavailable') return support;
  if (support === 'unsupported' || support === 'missing' || support === 'none') return 'unavailable';
  return support;
}
