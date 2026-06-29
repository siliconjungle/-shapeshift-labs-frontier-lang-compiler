import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';

function cssModuleGeneratedClassNameMapHash(generatedClassNameMap) {
  return hashSemanticValue({
    kind: 'frontier.lang.css.modules.generatedClassNameMap.v1',
    generatedClassNameMap
  });
}

function cssModuleSourceMapIdentityFixture({
  sourcePath,
  sourceText,
  generatedClassNameMap,
  bundlerTransformHash,
  generatedSourceText = generatedCssModuleText(sourcePath, generatedClassNameMap)
}) {
  const generatedClassNameMapHash = cssModuleGeneratedClassNameMapHash(generatedClassNameMap);
  const generatedSourceHash = hashSemanticValue(generatedSourceText);
  return {
    generatedClassNameMapHash,
    cssModuleGeneratedSourceHash: generatedSourceHash,
    sourceMapIdentityProof: {
      schema: 'frontier.lang.cssModuleSourceMapIdentityProof.v1',
      kind: 'frontier.lang.cssModuleSourceMapIdentityProof',
      status: 'passed',
      sourcePath,
      originalSourceHash: hashSemanticValue(sourceText),
      generatedSourcePath: `dist/${sourcePath.split('/').pop()}`,
      generatedSourceHash,
      generatedClassNameMapHash,
      bundlerTransformHash,
      mappings: [{
        originalSourcePath: sourcePath,
        generatedSourcePath: `dist/${sourcePath.split('/').pop()}`,
        originalStart: 0,
        originalEnd: Math.max(1, sourceText.length),
        generatedStart: 0,
        generatedEnd: Math.max(1, generatedSourceText.length)
      }],
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      runtimeEquivalenceClaim: false,
      sourceMapIdentityClaim: true,
      claimScope: 'css-module-source-map-generated-class-identity-only'
    }
  };
}

function generatedCssModuleText(sourcePath, generatedClassNameMap) {
  return [
    `/* generated from ${sourcePath} */`,
    ...Object.values(generatedClassNameMap).map((className) => `.${className} {}`),
    ''
  ].join('\n');
}

export { cssModuleGeneratedClassNameMapHash, cssModuleSourceMapIdentityFixture };
