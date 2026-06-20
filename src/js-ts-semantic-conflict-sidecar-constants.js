export const JsTsSemanticConflictSidecarClasses = Object.freeze([
  'same-region',
  'delete-modify',
  'duplicate-export',
  'duplicate-member',
  'ordered-list-conflict',
  'parser-ledger-loss',
  'stale-source-hash',
  'unsupported-syntax'
]);

export const classDefaults = Object.freeze({
  'same-region': {
    severity: 'error',
    risk: 'high',
    readiness: 'blocked',
    reasonCodes: ['same-region-concurrent-edit'],
    suggestedOutcome: 'manual-merge-required'
  },
  'delete-modify': {
    severity: 'error',
    risk: 'high',
    readiness: 'blocked',
    reasonCodes: ['delete-modify-same-region'],
    suggestedOutcome: 'choose-delete-or-port-modification'
  },
  'duplicate-export': {
    severity: 'error',
    risk: 'high',
    readiness: 'blocked',
    reasonCodes: ['duplicate-export-name'],
    suggestedOutcome: 'rename-or-remove-duplicate-export'
  },
  'duplicate-member': {
    severity: 'error',
    risk: 'high',
    readiness: 'blocked',
    reasonCodes: ['duplicate-member-name'],
    suggestedOutcome: 'rename-or-remove-duplicate-member'
  },
  'ordered-list-conflict': {
    severity: 'warning',
    risk: 'medium',
    readiness: 'needs-review',
    reasonCodes: ['ordered-list-concurrent-position'],
    suggestedOutcome: 'preserve-intended-order-with-human-review'
  },
  'parser-ledger-loss': {
    severity: 'error',
    risk: 'high',
    readiness: 'blocked',
    reasonCodes: ['parser-or-ledger-loss'],
    suggestedOutcome: 'rerun-parser-and-ledger-before-merge'
  },
  'stale-source-hash': {
    severity: 'error',
    risk: 'high',
    readiness: 'blocked',
    reasonCodes: ['stale-source-hash'],
    suggestedOutcome: 'rerun-semantic-import-before-merge'
  },
  'unsupported-syntax': {
    severity: 'error',
    risk: 'high',
    readiness: 'blocked',
    reasonCodes: ['unsupported-js-ts-syntax'],
    suggestedOutcome: 'fall-back-to-textual-review'
  }
});

export const severityRank = Object.freeze({ info: 1, warning: 2, error: 3 });
export const riskRank = Object.freeze({ low: 1, medium: 2, high: 3 });
export const orderedChangeKinds = /^(?:insert|add|move|reorder|replace|modify|update)$/i;
export const deleteChangeKinds = /^(?:delete|remove|removed|deleted)$/i;
export const modifyChangeKinds = /^(?:modify|modified|replace|update|edit|move|reorder|insert|add)$/i;
export const parserLedgerLossPattern = /(?:parser|parse|ledger|source[-_ ]?map|anchor|projection).*(?:loss|lost|missing|failed|error)|(?:loss|lost|missing).*(?:parser|ledger|source[-_ ]?map|anchor|projection)/i;
export const unsupportedSyntaxPattern = /unsupported|unhandled|unknown syntax|syntax unsupported/i;
