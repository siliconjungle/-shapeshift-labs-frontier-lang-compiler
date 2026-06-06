import{pythonTargetName}from'./pythonTargetName.js';
export function pythonAssignmentName(node) {
  if (node.target) return pythonTargetName(node.target);
  for (const target of node.targets ?? []) {
    const name = pythonTargetName(target);
    if (name) return name;
  }
  return undefined;
}
