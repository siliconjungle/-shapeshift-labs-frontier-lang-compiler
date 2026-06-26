import * as compilerApi from '../src/index.js';

declare const typedCompilerTypeRecord: compilerApi.NativeProjectSymbolGraphCompilerTypeRecord;
declare const decoratorRecord: compilerApi.NativeProjectSymbolGraphCompilerDecoratorMetadataRecord;
declare const decoratorProof: compilerApi.NativeProjectSymbolGraphCompilerDecoratorMetadataProof;
declare const decoratorRuntimeProof: compilerApi.NativeProjectSymbolGraphCompilerDecoratorRuntimeExecutionProof;

typedCompilerTypeRecord.decoratorMetadataCount satisfies number | undefined;
typedCompilerTypeRecord.classDecoratorCount satisfies number | undefined;
typedCompilerTypeRecord.memberDecoratorCount satisfies number | undefined;
typedCompilerTypeRecord.parameterDecoratorCount satisfies number | undefined;
typedCompilerTypeRecord.decoratorMetadataHash satisfies string | undefined;
typedCompilerTypeRecord.decoratorRuntimeExecutionHash satisfies string | undefined;
typedCompilerTypeRecord.decoratorRuntimeExecutionProof satisfies
  compilerApi.NativeProjectSymbolGraphCompilerDecoratorRuntimeExecutionProof | undefined;
typedCompilerTypeRecord.decoratorRuntimeExecutionProofReasonCodes?.[0] satisfies string | undefined;
typedCompilerTypeRecord.decoratorMetadata?.[0] satisfies
  compilerApi.NativeProjectSymbolGraphCompilerDecoratorMetadataRecord | undefined;
typedCompilerTypeRecord.decoratorMetadataProof satisfies
  compilerApi.NativeProjectSymbolGraphCompilerDecoratorMetadataProof | undefined;
typedCompilerTypeRecord.decoratorMetadataProof?.runtimeEquivalenceClaim satisfies false | undefined;
typedCompilerTypeRecord.decoratorMetadataProof?.decoratorExecutionEquivalenceClaim satisfies false | undefined;
typedCompilerTypeRecord.decoratorMetadataProof?.runtimeExecutionEquivalenceGap?.proofReasonCodes?.[0] satisfies string | undefined;
typedCompilerTypeRecord.decoratorMetadataProof?.decoratorRuntimeExecutionProof satisfies
  compilerApi.NativeProjectSymbolGraphCompilerDecoratorRuntimeExecutionProof | undefined;
typedCompilerTypeRecord.decoratorMetadataProof?.conflictRouting?.status satisfies string | undefined;

decoratorRecord.kind satisfies string;
decoratorRecord.targetKind satisfies string | undefined;
decoratorRecord.className satisfies string | undefined;
decoratorRecord.memberName satisfies string | undefined;
decoratorRecord.parameterName satisfies string | undefined;
decoratorRecord.expressionText satisfies string | undefined;
decoratorRecord.expressionHash satisfies string | undefined;
decoratorRecord.sourceSpan?.startLine satisfies number | undefined;
decoratorRecord.staticDecoratorMetadataEvidence satisfies true;
decoratorRecord.decoratorExecutionEquivalenceClaim satisfies false;
decoratorRecord.runtimeEquivalenceClaim satisfies false;
decoratorRecord.semanticEquivalenceClaim satisfies false;

decoratorProof.staticDecoratorMetadataEvidence satisfies true;
decoratorProof.autoMergeClaim satisfies false;
decoratorProof.semanticEquivalenceClaim satisfies false;
decoratorProof.decoratorRuntimeExecutionHash satisfies string | undefined;
decoratorProof.decoratorRuntimeExecutionProofReasonCodes?.[0] satisfies string | undefined;
decoratorProof.decoratorRuntimeExecutionProof?.decoratorFactoryCallOrderHash satisfies string | undefined;
decoratorProof.runtimeExecutionEquivalenceGap?.failClosed satisfies true | undefined;
decoratorProof.conflictRouting?.reasonCode satisfies string | undefined;

decoratorRuntimeProof.schema satisfies string | undefined;
decoratorRuntimeProof.kind satisfies string | undefined;
decoratorRuntimeProof.status satisfies string;
decoratorRuntimeProof.sourcePath satisfies string | undefined;
decoratorRuntimeProof.sourceHash satisfies string | undefined;
decoratorRuntimeProof.decoratorRuntimeExecutionHash satisfies string | undefined;
decoratorRuntimeProof.decoratorFactoryCallOrderHash satisfies string | undefined;
decoratorRuntimeProof.decoratorInvocationOrderHash satisfies string | undefined;
decoratorRuntimeProof.decoratorSideEffectTraceHash satisfies string | undefined;
decoratorRuntimeProof.decoratorResultApplicationHash satisfies string | undefined;
decoratorRuntimeProof.decoratorEmitRuntimeEquivalenceHash satisfies string | undefined;
decoratorRuntimeProof.autoMergeClaim satisfies false;
decoratorRuntimeProof.semanticEquivalenceClaim satisfies false;
decoratorRuntimeProof.runtimeEquivalenceClaim satisfies false;
decoratorRuntimeProof.decoratorExecutionEquivalenceClaim satisfies false;
decoratorRuntimeProof.decoratorEmitRuntimeEquivalenceClaim satisfies false;
