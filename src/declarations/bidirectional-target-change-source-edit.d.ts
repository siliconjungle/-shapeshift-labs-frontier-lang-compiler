import type { SemanticMergeReadiness } from '@shapeshift-labs/frontier-lang-kernel';
import type { BidirectionalTargetPortabilityAction } from './bidirectional-target-change-evidence.js';

export interface BidirectionalTargetChangeSourceEditProjectionHint {
  readonly schema: 'frontier.lang.bidirectionalTargetChangeSourceEditProjectionHint.v1';
  readonly version: 1;
  readonly id: string;
  readonly scriptId: string;
  readonly hash: string;
  readonly status: 'portable' | string;
  readonly action: BidirectionalTargetPortabilityAction;
  readonly readiness: SemanticMergeReadiness | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly targetPath?: string;
  readonly targetHash?: string;
  readonly targetChangeSetId: string;
  readonly targetPatchId?: string;
  readonly targetMergeCandidateId?: string;
  readonly sourceAnchorMatchIds: readonly string[];
  readonly sourceAnchorKeys: readonly string[];
  readonly sourceMapLinkIds: readonly string[];
  readonly sourceMapIds: readonly string[];
  readonly sourceMapMappingIds: readonly string[];
  readonly operationIds: readonly string[];
  readonly reviewRequired: true;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
  readonly reasonCodes: readonly string[];
}
