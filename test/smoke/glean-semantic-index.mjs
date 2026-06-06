import { assert, assertSemanticImportFixture } from './helpers.mjs';
import { createSemanticImportSidecar, ExternalSemanticIndexFormats, importExternalSemanticIndex } from './compiler-api.mjs';

assert.equal(ExternalSemanticIndexFormats.includes('glean'), true);

const gleanImport = importExternalSemanticIndex({
  format: 'glean-facts',
  language: 'typescript',
  projectRoot: '/repo',
  payload: {
    schemaId: 'all.6',
    predicates: {
      'typescript.FunctionDeclaration.1': [{
        id: 101,
        key: {
          file: { key: { name: 'src/service.ts', hash: 'fnv1a32:service' } },
          name: 'loadUser',
          range: {
            start: { line: 2, column: 7 },
            end: { line: 2, column: 15 }
          }
        },
        value: { signature: 'function loadUser(id: string): Promise<User>' }
      }],
      'typescript.Call.1': [{
        id: 102,
        key: {
          file: { key: { name: 'src/service.ts' } },
          name: 'loadUser',
          callee: { name: 'fetchUser', kind: 'function' },
          range: {
            start: { line: 4, column: 9 },
            end: { line: 4, column: 18 }
          }
        }
      }]
    }
  }
});

assert.equal(gleanImport.format, 'glean');
assert.equal(gleanImport.semanticIndex.documents[0].path, 'src/service.ts');
assert.equal(gleanImport.semanticIndex.symbols.some((symbol) => symbol.scheme === 'glean'), true);
assert.equal(gleanImport.semanticIndex.symbols.some((symbol) => symbol.name === 'loadUser'), true);
assert.equal(gleanImport.semanticIndex.symbols.some((symbol) => symbol.name === 'fetchUser'), true);
assert.equal(gleanImport.semanticIndex.occurrences[0].span.startLine, 3);
assert.equal(gleanImport.semanticIndex.occurrences[0].span.startColumn, 8);
assert.equal(gleanImport.semanticIndex.facts.some((fact) => fact.predicate === 'typescript.FunctionDeclaration.1'), true);
assert.equal(gleanImport.semanticIndex.relations.some((relation) => relation.predicate === 'calls'), true);
assert.equal(gleanImport.summary.sourceMapMappings >= 2, true);
assert.equal(gleanImport.readiness.readiness, 'ready-with-losses');
const gleanSidecar = createSemanticImportSidecar(gleanImport, { generatedAt: 127 });
assertSemanticImportFixture(gleanImport, {
  sidecar: gleanSidecar,
  expectedSymbols: ['loadUser', 'fetchUser'],
  expectedRegionKinds: ['body'],
  expectedReadiness: 'ready-with-losses',
  minSourceMapMappings: 2
});

const gleanJsonBatchImport = importExternalSemanticIndex({
  language: 'typescript',
  projectRoot: '/repo',
  payload: [{
    predicate: 'typescript.FunctionDeclaration.1',
    facts: [{
      id: 301,
      key: {
        file: { key: { name: 'src/batch.ts', hash: 'fnv1a32:batch' } },
        name: 'saveUser',
        range: {
          start: { line: 0, column: 16 },
          end: { line: 0, column: 24 }
        }
      },
      value: { signature: 'function saveUser(user: User): void' }
    }]
  }, {
    predicate: 'typescript.Call.1',
    facts: [{
      id: 302,
      key: {
        file: { key: { name: 'src/batch.ts' } },
        name: 'saveUser',
        callee: { name: 'validateUser', kind: 'function' },
        range: {
          start: { line: 1, column: 2 },
          end: { line: 1, column: 14 }
        }
      }
    }]
  }]
});

assert.equal(gleanJsonBatchImport.format, 'glean');
assert.equal(gleanJsonBatchImport.semanticIndex.documents[0].path, 'src/batch.ts');
assert.equal(gleanJsonBatchImport.semanticIndex.symbols.some((symbol) => symbol.name === 'saveUser'), true);
assert.equal(gleanJsonBatchImport.semanticIndex.symbols.some((symbol) => symbol.name === 'validateUser'), true);
assert.equal(gleanJsonBatchImport.semanticIndex.facts.some((fact) => fact.predicate === 'typescript.FunctionDeclaration.1'), true);
assert.equal(gleanJsonBatchImport.semanticIndex.relations.some((relation) => relation.predicate === 'calls'), true);
assert.equal(gleanJsonBatchImport.summary.sourceMapMappings >= 2, true);

const gleanFactsByPredicateImport = importExternalSemanticIndex({
  language: 'typescript',
  payload: {
    factsByPredicate: {
      'typescript.Reference.1': [{
        fact_id: 401,
        key: {
          file: { key: { path: 'src/ref.ts', hash: 'fnv1a32:ref' } },
          name: 'loadUser',
          target: { name: 'UserService', kind: 'class' },
          location: {
            start: { line: 5, character: 11 },
            end: { line: 5, character: 20 }
          }
        }
      }]
    }
  }
});

assert.equal(gleanFactsByPredicateImport.format, 'glean');
assert.equal(gleanFactsByPredicateImport.semanticIndex.documents[0].path, 'src/ref.ts');
assert.equal(gleanFactsByPredicateImport.semanticIndex.documents[0].sourceHash, 'fnv1a32:ref');
assert.equal(gleanFactsByPredicateImport.semanticIndex.occurrences[0].role, 'reference');
assert.equal(gleanFactsByPredicateImport.semanticIndex.occurrences[0].span.startLine, 6);
assert.equal(gleanFactsByPredicateImport.semanticIndex.relations.some((relation) => relation.predicate === 'references'), true);

const inferredGleanImport = importExternalSemanticIndex({
  payload: {
    facts: [{
      predicate: 'python.FunctionDeclaration.1',
      id: 201,
      key: {
        file: { key: { path: 'src/app.py' } },
        name: 'make_user',
        language: 'python',
        location: {
          start: { line: 0, character: 4 },
          end: { line: 0, character: 13 }
        }
      }
    }]
  }
});

assert.equal(inferredGleanImport.format, 'glean');
assert.equal(inferredGleanImport.semanticIndex.documents[0].language, 'python');
assert.equal(inferredGleanImport.semanticIndex.symbols[0].kind, 'function');
