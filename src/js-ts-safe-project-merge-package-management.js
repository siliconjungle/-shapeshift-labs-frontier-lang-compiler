import { compactRecord } from './js-ts-safe-merge-context.js';
import { hashText, safeId, uniqueStrings } from './js-ts-safe-project-merge-core.js';
import { packageCommandExecutionPhase, packageManagerCommandExecutionRecord, proofHasPackageCommandExecutionCapsule, scriptCommandBinding } from './js-ts-safe-project-merge-package-command-execution-proof.js';

const DependencySections = ['dependencies', 'devDependencies', 'optionalDependencies'];
const PeerSections = ['peerDependencies', 'peerDependenciesMeta'];
const PublicSurfaceFields = ['exports', 'types', 'typings', 'main', 'module', 'bin'];
const WorkspaceFields = ['workspaces'];
const ResolutionOverrideFields = ['overrides', 'resolutions', 'pnpm'];
const InstallScripts = new Set(['preinstall', 'install', 'postinstall', 'prepare', 'prepublish', 'prepublishOnly']);
const PackageCommandExecutionScripts = new Set(['build', 'prebuild', 'postbuild', 'test', 'pretest', 'posttest']);
const KnownFields = new Set([...DependencySections, ...PeerSections, 'scripts', 'engines', ...PublicSurfaceFields, ...WorkspaceFields, ...ResolutionOverrideFields, 'packageManager']);
const GuardedProofLevels = { publicSurface: 'package-public-surface-proof', workspace: 'package-workspace-proof', packageManagerMigration: 'package-manager-migration-proof', resolutionOverride: 'package-resolution-override-proof' };

function packageManagementLanguageForPath(sourcePath) {
  const path = stripQuery(sourcePath).toLowerCase();
  if (path.endsWith('/package.json') || path === 'package.json') return 'package-json';
  if (path.endsWith('/package-lock.json') || path === 'package-lock.json' || path.endsWith('/npm-shrinkwrap.json') || path === 'npm-shrinkwrap.json') return 'npm-lockfile';
  if (path.endsWith('/pnpm-lock.yaml') || path === 'pnpm-lock.yaml') return 'pnpm-lockfile';
  if (path.endsWith('/yarn.lock') || path === 'yarn.lock') return 'yarn-lockfile';
  return undefined;
}

function maybeMergePackageManagementProjectFile({ file, input, projectId, context, base, worker, head }) {
  const language = packageManagementLanguageForPath(file.sourcePath);
  if (!language) return undefined;
  const nextContext = { ...context, language };
  if (language === 'package-json') return mergePackageJsonFile(file, input, projectId, nextContext, base, worker, head);
  return mergeLockfile(file, input, projectId, nextContext, base, worker, head, language);
}

