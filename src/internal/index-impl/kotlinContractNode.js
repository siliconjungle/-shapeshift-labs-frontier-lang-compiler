export function kotlinContractNode(kind) {
  return /Contract/i.test(String(kind));
}
