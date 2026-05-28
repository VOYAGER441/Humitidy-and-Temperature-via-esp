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
  Dimensions
} from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line } from 'react-native-svg';
import { TelemetryReading } from '../types';
import { ShieldIcon, RadioIcon, DatabaseIcon } from './Icons';

interface HistoryTabProps {
  history: TelemetryReading[];
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 48; // padding of 24 on each side
const CHART_HEIGHT = 160;

export default function HistoryTab({ history }: HistoryTabProps) {
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');

  // Filter history items according to time range selection
  const getFilteredData = () => {
    switch (timeRange) {
      case '1h':
        return history.slice(-12); // Last 1 hour (5 min intervals)
      case '6h':
        return history.slice(-72); // Last 6 hours
      case '24h':
        return history.slice(-288); // 24 hours
      case '7d':
        return history.filter((_, idx) => idx % 4 === 0).slice(-200);
      default:
        return history;
    }
  };

  const filteredData = getFilteredData();

  // Calculations for averages
  const calculateAverage = (key: 'temperature' | 'humidity') => {
    if (filteredData.length === 0) return 0;
    const sum = filteredData.reduce((acc, curr) => acc + curr[key], 0);
    return parseFloat((sum / filteredData.length).toFixed(1));
  };

  const tempAvg = calculateAverage('temperature');
  const humAvg = calculateAverage('humidity');

  // Custom SVG chart path renderer
  const renderAreaChart = (
    key: 'temperature' | 'humidity',
    strokeColor: string,
    gradientId: string,
    minTarget: number,
    maxTarget: number
  ) => {
    const dataPoints = filteredData.slice(-24); // Show up to last 24 points for clean rendering
    if (dataPoints.length < 2) {
      return (
        <View style={styles.chartEmpty}>
          <Text style={styles.chartEmptyText}>Awaiting telemetry history data points...</Text>
        </View>
      );
    }

    // Determine min/max values in data to scale properly
    const values = dataPoints.map((p) => p[key]);
    const actualMin = Math.min(...values);
    const actualMax = Math.max(...values);
    
    // Add margin to min/max
    const minVal = Math.min(minTarget, Math.floor(actualMin - 1));
    const maxVal = Math.max(maxTarget, Math.ceil(actualMax + 1));
    const range = maxVal - minVal || 1;

    const paddingLeft = 30;
    const paddingRight = 10;
    const paddingTop = 15;
    const paddingBottom = 20;

    const plotWidth = CHART_WIDTH - paddingLeft - paddingRight;
    const plotHeight = CHART_HEIGHT - paddingTop - paddingBottom;
    const stepX = plotWidth / (dataPoints.length - 1);

    let path = '';
    let areaPath = '';

    dataPoints.forEach((point, index) => {
      const val = point[key];
      const percent = (val - minVal) / range;
      const x = paddingLeft + index * stepX;
      // SVG 0,0 is top-left, so we invert Y coordinate
      const y = paddingTop + plotHeight - percent * plotHeight;

      if (index === 0) {
        path = `M ${x} ${y}`;
        areaPath = `M ${x} ${paddingTop + plotHeight} L ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
        areaPath += ` L ${x} ${y}`;
      }

      if (index === dataPoints.length - 1) {
        areaPath += ` L ${x} ${paddingTop + plotHeight} Z`;
      }
    });

    // Generate horizontal grid line heights
    const gridLines = [0.25, 0.5, 0.75];

    return (
      <View style={styles.chartContainer}>
        <Svg height={CHART_HEIGHT} width={CHART_WIDTH}>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          {/* Grid Lines */}
          {gridLines.map((percent, index) => {
            const y = paddingTop + plotHeight - percent * plotHeight;
            const gridVal = minVal + percent * range;
            return (
              <React.Fragment key={index}>
                <Line
                  x1={paddingLeft}
                  y1={y}
                  x2={CHART_WIDTH - paddingRight}
                  y2={y}
                  stroke="#27272a"
                  strokeWidth="0.5"
                  strokeDasharray="3, 3"
                />
                {/* Grid Label */}
                <Text
                  style={[
                    styles.yAxisLabel,
                    {
                      position: 'absolute',
                      left: 0,
                      top: y - 6,
                    },
                  ]}
                >
                  {gridVal.toFixed(0)}
                </Text>
              </React.Fragment>
            );
          })}

          {/* Y Axis Baseline */}
          <Line
            x1={paddingLeft}
            y1={paddingTop}
            x2={paddingLeft}
            y2={paddingTop + plotHeight}
            stroke="#27272a"
            strokeWidth="1"
          />

          {/* X Axis Baseline */}
          <Line
            x1={paddingLeft}
            y1={paddingTop + plotHeight}
            x2={CHART_WIDTH - paddingRight}
            y2={paddingTop + plotHeight}
            stroke="#27272a"
            strokeWidth="1"
          />

          {/* Under-line filled area gradient */}
          <Path d={areaPath} fill={`url(#${gradientId})`} />

          {/* Chart main line stroke */}
          <Path d={path} fill="none" stroke={strokeColor} strokeWidth="2.5" />
        </Svg>

        {/* X Axis Timeline Labels */}
        <View style={[styles.xAxisContainer, { paddingLeft }]}>
          <Text style={styles.xAxisLabel}>
            {dataPoints[0]?.timeLabel || ''}
          </Text>
          <Text style={styles.xAxisLabel}>
            {dataPoints[Math.floor(dataPoints.length / 2)]?.timeLabel || ''}
          </Text>
          <Text style={styles.xAxisLabel}>
            {dataPoints[dataPoints.length - 1]?.timeLabel || ''}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.container}>
      
      {/* Header Info */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Data History Analytics</Text>
          <Text style={styles.subtitle}>
            Archived sensor telemetry for local and remote atmospheric assessments.
          </Text>
        </View>

        {/* Time Range Selectors */}
        <View style={styles.filterBar}>
          {(['1h', '6h', '24h', '7d'] as const).map((range) => {
            const isActive = timeRange === range;
            return (
              <TouchableOpacity
                key={range}
                onPress={() => setTimeRange(range)}
                style={[styles.filterBtn, isActive && styles.filterBtnActive]}
              >
                <Text style={[styles.filterBtnText, isActive && styles.filterBtnTextActive]}>
                  {range.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Graphs List */}
      <View style={styles.graphsList}>
        
        {/* TEMPERATURE GRAPH CARD */}
        <View style={styles.graphCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
              <Text style={styles.cardTitle}>TEMPERATURE HISTORY (°C)</Text>
            </View>
            <View style={styles.cardHeaderRight}>
              <Text style={styles.avgLabel}>AVG</Text>
              <Text style={styles.avgValue}>{tempAvg}°C</Text>
            </View>
          </View>

          {renderAreaChart('temperature', '#3b82f6', 'tempGrad', 15, 35)}
        </View>

        {/* HUMIDITY GRAPH CARD */}
        <View style={styles.graphCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.cardTitle}>HUMIDITY HISTORY (%)</Text>
            </View>
            <View style={styles.cardHeaderRight}>
              <Text style={styles.avgLabel}>AVG</Text>
              <Text style={styles.avgValue}>{humAvg}%</Text>
            </View>
          </View>

          {renderAreaChart('humidity', '#10b981', 'humGrad', 20, 100)}
        </View>

      </View>

      {/* Technical Infrastructure Metadata Footer */}
      <View style={styles.metadataGrid}>
        <View style={styles.metadataCard}>
          <Text style={styles.metaLabel}>CLUSTER IDENTIFIER</Text>
          <View style={styles.metaValueRow}>
            <RadioIcon color="#a1a1aa" size={12} />
            <Text style={styles.metaValueText}>ESP32-DA_01</Text>
          </View>
        </View>

        <View style={styles.metadataCard}>
          <Text style={styles.metaLabel}>SAMPLING VELOCITY</Text>
          <View style={styles.metaValueRow}>
            <View style={styles.greenPulseDot} />
            <Text style={styles.metaValueText}>1 Sample / 60s</Text>
          </View>
        </View>

        <View style={styles.metadataCard}>
          <Text style={styles.metaLabel}>CRYPTOGRAPHY</Text>
          <View style={styles.metaValueRow}>
            <ShieldIcon color="#a1a1aa" size={12} />
            <Text style={styles.metaValueText}>SHA-256 SSL</Text>
          </View>
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
  header: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 20,
    marginTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 4,
    lineHeight: 16,
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: '#141417',
    padding: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#202024',
    alignSelf: 'flex-start',
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  filterBtnActive: {
    backgroundColor: '#27272a',
  },
  filterBtnText: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'System',
  },
  filterBtnTextActive: {
    color: '#ffffff',
  },
  graphsList: {
    flexDirection: 'column',
    gap: 16,
    marginBottom: 20,
  },
  graphCard: {
    backgroundColor: '#141417',
    borderWidth: 1,
    borderColor: '#202024',
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#71717a',
    letterSpacing: 1,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avgLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#52525b',
  },
  avgValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'System',
  },
  chartEmpty: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartEmptyText: {
    color: '#52525b',
    fontSize: 11,
    fontWeight: '600',
  },
  chartContainer: {
    alignSelf: 'center',
    marginTop: 8,
  },
  yAxisLabel: {
    color: '#52525b',
    fontSize: 8,
    fontFamily: 'System',
    width: 24,
    textAlign: 'right',
  },
  xAxisContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: CHART_WIDTH,
    marginTop: 4,
    paddingRight: 10,
  },
  xAxisLabel: {
    color: '#52525b',
    fontSize: 8,
    fontFamily: 'System',
  },
  metadataGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  metadataCard: {
    flex: 1,
    backgroundColor: '#141417',
    borderWidth: 1,
    borderColor: '#202024',
    borderRadius: 12,
    padding: 12,
  },
  metaLabel: {
    fontSize: 8,
    color: '#52525b',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metaValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaValueText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#d4d4d8',
    fontFamily: 'System',
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
});
