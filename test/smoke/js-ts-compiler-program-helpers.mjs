function typeScriptProgramForFiles(typescript, files) {
  const compilerOptions = { target: typescript.ScriptTarget.Latest, module: typescript.ModuleKind.ESNext, noLib: true, strict: true };
  const normalizedFiles = new Map(Object.entries(files).map(([sourcePath, sourceText]) => [normalizePath(sourcePath), sourceText]));
  const host = typescript.createCompilerHost(compilerOptions, true);
  const originalGetSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
    const sourceText = normalizedFiles.get(normalizePath(fileName));
    return sourceText === undefined ? originalGetSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile) : typescript.createSourceFile(fileName, sourceText, languageVersion, true);
  };
  host.readFile = (fileName) => normalizedFiles.get(normalizePath(fileName));
  host.fileExists = (fileName) => normalizedFiles.has(normalizePath(fileName));
  return typescript.createProgram([...normalizedFiles.keys()], compilerOptions, host);
}

function normalizePath(sourcePath) { return String(sourcePath).replace(/\\/g, '/'); }

export { typeScriptProgramForFiles };
