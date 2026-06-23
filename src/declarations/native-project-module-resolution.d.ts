export type NativeProjectModuleResolutionPaths = Readonly<Record<string, readonly string[] | string>>;
export type NativeProjectPackageExportTarget = string | readonly string[] | NativeProjectPackageConditionalExports;
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
  readonly exports?: NativeProjectPackageExports;
  readonly imports?: NativeProjectPackageImports;
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
  readonly conditions?: readonly string[];
  readonly packageExportConditions?: readonly string[];
  readonly compilerOptions?: {
    readonly baseUrl?: string;
    readonly paths?: NativeProjectModuleResolutionPaths;
  };
}
