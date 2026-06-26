import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { compactRecord } from './js-ts-safe-merge-context.js';
import { globalAugmentationCompatibilityAssessment } from './js-ts-safe-project-merge-global-augmentation-compatibility.js';

const ambientRequiredEvidence = [
  'typescript-program-symbol-evidence',
  'declaration-output-gate',
  'consumer-diagnostics-gate',
  'global-augmentation-compatibility-evidence'
];

function maybeBlockAmbientProjectFile(file, context, input = {}) {
  const changed = changedProjectTexts(file);
  if (!changed.length) return undefined;
  const sourceText = changed.map((entry) => entry.sourceText).join('\n');
  const ambient = ambientReason(file.sourcePath, sourceText);
  if (!ambient) return undefined;
  const compatibility = ambient.surface === 'global-augmentation'
    ? globalAugmentationCompatibilityAssessment({
      sourcePath: file.sourcePath,
      sourceHashes: uniqueStrings(changed.map((entry) => hashText(entry.sourceText))),
      moduleName: 'global',
      surfaceKind: 'global-augmentation'
    }, input)
    : undefined;
  if (compatibility?.status === 'passed') return undefined;
  return blockedAmbientFile(file, context, ambient, compatibility);
}

function changedProjectTexts(file) {
  const entries = [];
  if (typeof file.workerSourceText === 'string' && file.workerSourceText !== file.baseSourceText) {
    entries.push({ branch: 'worker', sourceText: file.workerSourceText });
  }
  if (typeof file.headSourceText === 'string' && file.headSourceText !== file.baseSourceText) {
    entries.push({ branch: 'head', sourceText: file.headSourceText });
  }
  if (file.workerDeleted || file.headDeleted) entries.push({ branch: file.workerDeleted ? 'worker' : 'head', sourceText: file.baseSourceText ?? '' });
  return entries;
}

function ambientReason(sourcePath, sourceText) {
  if (/\.d\.[cm]?ts$/i.test(String(sourcePath ?? ''))) {
    return { code: 'project-ambient-declaration-merge-blocked', operation: 'blocked-ambient-declaration', surface: 'declaration-file' };
  }
  if (/\bdeclare\s+global\b|\bdeclare\s+module\s+['"]|\bglobalThis\b/.test(String(sourceText ?? ''))) {
    return { code: 'project-global-augmentation-merge-blocked', operation: 'blocked-global-augmentation', surface: 'global-augmentation' };
  }
  return undefined;
}

function blockedAmbientFile(file, context, ambient, compatibility = undefined) {
  const conflict = {
    code: ambient.code,
    gateId: 'project-ambient-declaration-classifier',
    message: `Project ${ambient.surface} changes require TypeScript program, declaration, and consumer diagnostics evidence.`,
    sourcePath: file.sourcePath,
    details: compactRecord({
      reasonCode: ambient.code,
      conflictKey: `project-ambient#${ambient.surface}#${file.sourcePath}`,
      sourcePath: file.sourcePath,
      surface: ambient.surface,
      baseHash: hashText(file.baseSourceText),
      workerHash: hashText(file.workerSourceText),
      headHash: hashText(file.headSourceText),
      requiredEvidence: ambientRequiredEvidence,
      routeId: compatibility?.routeId,
      routeLane: compatibility?.routeLane,
      routeNext: compatibility?.routeNext,
      reasonCodes: compatibility?.reasonCodes,
      globalAugmentationCompatibilityProof: compatibility?.record,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    })
  };
  return compactRecord({
    kind: 'frontier.lang.jsTsProjectSafeMergeFile',
    version: 1,
    sourcePath: file.sourcePath,
    language: context.language,
    status: 'blocked',
    operation: ambient.operation,
    baseHash: hashText(file.baseSourceText),
    workerHash: hashText(file.workerSourceText),
    headHash: hashText(file.headSourceText),
    conflicts: [conflict],
    admission: {
      status: 'blocked',
      action: 'human-review',
      reviewRequired: true,
      autoApplyCandidate: false,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes: [ambient.code],
      conflictKeys: [conflict.details.conflictKey]
    },
    summary: { conflicts: 1, projectAmbientDeclarationClassification: true },
    conflictKeys: [conflict.details.conflictKey]
  });
}

function hashText(text) {
  return typeof text === 'string' ? hashSemanticValue(text) : undefined;
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))];
}

export { maybeBlockAmbientProjectFile };
