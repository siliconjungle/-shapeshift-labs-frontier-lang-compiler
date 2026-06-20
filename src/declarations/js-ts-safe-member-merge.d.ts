export type JsTsSafeMemberMergeRegionKind = 'interface' | 'type' | 'object';
export type JsTsSafeMemberMergeOrder = 'non-semantic' | string;
export type JsTsSafeMemberMergeStatus = 'merged' | 'rejected';

export interface JsTsSafeMemberMergePolicyRegion {
  readonly kind: JsTsSafeMemberMergeRegionKind | string;
  readonly name: string;
  readonly regionKind?: string;
  readonly order?: JsTsSafeMemberMergeOrder;
  readonly ordering?: JsTsSafeMemberMergeOrder;
  readonly nonSemanticOrder?: boolean;
  readonly orderSensitive?: boolean;
}

export interface JsTsSafeMemberMergePolicy {
  readonly unorderedRegions?: readonly JsTsSafeMemberMergePolicyRegion[];
  readonly unorderedMemberRegions?: readonly JsTsSafeMemberMergePolicyRegion[];
  readonly safeList?: readonly JsTsSafeMemberMergePolicyRegion[];
  readonly safeMembers?: readonly JsTsSafeMemberMergePolicyRegion[];
}

export interface JsTsSafeMemberMergeInput {
  readonly baseSourceText: string;
  readonly workerSourceText: string;
  readonly headSourceText: string;
  readonly policy?: JsTsSafeMemberMergePolicy | readonly JsTsSafeMemberMergePolicyRegion[];
  readonly mergePolicy?: JsTsSafeMemberMergePolicy | readonly JsTsSafeMemberMergePolicyRegion[];
  readonly unorderedRegions?: readonly JsTsSafeMemberMergePolicyRegion[];
}

export interface JsTsSafeMemberMergedRegion {
  readonly kind: JsTsSafeMemberMergeRegionKind;
  readonly name: string;
  readonly regionKind?: string;
  readonly workerAddedKeys: readonly string[];
  readonly headAddedKeys: readonly string[];
}

export interface JsTsSafeMemberMergeResult {
  readonly kind: 'frontier.lang.jsTsSafeMemberMerge';
  readonly version: 1;
  readonly status: JsTsSafeMemberMergeStatus;
  readonly sourceText?: string;
  readonly reasonCodes: readonly string[];
  readonly mergedRegions: readonly JsTsSafeMemberMergedRegion[];
  readonly summary: {
    readonly regions: number;
    readonly workerAdditions: number;
    readonly headAdditions: number;
    readonly appliedAdditions: number;
  };
  readonly metadata: {
    readonly explicitPolicy: boolean;
  };
}

export declare function mergeJsTsSafeMemberAdditions(input?: JsTsSafeMemberMergeInput): JsTsSafeMemberMergeResult;
export declare function safeMergeJsTsMembers(input?: JsTsSafeMemberMergeInput): JsTsSafeMemberMergeResult;
