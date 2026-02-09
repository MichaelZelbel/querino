// Supported languages for artefact content
export interface Language {
  code: string;
  label: string;
}

export const LANGUAGES: Language[] = [
  { code: "en", label: "English" },
  { code: "de", label: "German" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "pt", label: "Portuguese" },
  { code: "it", label: "Italian" },
  { code: "nl", label: "Dutch" },
  { code: "pl", label: "Polish" },
  { code: "tr", label: "Turkish" },
  { code: "ru", label: "Russian" },
  { code: "ar", label: "Arabic" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh", label: "Chinese" },
];

export const DEFAULT_LANGUAGE = "en";

export function getLanguageLabel(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.label || code.toUpperCase();
}
