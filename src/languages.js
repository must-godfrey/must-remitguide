// Canonical list of languages RemitGuide supports.
//
// `ui: true`  → the front-end chrome (labels, buttons) is fully localized.
// `ui: false` → conversation still works (Qwen replies in this language) and the
//               read-aloud voice + language chip are correct, but UI chrome falls
//               back to English. This lets us advertise broad language support
//               honestly without shipping half-translated UI strings.
//
// The conversation itself is NOT limited to this list — Qwen handles many more
// languages; this is the set we explicitly recognise, label, and voice.

export const LANGUAGES = [
  { code: "en", name: "English", native: "English", bcp47: "en-US", rtl: false, ui: true },
  { code: "ko", name: "Korean", native: "한국어", bcp47: "ko-KR", rtl: false, ui: true },
  { code: "zh", name: "Chinese", native: "中文", bcp47: "zh-CN", rtl: false, ui: true },
  { code: "ja", name: "Japanese", native: "日本語", bcp47: "ja-JP", rtl: false, ui: true },
  { code: "es", name: "Spanish", native: "Español", bcp47: "es-ES", rtl: false, ui: true },
  { code: "fr", name: "French", native: "Français", bcp47: "fr-FR", rtl: false, ui: true },
  { code: "pt", name: "Portuguese", native: "Português", bcp47: "pt-BR", rtl: false, ui: true },
  { code: "de", name: "German", native: "Deutsch", bcp47: "de-DE", rtl: false, ui: true },
  { code: "ru", name: "Russian", native: "Русский", bcp47: "ru-RU", rtl: false, ui: true },
  { code: "ar", name: "Arabic", native: "العربية", bcp47: "ar-SA", rtl: true, ui: true },
  { code: "hi", name: "Hindi", native: "हिन्दी", bcp47: "hi-IN", rtl: false, ui: true },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt", bcp47: "vi-VN", rtl: false, ui: true },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia", bcp47: "id-ID", rtl: false, ui: true },
  { code: "it", name: "Italian", native: "Italiano", bcp47: "it-IT", rtl: false, ui: true },
  { code: "tr", name: "Turkish", native: "Türkçe", bcp47: "tr-TR", rtl: false, ui: true },
  { code: "tl", name: "Filipino", native: "Filipino", bcp47: "fil-PH", rtl: false, ui: true },
  { code: "sw", name: "Swahili", native: "Kiswahili", bcp47: "sw-KE", rtl: false, ui: true },
  // Nigeria's own languages (the recipient side of this corridor).
  { code: "yo", name: "Yoruba", native: "Yorùbá", bcp47: "yo-NG", rtl: false, ui: false },
  { code: "ig", name: "Igbo", native: "Igbo", bcp47: "ig-NG", rtl: false, ui: false },
  { code: "ha", name: "Hausa", native: "Hausa", bcp47: "ha-NG", rtl: false, ui: false },
  // Recognised + voiced; UI chrome falls back to English.
  { code: "th", name: "Thai", native: "ไทย", bcp47: "th-TH", rtl: false, ui: false },
  { code: "bn", name: "Bengali", native: "বাংলা", bcp47: "bn-BD", rtl: false, ui: false },
  { code: "ne", name: "Nepali", native: "नेपाली", bcp47: "ne-NP", rtl: false, ui: false },
  { code: "ur", name: "Urdu", native: "اردو", bcp47: "ur-PK", rtl: true, ui: false },
  { code: "km", name: "Khmer", native: "ខ្មែរ", bcp47: "km-KH", rtl: false, ui: false },
  { code: "my", name: "Burmese", native: "မြန်မာ", bcp47: "my-MM", rtl: false, ui: false },
  { code: "uz", name: "Uzbek", native: "Oʻzbekcha", bcp47: "uz-UZ", rtl: false, ui: false },
];

export const byCode = Object.fromEntries(LANGUAGES.map((l) => [l.code, l]));
