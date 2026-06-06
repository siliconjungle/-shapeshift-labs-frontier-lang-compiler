import{ensureTrailingNewline}from'./ensureTrailingNewline.js';import{nativeProjectionLineComment}from'./nativeProjectionLineComment.js';import{oneLine}from'./oneLine.js';
export function nativeProjectionStubHeader(language, context, options) {
  if (options.stubBanner === false) return '';
  if (typeof options.stubBanner === 'string') return ensureTrailingNewline(options.stubBanner).trimEnd();
  const comment = nativeProjectionLineComment(language);
  const suffix = context.sourcePath ? ` for ${oneLine(context.sourcePath)}` : '';
  return [
    `${comment} Frontier native source stubs${suffix}`,
    `${comment} Exact source text was unavailable; declarations are reconstructed from native import metadata.`
  ].join('\n');
}
