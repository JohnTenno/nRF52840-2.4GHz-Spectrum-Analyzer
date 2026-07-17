# 2.4 Scanner

2.4GHz spectrum analyzer + BLE device identifier, all in the browser. Born to
diagnose erratic SteamVR tracking (spoiler: it was a Bluetooth mouse left
powered on inside a backpack) and ended up as a low-cost home RF lab.

![nRF52840 boards](https://img.shields.io/badge/hardware-nRF52840-blue)
![web](https://img.shields.io/badge/web-GitHub%20Pages-green)

## What it does

- **Live 2400–2483MHz spectrum**: bar chart + waterfall history, peak hold,
  WiFi channel markers (1/6/11) and BLE advertising markers (37/38/39),
  frequency/level tooltip, PNG export.
- **Hot-swappable sweep speed**: from ~6 sweeps/s (maximum burst sensitivity)
  to ~77 sweeps/s (maximum time resolution), no reflashing needed.
- **BLE device panel** (with a second board): name, vendor, RSSI, packets/s
  and traffic share of every nearby advertiser.
- **Visual correlation**: click a device in the panel and its packets get
  highlighted in cyan on the waterfall, at the exact channel and instant.

## Required hardware

| Part | Purpose | Approx. cost |
|---|---|---|
| 1× nRF52840 (nice!nano v2 or "Pro Micro nRF52840" clone) | spectrum | ~$3-10 |
| 2nd nRF52840 board (optional) | simultaneous BLE identifier | ~$3-10 |

Any nRF52840 board with the Adafruit UF2 bootloader works (nice!nano,
SuperMini nRF52840, Seeed XIAO nRF52840...).

## Usage in 3 steps

1. **Flash**: put the board in bootloader mode (quick double-tap on the reset
   button — a USB drive named `NICENANO` or similar shows up) and drag
   [`spectrum_scanner.uf2`](docs/firmware/spectrum_scanner.uf2) onto it. The
   board reboots on its own. Same for the second board with
   [`ble_identifier.uf2`](docs/firmware/ble_identifier.uf2).
2. **Open the web app** (this repo's GitHub Pages, in Chrome or Edge — Web
   Serial does not exist in Firefox/Safari).
3. **Connect**: "Connect scanner" button → pick the board's port. If you have
   the second board, "Connect BLE identifier" → its port. Done.

> The `.uf2` files are also linked at the bottom of the web app itself.

## Repo layout

```
firmware/
  spectrum_scanner/   84-channel sweep with max-hold RSSI (Arduino source)
  ble_identifier/     BLE advertising scanner via SoftDevice (source)
  prebuilt/           ready-to-drag .uf2 files
docs/                 the web app (plain HTML+JS, no build step) + .uf2 files
                      — exactly what GitHub Pages serves
```

## Building from source

Firmware (requires [arduino-cli](https://arduino.github.io/arduino-cli/), the
Adafruit nRF52 core and the "Adafruit TinyUSB Library"):

```sh
arduino-cli compile --fqbn adafruit:nrf52:feather52840 firmware/spectrum_scanner
arduino-cli upload -p <BOOTLOADER_PORT> --fqbn adafruit:nrf52:feather52840 firmware/spectrum_scanner
```

Web: nothing to build — `docs/` is plain HTML + ES2022 JavaScript. Edit and
refresh. To run it locally: `python -m http.server` inside `docs/` (Web
Serial needs localhost or HTTPS).

## Technical details that cost blood

- The nRF52 radio driven through bare registers needs the **HFXO started
  manually** (without the SoftDevice nobody does it for you) and must reach
  the real **RX state** via the READY→START short — in RXIDLE the RSSI
  returns plausible-looking noise while being completely deaf.
- RSSI is sampled in **max-hold** over a configurable dwell (serial command
  `D<µs>`): 2.4GHz signals are bursts, and an instantaneous reading almost
  always lands on silence.
- The dwell is timed with the **DWT cycle counter** — the Adafruit core's
  `micros()` has ~1ms granularity and ruins short dwells.
- The identifier reports each packet's **advertising channel** (the
  SoftDevice's `ch_index`), which is what makes the packet→waterfall
  correlation possible.
- Serial protocol: 115200 baud (nominal — USB CDC runs much faster), one CSV
  line of 84 dBm values per sweep.

## Honest limitations

- The scanner measures **energy**, it does not decode: it sees everything
  (WiFi, BT, Zigbee, proprietary links, USB3 noise) but names nothing on its
  own.
- The BLE panel only names **standard BLE advertisers** — a VR dongle or a
  proprietary 2.4GHz mouse shows up in the spectrum but never in the list.
- One radio per board: that is why the combo uses two (simultaneous spectrum
  + BLE). With a single board, flash whichever firmware the moment calls for.
