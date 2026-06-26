import * as compilerApi from '../src/index.js';

const typedModuleResolution: compilerApi.NativeProjectModuleResolutionOptions = {
  packageType: 'module',
  packageTypeByRoot: { 'apps/commonjs': 'commonjs' },
  packageTypes: { 'packages/legacy': 'commonjs' },
  packages: {
    '@pkg/core': {
      root: 'packages/core',
      type: 'module',
      packageType: 'module',
      exports: { './utils': { import: './src/utils.ts', require: './src/utils.cts' } },
      imports: { '#utils': { import: './src/utils.ts', require: './src/utils.cts' } }
    }
  },
  packageExportConditions: ['import', 'require', 'default']
};

const typedManifestResolution = compilerApi.createNativeProjectModuleResolutionFromPackageManifests({
  baseModuleResolution: typedModuleResolution,
  manifests: [{
    sourcePath: 'packages/core/package.json',
    packageJson: {
      name: '@pkg/core',
      type: 'module',
      exports: { './utils': './src/utils.ts', './blocked': null },
      imports: { '#utils': './src/utils.ts' }
    }
  }]
});

typedManifestResolution.moduleResolution satisfies compilerApi.NativeProjectModuleResolutionOptions;
typedManifestResolution.packages[0] satisfies compilerApi.NativeProjectPackageManifestResolutionRecord | undefined;
typedManifestResolution.diagnostics[0] satisfies compilerApi.NativeProjectPackageManifestResolutionDiagnostic | undefined;
