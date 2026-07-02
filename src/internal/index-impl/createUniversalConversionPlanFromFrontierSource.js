import { parseFrontierFile, parseFrontierSource } from '@shapeshift-labs/frontier-lang-parser';
import { createUniversalConversionPlan } from './createUniversalConversionPlan.js';

export function createUniversalConversionPlanFromFrontierSource(source, options = {}) {
  const { fileName, parse, sourcePath, ...planOptions } = options;
  const document = fileName ? parseFrontierFile(fileName, source) : parseFrontierSource(source, parse);
  const plan = createUniversalConversionPlan({ ...planOptions, document });
  return {
    ...plan,
    document,
    ...(sourcePath ?? fileName ? { sourcePath: sourcePath ?? fileName } : {}),
    metadata: {
      ...plan.metadata,
      authoredFrontierSource: sourceMetadata(document, sourcePath ?? fileName)
    }
  };
}

function sourceMetadata(document, sourcePath) {
  const authored = document.metadata?.universalConversionPlan;
  return {
    documentId: document.id,
    ...(sourcePath ? { sourcePath } : {}),
    conversionPlanId: authored?.id,
    targets: authored?.targets ?? [],
    constraintFamilies: Object.keys(authored ?? {}).filter((key) => key.endsWith('Constraints') || key === 'resourceTransfers')
  };
}
