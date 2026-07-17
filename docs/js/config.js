export const NUM_CHANNELS = 84;
export const FREQ_START = 2400;
export const HISTORY = 250;
export const DBM_MIN = -100;
export const DBM_MAX = -30;
export const OCC_THRESHOLD = -70;
export const BAUD = 115200;

export const WIFI_MARKERS = [
  { mhz: 2412, label: "WiFi 1", color: "#3d78d8" },
  { mhz: 2437, label: "WiFi 6", color: "#3d78d8" },
  { mhz: 2462, label: "WiFi 11", color: "#3d78d8" },
];

export const BLE_MARKERS = [
  { mhz: 2402, label: "BLE 37", color: "#3fae7a" },
  { mhz: 2426, label: "BLE 38", color: "#3fae7a" },
  { mhz: 2480, label: "BLE 39", color: "#3fae7a" },
];

export const BLE_WINDOW_MS = 30_000;
export const BLE_EXPIRE_MS = 60_000;
export const ADV_CH_TO_INDEX = { 37: 2, 38: 26, 39: 80 };
export const SELECT_COLOR = "#00e5ff";

export const COMPANIES = {
  0x004c: "Apple",
  0x0075: "Samsung",
  0x0006: "Microsoft",
  0x00e0: "Google",
  0x0059: "Nordic",
  0x038f: "Xiaomi",
  0x012d: "Sony",
  0x0087: "Garmin",
};