function mergePackageJsonFile(file, input, projectId, context, base, worker, head) {
  const id = `${projectId}_${safeId(file.sourcePath)}`;
  const parsed = parsePackageJsonSides(file.sourcePath, base, worker, head);
  if (parsed.conflicts.length) return packageFile(file, context, packageResult(id, file.sourcePath, 'blocked', undefined, parsed.conflicts, []));
  const conflicts = [];
  const proofs = [];
  const output = cloneJson(parsed.base);
  for (const section of DependencySections) mergeStringMap(output, section, parsed, conflicts, 'package-dependency-range-conflict');
  mergeStringMap(output, 'engines', parsed, conflicts, 'package-engine-range-conflict');
  for (const section of PeerSections) {
    if (changed(parsed.base[section], parsed.worker[section]) || changed(parsed.base[section], parsed.head[section])) {
      const proof = validProof(input, file.sourcePath, 'peerResolution', { base, worker, head });
      if (!proof) conflicts.push(packageConflict(file.sourcePath, 'package-peer-dependency-resolution-proof-missing', { section }));
      else proofs.push(proofRecord(proof, 'package-peer-resolution-proof', file.sourcePath, { section }));
    }
    mergeStringMap(output, section, parsed, conflicts, 'package-peer-dependency-conflict');
  }
  mergeScripts(output, parsed, conflicts, input, file.sourcePath, { base, worker, head }, proofs);
  for (const field of PublicSurfaceFields) mergeGuardedField(output, field, parsed, conflicts, input, file.sourcePath, 'publicSurface', 'package-public-surface-proof-missing', proofs, { base, worker, head });
  for (const field of WorkspaceFields) mergeGuardedField(output, field, parsed, conflicts, input, file.sourcePath, 'workspace', 'package-workspace-proof-missing', proofs, { base, worker, head });
  for (const field of ResolutionOverrideFields) mergeGuardedField(output, field, parsed, conflicts, input, file.sourcePath, 'resolutionOverride', 'package-resolution-override-proof-missing', proofs, { base, worker, head });
  mergeGuardedField(output, 'packageManager', parsed, conflicts, input, file.sourcePath, 'packageManagerMigration', 'package-manager-migration-proof-missing', proofs, { base, worker, head });
  for (const field of uniqueStrings([...Object.keys(parsed.base), ...Object.keys(parsed.worker), ...Object.keys(parsed.head)])) {
    if (!KnownFields.has(field)) mergeJsonField(output, field, parsed, conflicts, 'package-field-conflict');
  }
  const outputSourceText = stringifyPackageJson(output);
  const boundProofs = proofs.filter((proof) => proof.outputSourceHash === undefined || proof.outputSourceHash === hashText(outputSourceText));
  if (boundProofs.length !== proofs.length) conflicts.push(packageConflict(file.sourcePath, 'package-proof-output-binding-mismatch'));
  return packageFile(file, context, packageResult(id, file.sourcePath, conflicts.length ? 'blocked' : 'merged', outputSourceText, conflicts, boundProofs, {
    packageGraphEvidence: createPackageGraphEvidence(file.sourcePath, output, parsed, boundProofs),
    packageIntentMerge: true
  }));
}

function mergeLockfile(file, input, projectId, context, base, worker, head, language) {
  const id = `${projectId}_${safeId(file.sourcePath)}`;
  if (worker === base && head === base) return packageFile(file, context, packageResult(id, file.sourcePath, 'merged', base, [], [], { lockfileUnchanged: true }));
  const proof = validProof(input, file.sourcePath, 'lockfileRegeneration', { base, worker, head }, { requireCommand: true });
  if (!proof) return packageFile(file, context, packageResult(id, file.sourcePath, 'blocked', undefined, [packageConflict(file.sourcePath, 'package-lockfile-regeneration-proof-missing', { lockfileLanguage: language })], []));
  const output = lockfileOutputFromProof(proof, worker, head, base);
  if (typeof output !== 'string') return packageFile(file, context, packageResult(id, file.sourcePath, 'blocked', undefined, [packageConflict(file.sourcePath, 'package-lockfile-regeneration-output-missing', { lockfileLanguage: language, proofId: proof.id })], []));
  const outputHash = hashText(output);
  if (proof.outputSourceHash && proof.outputSourceHash !== outputHash) return packageFile(file, context, packageResult(id, file.sourcePath, 'blocked', undefined, [packageConflict(file.sourcePath, 'package-lockfile-regeneration-output-mismatch', { lockfileLanguage: language, proofId: proof.id })], []));
  return packageFile(file, context, packageResult(id, file.sourcePath, 'merged', output, [], [proofRecord(proof, 'package-lockfile-regeneration-proof', file.sourcePath, { lockfileLanguage: language })], { lockfileRegenerated: true }));
}

function mergeStringMap(output, section, parsed, conflicts, reasonCode) {
  const result = cloneJson(parsed.base[section] ?? {});
  for (const key of uniqueStrings([...keys(parsed.base[section]), ...keys(parsed.worker[section]), ...keys(parsed.head[section])])) {
    const merged = mergeValue(parsed.base[section]?.[key], parsed.worker[section]?.[key], parsed.head[section]?.[key]);
    if (merged.conflict) conflicts.push(packageConflict(parsed.sourcePath, reasonCode, { section, name: key, base: parsed.base[section]?.[key], worker: parsed.worker[section]?.[key], head: parsed.head[section]?.[key] }));
    else if (merged.value === undefined) delete result[key];
    else result[key] = merged.value;
  }
  if (Object.keys(result).length) output[section] = result;
  else delete output[section];
}

