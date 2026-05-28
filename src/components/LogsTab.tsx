/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  Dimensions
} from 'react-native';
import { TelemetryReading } from '../types';

interface LogsTabProps {
  history: TelemetryReading[];
}

export default function LogsTab({ history }: LogsTabProps) {
  // Sort reverse chronological order to show newest readings first
  const sortedLogs = [...history].reverse();

  // Calculations for historical average and peaks
  const latestTen = history.slice(-20);
  const avgTemp = latestTen.length 
    ? parseFloat((latestTen.reduce((sum, item) => sum + item.temperature, 0) / latestTen.length).toFixed(1))
    : 24.5;

  const peakHigh = history.length
    ? Math.max(...history.map(item => item.temperature))
    : 28.2;
    
  const peakLow = history.length
    ? Math.min(...history.map(item => item.temperature))
    : 18.5;

  // Render Status badge properties based on temperature/humidity statuses
  const getStatusConfig = (status: TelemetryReading['status']) => {
    switch (status) {
      case 'WARM':
        return {
          bar: '#f97316',
          badgeText: '#f97316',
          badgeBg: 'rgba(249, 115, 22, 0.1)',
          badgeBorder: 'rgba(249, 115, 22, 0.2)',
          label: 'WARM'
        };
      case 'COLD':
        return {
          bar: '#3b82f6',
          badgeText: '#3b82f6',
          badgeBg: 'rgba(59, 130, 246, 0.1)',
          badgeBorder: 'rgba(59, 130, 246, 0.2)',
          label: 'COLD'
        };
      case 'DRY':
        return {
          bar: '#fbbf24',
          badgeText: '#fbbf24',
          badgeBg: 'rgba(251, 191, 36, 0.1)',
          badgeBorder: 'rgba(251, 191, 36, 0.2)',
          label: 'DRY'
        };
      case 'HUMID':
        return {
          bar: '#818cf8',
          badgeText: '#818cf8',
          badgeBg: 'rgba(129, 140, 248, 0.1)',
          badgeBorder: 'rgba(129, 140, 248, 0.2)',
          label: 'HUMID'
        };
      case 'NOMINAL':
      default:
        return {
          bar: '#10b981',
          badgeText: '#10b981',
          badgeBg: 'rgba(16, 185, 129, 0.1)',
          badgeBorder: 'rgba(16, 185, 129, 0.2)',
          label: 'NOMINAL'
        };
    }
  };

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.container}>
      
      {/* Upper Average / High / Low Banner Grid */}
      <View style={styles.bannerCard}>
        <View style={styles.bannerTopRow}>
          <View>
            <Text style={styles.bannerLabel}>RUNNING AVERAGE TEMPERATURE</Text>
            <Text style={styles.bannerMainVal}>
              {avgTemp}
              <Text style={styles.bannerMainUnit}>°C</Text>
            </Text>
          </View>
          <View style={styles.statusBadgeRight}>
            <View style={styles.statusPill}>
              <View style={styles.pulseDot} />
              <Text style={styles.pulseDotText}>STABLE</Text>
            </View>
            <Text style={styles.statusSystemText}>SYSTEM STATUS OK</Text>
          </View>
        </View>

        {/* Dynamic Peak display cards */}
        <View style={styles.peaksGrid}>
          <View style={styles.peakCard}>
            <Text style={styles.peakLabel}>PEAK RECORDED HIGH</Text>
            <Text style={[styles.peakValue, { color: '#f97316' }]}>
              {peakHigh.toFixed(1)}°C
            </Text>
          </View>
          <View style={styles.peakCard}>
            <Text style={styles.peakLabel}>PEAK RECORDED LOW</Text>
            <Text style={[styles.peakValue, { color: '#3b82f6' }]}>
              {peakLow.toFixed(1)}°C
            </Text>
          </View>
        </View>
      </View>

      {/* Historical logs table list section */}
      <View style={styles.logsSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>Recent Transmissions</Text>
          <View style={styles.headerDivider} />
          <Text style={styles.sectionHeaderCounter}>{history.length} samples total</Text>
        </View>

        <View style={styles.logsList}>
          {sortedLogs.slice(0, 30).map((log, index) => {
            const statusConfig = getStatusConfig(log.status);
            const rawDate = new Date(log.timestamp);
            const timeString = isNaN(rawDate.getTime()) 
              ? log.timeLabel 
              : rawDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            
            return (
              <View key={log.timestamp + index} style={styles.logTile}>
                <View style={styles.logLeft}>
                  {/* Status Indicator Bar */}
                  <View style={[styles.logIndicatorBar, { backgroundColor: statusConfig.bar }]} />
                  <View>
                    <Text style={styles.logTime}>{timeString}</Text>
                    <Text style={styles.logDevice}>ID: {log.device}</Text>
                  </View>
                </View>
                
                <View style={styles.logRight}>
                  <Text style={styles.logValues}>
                    {log.temperature.toFixed(1)}°C <Text style={styles.divider}>|</Text> <Text style={styles.humidityText}>{log.humidity}%</Text>
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    {
                      backgroundColor: statusConfig.badgeBg,
                      borderColor: statusConfig.badgeBorder,
                    }
                  ]}>
                    <Text style={[styles.statusBadgeText, { color: statusConfig.badgeText }]}>
                      {statusConfig.label}
                    </Text>
                    <View style={[styles.statusBadgeDot, { backgroundColor: statusConfig.bar }]} />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Atmospheric analysis aesthetic card */}
      <View style={styles.aestheticCard}>
        <Image
          style={styles.aestheticImage as any}
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3_mQm_-UTh1VZHYjHjb9Vy9TNoPm_1PDbty0h1WiCL_u0nMplsq4B6LL9svzKRuRTyCZxKDzCEkyLCY1OLw4ULtJAGbSNgAJ1hzBQzqLTIYCkANiDEXrDdfi8QTf8wRcX51cWpcKYUPNLDOcrZ2GpnIPCgJInoH-duBUUiqosSPQe0eEygS0t4mze7_hZcBYx3n4aDNBW7NH840qx-Or3Qem8k7XynsAFSA_D3ho7R7GHbKPtqXUUcc2hJhX58w8AzTKlVrwCs0g' }}
          resizeMode="cover"
        />
        <View style={styles.aestheticOverlay}>
          <Text style={styles.aestheticOverlayTitle}>ECOSYSTEM ANALYTICS v2.4</Text>
          <Text style={styles.aestheticOverlaySubtitle}>Precision climate tracking for IoT devices.</Text>
        </View>
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
  bannerCard: {
    backgroundColor: '#141417',
    borderWidth: 1,
    borderColor: '#202024',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    marginTop: 8,
  },
  bannerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  bannerLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#71717a',
    letterSpacing: 1,
  },
  bannerMainVal: {
    fontSize: 32,
    fontWeight: '200',
    color: '#ffffff',
    marginTop: 4,
    fontFamily: 'System',
  },
  bannerMainUnit: {
    fontSize: 18,
    fontWeight: '400',
    color: '#52525b',
  },
  statusBadgeRight: {
    alignItems: 'flex-end',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(60, 220, 209, 0.1)',
    borderColor: 'rgba(60, 220, 209, 0.25)',
    borderWidth: 0.5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3cdcd1',
    marginRight: 6,
  },
  pulseDotText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#3cdcd1',
    letterSpacing: 0.5,
    fontFamily: 'System',
  },
  statusSystemText: {
    fontSize: 8,
    color: '#52525b',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 4,
    fontFamily: 'System',
  },
  peaksGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  peakCard: {
    flex: 1,
    backgroundColor: '#0a0a0b',
    borderColor: '#1d1d21',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  peakLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#52525b',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  peakValue: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'System',
  },
  logsSection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    marginRight: 8,
  },
  headerDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#1d1d21',
  },
  sectionHeaderCounter: {
    fontSize: 10,
    color: '#52525b',
    fontFamily: 'System',
    marginLeft: 8,
  },
  logsList: {
    flexDirection: 'column',
    gap: 8,
  },
  logTile: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#141417',
    borderWidth: 0.5,
    borderColor: '#202024',
    borderRadius: 16,
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logIndicatorBar: {
    width: 3,
    height: 32,
    borderRadius: 2,
    marginRight: 10,
  },
  logTime: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'System',
  },
  logDevice: {
    fontSize: 9,
    color: '#52525b',
    marginTop: 2,
  },
  logRight: {
    alignItems: 'flex-end',
  },
  logValues: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'System',
  },
  divider: {
    color: '#27272a',
  },
  humidityText: {
    color: '#3cdcd1',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  statusBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginRight: 4,
  },
  statusBadgeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  aestheticCard: {
    height: 140,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#202024',
  },
  aestheticImage: {
    width: '100%',
    height: '100%',
    opacity: 0.35,
  },
  aestheticOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 11, 0.4)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  aestheticOverlayTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#3cdcd1',
    letterSpacing: 1,
    marginBottom: 4,
  },
  aestheticOverlaySubtitle: {
    fontSize: 10,
    color: '#a1a1aa',
    fontWeight: '500',
  },
});
