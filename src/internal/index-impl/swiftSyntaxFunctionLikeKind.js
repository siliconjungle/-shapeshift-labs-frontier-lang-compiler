export function swiftSyntaxFunctionLikeKind(kind) {
  return kind === 'FunctionDecl'
    || kind === 'InitializerDecl'
    || kind === 'DeinitializerDecl'
    || kind === 'SubscriptDecl'
    || kind === 'OperatorDecl'
    || kind === 'PrecedenceGroupDecl';
}
