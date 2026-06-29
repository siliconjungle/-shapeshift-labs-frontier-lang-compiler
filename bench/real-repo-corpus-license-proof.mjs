import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { resolveInside } from './real-repo-corpus-checkout-files.mjs';

const defaultLicenseCandidateFiles = Object.freeze(['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'COPYING', 'COPYING.md', 'COPYING.txt']);

function skippedLicenseProof(entry) {
  return {
    licenseExpectation: entry.licenseExpectation ?? null,
    licenseExpectedId: expectedLicenseId(entry.licenseExpectation),
    licenseProofStatus: 'skipped-missing-checkout',
    licenseProofExecution: 'skipped',
    licenseFilePresent: false,
    licenseFilePath: null,
    licenseFileHash: null,
    licenseFileBytes: 0,
    licenseTextMatchesExpectation: null,
    sourceCachePolicyStatus: 'source-cache-blocked-missing-checkout'
  };
}

function collectLicenseProof(checkoutPath, entry) {
  const expectedId = expectedLicenseId(entry.licenseExpectation);
  const base = {
    licenseExpectation: entry.licenseExpectation ?? null,
    licenseExpectedId: expectedId,
    licenseProofExecution: 'executed',
    licenseFilePresent: false,
    licenseFilePath: null,
    licenseFileHash: null,
    licenseFileBytes: 0,
    licenseTextMatchesExpectation: null,
    sourceCachePolicyStatus: 'source-cache-blocked-license-missing'
  };
  if (!expectedId) {
    return {
      ...base,
      licenseProofStatus: 'license-expectation-missing',
      sourceCachePolicyStatus: 'source-cache-blocked-license-expectation-missing'
    };
  }
  const licenseFile = firstExistingLicenseFile(checkoutPath);
  if (!licenseFile) return { ...base, licenseProofStatus: 'license-file-missing' };
  const text = readBoundedText(licenseFile.path);
  if (!text) {
    return {
      ...base,
      licenseProofStatus: 'license-file-missing',
      licenseFilePresent: true,
      licenseFilePath: licenseFile.relativePath
    };
  }
  const matches = licenseTextMatchesExpectedId(text, expectedId);
  return {
    ...base,
    licenseProofStatus: matches ? 'license-proof-passed' : 'license-text-mismatch',
    licenseFilePresent: true,
    licenseFilePath: licenseFile.relativePath,
    licenseFileHash: hashText(text),
    licenseFileBytes: Buffer.byteLength(text),
    licenseTextMatchesExpectation: matches,
    sourceCachePolicyStatus: matches ? 'source-cache-license-verified' : 'source-cache-blocked-license-mismatch'
  };
}

function firstExistingLicenseFile(checkoutPath) {
  for (const file of defaultLicenseCandidateFiles) {
    const filePath = resolveInside(checkoutPath, file);
    if (!filePath) continue;
    try {
      const stat = statSync(filePath);
      if (stat.isFile()) return { path: filePath, relativePath: file };
    } catch {
      // Keep scanning known license filenames.
    }
  }
  return null;
}

function expectedLicenseId(expectation) {
  if (typeof expectation !== 'string') return null;
  const [id] = expectation.split(';');
  const trimmed = id.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function licenseTextMatchesExpectedId(text, expectedId) {
  const normalizedText = normalizeLicenseText(text);
  const normalizedId = normalizeLicenseText(expectedId);
  if (!normalizedText || !normalizedId) return false;
  if (normalizedText.includes(normalizedId)) return true;
  if (expectedId === 'MIT') return /\bmit license\b/.test(normalizedText);
  if (expectedId === 'Apache-2.0') return /\bapache license\b/.test(normalizedText) && /\bversion 2(?: 0)?\b/.test(normalizedText);
  return false;
}

function normalizeLicenseText(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function readBoundedText(filePath, maxBytes = 131_072) {
  try {
    const stat = statSync(filePath);
    if (!stat.isFile() || stat.size > maxBytes) return null;
    return readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function hashText(text) {
  return createHash('sha256').update(text).digest('hex');
}

export { collectLicenseProof, skippedLicenseProof };