function mergeScripts(output, parsed, conflicts, input, sourcePath, binding, proofs) {
  const result = cloneJson(parsed.base.scripts ?? {});
  for (const key of uniqueStrings([...keys(parsed.base.scripts), ...keys(parsed.worker.scripts), ...keys(parsed.head.scripts)])) {
    const merged = mergeValue(parsed.base.scripts?.[key], parsed.worker.scripts?.[key], parsed.head.scripts?.[key]);
    const scriptChanged = changed(parsed.base.scripts?.[key], parsed.worker.scripts?.[key]) || changed(parsed.base.scripts?.[key], parsed.head.scripts?.[key]);
    const scriptBinding = scriptCommandBinding(parsed, key, merged.value);
    if (InstallScripts.has(key) && scriptChanged && !merged.conflict) {
      const proof = validProof(input, sourcePath, 'installScript', binding, { requirePackageCommandExecution: true, executionPhase: 'lifecycle-script', script: key, scriptBinding });
      if (!proof) conflicts.push(packageConflict(sourcePath, 'package-install-script-change-blocked', { script: key }));
      else proofs.push(proofRecord(proof, 'package-install-script-proof', sourcePath, { script: key, ...packageManagerCommandExecutionRecord(proof) }));
    }
    if (PackageCommandExecutionScripts.has(key) && scriptChanged && !merged.conflict) {
      const executionPhase = packageCommandExecutionPhase(key);
      const proof = validProof(input, sourcePath, 'packageManagerCommandExecution', binding, { requirePackageCommandExecution: true, executionPhase, script: key, scriptBinding });
      if (!proof) conflicts.push(packageConflict(sourcePath, 'package-manager-command-execution-proof-missing', { script: key, executionPhase }));
      else proofs.push(proofRecord(proof, 'package-manager-command-execution-proof', sourcePath, { script: key, executionPhase, ...packageManagerCommandExecutionRecord(proof) }));
    }
    if (merged.conflict) conflicts.push(packageConflict(sourcePath, 'package-script-conflict', { script: key }));
    else if (merged.value === undefined) delete result[key];
    else result[key] = merged.value;
  }
  if (Object.keys(result).length) output.scripts = result;
  else delete output.scripts;
}

function mergeGuardedField(output, field, parsed, conflicts, input, sourcePath, proofKind, reasonCode, proofs, binding) {
  const fieldChanged = changed(parsed.base[field], parsed.worker[field]) || changed(parsed.base[field], parsed.head[field]);
  if (fieldChanged) {
    const proof = validProof(input, sourcePath, proofKind, binding);
    if (!proof) conflicts.push(packageConflict(sourcePath, reasonCode, { field }));
    else proofs.push(proofRecord(proof, GuardedProofLevels[proofKind] ?? `package-${proofKind}-proof`, sourcePath, { field }));
  }
  mergeJsonField(output, field, parsed, conflicts, 'package-field-conflict');
}

function mergeJsonField(output, field, parsed, conflicts, reasonCode) {
  const merged = mergeValue(parsed.base[field], parsed.worker[field], parsed.head[field]);
  if (merged.conflict) conflicts.push(packageConflict(parsed.sourcePath, reasonCode, { field, base: parsed.base[field], worker: parsed.worker[field], head: parsed.head[field] }));
  else if (merged.value === undefined) delete output[field];
  else output[field] = cloneJson(merged.value);
}

function mergeValue(base, worker, head) {
  if (jsonEqual(worker, head)) return { value: worker };
  if (jsonEqual(worker, base)) return { value: head };
  if (jsonEqual(head, base)) return { value: worker };
  return { conflict: true };
}

function validProof(input, sourcePath, proofKind, binding, options = {}) {
  return proofCandidates(input, sourcePath, proofKind).find((proof) => proofValid(proof, sourcePath, binding, options));
}

function proofValid(proof, sourcePath, binding, options) {
  return Boolean(proof && typeof proof === 'object') && proof.status === 'passed' && proof.sourcePath === sourcePath &&
    proofSourceMatches(proof, 'base', binding.base) && proofSourceMatches(proof, 'worker', binding.worker) && proofSourceMatches(proof, 'head', binding.head) &&
    !proof.autoMergeClaim && !proof.semanticEquivalenceClaim && !proof.packageInstallEquivalenceClaim &&
    (!options.requireCommand || firstString(proof.command, proof.installCommand, proof.packageManagerCommand, proof.runtimeCommand)) &&
    (!options.requirePackageCommandExecution || proofHasPackageCommandExecutionCapsule(proof, options)) &&
    firstString(proof.evidenceHash, proof.runtimeEvidenceHash, proof.packageGraphHash, proof.lockfileRegenerationHash, proof.installProofHash);
}

