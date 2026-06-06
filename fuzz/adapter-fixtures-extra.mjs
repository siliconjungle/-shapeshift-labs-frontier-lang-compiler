export function createKotlinPsiImportCase(index) {
  return {
    sourcePath: `src/Fuzz${index}.kt`,
    sourceText: `package fuzz\nclass FuzzKotlin${index}(val value: String) { fun fuzzKotlin${index}() {} }\n`,
    adapterOptions: {
      ast: {
        kind: 'KtFile',
        packageDirective: { kind: 'KtPackageDirective', fqName: 'fuzz' },
        declarations: [{
          kind: 'KtClass',
          name: `FuzzKotlin${index}`,
          declarations: [{
            kind: 'KtPrimaryConstructor',
            parameters: [{
              kind: 'KtParameter',
              name: 'value',
              typeReference: { text: 'String' },
              valOrVarKeyword: 'val'
            }]
          }, {
            kind: 'KtNamedFunction',
            name: `fuzzKotlin${index}`,
            bodyExpression: { kind: 'KtBlockExpression' }
          }]
        }]
      }
    }
  };
}

export function createCSharpRoslynImportCase(index) {
  return {
    sourcePath: `src/Fuzz${index}.cs`,
    sourceText: `namespace fuzz; public class FuzzCSharp${index} { private string value; public void FuzzCSharpMethod${index}() {} }\n`,
    adapterOptions: {
      ast: {
        kind: 'CompilationUnit',
        members: [{
          kind: 'FileScopedNamespaceDeclaration',
          name: { qualifiedName: 'fuzz' },
          members: [{
            kind: 'ClassDeclaration',
            identifier: { text: `FuzzCSharp${index}` },
            members: [{
              kind: 'FieldDeclaration',
              declaration: {
                type: { name: 'string' },
                variables: [{ kind: 'VariableDeclarator', identifier: { text: 'value' } }]
              }
            }, {
              kind: 'MethodDeclaration',
              identifier: { text: `FuzzCSharpMethod${index}` },
              returnType: { name: 'void' },
              body: { kind: 'Block', statements: [] }
            }]
          }]
        }]
      }
    }
  };
}

export function createSwiftSyntaxImportCase(index) {
  return {
    sourcePath: `src/Fuzz${index}.swift`,
    sourceText: `struct FuzzSwift${index} { var value: String\n func fuzzSwift${index}() {} }\n`,
    adapterOptions: {
      ast: {
        kind: 'SourceFileSyntax',
        statements: [{
          kind: 'StructDeclSyntax',
          identifier: { text: `FuzzSwift${index}` },
          members: [{
            kind: 'VariableDeclSyntax',
            bindings: [{ kind: 'PatternBindingSyntax', pattern: { identifier: { text: 'value' } } }]
          }, {
            kind: 'FunctionDeclSyntax',
            identifier: { text: `fuzzSwift${index}` },
            body: { kind: 'CodeBlockSyntax', statements: [] }
          }]
        }]
      }
    }
  };
}
