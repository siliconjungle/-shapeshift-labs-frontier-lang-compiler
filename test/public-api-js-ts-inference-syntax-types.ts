import * as compilerApi from '../src/index.js';

declare const typedCompilerTypeRecord: compilerApi.NativeProjectSymbolGraphCompilerTypeRecord;

typedCompilerTypeRecord.typeInferenceSyntaxCount satisfies number | undefined;
typedCompilerTypeRecord.typeInferenceSyntaxKinds?.[0] satisfies string | undefined;
typedCompilerTypeRecord.typeInferenceSyntaxHash satisfies string | undefined;
typedCompilerTypeRecord.satisfiesExpressionCount satisfies number | undefined;
typedCompilerTypeRecord.asConstAssertionCount satisfies number | undefined;
typedCompilerTypeRecord.constTypeParameterCount satisfies number | undefined;
typedCompilerTypeRecord.typeInferenceSyntax?.[0] satisfies compilerApi.NativeProjectSymbolGraphCompilerTypeInferenceSyntaxRecord | undefined;
typedCompilerTypeRecord.typeInferenceSyntax?.[0]?.kind satisfies string | undefined;
typedCompilerTypeRecord.typeInferenceSyntax?.[0]?.expressionTypeText satisfies string | undefined;
typedCompilerTypeRecord.typeInferenceSyntaxProof satisfies compilerApi.NativeProjectSymbolGraphCompilerTypeInferenceSyntaxProof | undefined;
typedCompilerTypeRecord.typeInferenceSyntaxProof?.status satisfies string | undefined;
typedCompilerTypeRecord.typeInferenceSyntaxProof?.sourcePath satisfies string | undefined;
typedCompilerTypeRecord.typeInferenceSyntaxProof?.sourceHash satisfies string | undefined;
typedCompilerTypeRecord.typeInferenceSyntaxProof?.sourceBoundPublicApi satisfies boolean | undefined;
typedCompilerTypeRecord.typeInferenceSyntaxProof?.missingSignals?.[0] satisfies string | undefined;
typedCompilerTypeRecord.typeInferenceSyntaxProof?.reasonCodes?.[0] satisfies string | undefined;
typedCompilerTypeRecord.typeInferenceSyntaxProof?.autoMergeClaim satisfies false | undefined;
typedCompilerTypeRecord.typeInferenceSyntaxProof?.semanticEquivalenceClaim satisfies false | undefined;
