import * as compilerApi from '../src/index.js';

declare const typeRecord: compilerApi.NativeProjectSymbolGraphCompilerTypeRecord;
declare const proof: compilerApi.NativeProjectSymbolGraphCompilerTypeEquivalenceProof;

typeRecord.indexSignatureReadonlyCount satisfies number | undefined;
typeRecord.advancedTypeProofRequirement satisfies
  compilerApi.NativeProjectSymbolGraphCompilerAdvancedTypeProofRequirement | undefined;
typeRecord.advancedTypeProofRequirement?.requiredEvidence satisfies string | undefined;
typeRecord.advancedTypeProofRequirement?.requiredSignals?.[0] satisfies string | undefined;
typeRecord.advancedTypeProofRequirement?.sourcePath satisfies string | undefined;
typeRecord.advancedTypeProofRequirement?.sourceHash satisfies string | undefined;
typeRecord.advancedTypeProofRequirement?.sourceBound satisfies boolean | undefined;
typeRecord.advancedTypeProofRequirement?.autoMergeClaim satisfies false | undefined;
typeRecord.advancedTypeProofRequirement?.semanticEquivalenceClaim satisfies false | undefined;
typeRecord.advancedTypeMissingProof satisfies
  compilerApi.NativeProjectSymbolGraphCompilerAdvancedTypeMissingProof | undefined;
typeRecord.advancedTypeMissingProof?.reasonCode satisfies string | undefined;
typeRecord.advancedTypeMissingProof?.missingSignals?.[0] satisfies string | undefined;
typeRecord.advancedTypeMissingProof?.unsupportedSignals?.[0] satisfies string | undefined;
typeRecord.advancedTypeMissingProof?.autoMergeClaim satisfies false | undefined;
typeRecord.advancedTypeMissingProof?.semanticEquivalenceClaim satisfies false | undefined;

proof.sourceBoundPublicApi satisfies boolean | undefined;
proof.indexSignatureSetHash satisfies string | undefined;
proof.indexSignatureCount satisfies number | undefined;
proof.indexSignatureReadonlyCount satisfies number | undefined;
proof.unionTypeSetHash satisfies string | undefined;
proof.intersectionTypeSetHash satisfies string | undefined;
proof.tupleTypeSetHash satisfies string | undefined;
proof.unionTypeCount satisfies number | undefined;
proof.intersectionTypeCount satisfies number | undefined;
proof.tupleTypeCount satisfies number | undefined;
