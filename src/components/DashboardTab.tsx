/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { TelemetryReading, SimulationSettings } from '../types';
import {
  ThermostatIcon,
  HumidityIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ActivityIcon,
  CpuIcon,
  RefreshIcon
} from './Icons';

interface DashboardTabProps {
  onNavigateToTab: (tab: 'dashboard' | 'history' | 'logs' | 'settings') => void;
  latest: TelemetryReading | null;
  settings: SimulationSettings;
  onForceTick: () => void;
}

export default function DashboardTab({
  onNavigateToTab,
  latest,
  settings,
  onForceTick,
}: DashboardTabProps) {
  const [streamHeights, setStreamHeights] = useState<number[]>(
    Array.from({ length: 24 }, () => Math.floor(Math.random() * 60) + 20)
  );

  // Update dynamic waveform live bars
  useEffect(() => {
    if (settings.deviceStatus === 'Offline' || settings.simSpeed === 'paused') {
      return;
    }
    const interval = setInterval(() => {
      setStreamHeights((prev) => {
        const next = [...prev.slice(1)];
        const newVal = Math.floor(Math.random() * 70) + 15;
        next.push(newVal);
        return next;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [settings.deviceStatus, settings.simSpeed]);

  if (!latest) {
    return (
      <View style={styles.emptyContainer}>
        <RefreshIcon color="#3cdcd1" size={24} style={styles.spinIcon} />
        <Text style={styles.emptyText}>Awaiting first ESP telemetry sample...</Text>
      </View>
    );
  }

  // Calculate status glow color classes
  const statusColors = {
    Online: { dot: '#10b981', text: '#10b981' },
    Offline: { dot: '#64748b', text: '#64748b' },
    Connecting: { dot: '#facc15', text: '#facc15' },
    Error: { dot: '#ef4444', text: '#ef4444' },
  };

  const statusStyle = statusColors[settings.deviceStatus];

  // Simple relative time string
  const getRelativeTime = () => {
    if (settings.deviceStatus === 'Offline') return 'Device disconnected';
    return 'updated Just Now';
  };

  // Human friendly uptime formatter
  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.container}>
      
      {/* Device Status Segment */}
      <View style={styles.statusRow}>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: statusStyle.dot }]} />
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {settings.deviceStatus.toUpperCase()}
          </Text>
          <Text style={styles.deviceLabel}>({latest.device})</Text>
        </View>
        <Text style={styles.relativeTime}>{getRelativeTime()}</Text>
      </View>

      {/* Main Dual Metric Cards Grid */}
      <View style={styles.gridRow}>
        {/* Temperature Card */}
        <View style={[styles.card, styles.tempGlow]}>
          <View style={styles.cardHeader}>
            <Text style={styles.tempIndicatorText}>TEMPERATURE</Text>
            <ThermostatIcon color="#f97316" size={18} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardBigNumber}>{latest.temperature.toFixed(1)}</Text>
            <Text style={styles.cardUnitText}>°C</Text>
          </View>
          <View style={styles.cardFooter}>
            <TrendingUpIcon color="#f97316" size={12} />
            <Text style={styles.cardSubtext}>+0.2° from last min</Text>
          </View>
          
          {/* Sparkline decoration */}
          <View style={styles.sparklineContainer}>
            {Array.from({ length: 16 }).map((_, i) => {
              const h = Math.sin((i + latest.temperature) * 0.5) * 12 + 16;
              return (
                <View
                  key={i}
                  style={[styles.sparkBar, { height: h, backgroundColor: 'rgba(249, 115, 22, 0.4)' }]}
                />
              );
            })}
          </View>
        </View>

        {/* Humidity Card */}
        <View style={[styles.card, styles.humGlow]}>
          <View style={styles.cardHeader}>
            <Text style={styles.humIndicatorText}>HUMIDITY</Text>
            <HumidityIcon color="#3cdcd1" size={18} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardBigNumber}>{latest.humidity}</Text>
            <Text style={styles.cardUnitText}>%</Text>
          </View>
          <View style={styles.cardFooter}>
            <TrendingDownIcon color="#3cdcd1" size={12} />
            <Text style={styles.cardSubtext}>-1.5% from last min</Text>
          </View>

          {/* Sparkline decoration */}
          <View style={styles.sparklineContainer}>
            {Array.from({ length: 16 }).map((_, i) => {
              const h = Math.cos((i + latest.humidity) * 0.3) * 12 + 16;
              return (
                <View
                  key={i}
                  style={[styles.sparkBar, { height: h, backgroundColor: 'rgba(60, 220, 209, 0.4)' }]}
                />
              );
            })}
          </View>
        </View>
      </View>

      {/* Real-time Streaming Soundwave / Spectrogram */}
      <View style={styles.glassCard}>
        <View style={styles.secHeaderRow}>
          <View style={styles.secHeaderLeft}>
            <ActivityIcon color="#3cdcd1" size={14} style={styles.activityIcon} />
            <Text style={styles.secHeaderText}>LIVE SPECTROGRAM TELEMETRY</Text>
          </View>
          <View style={styles.secHeaderRight}>
            <Text style={styles.deviceNameBadge}>{settings.deviceName}</Text>
            <CpuIcon color="#3cdcd1" size={12} />
          </View>
        </View>

        {/* Dynamic Waveform Visual Box */}
        <View style={styles.waveformContainer}>
          {settings.deviceStatus === 'Offline' ? (
            <View style={styles.overlayContainer}>
              <Text style={styles.overlayText}>[TELEMETRY STREAM DISCONNECTED]</Text>
            </View>
          ) : settings.simSpeed === 'paused' ? (
            <View style={styles.overlayContainer}>
              <Text style={styles.overlayText}>[STREAM PAUSED - MANUAL STEP ENABLED]</Text>
            </View>
          ) : null}

          <View style={styles.barWrapper}>
            {streamHeights.map((h, idx) => {
              let barColor = 'rgba(60, 220, 209, 0.4)';
              if (h > 65) {
                barColor = '#f97316';
              } else if (h > 45) {
                barColor = '#3cdcd1';
              }
              
              return (
                <View
                  key={idx}
                  style={[
                    styles.streamBar,
                    {
                      height: settings.deviceStatus === 'Offline' ? 2 : `${h}%`,
                      backgroundColor: barColor,
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>

        {/* Technical Specification Stats Grid */}
        <View style={styles.specGrid}>
          <View style={styles.specCell}>
            <Text style={styles.specLabel}>VOLTAGE LEVEL</Text>
            <Text style={styles.specValue}>{latest.voltage.toFixed(2)}V</Text>
          </View>
          <View style={styles.specCell}>
            <Text style={styles.specLabel}>WIFI RSSI</Text>
            <Text style={styles.specValue}>{latest.wifiRssi} dBm</Text>
          </View>
          <View style={styles.specCell}>
            <Text style={styles.specLabel}>UPTIME CLOCK</Text>
            <Text style={styles.specValue}>{formatUptime(latest.uptime)}</Text>
          </View>
        </View>
      </View>

      {/* Simulator Direct Access Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          onPress={onForceTick}
          disabled={settings.deviceStatus === 'Offline'}
          style={[styles.primaryBtn, settings.deviceStatus === 'Offline' && styles.disabledBtn]}
        >
          <RefreshIcon color="#0a0a0b" size={14} />
          <Text style={styles.primaryBtnText}>PULSE TELEMETRY MANUALLY</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onNavigateToTab('settings')}
          style={styles.secondaryBtn}
        >
          <Text style={styles.secondaryBtnText}>OPEN CORES & SIMULATORS</Text>
        </TouchableOpacity>
      </View>

      {/* Historical Summary Navigation Link */}
      <TouchableOpacity
        onPress={() => onNavigateToTab('history')}
        style={styles.shortcutCard}
      >
        <View style={styles.shortcutLeft}>
          <View style={styles.shortcutIconBox}>
            <ActivityIcon color="#3cdcd1" size={18} />
          </View>
          <View style={styles.shortcutTextBox}>
            <Text style={styles.shortcutTitle}>View Advanced Grafana Charts</Text>
            <Text style={styles.shortcutSubtitle}>24-Hour Telemetry Grid Included</Text>
          </View>
        </View>
        <Text style={styles.shortcutArrow}>➔</Text>
      </TouchableOpacity>

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
  emptyContainer: {
    flex: 1,
    backgroundColor: '#0a0a0b',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  spinIcon: {
    marginBottom: 16,
  },
  emptyText: {
    color: '#71717a',
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'System',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  deviceLabel: {
    fontSize: 11,
    color: '#52525b',
    marginLeft: 4,
    fontFamily: 'System',
  },
  relativeTime: {
    fontSize: 10,
    color: '#71717a',
    fontFamily: 'System',
    fontWeight: '500',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    backgroundColor: '#141417',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 20,
    padding: 14,
    minHeight: 140,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  tempGlow: {
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  humGlow: {
    borderColor: 'rgba(60, 220, 209, 0.3)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tempIndicatorText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#f97316',
    letterSpacing: 1,
  },
  humIndicatorText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#3cdcd1',
    letterSpacing: 1,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 10,
  },
  cardBigNumber: {
    fontSize: 36,
    fontWeight: '200',
    color: '#ffffff',
    fontFamily: 'System',
  },
  cardUnitText: {
    fontSize: 16,
    color: '#71717a',
    fontWeight: '400',
    marginLeft: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  cardSubtext: {
    fontSize: 9,
    color: '#52525b',
    fontWeight: '500',
  },
  sparklineContainer: {
    position: 'absolute',
    bottom: 0,
    left: 10,
    right: 10,
    height: 30,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    opacity: 0.15,
  },
  sparkBar: {
    width: 4,
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
  },
  glassCard: {
    backgroundColor: '#141417',
    borderWidth: 1,
    borderColor: '#202024',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  secHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  secHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    marginRight: 6,
  },
  secHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#e4e4e7',
    letterSpacing: 1,
  },
  secHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deviceNameBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#3cdcd1',
    backgroundColor: 'rgba(60, 220, 209, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(60, 220, 209, 0.25)',
  },
  waveformContainer: {
    height: 80,
    backgroundColor: '#0a0a0b',
    borderWidth: 1,
    borderColor: '#1d1d21',
    borderRadius: 10,
    padding: 8,
    justifyContent: 'flex-end',
    position: 'relative',
    overflow: 'hidden',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 11, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  overlayText: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'System',
  },
  barWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
    width: '100%',
  },
  streamBar: {
    flex: 1,
    marginHorizontal: 1,
    borderRadius: 2,
  },
  specGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#202024',
    paddingTop: 12,
    marginTop: 12,
    gap: 8,
  },
  specCell: {
    flex: 1,
  },
  specLabel: {
    fontSize: 8,
    color: '#52525b',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  specValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'System',
  },
  actionsContainer: {
    flexDirection: 'column',
    gap: 10,
    marginBottom: 16,
  },
  primaryBtn: {
    backgroundColor: '#3cdcd1',
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  disabledBtn: {
    opacity: 0.4,
  },
  primaryBtnText: {
    color: '#0a0a0b',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: 'System',
  },
  secondaryBtn: {
    borderColor: 'rgba(60, 220, 209, 0.3)',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#3cdcd1',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: 'System',
  },
  shortcutCard: {
    backgroundColor: '#141417',
    borderWidth: 1,
    borderColor: '#202024',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shortcutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shortcutIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#1c1c20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shortcutTextBox: {
    justifyContent: 'center',
  },
  shortcutTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  shortcutSubtitle: {
    fontSize: 9,
    color: '#71717a',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  shortcutArrow: {
    color: '#3cdcd1',
    fontSize: 12,
    fontWeight: '700',
  },
});
