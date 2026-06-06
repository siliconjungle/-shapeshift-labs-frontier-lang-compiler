import{upperFirst}from'../../native-import-utils.js';
export function normalizeKotlinPsiKind(kind) {
  const text = String(kind)
    .replace(/^org\.jetbrains\.kotlin\.psi\./, '')
    .replace(/^KtNodeTypes\./, '')
    .replace(/ElementType$/, '');
  const compact = text.replace(/[_\s.-]+/g, '').toLowerCase();
  const known = {
    kotlinfile: 'KtFile',
    ktfile: 'KtFile',
    file: 'KtFile',
    script: 'KtScript',
    ktscript: 'KtScript',
    packagedirective: 'KtPackageDirective',
    ktpackagedirective: 'KtPackageDirective',
    importdirective: 'KtImportDirective',
    ktimportdirective: 'KtImportDirective',
    class: 'KtClass',
    ktclass: 'KtClass',
    classorobject: 'KtClassOrObject',
    ktclassorobject: 'KtClassOrObject',
    objectdeclaration: 'KtObjectDeclaration',
    ktobjectdeclaration: 'KtObjectDeclaration',
    enumentry: 'KtEnumEntry',
    ktenumentry: 'KtEnumEntry',
    namedfunction: 'KtNamedFunction',
    ktnamedfunction: 'KtNamedFunction',
    function: 'KtNamedFunction',
    property: 'KtProperty',
    ktproperty: 'KtProperty',
    typealias: 'KtTypeAlias',
    kttypealias: 'KtTypeAlias',
    parameter: 'KtParameter',
    ktparameter: 'KtParameter',
    primaryconstructor: 'KtPrimaryConstructor',
    ktprimaryconstructor: 'KtPrimaryConstructor',
    secondaryconstructor: 'KtSecondaryConstructor',
    ktsecondaryconstructor: 'KtSecondaryConstructor',
    classinitializer: 'KtClassInitializer',
    ktclassinitializer: 'KtClassInitializer',
    annotationentry: 'KtAnnotationEntry',
    ktannotationentry: 'KtAnnotationEntry',
    contracteffect: 'KtContractEffect',
    ktcontracteffect: 'KtContractEffect',
    contractdescription: 'KtContractDescription',
    ktcontractdescription: 'KtContractDescription',
    error: 'PsiErrorElement',
    psierror: 'PsiErrorElement',
    psierrorelement: 'PsiErrorElement'
  };
  if (known[compact]) return known[compact];
  if (/^[A-Z0-9_]+$/.test(text)) return text.toLowerCase().split('_').map(upperFirst).join('');
  return text;
}
