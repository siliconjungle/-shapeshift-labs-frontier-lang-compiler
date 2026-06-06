export function nativeProjectionLineComment(language) {
  if (language === 'python' || language === 'py' || language === 'ruby' || language === 'rb' || language === 'shell' || language === 'sh') return '#';
  if (language === 'sql') return '--';
  return '//';
}
