import {
  bindingsForSourcePath,
  escapeRegExp,
  localKey,
  sourceSpanForRange
} from './projectSymbolGraphCssModuleUtils.js';
import {
  cssModuleAccessBlocker,
  cssModulePropBlocker,
  cssModuleUseSiteRecord
} from './projectSymbolGraphCssModuleRecords.js';
import {
  cssModuleExpressionHasBlockedAccess,
  cssModuleExpressionHasCall,
  cssModuleMemberAccess,
  cssModuleStaticExpressionAccess,
  identifierOccurrences
} from './projectSymbolGraphCssModuleMemberAccess.js';
import {
  cssModuleClassHelperCalleeEvidence,
  cssModuleClassHelperCallProof,
  cssModuleHelperArgumentIsConditional,
  cssModuleMemberWriteOperation
} from './projectSymbolGraphCssModuleClassHelpers.js';

function cssModuleLexicalUseSites(importBindings, sourceTextsByPath, scopeReferenceRecords = []) {
  const useSites = [];
  const blockers = [];
  for (const binding of importBindings) {
    if (!binding.localName) continue;
    const sourceText = sourceTextsByPath.get(binding.sourcePath);
    if (typeof sourceText !== 'string') {
      blockers.push(cssModuleAccessBlocker(binding, '', 0, 0, 'css-module-import-resolution-unproved'));
      continue;
    }
    if (binding.importKind === 'named') {
      useSites.push(...cssModuleNamedImportUseSites(binding, sourceText, scopeReferenceRecords, blockers));
      continue;
    }
    if (binding.importKind !== 'default' && binding.importKind !== 'namespace') continue;
    useSites.push(...cssModuleDestructuringUseSites(binding, sourceText, blockers));
    useSites.push(...cssModuleMemberUseSites(binding, sourceText, blockers));
  }
  return { useSites, blockers };
}

function cssModuleNamedImportUseSites(binding, sourceText, scopeReferenceRecords, blockers) {
  const references = scopeReferenceRecords.filter((reference) => cssModuleNamedImportReferenceMatches(reference, binding));
  if (!references.length) {
    blockers.push(cssModuleAccessBlocker(binding, sourceText, 0, 0, 'css-module-named-export-reference-unproved', binding.localName));
    return [];
  }
  return references.flatMap((reference) => {
    const span = sourceSpanForScopeReference(sourceText, binding, reference);
    if (!span) return [];
    return [cssModuleUseSiteRecord(binding, {
      useSiteKind: 'named-import-reference',
      accessKind: 'named-import',
      exportName: binding.importedName ?? binding.localName,
      localReferenceName: binding.localName,
      expressionText: sourceText.slice(span.start, span.end),
      sourcePath: binding.sourcePath,
      sourceHash: binding.sourceHash,
      sourceSpan: span,
      scopeReferenceRecordId: reference.id
    })];
  });
}

function cssModuleNamedImportReferenceMatches(reference, binding) {
  if (!reference || binding.importKind !== 'named') return false;
  if (reference.sourcePath !== binding.sourcePath) return false;
  if (reference.bindingKind !== 'import' || reference.importAlias !== true) return false;
  if ((reference.bindingName ?? reference.name) !== binding.localName) return false;
  if (reference.moduleSpecifier && reference.moduleSpecifier !== binding.moduleSpecifier) return false;
  const referenceExportName = reference.importedName ?? reference.resolvedExportName ?? reference.originExportedName;
  if (binding.importedName && referenceExportName && referenceExportName !== binding.importedName) return false;
  const referenceSourcePath = reference.resolvedSourcePath ?? reference.originSourcePath;
  if (binding.cssModuleSourcePath && referenceSourcePath && referenceSourcePath !== binding.cssModuleSourcePath) return false;
  return true;
}

function sourceSpanForScopeReference(sourceText, binding, reference) {
  if (reference.sourceSpan && Number.isInteger(reference.sourceSpan.start) && Number.isInteger(reference.sourceSpan.end)) return reference.sourceSpan;
  if (Number.isInteger(reference.start) && Number.isInteger(reference.end)) {
    return sourceSpanForRange(sourceText, binding.sourcePath, binding.sourceHash, reference.start, reference.end);
  }
  return undefined;
}

function cssModuleMemberUseSites(binding, sourceText, blockers) {
  const useSites = [];
  for (const occurrence of identifierOccurrences(sourceText, binding.localName)) {
    const access = cssModuleMemberAccess(sourceText, occurrence.end);
    if (!access) continue;
    if (access.status === 'blocked') {
      blockers.push(cssModuleAccessBlocker(binding, sourceText, occurrence.start, access.end ?? occurrence.end, access.reasonCode, access.expressionText));
      continue;
    }
    const writeOperation = cssModuleMemberWriteOperation(sourceText, occurrence.start, access.end);
    if (writeOperation) {
      blockers.push(cssModuleAccessBlocker(binding, sourceText, occurrence.start, access.end, 'css-module-member-write-unsupported', sourceText.slice(occurrence.start, access.end), { writeOperation }));
      continue;
    }
    useSites.push(cssModuleUseSiteRecord(binding, {
      useSiteKind: 'scope-member-read',
      accessKind: access.accessKind,
      exportName: access.memberName,
      receiverLocalName: binding.localName,
      expressionText: sourceText.slice(occurrence.start, access.end),
      sourcePath: binding.sourcePath,
      sourceHash: binding.sourceHash,
      sourceSpan: sourceSpanForRange(sourceText, binding.sourcePath, binding.sourceHash, occurrence.start, access.end)
    }));
  }
  return useSites;
}

