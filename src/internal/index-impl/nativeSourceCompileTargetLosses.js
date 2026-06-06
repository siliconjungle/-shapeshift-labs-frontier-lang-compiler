import{idFragment}from'../../native-import-utils.js';
import{nativeSourceCompileTargetLoss}from'./nativeSourceCompileTargetLoss.js';
export function nativeSourceCompileTargetLosses(input) {
  const { importResult, projection, targetCoverage, sourceLanguage, target, idPart } = input;
  if (!targetCoverage || targetCoverage.lossClass === 'exactSourceProjection') return [];
  if (targetCoverage.lossClass === 'missingAdapter') {
    return [nativeSourceCompileTargetLoss({
      id: `loss_${idPart}_${idFragment(target)}_missing_projection_adapter`,
      severity: 'error',
      message: targetCoverage.reason,
      importResult,
      projection,
      targetCoverage,
      sourceLanguage,
      target
    })];
  }
  if (targetCoverage.lossClass === 'unsupportedTargetFeatures') {
    return [nativeSourceCompileTargetLoss({
      id: `loss_${idPart}_${idFragment(target)}_unsupported_target_features`,
      severity: 'warning',
      message: targetCoverage.reason,
      importResult,
      projection,
      targetCoverage,
      sourceLanguage,
      target
    })];
  }
  if (targetCoverage.lossClass === 'nativeSourceStubs') {
    return [nativeSourceCompileTargetLoss({
      id: `loss_${idPart}_${idFragment(target)}_target_stubs`,
      severity: 'warning',
      message: targetCoverage.reason,
      importResult,
      projection,
      targetCoverage,
      sourceLanguage,
      target
    })];
  }
  return [];
}
