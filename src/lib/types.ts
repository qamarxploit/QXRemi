export type ColorKey = 'default' | 'blue' | 'red' | 'purple' | 'orange' | 'green';

export const COLORS: Record<ColorKey, string> = {
  default: '#6b7280',
  blue: '#2563eb',
  red: '#dc2626',
  purple: '#7c3aed',
  orange: '#d97706',
  green: '#059669',
};
export const COLOR_KEYS = Object.keys(COLORS) as ColorKey[];

export type RepeatUnit = 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';
export type RepeatType = 'none' | 'day' | 'week' | 'month' | 'year' | 'weekdays' | 'custom';

export interface Repeat {
  type: RepeatType;
  interval: number;
  unit: RepeatUnit;
  weekdays: number[]; // 0 = Sunday
}

export const NO_REPEAT: Repeat = { type: 'none', interval: 1, unit: 'day', weekdays: [] };

export interface Reminder {
  id: string;
  title: string;
  at: number; // ms timestamp of the (next) occurrence
  color: ColorKey;
  repeat: Repeat;
  contact: string;
  phone: string;
  advance: number; // minutes before
  sound: boolean;
  vibrate: boolean;
  completed: boolean;
  completedAt?: number;
  snoozedUntil?: number;
  firedAdv?: number;
  firedDue?: number;
  createdAt: number;
}

export interface Birthday {
  id: string;
  name: string;
  comment: string;
  dob: string; // yyyy-mm-dd
  time: string; // HH:mm
  advanceDays: number;
  color: ColorKey;
  fired: string[];
  createdAt: number;
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  language: 'en';
  notifications: boolean;
  soundMode: 'default' | 'custom' | 'silent';
  ringtoneName: string;
  volume: number;
  vibration: boolean;
  minInterval: number;
  swipe: boolean;
  addTomorrow: boolean;
  confirmRemoval: boolean;
  confirmCompletion: boolean;
  weekNumber: boolean;
  orientation: 'auto' | 'portrait' | 'landscape';
  hour24: boolean;
  firstDay: 0 | 1 | 6;
  birthdayTime: string;
  birthdayAdvance: number;
  snoozes: number[];
  reAlertMinutes: number;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  fontSize: 'medium',
  language: 'en',
  notifications: true,
  soundMode: 'default',
  ringtoneName: '',
  volume: 80,
  vibration: true,
  minInterval: 1,
  swipe: true,
  addTomorrow: false,
  confirmRemoval: false,
  confirmCompletion: false,
  weekNumber: false,
  orientation: 'auto',
  hour24: false,
  firstDay: 1,
  birthdayTime: '10:00',
  birthdayAdvance: 3,
  snoozes: [5, 10, 15, 30, 60],
  reAlertMinutes: 5,
};
