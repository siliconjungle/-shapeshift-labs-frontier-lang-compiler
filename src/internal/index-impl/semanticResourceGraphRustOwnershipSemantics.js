export function rustBindingOwnershipSemantics(input = {}) {
  const typeText = String(input.typeText ?? '');
  const initializerText = String(input.initializerText ?? '');
  const clone = rustCloneInitializer(initializerText);
  const copySemantics = rustCopyLikeType(typeText) || rustCopyLikeInitializer(initializerText);
  const dropSemantics = !copySemantics && (clone || rustDropLikeType(typeText) || rustDropLikeInitializer(initializerText))
    ? 'rust-destructor-drop'
    : undefined;
  return {
    ownershipSemantics: clone ? 'rust-clone-value' : copySemantics ? 'rust-copy-value' : 'rust-owned-value',
    copySemantics,
    cloneSemantics: Boolean(clone),
    cloneSourceBinding: clone?.sourceBinding,
    dropSemantics,
    semanticEvidenceKind: clone ? 'rust-explicit-clone-semantics' : copySemantics ? 'rust-copy-semantics' : dropSemantics ? 'rust-drop-semantics' : 'rust-owned-value-semantics'
  };
}

export function rustCloneInitializer(initializerText) {
  const match = String(initializerText ?? '').match(/^([A-Za-z_][A-Za-z0-9_]*)\.clone\s*\(\s*\)$/);
  return match ? { sourceBinding: match[1] } : undefined;
}

export function rustCopyLikeType(typeText) {
  return /^(?:u8|u16|u32|u64|u128|usize|i8|i16|i32|i64|i128|isize|bool|char|f32|f64)$/.test(String(typeText ?? '').trim())
    || /\bCopy\b/.test(String(typeText ?? ''));
}

function rustCopyLikeInitializer(initializerText) {
  const text = String(initializerText ?? '').trim();
  return /^(?:true|false|'[^']'|b?'[^']'|\d+(?:_\d+)*(?:\.\d+)?)$/.test(text);
}

function rustDropLikeType(typeText) {
  return /\b(?:String|Vec|Box|Rc|Arc|HashMap|HashSet|BTreeMap|BTreeSet|PathBuf|Buffer|File)\b/.test(String(typeText ?? ''));
}

function rustDropLikeInitializer(initializerText) {
  return /\b(?:String|Vec|Box|Rc|Arc|HashMap|HashSet|BTreeMap|BTreeSet|PathBuf|Buffer|File)::/.test(String(initializerText ?? ''));
}
