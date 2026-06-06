import{hashSemanticValue}from'@shapeshift-labs/frontier-lang-kernel';
import{sourceTextForSpan}from'./sourceTextForSpan.js';
export function semanticSliceSourceFiles(spans, context, options = {}) {
  const byPath = new Map();
  const includeExcerpts = options.includeSourceText !== false;
  const maxExcerptBytes = Number.isFinite(options.maxExcerptBytes) ? Math.max(0, Math.floor(options.maxExcerptBytes)) : 4000;
  for (const span of spans) {
    const path = span.path ?? span.sourceId ?? context.sourcePath ?? 'unknown';
    const record = byPath.get(path) ?? {
      path,
      sourceHash: context.sourceHashes.get(path) ?? context.sourceHashes.get('') ?? span.sourceHash,
      spans: [],
      excerpts: []
    };
    record.spans.push(span);
    const sourceText = context.sourceTexts.get(path) ?? context.sourceTexts.get('');
    const excerpt = includeExcerpts ? sourceTextForSpan(sourceText, span) : undefined;
    if (typeof excerpt === 'string') {
      const clipped = excerpt.length > maxExcerptBytes ? excerpt.slice(0, maxExcerptBytes) : excerpt;
      record.excerpts.push({
        span,
        text: clipped,
        textHash: hashSemanticValue(excerpt),
        truncated: clipped.length !== excerpt.length
      });
    }
    byPath.set(path, record);
  }
  return [...byPath.values()].map((file) => ({
    ...file,
    spanCount: file.spans.length,
    excerptCount: file.excerpts.length,
    sourceTextAvailable: file.excerpts.length > 0
  }));
}
