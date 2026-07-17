import { els, setStatus, initCanvasSizing, updateStatsDisplay } from "./dom.js";
import { SerialLineConnection } from "./serial.js";
import { spectrum, parseSweepLine, addSweep, computeStats, resetPeak } from "./spectrum.js";
import { bleState, handleBleLine, renderPanel, initPanelInteraction } from "./ble.js";
import { pushWaterfallRow, initLegend, startRenderLoop } from "./render.js";
import { initTooltips } from "./tooltip.js";

const scanner = new SerialLineConnection();
const ble = new SerialLineConnection();

function onSweepLine(line) {
  if (spectrum.paused) return;
  const values = parseSweepLine(line);
  if (!values) return;
  addSweep(values);
  pushWaterfallRow(values);
  updateStatsDisplay(computeStats(values));
  setStatus("receiving", true);
}

async function toggleScanner() {
  if (scanner.running) {
    await scanner.disconnect();
    els.btnConnect.textContent = "Connect scanner";
    els.btnConnect.classList.add("primary");
    els.speedSel.disabled = true;
    setStatus("disconnected", false);
    return;
  }
  try {
    await scanner.connect(onSweepLine, (e) => setStatus(`read interrupted: ${e.message}`, false));
    els.btnConnect.textContent = "Disconnect";
    els.btnConnect.classList.remove("primary");
    els.speedSel.disabled = false;
    setStatus("waiting for data...", true);
    void sendDwell();
  } catch (e) {
    setStatus(`error: ${e.message}`, false);
  }
}

async function sendDwell() {
  try {
    await scanner.send(`D${els.speedSel.value}\n`);
    setStatus(`dwell ${els.speedSel.value}us`, true);
  } catch (e) {
    setStatus(`error sending command: ${e.message}`, false);
  }
}

async function toggleBle() {
  if (ble.running) {
    await ble.disconnect();
    bleState.running = false;
    els.btnBle.textContent = "Connect BLE identifier";
    els.btnBle.classList.remove("on");
    return;
  }
  try {
    await ble.connect(handleBleLine, (e) => setStatus(`BLE interrupted: ${e.message}`, false));
    bleState.running = true;
    els.btnBle.textContent = "BLE connected";
    els.btnBle.classList.add("on");
  } catch (e) {
    setStatus(`BLE error: ${e.message}`, false);
  }
}

function togglePause() {
  spectrum.paused = !spectrum.paused;
  els.btnPause.textContent = spectrum.paused ? "Resume" : "Pause";
  els.btnPause.classList.toggle("active", spectrum.paused);
  if (scanner.running) setStatus(spectrum.paused ? "paused" : "receiving", true);
}

function exportPNG() {
  const out = document.createElement("canvas");
  out.width = els.bars.width;
  out.height = els.bars.height + els.axis.height + els.waterfall.height;
  const ctx = out.getContext("2d");
  ctx.fillStyle = "#12151d";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(els.bars, 0, 0);
  ctx.drawImage(els.axis, 0, els.bars.height);
  ctx.drawImage(els.waterfall, 0, els.bars.height + els.axis.height);
  const a = document.createElement("a");
  a.download = `spectrum_${new Date().toISOString().replace(/[:.]/g, "-")}.png`;
  a.href = out.toDataURL("image/png");
  a.click();
}

els.btnConnect.addEventListener("click", () => void toggleScanner());
els.btnBle.addEventListener("click", () => void toggleBle());
els.btnPause.addEventListener("click", togglePause);
els.btnPeak.addEventListener("click", resetPeak);
els.btnExport.addEventListener("click", exportPNG);
els.speedSel.addEventListener("change", () => void sendDwell());

window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !(e.target instanceof HTMLButtonElement)) {
    e.preventDefault();
    togglePause();
  }
});

if (!("serial" in navigator)) {
  setStatus("this browser does not support Web Serial — use Chrome or Edge", false);
  els.btnConnect.disabled = true;
  els.btnBle.disabled = true;
}

initCanvasSizing();
initLegend();
initTooltips();
initPanelInteraction();
setInterval(renderPanel, 500);
startRenderLoop();
