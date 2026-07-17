import { FREQ_START } from "./config.js";

const $ = (id) => document.getElementById(id);

export const els = {
  btnConnect: $("connect"),
  btnBle: $("connectBle"),
  btnPause: $("pause"),
  btnPeak: $("peakreset"),
  btnExport: $("export"),
  speedSel: $("speed"),
  status: $("status"),
  tooltip: $("tooltip"),
  tgWifi: $("tgWifi"),
  tgBle: $("tgBle"),
  bars: $("bars"),
  axis: $("freqaxis"),
  waterfall: $("waterfall"),
  viz: $("viz"),
  legendBar: $("legendbar"),
  stMax: $("stMax"),
  stBusy: $("stBusy"),
  stOcc: $("stOcc"),
  stRate: $("stRate"),
  stBlePps: $("stBlePps"),
  devList: $("devlist"),
  devCount: $("devcount"),
};

export function setStatus(text, ok) {
  els.status.textContent = text;
  els.status.className = ok ? "ok" : "err";
}

export function fitCanvas(c) {
  const dpr = window.devicePixelRatio || 1;
  const r = c.getBoundingClientRect();
  const w = Math.round(r.width * dpr);
  const h = Math.round(r.height * dpr);
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
}

export function initCanvasSizing() {
  const fitAll = () => {
    fitCanvas(els.bars);
    fitCanvas(els.axis);
    fitCanvas(els.waterfall);
  };
  new ResizeObserver(fitAll).observe(els.viz);
  fitAll();
}

export function updateStatsDisplay({ maxV, maxI, occPct, rate }) {
  els.stMax.textContent = `${maxV.toFixed(0)} dBm`;
  els.stMax.style.color = maxV > -45 ? "var(--err)" : maxV > -65 ? "var(--warn)" : "var(--ok)";
  els.stBusy.textContent = `${FREQ_START + maxI} MHz`;
  els.stOcc.textContent = `${occPct.toFixed(0)}%`;
  els.stRate.textContent = rate === null ? "—" : rate.toFixed(1);
}
