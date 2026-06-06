export function nativeProjectionDeclarationKind(kind) {
  const normalized = String(kind ?? 'value').toLowerCase();
  if (normalized === 'function' || normalized === 'method' || normalized === 'procedure') return 'function';
  if (normalized === 'class') return 'class';
  if (normalized === 'interface' || normalized === 'protocol') return 'interface';
  if (normalized === 'trait') return 'trait';
  if (normalized === 'type' || normalized === 'struct' || normalized === 'enum' || normalized === 'record') return 'type';
  if (normalized === 'constant' || normalized === 'const') return 'constant';
  if (normalized === 'variable' || normalized === 'property' || normalized === 'field') return 'variable';
  if (normalized === 'module' || normalized === 'namespace' || normalized === 'package') return 'module';
  return normalized;
}
