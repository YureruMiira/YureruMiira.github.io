const parseMaybeJson = (value) => {
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
};

const logObject = (method, prefix, json) => {
    console[method](prefix, parseMaybeJson(json));
};

export const registerConsoleLoggingInterop = () => {
    globalThis.prism_console_debug_object = (prefix, json) => logObject("debug", prefix, json);
    globalThis.prism_console_log_object = (prefix, json) => logObject("log", prefix, json);
    globalThis.prism_console_warn_object = (prefix, json) => logObject("warn", prefix, json);
    globalThis.prism_console_error_object = (prefix, json) => logObject("error", prefix, json);
};
