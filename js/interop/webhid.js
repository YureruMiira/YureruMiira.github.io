const deviceMap = new Map();
let nextDeviceId = 1;
let isDeviceChangeListenerRegistered = false;
const inputListenerMap = new Map();

const isSupported = () => "hid" in navigator;

const ensureDeviceId = (device) => {
    for (const [id, mappedDevice] of deviceMap.entries()) {
        if (mappedDevice === device) return id;
    }
    const id = nextDeviceId++;
    deviceMap.set(id, device);
    return id;
};

const removeDevice = (device) => {
    for (const [id, mappedDevice] of deviceMap.entries()) {
        if (mappedDevice !== device) continue;
        deviceMap.delete(id);
        const listener = inputListenerMap.get(id);
        if (listener) {
            device.removeEventListener("inputreport", listener);
            inputListenerMap.delete(id);
        }
        return;
    }
};

const getDeviceOrThrow = (id) => {
    const device = deviceMap.get(id);
    if (!device) throw new Error("Device not found");
    return device;
};

const toDeviceInfo = (device) => ({
    id: ensureDeviceId(device),
    vendorId: device.vendorId,
    productId: device.productId,
    productName: device.productName,
    opened: device.opened,
    hasInputReport: !!device.collections?.some((collection) => (collection.inputReports?.length ?? 0) > 0),
    hasOutputReport: !!device.collections?.some((collection) => (collection.outputReports?.length ?? 0) > 0)
});

const getDevices = async () => {
    if (!isSupported()) return [];
    const devices = await navigator.hid.getDevices();
    return devices.map(toDeviceInfo);
};

const requestDevice = async (vendorId, productId) => {
    if (!isSupported()) return [];

    const filter = {};
    if (vendorId) filter.vendorId = vendorId;
    if (productId) filter.productId = productId;
    const filters = Object.keys(filter).length > 0 ? [filter] : [];

    try {
        const devices = await navigator.hid.requestDevice({ filters });
        return devices.map(toDeviceInfo);
    } catch (error) {
        console.error("User cancelled or error:", error);
        return [];
    }
};

const registerDeviceChangeListener = (callback) => {
    if (!isSupported() || isDeviceChangeListenerRegistered) return;

    const onConnect = (event) => {
        try {
            ensureDeviceId(event.device);
            callback();
        } catch (error) {
            console.error("webhid connect callback error:", error);
        }
    };

    const onDisconnect = (event) => {
        try {
            removeDevice(event.device);
            callback();
        } catch (error) {
            console.error("webhid disconnect callback error:", error);
        }
    };

    navigator.hid.addEventListener("connect", onConnect);
    navigator.hid.addEventListener("disconnect", onDisconnect);
    isDeviceChangeListenerRegistered = true;
};

const open = async (id) => {
    const device = getDeviceOrThrow(id);
    if (!device.opened) await device.open();
};

const close = async (id) => {
    const device = deviceMap.get(id);
    if (device?.opened) await device.close();
};

const sendReport = async (id, reportId, data) => {
    const device = getDeviceOrThrow(id);
    await device.sendReport(reportId, data);
};

const startInputListener = (id, callback) => {
    const device = deviceMap.get(id);
    if (!device) return;

    const existingListener = inputListenerMap.get(id);
    if (existingListener) {
        device.removeEventListener("inputreport", existingListener);
    }

    const listener = (event) => {
        const array = new Uint8Array(event.data.buffer);
        callback(event.reportId, array);
    };

    inputListenerMap.set(id, listener);
    device.addEventListener("inputreport", listener);
};

export const registerWebHidInterop = () => {
    globalThis.webhid_isSupported = isSupported;
    globalThis.webhid_getDevices = getDevices;
    globalThis.webhid_requestDevice = requestDevice;
    globalThis.webhid_register_device_change_listener = registerDeviceChangeListener;
    globalThis.webhid_open = open;
    globalThis.webhid_close = close;
    globalThis.webhid_sendReport = sendReport;
    globalThis.webhid_start_input_listener = startInputListener;
};
