import {
  NUM_CHANNELS, FREQ_START, HISTORY, DBM_MIN, DBM_MAX,
  WIFI_MARKERS, BLE_MARKERS, SELECT_COLOR,
} from "./config.js";
import { infernoCSS } from "./colormap.js";
import { els } from "./dom.js";
import { spectrum } from "./spectrum.js";
import { getSelectedDevice } from "./ble.js";

const barsCtx = els.bars.getContext("2d");
const axisCtx = els.axis.getContext("2d");
const wfCtx = els.waterfall.getContext("2d");
const wfBuffer = document.createElement("canvas");
wfBuffer.width = NUM_CHANNELS;
wfBuffer.height = HISTORY;
const wfBufCtx = wfBuffer.getContext("2d");
wfBufCtx.fillStyle = infernoCSS(DBM_MIN);
wfBufCtx.fillRect(0, 0, NUM_CHANNELS, HISTORY);

export function pushWaterfallRow(values) {
  wfBufCtx.drawImage(wfBuffer, 0, 1);
  for (let c = 0; c < NUM_CHANNELS; c++) {
    wfBufCtx.fillStyle = infernoCSS(values[c]);
    wfBufCtx.fillRect(c, 0, 1, 1);
  }
}

export function initLegend() {
  const stops = [];
  for (let i = 0; i <= 10; i++) {
    stops.push(infernoCSS(DBM_MIN + ((DBM_MAX - DBM_MIN) * i) / 10));
  }
  els.legendBar.style.background = `linear-gradient(to right, ${stops.join(",")})`;
}

const chX = (ch, w) => (ch / NUM_CHANNELS) * w;
const dbmY = (dbm, h) => {
  const t = (dbm - DBM_MIN) / (DBM_MAX - DBM_MIN);
  return h - Math.min(1, Math.max(0, t)) * h;
};

function activeMarkers() {
  return [
    ...(els.tgWifi.checked ? WIFI_MARKERS : []),
    ...(els.tgBle.checked ? BLE_MARKERS : []),
  ];
}

function drawBars() {
  const w = els.bars.width, h = els.bars.height;
  const dpr = window.devicePixelRatio || 1;
  barsCtx.clearRect(0, 0, w, h);
  barsCtx.font = `${11 * dpr}px ui-monospace, monospace`;

  for (let dbm = DBM_MIN + 10; dbm <= DBM_MAX; dbm += 10) {
    const y = dbmY(dbm, h);
    barsCtx.strokeStyle = "#20263a";
    barsCtx.beginPath();
    barsCtx.moveTo(0, y);
    barsCtx.lineTo(w, y);
    barsCtx.stroke();
    barsCtx.fillStyle = "#5a6178";
    barsCtx.fillText(`${dbm}`, 5 * dpr, y - 3 * dpr);
  }

  for (const m of activeMarkers()) {
    const x = chX(m.mhz - FREQ_START + 0.5, w);
    barsCtx.strokeStyle = m.color + "55";
    barsCtx.setLineDash([5 * dpr, 5 * dpr]);
    barsCtx.beginPath();
    barsCtx.moveTo(x, 0);
    barsCtx.lineTo(x, h);
    barsCtx.stroke();
    barsCtx.setLineDash([]);
    barsCtx.fillStyle = m.color;
    barsCtx.fillText(m.label, x + 4 * dpr, 13 * dpr);
  }

  if (spectrum.sweepCount > 0) {
    barsCtx.strokeStyle = "#9aa2bb99";
    barsCtx.lineWidth = dpr;
    barsCtx.beginPath();
    for (let i = 0; i < NUM_CHANNELS; i++) {
      const x = chX(i + 0.5, w), y = dbmY(spectrum.peakHold[i], h);
      i === 0 ? barsCtx.moveTo(x, y) : barsCtx.lineTo(x, y);
    }
    barsCtx.stroke();
  }

  if (spectrum.latest) {
    const slot = w / NUM_CHANNELS, barW = slot * 0.8;
    for (let i = 0; i < NUM_CHANNELS; i++) {
      const y = dbmY(spectrum.latest[i], h);
      barsCtx.fillStyle = infernoCSS(spectrum.latest[i]);
      barsCtx.fillRect(i * slot + (slot - barW) / 2, y, barW, h - y);
    }
  }
}

function drawAxis() {
  const w = els.axis.width, h = els.axis.height;
  const dpr = window.devicePixelRatio || 1;
  axisCtx.clearRect(0, 0, w, h);
  axisCtx.font = `${10.5 * dpr}px ui-monospace, monospace`;
  axisCtx.fillStyle = "#5a6178";
  axisCtx.textAlign = "center";
  for (let mhz = FREQ_START; mhz <= FREQ_START + NUM_CHANNELS; mhz += 10) {
    const x = chX(mhz - FREQ_START, w);
    axisCtx.fillText(`${mhz}`, Math.min(Math.max(x, 14 * dpr), w - 14 * dpr), h * 0.72);
  }
  axisCtx.textAlign = "left";
}

function drawWaterfall() {
  const w = els.waterfall.width, h = els.waterfall.height;
  wfCtx.imageSmoothingEnabled = false;
  wfCtx.clearRect(0, 0, w, h);
  wfCtx.drawImage(wfBuffer, 0, 0, NUM_CHANNELS, HISTORY, 0, 0, w, h);

  const dpr = window.devicePixelRatio || 1;
  for (const m of activeMarkers()) {
    const x = chX(m.mhz - FREQ_START + 0.5, w);
    wfCtx.strokeStyle = m.color + "30";
    wfCtx.setLineDash([3 * dpr, 6 * dpr]);
    wfCtx.beginPath();
    wfCtx.moveTo(x, 0);
    wfCtx.lineTo(x, h);
    wfCtx.stroke();
    wfCtx.setLineDash([]);
  }

  drawDeviceOverlay(w, h, dpr);
}

function drawDeviceOverlay(w, h, dpr) {
  const dev = getSelectedDevice();
  const { rowTimes } = spectrum;
  if (!dev || rowTimes.length === 0) return;

  const cellW = w / NUM_CHANNELS;
  const cellH = h / HISTORY;
  const oldest = rowTimes[rowTimes.length - 1];

  wfCtx.strokeStyle = SELECT_COLOR;
  wfCtx.lineWidth = Math.max(1, dpr);

  for (const p of dev.packets) {
    if (p.t < oldest) continue;
    let row = rowTimes.findIndex((rt) => rt <= p.t);
    if (row === -1) row = rowTimes.length - 1;
    const x = p.ch * cellW;
    const y = row * cellH;
    wfCtx.strokeRect(x - dpr, y - dpr, cellW + 2 * dpr, Math.max(cellH, 2 * dpr) + 2 * dpr);
  }
  wfCtx.font = `${11 * dpr}px ui-monospace, monospace`;
  wfCtx.fillStyle = SELECT_COLOR;
  wfCtx.fillText(`● ${dev.name ?? dev.mac}`, 8 * dpr, h - 8 * dpr);
}

export function startRenderLoop() {
  const frame = () => {
    drawBars();
    drawAxis();
    drawWaterfall();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
