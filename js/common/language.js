const normalizeLanguageTag = (value) => {
    if (!value) return "";
    return String(value).trim().toLowerCase();
};

export const resolveAppLanguage = () => {
    const htmlLang = normalizeLanguageTag(document.documentElement?.lang);
    const browserLang = normalizeLanguageTag(
        Array.isArray(navigator.languages) && navigator.languages.length > 0
            ? navigator.languages[0]
            : navigator.language
    );
    const source = htmlLang || browserLang;
    if (source.startsWith("zh")) return "zh";
    return "en";
};
