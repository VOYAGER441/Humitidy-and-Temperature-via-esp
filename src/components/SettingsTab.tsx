/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Clipboard,
  Alert
} from 'react-native';
import { SimulationSettings } from '../types';
import { ESP32_CODE_TEMPLATE } from '../utils';
import { FileCodeIcon, CopyIcon, ZapIcon, CheckIcon } from './Icons';

interface SettingsTabProps {
  settings: SimulationSettings;
  setSettings: React.Dispatch<React.SetStateAction<SimulationSettings>>;
  onClearHistory: () => void;
  onResetToMock: () => void;
  onTriggerEvent: (type: 'heatwave' | 'rainfall' | 'reset') => void;
}

export default function SettingsTab({
  settings,
  setSettings,
  onClearHistory,
  onResetToMock,
  onTriggerEvent,
}: SettingsTabProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    Clipboard.setString(ESP32_CODE_TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeviceStatusChange = (status: SimulationSettings['deviceStatus']) => {
    setSettings((prev) => ({ ...prev, deviceStatus: status }));
  };

  const handleSimulationSpeedChange = (speed: SimulationSettings['simSpeed']) => {
    setSettings((prev) => ({ ...prev, simSpeed: speed }));
  };

  const changeTemp = (amount: number) => {
    setSettings((prev) => ({
      ...prev,
      targetTemp: parseFloat(Math.min(40, Math.max(10, prev.targetTemp + amount)).toFixed(1)),
    }));
  };

  const changeHum = (amount: number) => {
    setSettings((prev) => ({
      ...prev,
      targetHum: Math.min(95, Math.max(10, prev.targetHum + amount)),
    }));
  };

  const changeNoise = (amount: number) => {
    setSettings((prev) => ({
      ...prev,
      noiseLevel: parseFloat(Math.min(2.0, Math.max(0.1, prev.noiseLevel + amount)).toFixed(1)),
    }));
  };

  const confirmWipe = () => {
    Alert.alert(
      'Wipe Cached Data',
      'Are you sure you want to delete all cached telemetry data? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onClearHistory }
      ]
    );
  };

  const confirmRestore = () => {
    Alert.alert(
      'Factory Restore',
      'Reset all target medians and restore 24h diurnal history mock data?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restore', onPress: onResetToMock }
      ]
    );
  };

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.container}>
      
      {/* Simulation Controls Sector */}
      <View style={styles.settingCard}>
        <View style={styles.cardHeader}>
          <ZapIcon color="#f97316" size={14} style={styles.zapIcon} />
          <Text style={styles.cardTitle}>CORE SIMULATION & TELEMETRY NODE</Text>
        </View>

        {/* Device Status Selector */}
        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>SIMULATED DEVICE STATE</Text>
          <View style={styles.btnGrid4}>
            {(['Online', 'Offline', 'Connecting', 'Error'] as const).map((status) => {
              const isActive = settings.deviceStatus === status;
              let activeStyle = styles.btnActiveOffline;
              if (isActive) {
                if (status === 'Online') activeStyle = styles.btnActiveOnline;
                else if (status === 'Connecting') activeStyle = styles.btnActiveConnecting;
                else if (status === 'Error') activeStyle = styles.btnActiveError;
              }
              return (
                <TouchableOpacity
                  key={status}
                  onPress={() => handleDeviceStatusChange(status)}
                  style={[styles.gridBtn, isActive && activeStyle]}
                >
                  <Text style={[styles.gridBtnText, isActive && styles.gridBtnTextActive]}>
                    {status}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Telemetry Clock / Frequency Selector */}
        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>TELEMETRY CLOCK FREQUENCY</Text>
          <View style={styles.btnGrid5}>
            {(['5s', '15s', '1m', '5m', 'paused'] as const).map((speed) => {
              const isActive = settings.simSpeed === speed;
              return (
                <TouchableOpacity
                  key={speed}
                  onPress={() => handleSimulationSpeedChange(speed)}
                  style={[styles.speedBtn, isActive && styles.speedBtnActive]}
                >
                  <Text style={[styles.speedBtnText, isActive && styles.speedBtnTextActive]}>
                    {speed === 'paused' ? 'PAUSE' : speed}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.helperText}>
            *Select "5s" to quickly watch charts populate with dynamic real-time feeds!
          </Text>
        </View>

        {/* Numeric Increments for Medians */}
        <View style={styles.incrementSection}>
          {/* Target Temperature */}
          <View style={styles.incrementRow}>
            <View style={styles.incrementTextColumn}>
              <Text style={styles.incrementLabel}>MEDIAN TEMP TARGET</Text>
              <Text style={styles.incrementDisplayVal}>{settings.targetTemp}°C</Text>
            </View>
            <View style={styles.incrementBtnRow}>
              <TouchableOpacity onPress={() => changeTemp(-0.5)} style={styles.incBtn}>
                <Text style={styles.incBtnText}>-0.5°</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => changeTemp(0.5)} style={styles.incBtn}>
                <Text style={styles.incBtnText}>+0.5°</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Target Humidity */}
          <View style={styles.incrementRow}>
            <View style={styles.incrementTextColumn}>
              <Text style={styles.incrementLabel}>MEDIAN HUMIDITY</Text>
              <Text style={styles.incrementDisplayVal}>{settings.targetHum}%</Text>
            </View>
            <View style={styles.incrementBtnRow}>
              <TouchableOpacity onPress={() => changeHum(-5)} style={styles.incBtn}>
                <Text style={styles.incBtnText}>-5%</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => changeHum(5)} style={styles.incBtn}>
                <Text style={styles.incBtnText}>+5%</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Fluctuations / Noise */}
          <View style={styles.incrementRow}>
            <View style={styles.incrementTextColumn}>
              <Text style={styles.incrementLabel}>SENSOR FLUCTUATIONS</Text>
              <Text style={styles.incrementDisplayVal}>{settings.noiseLevel}</Text>
            </View>
            <View style={styles.incrementBtnRow}>
              <TouchableOpacity onPress={() => changeNoise(-0.1)} style={styles.incBtn}>
                <Text style={styles.incBtnText}>-0.1</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => changeNoise(0.1)} style={styles.incBtn}>
                <Text style={styles.incBtnText}>+0.1</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

      </View>

      {/* Extreme Climate Event simulation buttons */}
      <View style={styles.anomalyCard}>
        <Text style={styles.anomalyTitle}>ANOMALOUS CLIMATE EVENT SIMULATOR</Text>
        <View style={styles.anomalyGrid}>
          <TouchableOpacity
            onPress={() => onTriggerEvent('heatwave')}
            style={[styles.anomalyBtn, styles.heatwaveBtn]}
          >
            <Text style={styles.heatwaveBtnText}>🔥 HEATWAVE CRISIS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onTriggerEvent('rainfall')}
            style={[styles.anomalyBtn, styles.rainfallBtn]}
          >
            <Text style={styles.rainfallBtnText}>☔ MONSOON BURST</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onTriggerEvent('reset')}
            style={[styles.anomalyBtn, styles.normalBtn]}
          >
            <Text style={styles.normalBtnText}>🍃 NORMAL STATUS</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Danger Zone Controls */}
      <View style={styles.dangerCard}>
        <View>
          <Text style={styles.dangerTitle}>DANGER ZONE</Text>
          <Text style={styles.dangerSubtitle}>Reset local mobile database cache telemetry points.</Text>
        </View>
        <View style={styles.dangerBtnGrid}>
          <TouchableOpacity onPress={confirmWipe} style={styles.wipeBtn}>
            <Text style={styles.wipeBtnText}>🗑️ WIPE CACHE</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmRestore} style={styles.restoreBtn}>
            <Text style={styles.restoreBtnText}>⚡ FACTORY RESTORE</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Arduino Sketch display scroll viewer */}
      <View style={styles.codeCard}>
        <View style={styles.codeHeader}>
          <View style={styles.codeHeaderLeft}>
            <FileCodeIcon color="#3cdcd1" size={14} style={styles.codeIcon} />
            <Text style={styles.codeTitle}>esp32_dht22_logger.ino</Text>
          </View>
          <TouchableOpacity
            onPress={handleCopyCode}
            style={[styles.copyBtn, copied && styles.copyBtnActive]}
          >
            {copied ? (
              <>
                <CheckIcon color="#10b981" size={10} />
                <Text style={styles.copyBtnTextActive}>COPIED</Text>
              </>
            ) : (
              <>
                <CopyIcon color="#ffffff" size={10} />
                <Text style={styles.copyBtnText}>COPY SOURCE</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Monospaced Scrollable code block */}
        <ScrollView style={styles.codeScrollView} nestedScrollEnabled={true}>
          <Text style={styles.codePreText}>{ESP32_CODE_TEMPLATE}</Text>
        </ScrollView>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#0a0a0b',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  settingCard: {
    backgroundColor: '#141417',
    borderWidth: 1,
    borderColor: '#202024',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  zapIcon: {
    marginRight: 6,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#71717a',
    letterSpacing: 1,
  },
  controlGroup: {
    marginBottom: 16,
  },
  controlLabel: {
    fontSize: 8,
    color: '#52525b',
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  btnGrid4: {
    flexDirection: 'row',
    gap: 6,
  },
  gridBtn: {
    flex: 1,
    backgroundColor: '#1c1c20',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActiveOnline: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10b981',
  },
  btnActiveOffline: {
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    borderColor: '#64748b',
  },
  btnActiveConnecting: {
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
    borderColor: '#facc15',
  },
  btnActiveError: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#ef4444',
  },
  gridBtnText: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'System',
  },
  gridBtnTextActive: {
    color: '#ffffff',
  },
  btnGrid5: {
    flexDirection: 'row',
    backgroundColor: '#0a0a0b',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1d1d21',
    padding: 3,
  },
  speedBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  speedBtnActive: {
    backgroundColor: '#27272a',
  },
  speedBtnText: {
    color: '#52525b',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'System',
  },
  speedBtnTextActive: {
    color: '#ffffff',
  },
  helperText: {
    fontSize: 8,
    color: '#52525b',
    marginTop: 6,
  },
  incrementSection: {
    borderTopWidth: 1,
    borderTopColor: '#202024',
    paddingTop: 16,
    marginTop: 8,
    flexDirection: 'column',
    gap: 14,
  },
  incrementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  incrementTextColumn: {
    flexDirection: 'column',
  },
  incrementLabel: {
    fontSize: 8,
    color: '#71717a',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  incrementDisplayVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'System',
  },
  incrementBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  incBtn: {
    backgroundColor: '#27272a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 50,
    alignItems: 'center',
  },
  incBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'System',
  },
  anomalyCard: {
    backgroundColor: 'rgba(20, 20, 23, 0.4)',
    borderWidth: 1,
    borderColor: '#202024',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  anomalyTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#71717a',
    letterSpacing: 1,
    marginBottom: 12,
  },
  anomalyGrid: {
    flexDirection: 'column',
    gap: 8,
  },
  anomalyBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
  },
  heatwaveBtn: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  heatwaveBtnText: {
    color: '#3b82f6',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: 'System',
  },
  rainfallBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  rainfallBtnText: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: 'System',
  },
  normalBtn: {
    backgroundColor: '#1c1c20',
    borderColor: '#27272a',
  },
  normalBtnText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: 'System',
  },
  dangerCard: {
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 1,
    backgroundColor: 'rgba(127, 29, 29, 0.05)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'column',
    gap: 12,
  },
  dangerTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#f87171',
    letterSpacing: 1,
    marginBottom: 2,
  },
  dangerSubtitle: {
    fontSize: 10,
    color: '#71717a',
    lineHeight: 14,
  },
  dangerBtnGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  wipeBtn: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  wipeBtnText: {
    color: '#f87171',
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'System',
  },
  restoreBtn: {
    flex: 1,
    backgroundColor: '#1c1c20',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  restoreBtnText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'System',
  },
  codeCard: {
    backgroundColor: '#141417',
    borderRadius: 20,
    borderColor: '#202024',
    borderWidth: 1,
    overflow: 'hidden',
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#202024',
  },
  codeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeIcon: {
    marginRight: 6,
  },
  codeTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#71717a',
    letterSpacing: 0.5,
  },
  copyBtn: {
    backgroundColor: '#27272a',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  copyBtnText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '700',
  },
  copyBtnTextActive: {
    color: '#10b981',
    fontSize: 8,
    fontWeight: '700',
  },
  codeScrollView: {
    height: 150,
    backgroundColor: '#0a0a0b',
    padding: 12,
  },
  codePreText: {
    fontFamily: 'System', // Standard monospaced font
    color: '#71717a',
    fontSize: 9,
    lineHeight: 13,
  },
});
