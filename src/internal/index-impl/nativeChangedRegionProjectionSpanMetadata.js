export function nativeChangedRegionProjectionSpanMetadata(projection) {
  return {
    schema: projection.schema,
    id: projection.id,
    reviewRequired: projection.reviewRequired,
    autoMergeClaim: projection.autoMergeClaim,
    beforeSourceHash: projection.before?.sourceHash,
    afterSourceHash: projection.after?.sourceHash,
    sourceMapLinks: projection.sourceMapLinks?.length ?? 0,
    admission: projection.admission
  };
}
