import { scanJavaScriptLike } from './native-region-scanner-js.js';
import {
  scanCLike,
  scanCSharp,
  scanGo,
  scanJava,
  scanRust,
  scanSwift
} from './native-region-scanner-main.js';
import { scanPython } from './native-region-scanner-python.js';
import { scanPhp } from './native-region-scanner-php.js';
import { scanKotlin } from './native-region-scanner-kotlin.js';
import { scanScala } from './native-region-scanner-scala.js';
import { scanDart } from './native-region-scanner-dart.js';
import {
  scanLua,
  scanShell,
  scanSql,
  scanZig
} from './native-region-scanner-dynamic.js';
import { scanRuby } from './native-region-scanner-ruby.js';
import {
  scanElixir,
  scanErlang,
  scanGenericDeclarations,
  scanHaskell,
  scanR
} from './native-region-scanner-functional.js';
import { normalizeNativeLanguageId } from './native-import-utils.js';
export { lightweightCoverageLosses } from './native-region-scanner-core.js';
export {
  detectNewlineStyle,
  scanPreservedSourceDirectives,
  scanPreservedSourceTokens
} from './native-source-preservation-scanner.js';

function scanNativeDeclarations(input) {
  const language = normalizeNativeLanguageId(input.language) || String(input.language).toLowerCase();
  if (language === 'javascript' || language === 'typescript') return scanJavaScriptLike(input);
  if (language === 'python') return scanPython(input);
  if (language === 'rust') return scanRust(input);
  if (language === 'c' || language === 'cpp' || language === 'c++') return scanCLike(input);
  if (language === 'java') return scanJava(input);
  if (language === 'go') return scanGo(input);
  if (language === 'swift') return scanSwift(input);
  if (language === 'csharp' || language === 'c#') return scanCSharp(input);
  if (language === 'php') return scanPhp(input);
  if (language === 'ruby' || language === 'rb') return scanRuby(input);
  if (language === 'kotlin' || language === 'kt') return scanKotlin(input);
  if (language === 'scala' || language === 'sc') return scanScala(input);
  if (language === 'dart') return scanDart(input);
  if (language === 'lua') return scanLua(input);
  if (language === 'shell' || language === 'sh' || language === 'bash' || language === 'zsh') return scanShell(input);
  if (language === 'sql' || language === 'postgresql' || language === 'postgres' || language === 'mysql' || language === 'sqlite') return scanSql(input);
  if (language === 'zig') return scanZig(input);
  if (language === 'elixir' || language === 'ex' || language === 'exs') return scanElixir(input);
  if (language === 'erlang' || language === 'erl' || language === 'hrl') return scanErlang(input);
  if (language === 'haskell' || language === 'hs') return scanHaskell(input);
  if (language === 'r') return scanR(input);
  return scanGenericDeclarations(input);
}

export { scanNativeDeclarations };
