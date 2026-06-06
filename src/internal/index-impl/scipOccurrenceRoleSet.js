export function scipOccurrenceRoleSet(value) {
  const role = Number(value ?? 0);
  const roles = [];
  if ((role & 0x1) > 0) roles.push('definition');
  if ((role & 0x2) > 0) roles.push('import');
  if ((role & 0x4) > 0) roles.push('write');
  if ((role & 0x8) > 0) roles.push('read');
  if ((role & 0x10) > 0) roles.push('generated');
  if ((role & 0x20) > 0) roles.push('test');
  if ((role & 0x40) > 0) roles.push('forwardDefinition');
  return roles.length ? roles : ['reference'];
}
