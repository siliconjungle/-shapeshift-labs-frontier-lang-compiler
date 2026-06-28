function parserSpanCoverageProofForFile(file, artifacts, evidence) {
  const proof = isPlainObject(evidence?.parserSpanCoverageProof)
    ? evidence.parserSpanCoverageProof
    : file.parserSpanCoverageProof
      ?? file.metadata?.parserSpanCoverageProof
      ?? file.result?.metadata?.parserSpanCoverageProof
      ?? artifacts?.metadata?.parserSpanCoverageProof;
  if (!isPlainObject(proof)) {
    return parserTriviaExactnessClaimsExact(evidence)
      ? blockedParserSpanCoverageProof({
        sourcePath: file.sourcePath,
        sourceHash: expectedOutputHashForFile(file)
      }, ['parser-span-coverage-proof-missing'])
      : undefined;
  }
  const expectedSourceHash = expectedOutputHashForFile(file);
  const proofSourceHash = firstString(proof.sourceHash, proof.sourceId, proof.evidenceSourceHash, proof.roundtripHash);
  const outputSourceText = outputSourceTextForFile(file);
  const sourceLength = numberOrUndefined(proof.sourceLength);
  const coveredSourceLength = numberOrUndefined(proof.coveredSourceLength);
  const blockReasonCodes = uniqueStrings([
    proof.status === 'exact' && !proofSourceHash ? 'parser-span-coverage-source-hash-missing' : undefined,
    expectedSourceHash && proofSourceHash && proofSourceHash !== expectedSourceHash ? 'parser-span-coverage-source-hash-mismatch' : undefined,
    outputSourceText !== undefined && sourceLength !== undefined && sourceLength !== outputSourceText.length ? 'parser-span-coverage-source-length-mismatch' : undefined,
    sourceLength !== undefined && coveredSourceLength !== undefined && coveredSourceLength !== sourceLength ? 'parser-span-coverage-covered-length-mismatch' : undefined,
    proof.startsAtZero === false ? 'parser-span-coverage-start-missing' : undefined,
    proof.endsAtSourceLength === false ? 'parser-span-coverage-end-missing' : undefined,
    proof.nonOverlapping === false ? 'parser-span-coverage-overlap' : undefined,
    proof.contiguous === false ? 'parser-span-coverage-gap' : undefined,
    proof.textMatchesSource === false ? 'parser-span-coverage-text-mismatch' : undefined,
    proof.truncated === true ? 'parser-span-coverage-truncated' : undefined
  ]);
  return blockReasonCodes.length ? blockedParserSpanCoverageProof(proof, blockReasonCodes) : proof;
}

function blockedParserSpanCoverageProof(proof, blockReasonCodes) {
  return compactRecord({
    ...proof,
    schema: proof.schema ?? 'frontier.lang.parserSpanCoverageProof.v1',
    version: proof.version ?? 1,
    status: 'blocked',
    exactParserSpans: false,
    reasonCodes: uniqueStrings([
      ...(proof.reasonCodes ?? []).filter((code) => code !== 'parser-token-comment-span-coverage-exact'),
      'parser-token-comment-span-coverage-blocked',
      ...blockReasonCodes
    ]),
    blockReasonCodes: uniqueStrings([...(proof.blockReasonCodes ?? []), ...blockReasonCodes]),
    reviewRequired: true,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  });
}

function expectedOutputHashForFile(file) {
  return firstString(file.outputHash, file.result?.outputHash);
}

function outputSourceTextForFile(file) {
  if (typeof file.outputSourceText === 'string') return file.outputSourceText;
  if (typeof file.result?.outputSourceText === 'string') return file.result.outputSourceText;
  return undefined;
}

function parserTriviaExactnessClaimsExact(evidence) {
  return isPlainObject(evidence)
    && (evidence.exactParserTrivia === true || evidence.exact === true || evidence.status === 'exact' || evidence.losslessCst === true);
}

function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

function firstString(...values) {
  return values.find((value) => typeof value === 'string' && value.length > 0);
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))];
}

function numberOrUndefined(value) {
  return Number.isFinite(value) ? value : undefined;
}

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

export { parserSpanCoverageProofForFile };
