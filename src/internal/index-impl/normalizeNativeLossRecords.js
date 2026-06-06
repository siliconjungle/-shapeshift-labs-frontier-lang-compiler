import{normalizeNativeLossRecord}from'./normalizeNativeLossRecord.js';
export function normalizeNativeLossRecords(losses) {
  return (Array.isArray(losses) ? losses : [losses])
    .filter((loss) => loss !== undefined && loss !== null)
    .map((loss, index) => normalizeNativeLossRecord(loss, `loss_${index + 1}`));
}
