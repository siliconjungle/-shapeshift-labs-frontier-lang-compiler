import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { compactRecord } from './js-ts-safe-merge-context.js';

function stageFileShape(file, branch) {
  const sourcePath = file.sourcePath;
  const baseSource = file.baseSourceText;
  const branchSource = branchSourceText(file, branch);
  const changed = baseSource !== branchSource;
  return compactRecord({
    sourcePath,
    changed,
    added: typeof baseSource !== 'string' && typeof branchSource === 'string',
    deleted: typeof baseSource === 'string' && typeof branchSource !== 'string',
    baseShape: typeof baseSource === 'string' ? sourceShape(sourcePath, baseSource) : undefined,
    branchShape: typeof branchSource === 'string' ? sourceShape(sourcePath, branchSource) : undefined
  });
}

function changedBaseModules(stageFiles) {
  return stageFiles.filter((file) => file.changed && file.baseShape);
}

function changedBranchModules(stageFiles) {
  return stageFiles.filter((file) => file.changed && file.branchShape);
}

function changedBaseClasses(stageFiles) {
  return stageFiles
    .filter((file) => file.changed && file.baseShape)
    .flatMap((file) => file.baseShape.classes.map((classRecord) => ({ sourcePath: file.sourcePath, sourceHash: file.baseShape.sourceHash, classRecord })));
}

function changedBranchClasses(stageFiles) {
  return stageFiles
    .filter((file) => file.changed && file.branchShape)
    .flatMap((file) => file.branchShape.classes.map((classRecord) => ({ sourcePath: file.sourcePath, sourceHash: file.branchShape.sourceHash, classRecord })));
}

function sourceShape(sourcePath, sourceText) {
  const declarations = scanTopLevelDeclarations(sourceText);
  const classes = scanClasses(sourceText);
  const moduleItems = uniqueByKey(declarations.map((declaration) => compactRecord({
    key: `${declaration.kind}:${declaration.name}`,
    kind: declaration.kind,
    name: declaration.name,
    exported: declaration.exported || undefined
  })), (item) => item.key);
  return {
    sourcePath,
    sourceHash: hashText(sourceText),
    moduleItems,
    moduleFingerprint: hashSemanticValue(moduleItems.map((item) => item.key).sort()),
    classes
  };
}

function scanTopLevelDeclarations(sourceText) {
  const declarations = [];
  for (const line of sourceText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
    const declaration = declarationFromLine(trimmed);
    if (declaration) declarations.push(declaration);
  }
  return declarations;
}

function declarationFromLine(trimmed) {
  const exported = /^export\b/.test(trimmed);
  const defaultExported = /^export\s+default\b/.test(trimmed);
  const source = trimmed
    .replace(/^export\s+default\s+/, 'default ')
    .replace(/^export\s+/, '')
    .replace(/^declare\s+/, '');
  let match = source.match(/^(?:default\s+)?(?:abstract\s+)?class\b(?:\s+(?!(?:extends|implements)\b)([A-Za-z_$][\w$]*))?/);
  if (match && (match[1] || defaultExported)) return { kind: 'class', name: match[1] ?? 'default', exported: exported || defaultExported };
  match = source.match(/^(?:namespace|module)\s+([A-Za-z_$][\w$.]*)\b/);
  if (match) return { kind: 'module', name: match[1], exported };
  match = source.match(/^(?:async\s+)?function\*?\s+([A-Za-z_$][\w$]*)\b/);
  if (match) return { kind: 'function', name: match[1], exported };
  match = source.match(/^interface\s+([A-Za-z_$][\w$]*)\b/);
  if (match) return { kind: 'interface', name: match[1], exported };
  match = source.match(/^type\s+([A-Za-z_$][\w$]*)\b/);
  if (match) return { kind: 'type', name: match[1], exported };
  match = source.match(/^(?:const\s+)?enum\s+([A-Za-z_$][\w$]*)\b/);
  if (match) return { kind: 'enum', name: match[1], exported };
  match = source.match(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\b/);
  if (match) return { kind: 'variable', name: match[1], exported };
  return undefined;
}

function scanClasses(sourceText) {
  const classes = [];
  const lines = sourceText.split(/\r?\n/);
  let offset = 0;
  for (const line of lines) {
    const match = line.match(/^\s*(?:export\s+)?(?:(default)\s+)?(?:declare\s+)?(?:abstract\s+)?class\b(?:\s+(?!(?:extends|implements)\b)([A-Za-z_$][\w$]*))?/);
    if (match && (match[1] || match[2])) {
      const name = match[2] ?? 'default';
      const classStart = offset + line.indexOf('class');
      const openIndex = sourceText.indexOf('{', classStart);
      const block = openIndex >= 0 ? balancedBlock(sourceText, openIndex) : undefined;
      classes.push(compactRecord({
        name,
        key: `class:${name}`,
        exported: /^\s*export\b/.test(line) || undefined,
        members: parseClassMembers(block?.body ?? '')
      }));
    }
    offset += line.length + 1;
  }
  return classes;
}

