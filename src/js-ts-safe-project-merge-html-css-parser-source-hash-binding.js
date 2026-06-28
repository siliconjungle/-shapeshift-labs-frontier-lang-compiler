import { RequiredParserEvidenceSideNames } from './js-ts-safe-project-merge-html-css-summary-constants.js';

function parserEvidenceSourceHashBindingValid(file, evidence) {
  const expectedHashes = requiredParserEvidenceSideHashes(file);
  if (!expectedHashes) return file?.status === 'blocked' || file?.result?.status === 'blocked';
  return RequiredParserEvidenceSideNames.every((sideName) => {
    const declaredHashes = parserEvidenceSideSourceHashes(evidence, sideName);
    return declaredHashes.length === 0 || declaredHashes.every((hash) => hash === expectedHashes[sideName]);
  });
}

function requiredParserEvidenceSideHashes(file) {
  const sourceHashes = file?.sourceHashes ?? file?.result?.sourceHashes ?? {};
  const hashes = {
    base: firstString(file?.baseHash, file?.baseSourceHash, sourceHashes.baseHash, sourceHashes.base),
    worker: firstString(file?.workerHash, file?.workerSourceHash, sourceHashes.workerHash, sourceHashes.worker),
    head: firstString(file?.headHash, file?.headSourceHash, sourceHashes.headHash, sourceHashes.head)
  };
  return RequiredParserEvidenceSideNames.every((sideName) => typeof hashes[sideName] === 'string') ? hashes : undefined;
}

function parserEvidenceSideSourceHashes(evidence, sideName) {
  const side = evidence?.sides?.[sideName] ?? {};
  const sourceHashes = evidence?.sourceHashes ?? evidence?.sourceHashBySide ?? evidence?.sideSourceHashes ?? {};
  return uniqueStrings([
    side.sourceHash,
    side.sourceTextHash,
    side.evidenceSourceHash,
    side[`${sideName}SourceHash`],
    evidence?.[`${sideName}SourceHash`],
    sourceHashes[sideName],
    sourceHashes[`${sideName}Hash`],
    sourceHashes[`${sideName}SourceHash`]
  ]);
}

function firstString(...values) { return values.find((value) => typeof value === 'string' && value.length > 0); }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

export { parserEvidenceSourceHashBindingValid };
