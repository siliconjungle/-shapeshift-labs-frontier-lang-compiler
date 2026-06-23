export type NativeProjectModuleResolutionPaths = Readonly<Record<string, readonly string[] | string>>;

export interface NativeProjectModuleResolutionOptions {
  readonly baseUrl?: string;
  readonly paths?: NativeProjectModuleResolutionPaths;
  readonly aliases?: NativeProjectModuleResolutionPaths;
  readonly compilerOptions?: {
    readonly baseUrl?: string;
    readonly paths?: NativeProjectModuleResolutionPaths;
  };
}
