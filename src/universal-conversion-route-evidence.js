import { normalizeNativeLanguageId, uniqueStrings } from './native-import-utils.js';

export function conversionRouteEvidence(evidence, language, target, routeId) {
  const languageIds = new Set(uniqueStrings([language.language, ...(language.aliases ?? [])].map(normalizeNativeLanguageId)));
  return (evidence ?? []).filter((record) => {
    if (!record?.id) return false;
    const routeIds = routeEvidenceIds(record, 'routeId', 'routeIds');
    if (routeIds.length && !routeIds.includes(routeId)) return false;
    const sourceLanguages = routeEvidenceIds(record, 'sourceLanguage', 'sourceLanguages', 'language', 'languages').map(normalizeNativeLanguageId);
    if (sourceLanguages.length && !sourceLanguages.some((entry) => languageIds.has(entry))) return false;
    const targets = routeEvidenceIds(record, 'target', 'targets', 'targetLanguage', 'targetLanguages');
    if (targets.length && !targets.includes(String(target))) return false;
    return routeIds.length > 0 || sourceLanguages.length > 0 || targets.length > 0;
  });
}

export function hasPassedRouteEvidence(evidence) {
  return (evidence ?? []).some((record) => record?.status === 'passed' || record?.status === 'ok' || record?.status === 'success');
}

function routeEvidenceIds(record, singleKey, pluralKey, alternateSingleKey, alternatePluralKey) {
  return uniqueStrings([
    record?.[singleKey],
    ...array(record?.[pluralKey]),
    alternateSingleKey ? record?.[alternateSingleKey] : undefined,
    ...array(alternatePluralKey ? record?.[alternatePluralKey] : undefined),
    record?.metadata?.[singleKey],
    ...array(record?.metadata?.[pluralKey]),
    alternateSingleKey ? record?.metadata?.[alternateSingleKey] : undefined,
    ...array(alternatePluralKey ? record?.metadata?.[alternatePluralKey] : undefined)
  ]);
}

function array(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}
