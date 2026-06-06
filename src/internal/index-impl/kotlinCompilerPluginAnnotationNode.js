import{kotlinPsiAnnotationNames}from'./kotlinPsiAnnotationNames.js';
export function kotlinCompilerPluginAnnotationNode(node) {
  const names = kotlinPsiAnnotationNames(node);
  return names.some((name) => /^(Composable|Serializable|Parcelize|Entity|Immutable|Stable|AutoService|AssistedInject|Hilt|Inject|Room|KSerializable)$/i.test(name.replace(/^.*\./, '')));
}
