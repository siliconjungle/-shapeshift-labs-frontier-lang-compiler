import { createUniversalDialectRegistry } from '../src/index.js';
import type { UniversalDialectRegistry } from '../src/index.js';
import type { UniversalDialectRegistry as UniversalDialectRegistryFromPackage } from '@shapeshift-labs/frontier-lang-dialects';

const compilerRegistry: UniversalDialectRegistry = createUniversalDialectRegistry({
  language: 'javascript',
  dialects: [{ dialect: 'node.runtime', constructKind: 'runtime', name: 'process.env' }]
});
const packageRegistry: UniversalDialectRegistryFromPackage = compilerRegistry;
const roundTripRegistry: UniversalDialectRegistry = packageRegistry;
roundTripRegistry.summary.projectionReadiness satisfies UniversalDialectRegistry['summary']['projectionReadiness'];

void roundTripRegistry;
