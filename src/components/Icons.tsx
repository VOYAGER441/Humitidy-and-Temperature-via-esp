/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Thermometer,
  Droplet,
  TrendingUp,
  TrendingDown,
  Activity,
  Cpu,
  CloudLightning,
  RefreshCw,
  History,
  Settings,
  LayoutDashboard,
  Shield,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Wifi,
  Radio,
  Clock,
  Trash2,
  Copy,
  ChevronRight,
  Database
} from 'lucide-react-native';

interface IconProps {
  color?: string;
  size?: number;
  style?: any;
}

export const ThermostatIcon = ({ color, size, style, ...props }: IconProps) => (
  <Thermometer color={color} size={size} style={style} {...props} />
);

export const HumidityIcon = ({ color, size, style, ...props }: IconProps) => (
  <Droplet color={color} size={size} style={style} {...props} />
);

export const TrendingUpIcon = ({ color, size, style, ...props }: IconProps) => (
  <TrendingUp color={color} size={size} style={style} {...props} />
);

export const TrendingDownIcon = ({ color, size, style, ...props }: IconProps) => (
  <TrendingDown color={color} size={size} style={style} {...props} />
);

export const ActivityIcon = ({ color, size, style, ...props }: IconProps) => (
  <Activity color={color} size={size} style={style} {...props} />
);

export const CpuIcon = ({ color, size, style, ...props }: IconProps) => (
  <Cpu color={color} size={size} style={style} {...props} />
);

export const CloudIcon = ({ color, size, style, ...props }: IconProps) => (
  <CloudLightning color={color} size={size} style={style} {...props} />
);

export const RefreshIcon = ({ color, size, style, ...props }: IconProps) => (
  <RefreshCw color={color} size={size} style={style} {...props} />
);

export const HistoryIcon = ({ color, size, style, ...props }: IconProps) => (
  <History color={color} size={size} style={style} {...props} />
);

export const SettingsIcon = ({ color, size, style, ...props }: IconProps) => (
  <Settings color={color} size={size} style={style} {...props} />
);

export const DashboardIcon = ({ color, size, style, ...props }: IconProps) => (
  <LayoutDashboard color={color} size={size} style={style} {...props} />
);

export const ShieldIcon = ({ color, size, style, ...props }: IconProps) => (
  <Shield color={color} size={size} style={style} {...props} />
);

export const FileCodeIcon = ({ color, size, style, ...props }: IconProps) => (
  <FileCode color={color} size={size} style={style} {...props} />
);

export const CheckIcon = ({ color, size, style, ...props }: IconProps) => (
  <CheckCircle2 color={color} size={size} style={style} {...props} />
);

export const AlertIcon = ({ color, size, style, ...props }: IconProps) => (
  <AlertTriangle color={color} size={size} style={style} {...props} />
);

export const ZapIcon = ({ color, size, style, ...props }: IconProps) => (
  <Zap color={color} size={size} style={style} {...props} />
);

export const WifiIcon = ({ color, size, style, ...props }: IconProps) => (
  <Wifi color={color} size={size} style={style} {...props} />
);

export const RadioIcon = ({ color, size, style, ...props }: IconProps) => (
  <Radio color={color} size={size} style={style} {...props} />
);

export const ClockIcon = ({ color, size, style, ...props }: IconProps) => (
  <Clock color={color} size={size} style={style} {...props} />
);

export const TrashIcon = ({ color, size, style, ...props }: IconProps) => (
  <Trash2 color={color} size={size} style={style} {...props} />
);

export const CopyIcon = ({ color, size, style, ...props }: IconProps) => (
  <Copy color={color} size={size} style={style} {...props} />
);

export const ChevronRightIcon = ({ color, size, style, ...props }: IconProps) => (
  <ChevronRight color={color} size={size} style={style} {...props} />
);

export const DatabaseIcon = ({ color, size, style, ...props }: IconProps) => (
  <Database color={color} size={size} style={style} {...props} />
);
