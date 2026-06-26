import * as compilerApi from '../src/index.js';

declare const typedCompilerTypeRecord: compilerApi.NativeProjectSymbolGraphCompilerTypeRecord;
declare const classMember: compilerApi.NativeProjectSymbolGraphCompilerClassMemberRecord;

typedCompilerTypeRecord.privateClassMemberCount satisfies number | undefined;
typedCompilerTypeRecord.privateClassMemberShapeHash satisfies string | undefined;
typedCompilerTypeRecord.privateClassMembers?.[0] satisfies compilerApi.NativeProjectSymbolGraphCompilerClassMemberRecord | undefined;
typedCompilerTypeRecord.accessorFieldCount satisfies number | undefined;
typedCompilerTypeRecord.accessorFieldShapeHash satisfies string | undefined;
typedCompilerTypeRecord.accessorFieldMembers?.[0] satisfies compilerApi.NativeProjectSymbolGraphCompilerClassMemberRecord | undefined;
typedCompilerTypeRecord.classMemberShapeProof satisfies compilerApi.NativeProjectSymbolGraphCompilerClassMemberShapeProof | undefined;
typedCompilerTypeRecord.classMemberShapeProof?.runtimeEquivalenceClaim satisfies false | undefined;
typedCompilerTypeRecord.classMemberShapeProof?.proofScope satisfies string | undefined;
typedCompilerTypeRecord.classMemberShapeProof?.classPrivateAccessorRuntimeHash satisfies string | undefined;
typedCompilerTypeRecord.classMemberShapeProof?.classPrivateAccessorRuntimeProof satisfies compilerApi.NativeProjectSymbolGraphCompilerClassPrivateAccessorRuntimeProof | undefined;
typedCompilerTypeRecord.classMemberShapeProof?.classPrivateAccessorRuntimeProofReasonCodes?.[0] satisfies string | undefined;
typedCompilerTypeRecord.classMemberShapeProof?.runtimeEquivalenceGap satisfies compilerApi.NativeProjectSymbolGraphCompilerClassPrivateAccessorRuntimeGap | undefined;
typedCompilerTypeRecord.classMemberShapeProof?.conflictRouting satisfies compilerApi.NativeProjectSymbolGraphCompilerClassPrivateAccessorRuntimeRouting | undefined;
typedCompilerTypeRecord.classPrivateAccessorRuntimeHash satisfies string | undefined;
typedCompilerTypeRecord.classPrivateAccessorRuntimeProof satisfies compilerApi.NativeProjectSymbolGraphCompilerClassPrivateAccessorRuntimeProof | undefined;
typedCompilerTypeRecord.classPrivateAccessorRuntimeProofReasonCodes?.[0] satisfies string | undefined;
typedCompilerTypeRecord.typeEquivalencePrivateClassMemberSetHash satisfies string | undefined;
typedCompilerTypeRecord.typeEquivalenceAccessorFieldSetHash satisfies string | undefined;
typedCompilerTypeRecord.typeEquivalenceProof?.privateClassMemberSetHash satisfies string | undefined;
typedCompilerTypeRecord.typeEquivalenceProof?.accessorFieldSetHash satisfies string | undefined;
typedCompilerTypeRecord.typeEquivalenceProof?.privateClassMemberCount satisfies number | undefined;
typedCompilerTypeRecord.typeEquivalenceProof?.accessorFieldCount satisfies number | undefined;

classMember.kind satisfies string | undefined;
classMember.name satisfies string | undefined;
classMember.privateIdentifier satisfies boolean | undefined;
classMember.accessorField satisfies boolean | undefined;
classMember.typeText satisfies string | undefined;
classMember.signatureText satisfies string | undefined;

declare const runtimeProof: compilerApi.NativeProjectSymbolGraphCompilerClassPrivateAccessorRuntimeProof;
runtimeProof.schema satisfies string | undefined;
runtimeProof.requiredSignals?.[0] satisfies string | undefined;
runtimeProof.classPrivateAccessorRuntimeHash satisfies string | undefined;
runtimeProof.privateBrandCheckTraceHash satisfies string | undefined;
runtimeProof.privateMethodCallTraceHash satisfies string | undefined;
runtimeProof.privateAccessorGetSetTraceHash satisfies string | undefined;
runtimeProof.staticPrivateMemberAccessTraceHash satisfies string | undefined;
runtimeProof.subclassPrivateBrandBoundaryTraceHash satisfies string | undefined;
runtimeProof.accessorDescriptorTraceHash satisfies string | undefined;
runtimeProof.command satisfies string | undefined;
runtimeProof.privateMemberRuntimeEquivalenceClaim satisfies false;
runtimeProof.accessorRuntimeEquivalenceClaim satisfies false;
