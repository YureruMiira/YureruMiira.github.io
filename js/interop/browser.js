let beforeUnloadGuardEnabled = false;
let beforeUnloadListenerBound = false;

const onBeforeUnload = (event) => {
    if (!beforeUnloadGuardEnabled) return;
    event.preventDefault();
    event.returnValue = "";
};

const registerVisibilityChangeListener = (callback) => {
    document.addEventListener("visibilitychange", () => {
        callback(!document.hidden);
    });
};

const setDocumentTitle = (title) => {
    document.title = title ?? "PrismTerminal";
};

const setBeforeUnloadGuard = (enabled) => {
    beforeUnloadGuardEnabled = Boolean(enabled);
};

export const registerBrowserInterop = () => {
    globalThis.prism_isDocumentHidden = () => document.hidden;
    globalThis.prism_registerVisibilityChangeListener = registerVisibilityChangeListener;
    globalThis.prism_setDocumentTitle = setDocumentTitle;
    globalThis.prism_setBeforeUnloadGuard = setBeforeUnloadGuard;

    if (!beforeUnloadListenerBound) {
        window.addEventListener("beforeunload", onBeforeUnload);
        beforeUnloadListenerBound = true;
    }
};
