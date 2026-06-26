import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';

const HOST_RESOURCE_IMPORT_KINDS = Object.freeze({
  'css-import': 'css',
  'css-module-import': 'css-module',
  'html-import': 'html'
});

export function moduleHostResourceImportMetadata(moduleSpecifier, options = {}) {
  const hostDependencyKind = moduleHostResourceImportKind(moduleSpecifier);
  if (!hostDependencyKind) return {};
  const hostDependencyBase = options.hostDependencyBase ?? 'module-import';
  const hostDependencyExpressionText = options.expressionText ?? String(moduleSpecifier);
  return {
    hostDependency: true,
    hostDependencyKind,
    hostDependencyBase,
    hostDependencyExpressionText,
    hostDependencyExpressionHash: hashSemanticValue({
      kind: hostDependencyKind,
      moduleSpecifier,
      base: hostDependencyBase,
      expressionText: hostDependencyExpressionText
    }),
    hostDependencyStaticSpecifierEvidence: true,
    hostDependencyRuntimeResolutionClaim: false,
    hostDependencyResolutionProofRequired: true
  };
}

export function moduleHostResourceImportKind(moduleSpecifier) {
  const path = resourcePath(moduleSpecifier);
  if (!path) return undefined;
  if (/\.module\.css$/i.test(path)) return 'css-module-import';
  if (/\.css$/i.test(path)) return 'css-import';
  if (/\.html?$/i.test(path)) return 'html-import';
  return undefined;
}

export function hostResourceImportDependencyKind(hostDependencyKind) {
  return HOST_RESOURCE_IMPORT_KINDS[hostDependencyKind];
}

function resourcePath(moduleSpecifier) {
  const path = String(moduleSpecifier ?? '').split(/[?#]/, 1)[0];
  return path || undefined;
}
