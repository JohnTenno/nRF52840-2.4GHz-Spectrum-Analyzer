#include <Adafruit_TinyUSB.h>

#define CH_START 0
#define CH_END   83
#define RX_SETTLE_US 40
#define DWELL_MIN_US 50
#define DWELL_MAX_US 20000

uint32_t dwellUs = 2000;
static uint8_t rxBuf[260] __attribute__((aligned(4)));

void radioInit() {
  NRF_CLOCK->EVENTS_HFCLKSTARTED = 0;
  NRF_CLOCK->TASKS_HFCLKSTART = 1;
  while (NRF_CLOCK->EVENTS_HFCLKSTARTED == 0);
  NRF_RADIO->POWER = 0;
  NRF_RADIO->POWER = 1;
  NRF_RADIO->MODE = RADIO_MODE_MODE_Ble_1Mbit << RADIO_MODE_MODE_Pos;
  NRF_RADIO->PACKETPTR = (uint32_t)rxBuf;
  NRF_RADIO->PCNF1 = 255;
  NRF_RADIO->MODECNF0 = (RADIO_MODECNF0_RU_Fast << RADIO_MODECNF0_RU_Pos) |
                        (RADIO_MODECNF0_DTX_Center << RADIO_MODECNF0_DTX_Pos);
  CoreDebug->DEMCR |= CoreDebug_DEMCR_TRCENA_Msk;
  DWT->CYCCNT = 0;
  DWT->CTRL |= DWT_CTRL_CYCCNTENA_Msk;
  NRF_RADIO->SHORTS = RADIO_SHORTS_READY_START_Msk | RADIO_SHORTS_END_START_Msk;
}

int8_t sampleChannel(uint8_t ch) {
  NRF_RADIO->FREQUENCY = ch;

  NRF_RADIO->EVENTS_READY = 0;
  NRF_RADIO->TASKS_RXEN = 1;
  while (NRF_RADIO->EVENTS_READY == 0);

  delayMicroseconds(RX_SETTLE_US);
  uint8_t minMag = 127;
  uint32_t t0 = DWT->CYCCNT;
  const uint32_t dwellCycles = dwellUs * 64;
  while ((uint32_t)(DWT->CYCCNT - t0) < dwellCycles) {
    NRF_RADIO->EVENTS_RSSIEND = 0;
    NRF_RADIO->TASKS_RSSISTART = 1;
    while (NRF_RADIO->EVENTS_RSSIEND == 0);
    uint8_t mag = (uint8_t)NRF_RADIO->RSSISAMPLE;
    if (mag < minMag) minMag = mag;
  }

  NRF_RADIO->TASKS_DISABLE = 1;
  while (NRF_RADIO->EVENTS_DISABLED == 0);
  NRF_RADIO->EVENTS_DISABLED = 0;

  return -(int8_t)minMag;
}

void setup() {
  Serial.begin(115200);
  while (!Serial) delay(10);
  radioInit();
}

void loop() {
  if (Serial.available()) {
    int c = Serial.read();
    if (c == 'D' || c == 'd') {
      long v = Serial.parseInt();
      while (Serial.available()) Serial.read();
      if (v >= DWELL_MIN_US && v <= DWELL_MAX_US) dwellUs = (uint32_t)v;
    }
  }
  static char out[512];
  int pos = 0;
  for (uint8_t ch = CH_START; ch <= CH_END; ch++) {
    int v = sampleChannel(ch);
    pos += snprintf(out + pos, sizeof(out) - pos, "%d", v);
    if (ch < CH_END) out[pos++] = ',';
  }
  out[pos++] = '\n';
  Serial.write((const uint8_t*)out, pos);
}
