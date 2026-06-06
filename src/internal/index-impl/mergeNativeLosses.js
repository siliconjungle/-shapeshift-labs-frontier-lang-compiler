export function mergeNativeLosses(primary = [], secondary = []) {
  const seen = new Set();
  const losses = [];
  for (const loss of [...primary, ...secondary]) {
    if (!loss) continue;
    const id = loss.id ?? `loss_${losses.length + 1}`;
    if (seen.has(id)) continue;
    seen.add(id);
    losses.push(loss.id ? loss : { ...loss, id });
  }
  return losses;
}
