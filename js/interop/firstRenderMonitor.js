import { resolveAppLanguage } from "../common/language.js";

let firstRenderTimeoutId = null;
let firstRenderStartTime = 0;

const firstRenderWarningThresholdMs = 1888;

const edgeWarningTexts = {
    zh: {
        title: "性能警告",
        description: "检测到Edge浏览器卡顿，请将设置项「隐私、搜索和服务」→「增强 Web 安全性」关闭。该选项会导致 WebAssembly JIT 编译被禁用，引发不可用的卡顿。",
        dismiss: "我知道了"
    },
    en: {
        title: "Performance Warning",
        description: 'Edge browser lag detected. Please turn off "Settings → Privacy, search, and services → Enhance your security on the web". This option disables WebAssembly JIT compilation, causing unusable lag.',
        dismiss: "Dismiss"
    }
};

const isEdgeBrowser = () => /Edg\//.test(navigator.userAgent);

const createElement = (tagName, className, textContent) => {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (textContent !== undefined) element.textContent = textContent;
    return element;
};

const showEdgePerformanceWarning = () => {
    if (document.getElementById("prism-edge-warning")) return;

    const texts = edgeWarningTexts[resolveAppLanguage()] ?? edgeWarningTexts.en;

    const overlay = createElement("div", "prism-edge-warning-overlay");
    overlay.id = "prism-edge-warning";

    const panel = createElement("div", "prism-edge-warning-panel");
    const title = createElement("h2", "prism-edge-warning-title", texts.title);
    const description = createElement("p", "prism-edge-warning-description", texts.description);
    const actions = createElement("div", "prism-edge-warning-actions");

    const dismissButton = createElement(
        "button",
        "prism-cookie-button prism-cookie-button-primary",
        texts.dismiss
    );
    dismissButton.type = "button";
    dismissButton.addEventListener("click", () => overlay.remove());

    actions.append(dismissButton);
    panel.append(title, description, actions);
    overlay.append(panel);
    document.body.append(overlay);
};

const startFirstRenderMonitor = () => {
    if (globalThis.prism_mainViewLoaded) return;
    if (firstRenderTimeoutId !== null) {
        clearTimeout(firstRenderTimeoutId);
    }

    firstRenderStartTime = performance.now();
    firstRenderTimeoutId = setTimeout(() => {
        firstRenderTimeoutId = null;
        if (globalThis.prism_mainViewLoaded) return;
        if (document.visibilityState !== "visible") return;
        if (performance.now() - firstRenderStartTime < firstRenderWarningThresholdMs) return;
        if (isEdgeBrowser()) {
            showEdgePerformanceWarning();
        }
    }, firstRenderWarningThresholdMs);
};

const notifyMainViewLoaded = () => {
    globalThis.prism_mainViewLoaded = true;
    if (firstRenderTimeoutId !== null) {
        clearTimeout(firstRenderTimeoutId);
        firstRenderTimeoutId = null;
    }
};

export const registerFirstRenderInterop = () => {
    globalThis.prism_mainViewLoaded = false;
    globalThis.prism_notifyMainViewLoaded = notifyMainViewLoaded;
};

export { startFirstRenderMonitor };