function cssModuleDestructuringUseSites(binding, sourceText, blockers) {
  const useSites = [];
  const pattern = new RegExp(`\\b(?:const|let|var)\\s*\\{([\\s\\S]*?)\\}\\s*=\\s*${escapeRegExp(binding.localName)}\\b`, 'g');
  for (const match of sourceText.matchAll(pattern)) {
    const body = match[1] ?? '';
    const bodyStart = match.index + match[0].indexOf(body);
    for (const part of splitTopLevelComma(body, bodyStart)) {
      const text = part.text.trim();
      if (!text) continue;
      if (text.startsWith('...')) {
        blockers.push(cssModuleAccessBlocker(binding, sourceText, part.offset, part.offset + part.text.length, 'css-module-destructuring-rest-unsupported', part.text));
        continue;
      }
      const property = destructuringProperty(text);
      if (!property?.exportName) continue;
      useSites.push(cssModuleUseSiteRecord(binding, {
        useSiteKind: 'destructured-binding',
        accessKind: 'destructure',
        exportName: property.exportName,
        receiverLocalName: binding.localName,
        localReferenceName: property.localName,
        expressionText: text,
        sourcePath: binding.sourcePath,
        sourceHash: binding.sourceHash,
        sourceSpan: sourceSpanForRange(sourceText, binding.sourcePath, binding.sourceHash, part.offset, part.offset + part.text.length)
      }));
    }
  }
  return useSites;
}

function cssModuleJsxUseSites(bindingsByLocal, jsxPropRecords, importEdges = []) {
  const useSites = [];
  const blockers = [];
  const helperCalleeEvidence = cssModuleClassHelperCalleeEvidence(importEdges);
  for (const prop of jsxPropRecords ?? []) {
    const root = prop.propValueReferenceRoot;
    const sourceBindings = root ? bindingsByLocal.get(localKey(prop.sourcePath, root)) ?? [] : [];
    useSites.push(...cssModuleJsxStaticUseSites(sourceBindings, prop));
    const classNameBindings = bindingsForSourcePath(bindingsByLocal, prop.sourcePath);
    if (prop.propName !== 'className' || !classNameBindings.length) continue;
    useSites.push(...cssModuleJsxStaticComputedUseSites(classNameBindings, prop));
    useSites.push(...cssModuleJsxHelperUseSites(classNameBindings, prop, helperCalleeEvidence));
    blockers.push(...cssModuleJsxBlockers(classNameBindings, prop, helperCalleeEvidence));
  }
  return { useSites, blockers };
}

function cssModuleJsxStaticUseSites(sourceBindings, prop) {
  if (prop.propName !== 'className' || (prop.propValueKind !== 'reference' && prop.propValueKind !== 'optional-reference')) return [];
  const referencePath = prop.propValueReferencePath ?? [];
  if (referencePath.length < 2) return [];
  return sourceBindings.map((binding) => cssModuleUseSiteRecord(binding, {
    useSiteKind: 'jsx-className',
    accessKind: 'dot',
    exportName: referencePath[1],
    receiverLocalName: referencePath[0],
    expressionText: prop.propValueExpressionText,
    sourcePath: prop.sourcePath,
    sourceHash: prop.sourceHash,
    sourceSpan: prop.sourceSpan,
    jsxPropRecordId: prop.id,
    conditionalRuntimePresence: prop.propValueKind === 'optional-reference' || undefined
  }));
}

function cssModuleJsxStaticComputedUseSites(classNameBindings, prop) {
  if (prop.propValueKind === 'reference' || prop.propValueKind === 'optional-reference') return [];
  const expressionText = prop.propValueExpressionText ?? prop.propValueDynamicText ?? '';
  return classNameBindings.flatMap((binding) => {
    const access = cssModuleStaticExpressionAccess(expressionText, binding.localName);
    if (!access) return [];
    return [cssModuleUseSiteRecord(binding, {
      useSiteKind: 'jsx-className',
      accessKind: access.accessKind,
      exportName: access.memberName,
      receiverLocalName: binding.localName,
      expressionText,
      sourcePath: prop.sourcePath,
      sourceHash: prop.sourceHash,
      sourceSpan: prop.sourceSpan,
      jsxPropRecordId: prop.id,
      conditionalRuntimePresence: access.optional || undefined
    })];
  });
}

