import {
  compileFrontierDeclaredTargets,
  compileFrontierSource,
  compileFrontierSourceDeclaredTargets
} from '../src/index.js';
import type {
  FrontierDeclaredTargetArtifact,
  FrontierDeclaredTargetCompilationResult,
  FrontierDeclaredTargetCompileOptions
} from '../src/index.js';

const source = `
module DeclaredTargetApiTypes @id("mod_declared_target_api_types")
entity DeclaredTargetTodo @id("ent_declared_target_todo") {
  title @id("field_declared_target_title"): Text
}
target typescript @id("target_declared_ts") {
  language typescript
  emitPath src/generated/declared-target.ts
}
`;

const compiled = compileFrontierSource(source, { target: 'typescript' });
const options: FrontierDeclaredTargetCompileOptions = { sourceMap: true };
const fromDocument: FrontierDeclaredTargetCompilationResult =
  compileFrontierDeclaredTargets(compiled.document, options);
const fromSource: FrontierDeclaredTargetCompilationResult =
  compileFrontierSourceDeclaredTargets(source, options);
const artifact: FrontierDeclaredTargetArtifact | undefined = fromSource.artifacts[0];

fromDocument.summary.targets satisfies number;
artifact?.targetPath satisfies string | undefined;
artifact?.sourceMap?.targetPath satisfies string | undefined;
