import { BAUD } from "./config.js";

export class SerialLineConnection {
  constructor() {
    this.port = null;
    this.reader = null;
    this.writer = null;
    this.running = false;
  }

  async connect(onLine, onReadError) {
    this.port = await navigator.serial.requestPort();
    await this.port.open({ baudRate: BAUD });
    await this.port.setSignals({ dataTerminalReady: true, requestToSend: true });
    this.writer = this.port.writable?.getWriter() ?? null;
    this.running = true;
    void this.#readLoop(onLine, onReadError);
  }

  async #readLoop(onLine, onReadError) {
    if (!this.port?.readable) return;
    const decoder = new TextDecoder();
    let buffer = "";
    this.reader = this.port.readable.getReader();
    try {
      while (this.running) {
        const { value, done } = await this.reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf("\n")) >= 0) {
          onLine(buffer.slice(0, idx).trim());
          buffer = buffer.slice(idx + 1);
        }
      }
    } catch (e) {
      if (this.running && onReadError) onReadError(e);
    } finally {
      this.reader?.releaseLock();
    }
  }

  async send(text) {
    if (!this.writer) return;
    await this.writer.write(new TextEncoder().encode(text));
  }

  async disconnect() {
    this.running = false;
    try {
      await this.reader?.cancel();
      this.writer?.releaseLock();
      await this.port?.close();
    } catch {}
    this.reader = null;
    this.writer = null;
    this.port = null;
  }
}
