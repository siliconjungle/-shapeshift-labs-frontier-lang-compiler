import * as compilerApi from '../src/index.js';

declare const graph: compilerApi.NativeProjectSymbolGraphSummary;

const moduleDeclarationRecord = graph.moduleDeclarationRecords[0];
moduleDeclarationRecord?.kind satisfies 'frontier.lang.projectModuleDeclarationShape' | undefined;
moduleDeclarationRecord?.surfaceKind satisfies string | undefined;
moduleDeclarationRecord?.declarationOnly satisfies boolean | undefined;
moduleDeclarationRecord?.runtimeNamespace satisfies boolean | undefined;
moduleDeclarationRecord?.ambient satisfies boolean | undefined;
moduleDeclarationRecord?.shapeHash satisfies string | undefined;
moduleDeclarationRecord?.shapeProof?.proofLevel satisfies string | undefined;
moduleDeclarationRecord?.shapeProof?.runtimeEquivalenceClaim satisfies false | undefined;
moduleDeclarationRecord?.shapeProof?.semanticEquivalenceClaim satisfies false | undefined;

const exportAssignmentRecord = graph.exportAssignmentRecords[0];
exportAssignmentRecord?.kind satisfies 'frontier.lang.projectExportAssignmentShape' | undefined;
exportAssignmentRecord?.exportedName satisfies string | undefined;
exportAssignmentRecord?.localName satisfies string | undefined;
exportAssignmentRecord?.commonJsShape satisfies boolean | undefined;
exportAssignmentRecord?.shapeHash satisfies string | undefined;
exportAssignmentRecord?.shapeProof?.runtimeInteropEquivalenceClaim satisfies false | undefined;
exportAssignmentRecord?.shapeProof?.semanticEquivalenceClaim satisfies false | undefined;