function parseClassMembers(body) {
  const members = [];
  const methodPattern = /(?:^|[;\n\r])\s*(?:(?:public|private|protected|static|async|override|readonly|abstract|accessor|get|set)\s+)*(?:async\s+)?(?:get\s+|set\s+)?(#?[A-Za-z_$][\w$]*)\??\s*(?:<[^({;]+>)?\s*\(([^)]*)\)/g;
  for (const match of body.matchAll(methodPattern)) {
    if (match[1] !== 'constructor') members.push({ kind: 'method', name: match[1], key: `method:${match[1]}` });
  }
  const propertyPattern = /(?:^|[;\n\r])\s*(?:(?:public|private|protected|static|readonly|declare|accessor)\s+)*(#?[A-Za-z_$][\w$]*)[?!]?\s*(?::\s*[^=;{]+)?(?:[=;]|$)/g;
  for (const match of body.matchAll(propertyPattern)) {
    if (match[1] !== 'constructor') members.push({ kind: 'property', name: match[1], key: `property:${match[1]}` });
  }
  return uniqueByKey(members, (member) => member.key);
}

function balancedBlock(sourceText, openIndex) {
  let depth = 0;
  for (let index = openIndex; index < sourceText.length; index += 1) {
    const char = sourceText[index];
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return { body: sourceText.slice(openIndex + 1, index), end: index + 1 };
    }
  }
  return { body: sourceText.slice(openIndex + 1), end: sourceText.length };
}

function moduleItemOverlap(left, right) {
  const rightKeys = new Set(right.moduleItems.map((item) => item.key));
  return left.moduleItems.map((item) => item.key).filter((key) => rightKeys.has(key));
}

function classMemberOverlap(left, right) {
  const rightKeys = new Set(right.members.map((member) => member.key));
  return left.members.map((member) => member.key).filter((key) => rightKeys.has(key));
}

function samePathCandidateCoversAllModuleItems(baseModule, candidates) {
  const samePath = candidates.find((candidate) => candidate.file.sourcePath === baseModule.sourcePath);
  return samePath ? samePath.overlap.length === baseModule.baseShape.moduleItems.length : false;
}

function sameIdentityCandidateCoversAllClassMembers(baseClass, branchClasses) {
  const sameIdentity = branchClasses.find((branchClass) => sameClassIdentity(baseClass, branchClass));
  return sameIdentity ? classMemberOverlap(baseClass.classRecord, sameIdentity.classRecord).length === baseClass.classRecord.members.length : false;
}

function sameClassIdentity(left, right) {
  return left.sourcePath === right.sourcePath && left.classRecord.name === right.classRecord.name;
}

function generatedProjectSourcePath(sourcePath) {
  const normalized = String(sourcePath ?? '').replace(/\\/g, '/');
  const basename = normalized.split('/').pop() ?? '';
  return /(?:^|\/)(?:dist|build|coverage|generated|__generated__)(?:\/|$)/.test(normalized)
    || /\.(?:generated|gen)\.[cm]?[jt]sx?$/.test(basename);
}

function moduleEvidence(shape) {
  if (!shape) return undefined;
  return compactRecord({
    sourcePath: shape.sourcePath,
    sourceHash: shape.sourceHash,
    declarationKeys: shape.moduleItems.map((item) => item.key),
    exportedDeclarationKeys: shape.moduleItems.filter((item) => item.exported).map((item) => item.key),
    classKeys: shape.classes.map((classRecord) => classRecord.key)
  });
}

function classEvidence(record) {
  if (!record) return undefined;
  return compactRecord({
    sourcePath: record.sourcePath,
    sourceHash: record.sourceHash,
    className: record.classRecord.name,
    classKey: record.classRecord.key,
    exported: record.classRecord.exported,
    memberKeys: record.classRecord.members.map((member) => member.key)
  });
}

function branchSourceText(file, branch) {
  if (branch === 'worker') {
    if (file.workerDeleted) return undefined;
    return typeof file.workerSourceText === 'string' ? file.workerSourceText : file.baseSourceText;
  }
  if (file.headDeleted) return undefined;
  return typeof file.headSourceText === 'string' ? file.headSourceText : file.baseSourceText;
}

function hashText(text) {
  return typeof text === 'string' ? hashSemanticValue(text) : undefined;
}

function uniqueByKey(records, keyForRecord) {
  const results = [];
  const seen = new Set();
  for (const record of records) {
    const key = keyForRecord(record);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    results.push(record);
  }
  return results;
}

export {
  changedBaseClasses,
  changedBaseModules,
  changedBranchClasses,
  changedBranchModules,
  classEvidence,
  classMemberOverlap,
  generatedProjectSourcePath,
  moduleEvidence,
  moduleItemOverlap,
  sameClassIdentity,
  sameIdentityCandidateCoversAllClassMembers,
  samePathCandidateCoversAllModuleItems,
  stageFileShape
};
