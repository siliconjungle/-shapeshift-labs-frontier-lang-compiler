export function goGeneratedCodeMarker(node, kind) {
  if (kind !== 'File') return false;
  if (node.Generated || node.generated) return true;
  const comments = node.Comments ?? node.comments;
  if (!Array.isArray(comments)) return false;
  return comments.some((group) => JSON.stringify(group).includes('Code generated') && JSON.stringify(group).includes('DO NOT EDIT'));
}
