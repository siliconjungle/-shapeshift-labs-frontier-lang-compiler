export interface JsTsProjectReferenceInput {
  readonly path?: string;
  readonly originalPath?: string;
  readonly sourcePath?: string;
  readonly prepend?: boolean;
  readonly circular?: boolean;
}

export type JsTsProjectReferencesInput = readonly (string | JsTsProjectReferenceInput)[];

export interface JsTsProjectTsconfigInput {
  readonly compilerOptions?: Record<string, unknown>;
  readonly references?: JsTsProjectReferencesInput;
  readonly [key: string]: unknown;
}

export type JsTsProjectCompilerOptionMetadata = Readonly<Record<string, unknown>>;

export interface JsTsProjectCompilerOptionSourceMetadata {
  readonly source: string;
  readonly compilerOptions?: JsTsProjectCompilerOptionMetadata;
}

export interface JsTsProjectReferenceMetadata {
  readonly path: string;
  readonly originalPath?: string;
  readonly prepend?: boolean;
  readonly circular?: boolean;
}

export interface JsTsProjectCompilerMetadata {
  readonly diagnosticSource?: string;
  readonly compilerOptions?: JsTsProjectCompilerOptionMetadata;
  readonly compilerOptionSources?: readonly JsTsProjectCompilerOptionSourceMetadata[];
  readonly projectReferences?: readonly JsTsProjectReferenceMetadata[];
  readonly projectReferenceCount?: number;
  readonly tsconfigCompilerOptions?: JsTsProjectCompilerOptionMetadata;
  readonly tsconfigReferences?: readonly JsTsProjectReferenceMetadata[];
  readonly hasTypescriptCompilerApi?: boolean;
  readonly hasOptionsOverride?: boolean;
  readonly rootNames?: readonly string[];
  readonly sourceFiles?: number;
}
