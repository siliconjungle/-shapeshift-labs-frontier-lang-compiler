import * as compilerApi from '../src/index.js';

declare const graph: compilerApi.NativeProjectSymbolGraphSummary | undefined;

const scopeBinding = graph?.scopeBindingRecords[0];
scopeBinding satisfies compilerApi.NativeProjectSymbolGraphScopeBindingRecord | undefined;
scopeBinding?.useHash satisfies string | undefined;
scopeBinding?.resolvedUseHash satisfies string | undefined;
scopeBinding?.closureCaptureHash satisfies string | undefined;
scopeBinding?.exportedNames?.[0] satisfies string | undefined;

const scopeReference = graph?.scopeReferenceRecords[0];
scopeReference satisfies compilerApi.NativeProjectSymbolGraphScopeReferenceRecord | undefined;
scopeReference?.bindingId satisfies string | undefined;
scopeReference?.resolvedUseHash satisfies string | undefined;
scopeReference?.templateLiteralInterpolation satisfies boolean | undefined;
scopeReference?.templateExpressionStart satisfies number | undefined;
scopeReference?.templateExpressionEnd satisfies number | undefined;
scopeReference?.templateExpressionHash satisfies string | undefined;
scopeReference?.templateLiteralKind satisfies 'template-literal' | 'tagged-template' | string | undefined;
scopeReference?.taggedTemplate satisfies boolean | undefined;
scopeReference?.templateTagText satisfies string | undefined;
scopeReference?.templateTagRoot satisfies string | undefined;
scopeReference?.templateTagMemberName satisfies string | undefined;
scopeReference?.templateTagStart satisfies number | undefined;
scopeReference?.templateTagEnd satisfies number | undefined;
scopeReference?.receiverKind satisfies 'this' | 'super' | string | undefined;
scopeReference?.memberName satisfies string | undefined;
scopeReference?.memberComputed satisfies boolean | undefined;
scopeReference?.memberOptional satisfies boolean | undefined;
scopeReference?.writeOperation satisfies string | undefined;
scopeReference?.closureDepthDelta satisfies number | undefined;
scopeReference?.closureBindingDepth satisfies number | undefined;
scopeReference?.closureOwnerName satisfies string | undefined;
scopeReference?.closureCaptureHash satisfies string | undefined;
