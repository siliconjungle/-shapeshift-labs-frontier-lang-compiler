import type { FrontierSourceLanguage, SourceSpan } from '@shapeshift-labs/frontier-lang-kernel';

export type NativeSourceTokenKind =
  | 'identifier'
  | 'keyword'
  | 'number'
  | 'string'
  | 'operator'
  | 'punctuation'
  | 'comment'
  | 'jsdoc-comment'
  | 'block-comment'
  | 'source-map-comment'
  | 'whitespace'
  | 'newline'
  | 'directive'
  | 'unknown'
  | string;

export interface NativeSourcePreservedToken {
  readonly id: string;
  readonly kind: NativeSourceTokenKind;
  readonly text?: string;
  readonly textHash: string;
  readonly span: SourceSpan;
  readonly metadata?: Record<string, unknown>;
}

export interface NativeSourcePreservedDirective {
  readonly id: string;
  readonly kind: string;
  readonly text?: string;
  readonly textHash: string;
  readonly span: SourceSpan;
  readonly metadata?: Record<string, unknown>;
}

export interface NativeSourcePreservation {
  readonly kind: 'frontier.lang.nativeSourcePreservation';
  readonly version: 1;
  readonly id: string;
  readonly language: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash: string;
  readonly sourceBytes: number;
  readonly lineCount: number;
  readonly newline: 'lf' | 'crlf' | 'mixed' | 'none';
  readonly encoding: string;
  readonly sourceText?: string;
  readonly tokens: readonly NativeSourcePreservedToken[];
  readonly trivia: readonly NativeSourcePreservedToken[];
  readonly directives: readonly NativeSourcePreservedDirective[];
  readonly summary: {
    readonly tokens: number;
    readonly trivia: number;
    readonly directives: number;
    readonly comments: number;
    readonly whitespace: number;
    readonly exactSourceAvailable: boolean;
    readonly truncated: boolean;
  };
  readonly metadata?: Record<string, unknown>;
}

export interface CreateNativeSourcePreservationOptions {
  readonly id?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceText: string;
  readonly encoding?: string;
  readonly includeSourceText?: boolean;
  readonly includeTokens?: boolean;
  readonly includeTrivia?: boolean;
  readonly includeDirectives?: boolean;
  readonly maxTokens?: number;
  readonly maxTrivia?: number;
  readonly maxDirectives?: number;
  readonly metadata?: Record<string, unknown>;
}
