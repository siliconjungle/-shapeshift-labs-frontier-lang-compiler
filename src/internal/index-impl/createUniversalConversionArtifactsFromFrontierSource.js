import { createUniversalConversionArtifacts } from './createUniversalConversionArtifacts.js';
import { createUniversalConversionPlanFromFrontierSource } from './createUniversalConversionPlanFromFrontierSource.js';

export function createUniversalConversionArtifactsFromFrontierSource(source, options = {}, artifactOptions = {}) {
  const plan = createUniversalConversionPlanFromFrontierSource(source, options);
  const artifacts = createUniversalConversionArtifacts(plan, artifactOptions);
  return {
    ...artifacts,
    document: plan.document,
    plan,
    ...(plan.sourcePath ? { sourcePath: plan.sourcePath } : {}),
    metadata: {
      ...artifacts.metadata,
      authoredFrontierSource: plan.metadata.authoredFrontierSource
    }
  };
}
