export type NativeProjectModuleResolutionPaths = Readonly<Record<string, readonly string[] | string>>;
export type NativeProjectPackageExportTarget = string | readonly NativeProjectPackageExportTarget[] | NativeProjectPackageConditionalExports | null;
export type NativeProjectPackageExports = NativeProjectPackageExportTarget | Readonly<Record<string, NativeProjectPackageExportTarget>>;
export type NativeProjectPackageImports = Readonly<Record<string, NativeProjectPackageExportTarget>>;

export interface NativeProjectPackageConditionalExports {
  readonly [condition: string]: NativeProjectPackageExportTarget;
}

export interface NativeProjectPackageResolutionOptions {
  readonly root?: string;
  readonly sourceRoot?: string;
  readonly main?: string;
  readonly types?: string;
  readonly type?: 'module' | 'commonjs' | string;
  readonly packageType?: 'module' | 'commonjs' | string;
  readonly exports?: NativeProjectPackageExports;
  readonly imports?: NativeProjectPackageImports;
  readonly packageWorkspaceRootAmbiguous?: boolean;
  readonly packageWorkspaceRoots?: readonly string[];
  readonly packageResolutionReasonCode?: string;
}

export interface NativeProjectModuleResolutionOptions {
  readonly root?: string;
  readonly packageRoot?: string;
  readonly baseUrl?: string;
  readonly paths?: NativeProjectModuleResolutionPaths;
  readonly aliases?: NativeProjectModuleResolutionPaths;
  readonly imports?: NativeProjectPackageImports;
  readonly packageImports?: NativeProjectPackageImports;
  readonly packages?: Readonly<Record<string, NativeProjectPackageResolutionOptions>>;
  readonly type?: 'module' | 'commonjs' | string;
  readonly packageType?: 'module' | 'commonjs' | string;
  readonly packageTypeByRoot?: Readonly<Record<string, 'module' | 'commonjs' | string>>;
  readonly packageTypes?: Readonly<Record<string, 'module' | 'commonjs' | string>>;
  readonly packageWorkspaceRootAmbiguities?: Readonly<Record<string, readonly string[]>>;
  readonly conditions?: readonly string[];
  readonly packageExportConditions?: readonly string[];
  readonly compilerOptions?: {
    readonly baseUrl?: string;
    readonly paths?: NativeProjectModuleResolutionPaths;
  };
}

export type NativeProjectPackageJsonValue = string | NativeProjectPackageJsonObject;

export interface NativeProjectPackageJsonObject {
  readonly name?: string;
  readonly type?: 'module' | 'commonjs' | string;
  readonly main?: string;
  readonly types?: string;
  readonly typings?: string;
  readonly exports?: NativeProjectPackageExports;
  readonly imports?: NativeProjectPackageImports;
}

export interface NativeProjectPackageManifestInput {
  readonly sourcePath?: string;
  readonly path?: string;
  readonly root?: string;
  readonly packageName?: string;
  readonly type?: 'module' | 'commonjs' | string;
  readonly packageType?: 'module' | 'commonjs' | string;
  readonly packageJson?: NativeProjectPackageJsonValue;
  readonly json?: NativeProjectPackageJsonValue;
  readonly packageJsonText?: string;
  readonly text?: string;
}

export interface NativeProjectPackageManifestResolutionRecord {
  readonly packageName: string;
  readonly root: string;
  readonly sourcePath?: string;
  readonly packageType?: 'module' | 'commonjs' | string;
  readonly hasExports?: boolean;
  readonly hasImports?: boolean;
}

export interface NativeProjectPackageManifestResolutionDiagnostic {
  readonly reasonCode: 'invalid-package-json' | 'missing-package-name' | 'ambiguous-package-workspace-root' | string;
  readonly sourcePath?: string;
  readonly root?: string;
  readonly existingRoot?: string;
  readonly packageName?: string;
  readonly packageWorkspaceRoots?: readonly string[];
}

export interface CreateNativeProjectModuleResolutionFromPackageManifestsOptions {
  readonly manifests?: readonly NativeProjectPackageManifestInput[];
  readonly moduleResolution?: NativeProjectModuleResolutionOptions;
  readonly baseModuleResolution?: NativeProjectModuleResolutionOptions;
  readonly conditions?: readonly string[];
  readonly packageExportConditions?: readonly string[];
}

export interface NativeProjectModuleResolutionFromPackageManifestsResult {
  readonly kind: 'frontier.lang.nativeProjectModuleResolutionFromPackageManifests';
  readonly version: 1;
  readonly ok: boolean;
  readonly moduleResolution: NativeProjectModuleResolutionOptions;
  readonly packages: readonly NativeProjectPackageManifestResolutionRecord[];
  readonly packageCount: number;
  readonly diagnostics: readonly NativeProjectPackageManifestResolutionDiagnostic[];
}

export declare function createNativeProjectModuleResolutionFromPackageManifests(
  input?: CreateNativeProjectModuleResolutionFromPackageManifestsOptions | readonly NativeProjectPackageManifestInput[]
): NativeProjectModuleResolutionFromPackageManifestsResult;
