export function appendManagedReferenceAliases(output, bundle, owner, helpers) {
  for (const record of managedReferenceRecords(bundle)) {
    const base = helpers.managedBase(bundle, owner, record.match, record.name, record.referenceKind);
    output.resources.push(helpers.resource(base, record.name, `${bundle.language}-managed-reference-resource`, {
      referenceKind: record.referenceKind,
      targetType: record.targetType,
      referenceStrength: record.referenceStrength
    }));
    output.lifetimeRegions.push(helpers.lifetime(base, `${record.name} managed reference lifetime`, `${bundle.language}-managed-reference-region`));
    output.aliases.push(helpers.alias(base, record.referenceKind, {
      targetType: record.targetType,
      referenceStrength: record.referenceStrength,
      aliasSemantics: record.referenceStrength === 'weak' ? 'managed-weak-reference' : 'managed-unowned-reference'
    }));
  }
}

export function appendManagedFinalizers(output, bundle, owner, helpers) {
  for (const record of managedFinalizerRecords(bundle)) {
    const base = helpers.managedBase(bundle, owner, record.match, record.name, record.finalizerKind);
    output.resources.push(helpers.resource(base, record.name, `${bundle.language}-finalizer-resource`, {
      finalizerKind: record.finalizerKind,
      finalizerSemantics: 'managed-nondeterministic-finalizer'
    }));
    output.lifetimeRegions.push(helpers.lifetime(base, `${record.name} finalizer lifetime`, `${bundle.language}-finalizer-region`));
    output.drops.push(helpers.drop(base, record.finalizerKind, {
      automatic: true,
      finalizerSemantics: 'managed-nondeterministic-finalizer',
      dropSemantics: 'managed-finalizer'
    }));
    output.unsafeBoundaries.push(helpers.unsafe(base, `${bundle.language}-finalizer-nondeterministic-boundary`, {
      finalizerKind: record.finalizerKind,
      finalizerSemantics: 'managed-nondeterministic-finalizer'
    }));
  }
}

export function disposalSemanticsFor(bundle, dropKind) {
  if (/defer/.test(dropKind)) return `${bundle.language}-defer-disposal`;
  if (/auto-close|dispose|close/.test(dropKind)) return `${bundle.language}-deterministic-disposal`;
  return `${bundle.language}-managed-disposal`;
}

function managedReferenceRecords(bundle) {
  if (bundle.language === 'swift') return swiftReferenceRecords(bundle.sourceText);
  if (bundle.language === 'java' || bundle.language === 'kotlin') return jvmWeakReferenceRecords(bundle.sourceText, bundle.language);
  if (bundle.language === 'csharp') return csharpWeakReferenceRecords(bundle.sourceText);
  return [];
}

function swiftReferenceRecords(sourceText) {
  return [...String(sourceText).matchAll(/\b(?:weak|unowned)\s+(?:var|let)\s+([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([A-Za-z_][A-Za-z0-9_.<>?]*)/g)]
    .map((match) => ({
      match,
      name: match[1],
      targetType: match[2],
      referenceStrength: match[0].trimStart().startsWith('weak') ? 'weak' : 'unowned',
      referenceKind: match[0].trimStart().startsWith('weak') ? 'swift-weak-reference' : 'swift-unowned-reference'
    }));
}

function jvmWeakReferenceRecords(sourceText, language) {
  return [...String(sourceText).matchAll(/\bWeakReference\s*<\s*([^>]+)\s*>\s+([A-Za-z_][A-Za-z0-9_]*)/g)]
    .map((match) => ({
      match,
      name: match[2],
      targetType: match[1].trim(),
      referenceStrength: 'weak',
      referenceKind: `${language}-weak-reference`
    }));
}

function csharpWeakReferenceRecords(sourceText) {
  return [...String(sourceText).matchAll(/\bWeakReference(?:\s*<\s*([^>]+)\s*>)?\s+([A-Za-z_][A-Za-z0-9_]*)/g)]
    .map((match) => ({
      match,
      name: match[2],
      targetType: match[1]?.trim(),
      referenceStrength: 'weak',
      referenceKind: 'csharp-weak-reference'
    }));
}

function managedFinalizerRecords(bundle) {
  if (bundle.language === 'java') return javaFinalizers(bundle.sourceText);
  if (bundle.language === 'csharp') return csharpFinalizers(bundle.sourceText);
  if (bundle.language === 'swift') return swiftFinalizers(bundle.sourceText);
  return [];
}

function javaFinalizers(sourceText) {
  return [...String(sourceText).matchAll(/\b(?:protected|public)?\s*void\s+finalize\s*\(\s*\)/g)]
    .map((match, index) => ({ match, name: `java_finalize_${index + 1}`, finalizerKind: 'java-finalize-method' }));
}

function csharpFinalizers(sourceText) {
  return [...String(sourceText).matchAll(/~\s*([A-Za-z_][A-Za-z0-9_]*)\s*\(\s*\)/g)]
    .map((match) => ({ match, name: match[1], finalizerKind: 'csharp-finalizer' }));
}

function swiftFinalizers(sourceText) {
  return [...String(sourceText).matchAll(/\bdeinit\s*\{/g)]
    .map((match, index) => ({ match, name: `swift_deinit_${index + 1}`, finalizerKind: 'swift-deinit' }));
}

export function managedHelperSet({ managedBase, resource, lifetime, drop, alias, unsafe }) {
  return { managedBase, resource, lifetime, drop, alias, unsafe };
}
