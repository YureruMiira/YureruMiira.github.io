import { resolveAppLanguage } from "../common/language.js";

const consentCookieKey = "prism_cookie_consent";
const settingsCookieKey = "prism_settings";
const cookieBannerId = "prism-cookie-banner";

const bannerTexts = {
    zh: {
        title: "同意 Cookie",
        description: "我们使用 Cookie 保存主题与语言设置，仅在你手动同意后写入。",
        reject: "拒绝",
        accept: "同意 Cookie"
    },
    en: {
        title: "Accept Cookies",
        description: "We use cookies to save theme and language settings, and only write them after your consent.",
        reject: "Reject",
        accept: "Accept Cookies"
    }
};

const getBannerTexts = () => bannerTexts[resolveAppLanguage()] ?? bannerTexts.en;

const getCookie = (name) => {
    const prefix = `${name}=`;
    const cookies = document.cookie ? document.cookie.split(";") : [];
    for (const item of cookies) {
        const cookie = item.trim();
        if (cookie.startsWith(prefix)) {
            return decodeURIComponent(cookie.slice(prefix.length));
        }
    }
    return null;
};

const setCookie = (name, value, maxAgeDays) => {
    const maxAge = Math.max(1, Math.floor(maxAgeDays * 24 * 60 * 60));
    const secure = location.protocol === "https:" ? "; secure" : "";
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax${secure}`;
};

const deleteCookie = (name) => {
    const secure = location.protocol === "https:" ? "; secure" : "";
    document.cookie = `${name}=; path=/; max-age=0; samesite=lax${secure}`;
};

const getConsentStatus = () => getCookie(consentCookieKey) ?? "unknown";

const removeCookieBanner = () => {
    const banner = document.getElementById(cookieBannerId);
    if (banner) banner.remove();
};

const createElement = (tagName, className, textContent) => {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (textContent !== undefined) element.textContent = textContent;
    return element;
};

const createCookieActionButton = (className, label, onClick) => {
    const button = createElement("button", className, label);
    button.type = "button";
    button.addEventListener("click", onClick);
    return button;
};

const ensureCookieBanner = () => {
    if (getConsentStatus() !== "unknown") return;
    if (document.getElementById(cookieBannerId)) return;

    const texts = getBannerTexts();
    const language = resolveAppLanguage();

    const banner = createElement("div", "prism-cookie-banner");
    banner.id = cookieBannerId;
    banner.lang = language;

    const panel = createElement("div", "prism-cookie-panel");
    const title = createElement("h2", "prism-cookie-title", texts.title);
    const description = createElement("p", "prism-cookie-description", texts.description);
    const actions = createElement("div", "prism-cookie-actions");

    const rejectButton = createCookieActionButton(
        "prism-cookie-button prism-cookie-button-secondary",
        texts.reject,
        () => {
            setCookie(consentCookieKey, "rejected", 180);
            deleteCookie(settingsCookieKey);
            removeCookieBanner();
        }
    );

    const acceptButton = createCookieActionButton(
        "prism-cookie-button prism-cookie-button-primary",
        texts.accept,
        () => {
            setCookie(consentCookieKey, "accepted", 180);
            removeCookieBanner();
        }
    );

    actions.append(rejectButton, acceptButton);
    panel.append(title, description, actions);
    banner.append(panel);
    document.body.append(banner);
};

const getSettings = () => {
    if (getConsentStatus() !== "accepted") return null;
    return getCookie(settingsCookieKey);
};

const saveSettings = (json) => {
    if (getConsentStatus() !== "accepted") return false;
    setCookie(settingsCookieKey, json, 365);
    return true;
};

const clearCacheAndReload = async (cacheBustToken) => {
    try {
        if ('caches' in window) {
            const names = await caches.keys();
            await Promise.all(names.map(name => caches.delete(name)));
        }

        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map(reg => reg.unregister()));
        }
    } catch {
        // ignore cache API errors
    }

    const reloadUrl = new URL(location.href);
    reloadUrl.searchParams.set("ptv", cacheBustToken || Date.now().toString());
    location.replace(reloadUrl.toString());
};

export const registerCookieInterop = () => {
    globalThis.prism_cookie_get_settings = getSettings;
    globalThis.prism_cookie_save_settings = saveSettings;
    globalThis.prism_cookie_ensure_banner = ensureCookieBanner;
    globalThis.prism_clear_cache_and_reload = clearCacheAndReload;
};
