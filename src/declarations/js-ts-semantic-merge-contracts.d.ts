import type {
  FrontierSourceLanguage,
  SemanticMergeReadiness,
  SourceSpan
} from '@shapeshift-labs/frontier-lang-kernel';

export type JsTsSemanticMergeLanguage = 'javascript' | 'typescript' | 'jsx' | 'tsx' | FrontierSourceLanguage | string;
export type JsTsSemanticMergeSourceTokenKind =
  | 'identifier'
  | 'keyword'
  | 'literal'
  | 'operator'
  | 'punctuation'
  | 'template'
  | 'jsx-text'
  | 'unknown'
  | string;
export type JsTsSemanticMergeTriviaKind = 'whitespace' | 'newline' | 'line-comment' | 'block-comment' | 'directive' | 'shebang' | string;
export type JsTsSemanticMergeSemanticRegionKind =
  | 'program'
  | 'module'
  | 'import'
  | 'export'
  | 'class'
  | 'interface'
  | 'type-alias'
  | 'function'
  | 'method'
  | 'field'
  | 'variable'
  | 'statement'
  | 'expression'
  | 'jsx'
  | 'unknown'
  | string;
export type JsTsSemanticMergeThreeWaySide = 'base' | 'left' | 'right' | 'merged' | string;
export type JsTsSemanticMergeThreeWayMatchStatus =
  | 'matched'
  | 'base-only'
  | 'left-only'
  | 'right-only'
  | 'moved'
  | 'renamed'
  | 'ambiguous'
  | 'missing'
  | string;
export type JsTsSemanticMergeStructuredEditKind =
  | 'insert'
  | 'delete'
  | 'replace'
  | 'move'
  | 'rename'
  | 'reorder'
  | 'update-import'
  | 'update-export'
  | 'update-signature'
  | 'update-body'
  | 'update-type'
  | 'update-jsx'
  | 'update-trivia'
  | string;
export type JsTsSemanticMergeConflictClass =
  | 'same-token-edit'
  | 'same-region-edit'
  | 'delete-modify'
  | 'move-edit'
  | 'rename-rename'
  | 'import-order'
  | 'type-surface-drift'
  | 'trivia-preservation'
  | 'behavior-evidence-needed'
  | string;
export type JsTsSemanticMergeConflictRisk = 'low' | 'medium' | 'high' | string;
export type JsTsSemanticMergeGateStatus = 'passed' | 'warning' | 'failed' | 'skipped' | 'blocked' | string;

/** Source-token evidence for JS/TS semantic merge without binding to a parser library. */
export interface JsTsSemanticMergeSourceToken {
  readonly schema: 'frontier.lang.jsTsSemanticMergeSourceToken.v1';
  readonly id: string;
  readonly kind: JsTsSemanticMergeSourceTokenKind;
  readonly language?: JsTsSemanticMergeLanguage;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly text?: string;
  readonly textHash?: string;
  readonly span: SourceSpan;
  readonly triviaBeforeIds?: readonly string[];
  readonly triviaAfterIds?: readonly string[];
  readonly semanticRegionId?: string;
  readonly metadata?: Record<string, unknown>;
}

/** Trivia span evidence for comments, whitespace, directives, and JSX/source preservation. */
export interface JsTsSemanticMergeTriviaSpan {
  readonly schema: 'frontier.lang.jsTsSemanticMergeTriviaSpan.v1';
  readonly id: string;
  readonly kind: JsTsSemanticMergeTriviaKind;
  readonly language?: JsTsSemanticMergeLanguage;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly text?: string;
  readonly textHash?: string;
  readonly span: SourceSpan;
  readonly attachesToTokenId?: string;
  readonly attachesToRegionId?: string;
  readonly metadata?: Record<string, unknown>;
}

/** Parser-neutral semantic region used to compare JS/TS declarations, statements, JSX, and type surfaces. */
export interface JsTsSemanticMergeSemanticRegion {
  readonly schema: 'frontier.lang.jsTsSemanticMergeSemanticRegion.v1';
  readonly id: string;
  readonly kind: JsTsSemanticMergeSemanticRegionKind;
  readonly regionKey: string;
  readonly conflictKey: string;
  readonly language?: JsTsSemanticMergeLanguage;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly stableHash?: string;
  readonly symbolId?: string;
  readonly symbolName?: string;
  readonly symbolKind?: string;
  readonly parentRegionId?: string;
  readonly childRegionIds?: readonly string[];
  readonly tokenIds?: readonly string[];
  readonly triviaIds?: readonly string[];
  readonly span?: SourceSpan;
  readonly metadata?: Record<string, unknown>;
}

export interface JsTsSemanticMergeThreeWayEndpoint {
  readonly side: JsTsSemanticMergeThreeWaySide;
  readonly regionId?: string;
  readonly tokenId?: string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly span?: SourceSpan;
  readonly semanticHash?: string;
  readonly textHash?: string;
  readonly metadata?: Record<string, unknown>;
}

