/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TelemetryReading {
  timestamp: string; // ISO string
  timeLabel: string; // "12:45"
  temperature: number; // °C
  humidity: number; // %
  voltage: number; // V
  wifiRssi: number; // dBm
  uptime: number; // seconds
  status: 'NOMINAL' | 'WARM' | 'COLD' | 'HUMID' | 'DRY';
  device: string;
}

export interface SimulationSettings {
  deviceStatus: 'Online' | 'Offline' | 'Connecting' | 'Error';
  deviceName: string;
  simSpeed: '5s' | '15s' | '1m' | '5m' | 'paused';
  targetTemp: number; // base temp around which noise is added
  targetHum: number; // base humidity
  voltageBase: number;
  rssiBase: number;
  noiseLevel: number; // scale of random walk
}