function proofSourceMatches(proof, role, sourceText) {
  const hash = hashText(sourceText);
  return proof[`${role}SourceHash`] === hash || proof.sourceHashes?.[role] === hash || proof[`${role}SourceText`] === sourceText || proof.sourceTexts?.[role] === sourceText;
}

function proofCandidates(input, sourcePath, proofKind) {
  const keyed = ProofInputKeys[proofKind] ?? [];
  const candidates = [];
  for (const key of keyed) {
    candidates.push(
      ...asArray(input[key]),
      ...asArray(input[`${key}s`]),
      ...asArray(input[`${key}sByPath`]?.[sourcePath]),
      ...asArray(input[`${key}ByPath`]?.[sourcePath])
    );
  }
  candidates.push(...asArray(input.packageManagementProofsByPath?.[sourcePath]), ...asArray(input.packageManagementProofs), ...asArray(input.packageManagementProof));
  return candidates.filter(Boolean);
}

const ProofInputKeys = {
  lockfileRegeneration: ['packageLockfileRegenerationProof', 'packageLockfileProof'],
  publicSurface: ['packagePublicSurfaceProof'],
  peerResolution: ['packagePeerDependencyProof', 'packagePeerResolutionProof'],
  resolutionOverride: ['packageResolutionOverrideProof', 'packageOverrideProof', 'packageDependencyResolutionProof'],
  packageManagerMigration: ['packageManagerMigrationProof'],
  workspace: ['packageWorkspaceProof'],
  installScript: ['packageInstallScriptProof', 'packageManagerCommandExecutionProof'],
  packageManagerCommandExecution: ['packageManagerCommandExecutionProof', 'packageCommandExecutionProof']
};

function packageFile(file, context, result) {
  const output = result.status === 'merged' ? result.mergedSourceText : undefined;
  return compactRecord({
    kind: 'frontier.lang.jsTsProjectSafeMergeFile', version: 1, sourcePath: file.sourcePath, language: context.language, status: result.status,
    operation: result.status === 'merged' ? `merged-${context.language}` : 'blocked-merge',
    outputSourceText: output, outputHash: hashText(output), baseHash: hashText(file.baseSourceText), workerHash: hashText(file.workerSourceText), headHash: hashText(file.headSourceText),
    result, semanticArtifacts: result.semanticArtifacts, conflicts: result.conflicts ?? [], admission: result.admission, summary: result.summary, conflictKeys: [`package#${file.sourcePath}`]
  });
}

function packageResult(id, sourcePath, status, outputSourceText, conflicts, proofs, extra = {}) {
  return compactRecord({
    kind: 'frontier.lang.packageManagementSafeMerge', version: 1, schema: 'frontier.lang.packageManagementSafeMerge.v1', id, sourcePath, status,
    mergedSourceText: status === 'merged' ? outputSourceText : undefined, mergedSourceHash: status === 'merged' ? hashText(outputSourceText) : undefined,
    conflicts, packageManagementProofs: proofs, ...extra,
    admission: { status: status === 'merged' ? 'auto-merge-candidate' : 'blocked', action: status === 'merged' ? 'apply-package-management-intent' : 'human-review', reviewRequired: status !== 'merged', autoApplyCandidate: status === 'merged', autoMergeClaim: false, semanticEquivalenceClaim: false, packageInstallEquivalenceClaim: false, reasonCodes: uniqueStrings(conflicts.map((conflict) => conflict.details?.reasonCode ?? conflict.code).concat(proofs.map((proof) => proof.proofLevel))) },
    summary: { conflicts: conflicts.length, packageManagementProofs: proofs.length, packageInstallEquivalenceClaim: false, packageIntentMerge: extra.packageIntentMerge === true, lockfileRegenerated: extra.lockfileRegenerated === true, lockfileUnchanged: extra.lockfileUnchanged === true }
  });
}