/** Three-way match record connecting base, left, and right JS/TS merge evidence. */
export interface JsTsSemanticMergeThreeWayMatch {
  readonly schema: 'frontier.lang.jsTsSemanticMergeThreeWayMatch.v1';
  readonly id: string;
  readonly matchKey: string;
  readonly status: JsTsSemanticMergeThreeWayMatchStatus;
  readonly confidence: number;
  readonly base?: JsTsSemanticMergeThreeWayEndpoint;
  readonly left?: JsTsSemanticMergeThreeWayEndpoint;
  readonly right?: JsTsSemanticMergeThreeWayEndpoint;
  readonly regionIds?: readonly string[];
  readonly tokenIds?: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

/** Structured JS/TS edit evidence, separate from concrete parser or diff-library nodes. */
export interface JsTsSemanticMergeStructuredEdit {
  readonly schema: 'frontier.lang.jsTsSemanticMergeStructuredEdit.v1';
  readonly id: string;
  readonly editKey: string;
  readonly side: JsTsSemanticMergeThreeWaySide;
  readonly kind: JsTsSemanticMergeStructuredEditKind;
  readonly targetRegionId?: string;
  readonly targetTokenId?: string;
  readonly sourcePath?: string;
  readonly beforeHash?: string;
  readonly afterHash?: string;
  readonly replacementTextHash?: string;
  readonly insertedTextHash?: string;
  readonly deletedTextHash?: string;
  readonly matchIds?: readonly string[];
  readonly regionIds?: readonly string[];
  readonly tokenIds?: readonly string[];
  readonly triviaIds?: readonly string[];
  readonly conflictKey?: string;
  readonly reasonCodes: readonly string[];
  readonly evidenceIds?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface JsTsSemanticMergeConflictSide {
  readonly side: JsTsSemanticMergeThreeWaySide;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly editIds?: readonly string[];
  readonly regionIds?: readonly string[];
  readonly tokenIds?: readonly string[];
  readonly summary?: string;
  readonly metadata?: Record<string, unknown>;
}

/** Normalized explanation for a JS/TS semantic merge conflict. */
export interface JsTsSemanticMergeConflictExplanation {
  readonly kind: 'frontier.lang.jsTsSemanticMergeConflictExplanation';
  readonly version: 1;
  readonly schema: 'frontier.lang.jsTsSemanticMergeConflictExplanation.v1';
  readonly id: string;
  readonly stableId: string;
  readonly hash: string;
  readonly conflictClass: JsTsSemanticMergeConflictClass;
  readonly risk: JsTsSemanticMergeConflictRisk;
  readonly readiness: SemanticMergeReadiness | string;
  readonly language?: JsTsSemanticMergeLanguage;
  readonly sourcePath?: string;
  readonly title?: string;
  readonly summary?: string;
  readonly conflictKeys: readonly string[];
  readonly matchIds: readonly string[];
  readonly editIds: readonly string[];
  readonly regionIds: readonly string[];
  readonly tokenIds: readonly string[];
  readonly triviaIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly sides: {
    readonly base?: JsTsSemanticMergeConflictSide;
    readonly left?: JsTsSemanticMergeConflictSide;
    readonly right?: JsTsSemanticMergeConflictSide;
  };
  readonly suggestedAction: 'merge' | 'manual-review' | 'rerun-gates' | 'block' | string;
  readonly metadata?: Record<string, unknown>;
}

export interface JsTsSemanticMergeGateCheck {
  readonly id: string;
  readonly name?: string;
  readonly status: JsTsSemanticMergeGateStatus;
  readonly readiness?: SemanticMergeReadiness | string;
  readonly reasonCodes: readonly string[];
  readonly evidenceIds?: readonly string[];
  readonly hash?: string;
  readonly metadata?: Record<string, unknown>;
}

/** Merge gate result for deciding whether normalized JS/TS merge evidence can proceed. */
export interface JsTsSemanticMergeGateResult {
  readonly kind: 'frontier.lang.jsTsSemanticMergeGateResult';
  readonly version: 1;
  readonly schema: 'frontier.lang.jsTsSemanticMergeGateResult.v1';
  readonly id: string;
  readonly stableId: string;
  readonly hash: string;
  readonly gateId: string;
  readonly status: JsTsSemanticMergeGateStatus;
  readonly readiness: SemanticMergeReadiness | string;
  readonly mergeable: boolean;
  readonly action: 'merge' | 'review' | 'skip' | 'block' | string;
  readonly confidence: number;
  readonly checks: readonly JsTsSemanticMergeGateCheck[];
  readonly conflictExplanations: readonly JsTsSemanticMergeConflictExplanation[];
  readonly conflictExplanationIds: readonly string[];
  readonly structuredEditIds: readonly string[];
  readonly semanticRegionIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly summary: {
    readonly checks: number;
    readonly conflicts: number;
    readonly failedChecks: number;
    readonly warningChecks: number;
    readonly blockedChecks: number;
    readonly evidenceIds: number;
    readonly reasonCodes: readonly string[];
  };
  readonly metadata?: Record<string, unknown>;
}

export type JsTsSemanticMergeConflictExplanationInput =
  Partial<JsTsSemanticMergeConflictExplanation> & Record<string, unknown>;
export type JsTsSemanticMergeGateResultInput =
  Partial<JsTsSemanticMergeGateResult> & Record<string, unknown>;

export interface CreateJsTsSemanticMergeConflictExplanationOptions extends JsTsSemanticMergeConflictExplanationInput {
  readonly conflictKey?: string;
}

export interface CreateJsTsSemanticMergeGateResultOptions extends JsTsSemanticMergeGateResultInput {
  readonly conflicts?: readonly JsTsSemanticMergeConflictExplanationInput[];
}

export declare const JsTsSemanticMergeConflictClasses: readonly JsTsSemanticMergeConflictClass[];
export declare const JsTsSemanticMergeGateStatuses: readonly JsTsSemanticMergeGateStatus[];
export declare function createJsTsSemanticMergeConflictExplanation(input?: JsTsSemanticMergeConflictExplanationInput, options?: CreateJsTsSemanticMergeConflictExplanationOptions): JsTsSemanticMergeConflictExplanation;
export declare function createJsTsSemanticMergeGateResult(input?: JsTsSemanticMergeGateResultInput, options?: CreateJsTsSemanticMergeGateResultOptions): JsTsSemanticMergeGateResult;
