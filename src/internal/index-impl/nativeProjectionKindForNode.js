export function nativeProjectionKindForNode(node) {
  const kind = String(node?.kind ?? node?.languageKind ?? '').toLowerCase();
  if (/function|method|procedure|funcdecl|itemfn|fndeclaration|\bdef\b/.test(kind)) return 'function';
  if (/class/.test(kind)) return 'class';
  if (/interface|protocol/.test(kind)) return 'interface';
  if (/trait/.test(kind)) return 'trait';
  if (/struct|enum|record|typedef|typealias|type/.test(kind)) return 'type';
  if (/const|constant|macro|define/.test(kind)) return 'constant';
  if (/var|property|field/.test(kind)) return 'variable';
  if (/module|namespace|package/.test(kind)) return 'module';
  return undefined;
}