function packageConflict(sourcePath, reasonCode, details = {}) {
  return { code: reasonCode, gateId: 'package-management-semantic-merge', sourcePath, details: compactRecord({ reasonCode, conflictKey: `package#${sourcePath}#${reasonCode}#${details.field ?? details.section ?? details.script ?? details.name ?? 'source'}`, failClosed: true, autoMergeClaim: false, semanticEquivalenceClaim: false, packageInstallEquivalenceClaim: false, ...details }) };
}

function parsePackageJsonSides(sourcePath, base, worker, head) {
  const parsed = { sourcePath, conflicts: [] };
  for (const [side, text] of [['base', base], ['worker', worker], ['head', head]]) {
    try { parsed[side] = JSON.parse(text); }
    catch { parsed.conflicts.push(packageConflict(sourcePath, 'package-json-parse-error', { side })); parsed[side] = {}; }
  }
  return parsed;
}

function createPackageGraphEvidence(sourcePath, output, parsed, proofs) {
  return { kind: 'frontier.lang.packageGraphEvidence', version: 1, sourcePath, packageName: output.name, packageManager: output.packageManager, dependencySections: DependencySections.filter((section) => output[section]), peerDependencySections: PeerSections.filter((section) => output[section]), publicSurfaceFields: PublicSurfaceFields.filter((field) => output[field] !== undefined), workspaceFields: WorkspaceFields.filter((field) => output[field] !== undefined), resolutionOverrideFields: ResolutionOverrideFields.filter((field) => output[field] !== undefined), proofIds: proofs.map((proof) => proof.id).filter(Boolean), baseHash: hashText(stringifyPackageJson(parsed.base)), workerHash: hashText(stringifyPackageJson(parsed.worker)), headHash: hashText(stringifyPackageJson(parsed.head)), outputHash: hashText(stringifyPackageJson(output)), packageInstallEquivalenceClaim: false };
}

function proofRecord(proof, proofLevel, sourcePath, extra = {}) { return compactRecord({ id: proof.id, kind: proof.kind, status: 'passed', proofLevel, sourcePath, command: firstString(proof.command, proof.installCommand, proof.packageManagerCommand, proof.runtimeCommand), evidenceHash: firstString(proof.evidenceHash, proof.runtimeEvidenceHash, proof.packageGraphHash, proof.lockfileRegenerationHash, proof.installProofHash, proof.commandExecutionEvidenceHash), outputSourceHash: proof.outputSourceHash ?? proof.sourceHashes?.output, ...extra, autoMergeClaim: false, semanticEquivalenceClaim: false, packageInstallEquivalenceClaim: false }); }
function lockfileOutputFromProof(proof, worker, head, base) { return firstString(proof.outputSourceText, proof.lockfileSourceText, proof.generatedLockfileSourceText) ?? (worker === head ? worker : worker !== base && head === base ? worker : head !== base && worker === base ? head : proof.outputSourceHash === hashText(worker) ? worker : proof.outputSourceHash === hashText(head) ? head : undefined); }
function parsePackageJson(text) { return JSON.parse(text); }
function stringifyPackageJson(value) { return `${JSON.stringify(orderPackageJson(value), null, 2)}\n`; }
function orderPackageJson(value) { const order = ['name', 'version', 'description', 'type', 'main', 'module', 'types', 'typings', 'exports', 'bin', 'scripts', 'dependencies', 'devDependencies', 'peerDependencies', 'peerDependenciesMeta', 'optionalDependencies', 'engines', 'packageManager', 'workspaces']; const result = {}; for (const key of order) if (value?.[key] !== undefined) result[key] = value[key]; for (const key of Object.keys(value ?? {}).filter((key) => !order.includes(key)).sort()) result[key] = value[key]; return result; }
function cloneJson(value) { return value === undefined ? undefined : parsePackageJson(JSON.stringify(value)); }
function jsonEqual(left, right) { return JSON.stringify(left) === JSON.stringify(right); }
function changed(base, next) { return !jsonEqual(base, next); }
function keys(value) { return value && typeof value === 'object' && !Array.isArray(value) ? Object.keys(value) : []; }
function firstString(...values) { for (const value of values) if (typeof value === 'string' && value.length) return value; return undefined; }
function asArray(value) { return Array.isArray(value) ? value : value === undefined ? [] : [value]; }
function stripQuery(sourcePath) { return String(sourcePath ?? '').replace(/[?#].*$/, ''); }

export { maybeMergePackageManagementProjectFile, packageManagementLanguageForPath };
