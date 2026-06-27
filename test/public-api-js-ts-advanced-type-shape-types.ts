import * as compilerApi from '../src/index.js';

declare const typeRecord: compilerApi.NativeProjectSymbolGraphCompilerTypeRecord;
declare const shapeRecord: compilerApi.NativeProjectSymbolGraphCompilerAdvancedTypeShapeRecord;

typeRecord.templateLiteralTypeCount satisfies number | undefined;
typeRecord.inferTypeCount satisfies number | undefined;
typeRecord.typeEquivalenceTemplateLiteralTypeSetHash satisfies string | undefined;
typeRecord.typeEquivalenceInferTypeSetHash satisfies string | undefined;
typeRecord.typeEquivalenceProof?.templateLiteralTypeSetHash satisfies string | undefined;
typeRecord.typeEquivalenceProof?.inferTypeSetHash satisfies string | undefined;
typeRecord.typeEquivalenceProof?.templateLiteralTypeCount satisfies number | undefined;
typeRecord.typeEquivalenceProof?.inferTypeCount satisfies number | undefined;
typeRecord.unionTypeCount satisfies number | undefined;
typeRecord.intersectionTypeCount satisfies number | undefined;
typeRecord.tupleTypeCount satisfies number | undefined;
typeRecord.typeEquivalenceUnionTypeSetHash satisfies string | undefined;
typeRecord.typeEquivalenceIntersectionTypeSetHash satisfies string | undefined;
typeRecord.typeEquivalenceTupleTypeSetHash satisfies string | undefined;
typeRecord.typeEquivalenceProof?.unionTypeSetHash satisfies string | undefined;
typeRecord.typeEquivalenceProof?.intersectionTypeSetHash satisfies string | undefined;
typeRecord.typeEquivalenceProof?.tupleTypeSetHash satisfies string | undefined;
typeRecord.typeEquivalenceProof?.unionTypeCount satisfies number | undefined;
typeRecord.typeEquivalenceProof?.intersectionTypeCount satisfies number | undefined;
typeRecord.typeEquivalenceProof?.tupleTypeCount satisfies number | undefined;
typeRecord.advancedTypeProofRequirement satisfies
  compilerApi.NativeProjectSymbolGraphCompilerAdvancedTypeProofRequirement | undefined;
typeRecord.advancedTypeProofRequirement?.requiredSignals?.[0] satisfies string | undefined;
typeRecord.advancedTypeProofRequirement?.sourceBound satisfies boolean | undefined;
typeRecord.advancedTypeProofRequirement?.autoMergeClaim satisfies false | undefined;
typeRecord.advancedTypeMissingProof satisfies
  compilerApi.NativeProjectSymbolGraphCompilerAdvancedTypeMissingProof | undefined;
typeRecord.advancedTypeMissingProof?.reasonCode satisfies string | undefined;
typeRecord.advancedTypeMissingProof?.semanticEquivalenceClaim satisfies false | undefined;
shapeRecord.templateHeadText satisfies string | undefined;
shapeRecord.templateSpanCount satisfies number | undefined;
shapeRecord.templateSpanTexts?.[0] satisfies string | undefined;
shapeRecord.templateSpanTypeTexts?.[0] satisfies string | undefined;
shapeRecord.templateLiteralTexts?.[0] satisfies string | undefined;
shapeRecord.typeParameterText satisfies string | undefined;
shapeRecord.typeParameterName satisfies string | undefined;
shapeRecord.constraintTypeText satisfies string | undefined;
shapeRecord.memberTypeTexts?.[0] satisfies string | undefined;
shapeRecord.tupleElementTypeTexts?.[0] satisfies string | undefined;
