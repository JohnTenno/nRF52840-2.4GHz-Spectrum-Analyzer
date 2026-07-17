
import {
  ADV_CH_TO_INDEX, BLE_EXPIRE_MS, BLE_WINDOW_MS, COMPANIES, SELECT_COLOR,
} from "./config.js";
import { els } from "./dom.js";

export const bleState = {
  devices: new Map(),
  selectedMac: null,
  running: false,
};

const LINE_RE = /^([0-9A-F:]{17})\s+rssi=(-?\d+)(?:\s+ch=(\d+))?(?:\s+name=(.*?))?(?:\s+mfg=0x([0-9A-Fa-f]{4}))?$/;

export function handleBleLine(line) {
  const m = LINE_RE.exec(line);
  if (!m) return;
  const [, mac, rssiStr, chStr, name, mfgHex] = m;
  const now = performance.now();
  let dev = bleState.devices.get(mac);
  if (!dev) {
    dev = { mac, rssi: 0, times: [], packets: [], lastSeen: now };
    bleState.devices.set(mac, dev);
  }
  dev.rssi = Number(rssiStr);
  if (name) dev.name = name;
  if (mfgHex) dev.mfg = parseInt(mfgHex, 16);
  dev.times.push(now);
  if (chStr) {
    const idx = ADV_CH_TO_INDEX[Number(chStr)];
    if (idx !== undefined) {
      dev.packets.push({ t: now, ch: idx });
      if (dev.packets.length > 1500) dev.packets.shift();
    }
  }
  dev.lastSeen = now;
}

export function getSelectedDevice() {
  return bleState.selectedMac ? bleState.devices.get(bleState.selectedMac) : undefined;
}

export function renderPanel() {
  const now = performance.now();
  let totalPackets = 0;

  for (const [mac, dev] of bleState.devices) {
    while (dev.times.length && now - dev.times[0] > BLE_WINDOW_MS) dev.times.shift();
    if (now - dev.lastSeen > BLE_EXPIRE_MS) { bleState.devices.delete(mac); continue; }
    totalPackets += dev.times.length;
  }

  const devs = [...bleState.devices.values()].sort((a, b) => b.times.length - a.times.length);
  els.devCount.textContent = devs.length ? `${devs.length} active` : "";
  els.stBlePps.textContent = bleState.running
    ? (totalPackets / (BLE_WINDOW_MS / 1000)).toFixed(1)
    : "—";

  if (!devs.length) {
    els.devList.innerHTML = `<div id="devempty">${bleState.running ? "listening..." : "connect the second nRF<br>(ble_identifier firmware)"
      }</div>`;
    return;
  }

  els.devList.innerHTML = devs.map((d) => deviceCard(d, totalPackets)).join("");
}

function deviceCard(d, totalPackets) {
  const share = totalPackets ? (d.times.length / totalPackets) * 100 : 0;
  const pps = d.times.length / (BLE_WINDOW_MS / 1000);
  const vendor = d.mfg !== undefined
    ? COMPANIES[d.mfg] ?? `0x${d.mfg.toString(16).toUpperCase().padStart(4, "0")}`
    : "";
  const title = d.name ?? d.mac;
  const strong = d.rssi > -55 && share > 20;
  const selected = d.mac === bleState.selectedMac;
  return `<div class="dev${strong ? " strong" : ""}${selected ? " selected" : ""}" data-mac="${d.mac}"
               style="${selected ? `border-color:${SELECT_COLOR};` : ""}">
    <div class="row1">
      <span class="dot" style="background:${selected ? SELECT_COLOR : "#3a445f"}"></span>
      <span class="name" title="${d.mac}">${title}</span><span class="vendor">${vendor}</span>
    </div>
    <div class="row2"><span>${d.rssi} dBm</span><span>${pps.toFixed(1)} pkt/s</span><span>${share.toFixed(0)}%</span></div>
    <div class="sharebar"><div style="width:${share.toFixed(1)}%; background:${selected ? SELECT_COLOR : ""}"></div></div>
  </div>`;
}

export function initPanelInteraction() {
  els.devList.addEventListener("click", (e) => {
    const card = e.target.closest(".dev");
    if (!card?.dataset.mac) return;
    bleState.selectedMac = bleState.selectedMac === card.dataset.mac ? null : card.dataset.mac;
    renderPanel();
  });
}