function cssModuleJsxHelperUseSites(classNameBindings, prop, helperCalleeEvidence) {
  const expressionText = prop.propValueExpressionText ?? prop.propValueDynamicText ?? '';
  if (!cssModuleExpressionHasCall(expressionText)) return [];
  const useSites = [];
  for (const binding of classNameBindings) {
    const helperProof = cssModuleClassHelperCallProof(expressionText, binding, prop, helperCalleeEvidence);
    for (const occurrence of identifierOccurrences(expressionText, binding.localName)) {
      const access = cssModuleMemberAccess(expressionText, occurrence.end);
      if (!access || access.status === 'blocked') continue;
      if (cssModuleMemberWriteOperation(expressionText, occurrence.start, access.end)) continue;
      useSites.push(cssModuleUseSiteRecord(binding, {
        useSiteKind: 'jsx-className-helper',
        accessKind: access.accessKind,
        exportName: access.memberName,
        receiverLocalName: binding.localName,
        expressionText: expressionText.slice(occurrence.start, access.end),
        sourcePath: prop.sourcePath,
        sourceHash: prop.sourceHash,
        sourceSpan: prop.sourceSpan,
        jsxPropRecordId: prop.id,
        conditionalRuntimePresence: cssModuleHelperArgumentIsConditional(expressionText, occurrence.start) || undefined,
        helperCallProofLevel: helperProof?.proofLevel,
        helperCallGraphHash: helperProof?.helperCallGraphHash,
        helperCalleeName: helperProof?.helperCalleeName,
        helperCalleeRoot: helperProof?.helperCalleeRoot,
        helperCalleeSource: helperProof?.helperCalleeSource,
        helperModuleSpecifier: helperProof?.helperModuleSpecifier,
        helperImportEdgeId: helperProof?.helperImportEdgeId
      }));
    }
  }
  return useSites;
}

function cssModuleJsxBlockers(classNameBindings, prop, helperCalleeEvidence) {
  if (prop.propValueKind === 'string') {
    return classNameBindings.map((binding) => cssModulePropBlocker(binding, prop, 'css-module-string-literal-classname-unproved'));
  }
  const expressionText = prop.propValueExpressionText ?? prop.propValueDynamicText ?? '';
  if (!expressionText) return [];
  return classNameBindings.flatMap((binding) => {
    if (!expressionText.includes(binding.localName)) return [];
    const reasonCodes = [];
    const helperProof = cssModuleClassHelperCallProof(expressionText, binding, prop, helperCalleeEvidence);
    if (cssModuleExpressionHasCall(expressionText) && !helperProof) reasonCodes.push('css-module-helper-call-unproved');
    if (cssModuleExpressionHasBlockedAccess(expressionText, binding.localName)) reasonCodes.push('css-module-dynamic-member-access-unproved');
    if (!reasonCodes.length && cssModuleStaticExpressionAccess(expressionText, binding.localName)) return [];
    if (!reasonCodes.length && prop.propValueDynamicBlockerReasonCode) {
      const dynamicReason = jsxDynamicReason(prop.propValueDynamicBlockerReasonCode);
      if (dynamicReason !== 'css-module-helper-call-unproved' || !helperProof) reasonCodes.push(dynamicReason);
    }
    return [...new Set(reasonCodes)].map((reasonCode) => cssModulePropBlocker(binding, prop, reasonCode));
  });
}

function destructuringProperty(text) {
  const value = String(text ?? '').trim();
  const [rawName, rawLocal] = value.split(':').map((part) => part.trim());
  const exportName = rawName?.match(/^([A-Za-z_$][\w$]*)$/)?.[1];
  const localName = (rawLocal ?? rawName)?.match(/^([A-Za-z_$][\w$]*)$/)?.[1];
  return exportName ? { exportName, localName } : undefined;
}

function splitTopLevelComma(text, baseOffset) {
  const parts = [];
  let start = 0;
  let brace = 0, bracket = 0, paren = 0;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '{') brace += 1;
    else if (char === '}') brace = Math.max(0, brace - 1);
    else if (char === '[') bracket += 1;
    else if (char === ']') bracket = Math.max(0, bracket - 1);
    else if (char === '(') paren += 1;
    else if (char === ')') paren = Math.max(0, paren - 1);
    if (char === ',' && brace === 0 && bracket === 0 && paren === 0) {
      parts.push({ text: text.slice(start, index), offset: baseOffset + start });
      start = index + 1;
    }
  }
  parts.push({ text: text.slice(start), offset: baseOffset + start });
  return parts;
}

function jsxDynamicReason(reasonCode) {
  if (reasonCode.includes('call')) return 'css-module-helper-call-unproved';
  if (reasonCode.includes('computed')) return 'css-module-dynamic-member-access-unproved';
  return 'css-module-helper-dynamic-argument-unsupported';
}

export { cssModuleJsxUseSites, cssModuleLexicalUseSites };
