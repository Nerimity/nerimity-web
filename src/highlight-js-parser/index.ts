import aliases from './aliases.json';
import languages from './languages.json';

// language argument can be a name or alias.
export function getLanguageName(language: string) {
  if (languages.includes(language)) return language;
  const languageIndex = (aliases as any)[language];
  if (languageIndex === undefined) return false;
  return languages[languageIndex];
}