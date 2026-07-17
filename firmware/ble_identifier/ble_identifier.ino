#include <bluefruit.h>

void scanCallback(ble_gap_evt_adv_report_t* report) {
  uint8_t buffer[32];
  memset(buffer, 0, sizeof(buffer));

  Serial.printf("%02X:%02X:%02X:%02X:%02X:%02X rssi=%d ch=%u",
                report->peer_addr.addr[5], report->peer_addr.addr[4],
                report->peer_addr.addr[3], report->peer_addr.addr[2],
                report->peer_addr.addr[1], report->peer_addr.addr[0],
                report->rssi, report->ch_index);

  if (Bluefruit.Scanner.parseReportByType(report, BLE_GAP_AD_TYPE_COMPLETE_LOCAL_NAME,
                                          buffer, sizeof(buffer) - 1) ||
      Bluefruit.Scanner.parseReportByType(report, BLE_GAP_AD_TYPE_SHORT_LOCAL_NAME,
                                          buffer, sizeof(buffer) - 1)) {
    Serial.printf(" name=%s", (char*)buffer);
  }

  memset(buffer, 0, sizeof(buffer));
  uint8_t len = Bluefruit.Scanner.parseReportByType(
      report, BLE_GAP_AD_TYPE_MANUFACTURER_SPECIFIC_DATA, buffer, sizeof(buffer));
  if (len >= 2) {
    uint16_t company = buffer[0] | (buffer[1] << 8);
    Serial.printf(" mfg=0x%04X", company);
  }

  Serial.println();
  Bluefruit.Scanner.resume();
}

void setup() {
  Serial.begin(115200);
  while (!Serial) delay(10);

  Bluefruit.begin(0, 1);
  Bluefruit.Scanner.setRxCallback(scanCallback);
  Bluefruit.Scanner.restartOnDisconnect(true);
  Bluefruit.Scanner.setInterval(160, 80);
  Bluefruit.Scanner.useActiveScan(true);
  Bluefruit.Scanner.start(0);

  Serial.println("# scanning BLE advertising...");
}

void loop() {
  delay(1000);
}
