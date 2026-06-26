import type {
  NativeProjectSymbolGraphCompilerCallableSignatureEquivalenceProof,
  NativeProjectSymbolGraphCompilerTypeRecord
} from '../src/index.js';

declare const typeRecord: NativeProjectSymbolGraphCompilerTypeRecord;
declare const callableProof: NativeProjectSymbolGraphCompilerCallableSignatureEquivalenceProof;

typeRecord.typeEquivalenceCallSignatureSetHash satisfies string | undefined;
typeRecord.typeEquivalenceConstructSignatureSetHash satisfies string | undefined;
typeRecord.callableSignatureEquivalenceProof satisfies NativeProjectSymbolGraphCompilerCallableSignatureEquivalenceProof | undefined;
typeRecord.callableSignatureEquivalenceProof?.callSignatureSetHash satisfies string | undefined;
typeRecord.callableSignatureEquivalenceProof?.constructSignatureSetHash satisfies string | undefined;
typeRecord.typeEquivalenceProof?.callSignatureSetHash satisfies string | undefined;
typeRecord.typeEquivalenceProof?.constructSignatureSetHash satisfies string | undefined;
callableProof.autoMergeClaim satisfies false | undefined;
callableProof.semanticEquivalenceClaim satisfies false | undefined;
