export function createEstreeImportCase(index) {
  const name = `fuzzImport${index}`;
  return {
    name,
    sourcePath: `src/fuzz-${index}.js`,
    sourceText: `export function ${name}() { return ${index}; }\n`,
    adapterOptions: {
      ast: {
        type: 'Program',
        loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 48 } },
        body: [{
          type: 'FunctionDeclaration',
          id: { type: 'Identifier', name },
          loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 48 } }
        }]
      }
    }
  };
}

export function createPythonAstImportCase(index) {
  return {
    sourcePath: `src/fuzz-${index}.py`,
    sourceText: `def fuzz_py_${index}(value):\n    return value\n`,
    adapterOptions: {
      ast: {
        _type: 'Module',
        body: [{
          _type: 'FunctionDef',
          name: `fuzz_py_${index}`,
          lineno: 1,
          col_offset: 0,
          end_lineno: 2,
          end_col_offset: 16,
          args: { _type: 'arguments', args: [{ _type: 'arg', arg: 'value', lineno: 1, col_offset: 12 }], defaults: [] },
          body: [{ _type: 'Return', lineno: 2, col_offset: 4, value: { _type: 'Name', id: 'value', lineno: 2, col_offset: 11 } }],
          decorator_list: []
        }],
        type_ignores: []
      }
    }
  };
}

export function createRustSynImportCase(index) {
  return {
    sourcePath: `src/fuzz-${index}.rs`,
    sourceText: `pub struct FuzzRust${index};\npub fn fuzz_rust_${index}() {}\n`,
    adapterOptions: {
      ast: {
        kind: 'File',
        items: [{
          kind: 'ItemStruct',
          ident: `FuzzRust${index}`,
          vis: 'pub',
          span: { startLine: 1, startColumn: 0 }
        }, {
          kind: 'ItemFn',
          vis: 'pub',
          sig: { kind: 'Signature', ident: `fuzz_rust_${index}`, inputs: [] },
          block: { kind: 'Block', stmts: [] },
          span: { startLine: 2, startColumn: 0 }
        }]
      }
    }
  };
}

export function createClangAstImportCase(index) {
  return {
    sourcePath: `src/fuzz-${index}.c`,
    sourceText: `typedef struct FuzzC${index} { int value; } FuzzC${index};\nint fuzz_c_${index}(void) { return ${index}; }\n`,
    adapterOptions: {
      ast: {
        kind: 'TranslationUnitDecl',
        inner: [{
          kind: 'TypedefDecl',
          name: `FuzzC${index}`,
          type: { qualType: `struct FuzzC${index}` },
          range: { begin: { line: 1, col: 1 } },
          inner: [{
            kind: 'RecordDecl',
            name: `FuzzC${index}`,
            tagUsed: 'struct',
            completeDefinition: true,
            inner: [{ kind: 'FieldDecl', name: 'value', type: { qualType: 'int' } }]
          }]
        }, {
          kind: 'FunctionDecl',
          name: `fuzz_c_${index}`,
          type: { qualType: 'int (void)' },
          isThisDeclarationADefinition: true,
          range: { begin: { line: 2, col: 1 } },
          inner: [{ kind: 'CompoundStmt' }]
        }]
      }
    }
  };
}

export function createGoAstImportCase(index) {
  return {
    sourcePath: `src/fuzz-${index}.go`,
    sourceText: `package fuzz\n\ntype FuzzGo${index} struct { Value int }\nfunc fuzzGo${index}() FuzzGo${index} { return FuzzGo${index}{} }\n`,
    adapterOptions: {
      ast: {
        kind: 'File',
        Name: { kind: 'Ident', Name: 'fuzz' },
        Decls: [{
          kind: 'GenDecl',
          Tok: 'TYPE',
          Specs: [{
            kind: 'TypeSpec',
            Name: { kind: 'Ident', Name: `FuzzGo${index}` },
            Type: {
              kind: 'StructType',
              Fields: {
                kind: 'FieldList',
                List: [{
                  kind: 'Field',
                  Names: [{ kind: 'Ident', Name: 'Value' }],
                  Type: { kind: 'Ident', Name: 'int' }
                }]
              }
            }
          }]
        }, {
          kind: 'FuncDecl',
          Name: { kind: 'Ident', Name: `fuzzGo${index}` },
          Type: { kind: 'FuncType' },
          Body: { kind: 'BlockStmt' }
        }]
      }
    }
  };
}

export function createJavaAstImportCase(index) {
  return {
    sourcePath: `src/Fuzz${index}.java`,
    sourceText: `package fuzz;\npublic class FuzzJava${index} { private String value; public void fuzzJava${index}() {} }\n`,
    adapterOptions: {
      ast: {
        kind: 'CompilationUnit',
        packageDeclaration: { kind: 'PackageDeclaration', name: { qualifiedName: 'fuzz' } },
        types: [{
          kind: 'ClassDeclaration',
          name: { identifier: `FuzzJava${index}` },
          members: [{
            kind: 'FieldDeclaration',
            type: { name: 'String' },
            variables: [{ kind: 'VariableDeclarator', name: { identifier: 'value' } }]
          }, {
            kind: 'MethodDeclaration',
            name: { identifier: `fuzzJava${index}` },
            returnType: { name: 'void' },
            body: { kind: 'Block' }
          }]
        }]
      }
    }
  };
}
