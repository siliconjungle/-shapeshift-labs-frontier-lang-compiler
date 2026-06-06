export function swiftSyntaxConditionalCompilationKind(kind) {
  return /IfConfig|ConditionalCompilation|PoundIf|PoundElse|PoundElseif|PoundEndif/i.test(String(kind));
}
