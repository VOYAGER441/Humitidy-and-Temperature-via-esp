/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ActivityIndicator,
  useColorScheme
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { TelemetryReading, SimulationSettings } from './src/types';
import { generateMockHistory } from './src/utils';

// Import child navigation views
import DashboardTab from './src/components/DashboardTab';
import HistoryTab from './src/components/HistoryTab';
import LogsTab from './src/components/LogsTab';
import SettingsTab from './src/components/SettingsTab';
import { DashboardIcon, HistoryIcon, SettingsIcon } from './src/components/Icons';

const CACHE_KEY_HISTORY = 'ecomonitor_telemetry_history_v2';
const CACHE_KEY_SETTINGS = 'ecomonitor_settings_v2';

const DEFAULT_SETTINGS: SimulationSettings = {
  deviceStatus: 'Online',
  deviceName: 'ESP32_WROOM_DA_01',
  simSpeed: '1m',
  targetTemp: 24.5,
  targetHum: 62,
  voltageBase: 3.31,
  rssiBase: -42,
  noiseLevel: 0.4,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'logs' | 'settings'>('dashboard');
  const [history, setHistory] = useState<TelemetryReading[]>([]);
  const [settings, setSettings] = useState<SimulationSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Background simulation tick interval ref
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial settings and history from AsyncStorage on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const storedHistory = await AsyncStorage.getItem(CACHE_KEY_HISTORY);
        const storedSettings = await AsyncStorage.getItem(CACHE_KEY_SETTINGS);
        
        if (storedHistory) {
          const parsedHistory = JSON.parse(storedHistory);
          if (parsedHistory.length > 0) {
            setHistory(parsedHistory);
          } else {
            setHistory(generateMockHistory(24, 5));
          }
        } else {
          setHistory(generateMockHistory(24, 5));
        }

        if (storedSettings) {
          setSettings(JSON.parse(storedSettings));
        }
      } catch (e) {
        console.error('Failed to load local storage from AsyncStorage', e);
        setHistory(generateMockHistory(24, 5));
      } finally {
        setIsLoading(false);
      }
    };
    loadState();
  }, []);

  // Persist state updates to AsyncStorage
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(CACHE_KEY_HISTORY, JSON.stringify(history)).catch((err) =>
        console.error('Failed storing history', err)
      );
    }
  }, [history, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(CACHE_KEY_SETTINGS, JSON.stringify(settings)).catch((err) =>
        console.error('Failed storing settings', err)
      );
    }
  }, [settings, isLoading]);

  // Core simulator generator tick function
  const triggerSimulationTick = () => {
    if (settings.deviceStatus === 'Offline') return;

    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const timeLabel = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    // Random walk simulation applying slider noise coefficients
    const tempWalk = (Math.random() - 0.5) * settings.noiseLevel;
    const currentTemp = parseFloat((settings.targetTemp + tempWalk).toFixed(1));

    const humWalk = Math.round((Math.random() - 0.5) * (settings.noiseLevel * 8));
    const currentHum = Math.max(10, Math.min(100, Math.round(settings.targetHum + humWalk)));

    const randVoltage = parseFloat(
      (3.30 + (Math.random() - 0.5) * 0.04).toFixed(2)
    );
    const randRssi = Math.round(-42 + (Math.random() - 0.5) * 6);

    // Status translation
    let currentStatus: TelemetryReading['status'] = 'NOMINAL';
    if (currentTemp > 26.5) currentStatus = 'WARM';
    else if (currentTemp < 19.0) currentStatus = 'COLD';
    else if (currentHum > 70) currentStatus = 'HUMID';
    else if (currentHum < 30) currentStatus = 'DRY';

    const timestamp = now.toISOString();

    const newReading: TelemetryReading = {
      timestamp,
      timeLabel,
      temperature: currentTemp,
      humidity: currentHum,
      voltage: randVoltage,
      wifiRssi: randRssi,
      uptime: history.length > 0 ? history[history.length - 1].uptime + 60 : 60,
      status: currentStatus,
      device: settings.deviceName,
    };

    setHistory((prev) => {
      const updated = [...prev, newReading];
      if (updated.length > 500) {
        return updated.slice(-500);
      }
      return updated;
    });
  };

  // Re-initialize background simulation tick on settings changes
  useEffect(() => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    if (settings.deviceStatus === 'Offline' || settings.simSpeed === 'paused') {
      return;
    }

    let delayMs = 60000; // 1 minute default
    switch (settings.simSpeed) {
      case '5s':
        delayMs = 5000;
        break;
      case '15s':
        delayMs = 15000;
        break;
      case '5m':
        delayMs = 300000;
        break;
      case '1m':
      default:
        delayMs = 60000;
        break;
    }

    intervalIdRef.current = setInterval(() => {
      triggerSimulationTick();
    }, delayMs);

    return () => {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    };
  }, [settings.simSpeed, settings.deviceStatus, settings.targetTemp, settings.targetHum, settings.noiseLevel, history]);

  // Handle extreme climate event anomaly triggers
  const handleTriggerAnomalyEvent = (type: 'heatwave' | 'rainfall' | 'reset') => {
    if (type === 'heatwave') {
      setSettings((prev) => ({
        ...prev,
        targetTemp: 34.0,
        targetHum: 20,
        noiseLevel: 0.8,
      }));
    } else if (type === 'rainfall') {
      setSettings((prev) => ({
        ...prev,
        targetTemp: 16.5,
        targetHum: 92,
        noiseLevel: 1.0,
      }));
    } else {
      setSettings((prev) => ({
        ...prev,
        targetTemp: 24.5,
        targetHum: 62,
        noiseLevel: 0.4,
      }));
    }

    // Force an immediate simulation tick
    setTimeout(() => {
      triggerSimulationTick();
    }, 100);
  };

  // Cache manipulation callbacks
  const handleClearHistoryLogs = async () => {
    try {
      await AsyncStorage.removeItem(CACHE_KEY_HISTORY);
      setHistory([]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetToFactoryMockData = async () => {
    try {
      const mockHistory = generateMockHistory(24, 5);
      await AsyncStorage.setItem(CACHE_KEY_HISTORY, JSON.stringify(mockHistory));
      setHistory(mockHistory);
      setSettings(DEFAULT_SETTINGS);
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3cdcd1" />
        <Text style={styles.loadingText}>Initializing EcoMonitor Node...</Text>
      </View>
    );
  }

  const latestReading = history.length > 0 ? history[history.length - 1] : null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Main Tab Rendering */}
      <View style={styles.content}>
        {activeTab === 'dashboard' && (
          <DashboardTab
            onNavigateToTab={(tab) => setActiveTab(tab)}
            latest={latestReading}
            settings={settings}
            onForceTick={triggerSimulationTick}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab history={history} />
        )}

        {activeTab === 'logs' && (
          <LogsTab history={history} />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            settings={settings}
            setSettings={setSettings}
            onClearHistory={handleClearHistoryLogs}
            onResetToMock={handleResetToFactoryMockData}
            onTriggerEvent={handleTriggerAnomalyEvent}
          />
        )}
      </View>

      {/* Customized Bottom Tab Navigation Bar */}
      <View style={styles.navBar}>
        <View style={styles.navBtnWrapper} onTouchEnd={() => setActiveTab('dashboard')}>
          <DashboardIcon color={activeTab === 'dashboard' ? '#3cdcd1' : '#71717a'} size={20} />
          <Text style={[styles.navBtnText, activeTab === 'dashboard' && styles.navBtnActive]}>
            Dash
          </Text>
        </View>

        <View style={styles.navBtnWrapper} onTouchEnd={() => setActiveTab('history')}>
          <HistoryIcon color={activeTab === 'history' ? '#3b82f6' : '#71717a'} size={20} />
          <Text style={[styles.navBtnText, activeTab === 'history' && styles.navBtnActive]}>
            Graphs
          </Text>
        </View>

        <View style={styles.navBtnWrapper} onTouchEnd={() => setActiveTab('logs')}>
          <Text style={[styles.logEmoji, activeTab === 'logs' && styles.logEmojiActive]}>📡</Text>
          <Text style={[styles.navBtnText, activeTab === 'logs' && styles.navBtnActive]}>
            Logs
          </Text>
        </View>

        <View style={styles.navBtnWrapper} onTouchEnd={() => setActiveTab('settings')}>
          <SettingsIcon color={activeTab === 'settings' ? '#3cdcd1' : '#71717a'} size={20} />
          <Text style={[styles.navBtnText, activeTab === 'settings' && styles.navBtnActive]}>
            Config
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0b',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#a1a1aa',
    fontFamily: 'System',
    fontSize: 14,
    marginTop: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  navBar: {
    height: 60,
    backgroundColor: '#0d0d0f',
    borderTopWidth: 1,
    borderTopColor: '#1f1f23',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 4,
  },
  navBtnWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  navBtnText: {
    fontSize: 10,
    color: '#71717a',
    fontWeight: '700',
    marginTop: 3,
    letterSpacing: 0.5,
  },
  navBtnActive: {
    color: '#ffffff',
  },
  logEmoji: {
    fontSize: 18,
    opacity: 0.6,
  },
  logEmojiActive: {
    opacity: 1,
  },
});
