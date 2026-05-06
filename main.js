const currentModuleUrl = new URL(import.meta.url);
const cacheBustToken = currentModuleUrl.searchParams.get("ptv");

const importRelativeModule = (relativePath) => {
    const moduleUrl = new URL(relativePath, currentModuleUrl);

    if (cacheBustToken) {
        moduleUrl.searchParams.set("ptv", cacheBustToken);
    }

    return import(moduleUrl.toString());
};

const [
    { dotnet },
    { registerWebHidInterop },
    { registerBrowserInterop },
    { registerCookieInterop },
    { registerConsoleLoggingInterop },
    { registerFirstRenderInterop, startFirstRenderMonitor },
] = await Promise.all([
    importRelativeModule("./_framework/dotnet.js"),
    importRelativeModule("./js/interop/webhid.js"),
    importRelativeModule("./js/interop/browser.js"),
    importRelativeModule("./js/interop/cookieConsent.js"),
    importRelativeModule("./js/interop/consoleLogging.js"),
    importRelativeModule("./js/interop/firstRenderMonitor.js"),
]);

registerWebHidInterop();
registerBrowserInterop();
registerCookieInterop();
registerConsoleLoggingInterop();
registerFirstRenderInterop();

const is_browser = typeof window != "undefined";
if (!is_browser) throw new Error(`Expected to be running in a browser`);
globalThis.prism_cookie_ensure_banner();

const dotnetRuntime = await dotnet
    .withDiagnosticTracing(false)
    .withApplicationArgumentsFromQuery()
    .withConfig({ loadAllSatelliteResources: true })
    .create();

startFirstRenderMonitor();

const config = dotnetRuntime.getConfig();

await dotnetRuntime.runMain(config.mainAssemblyName, [globalThis.location.href]);
