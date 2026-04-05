export interface DailyBar {
  date: string;    // "2024-03-15"
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface YearData {
  year: number;
  yearOpen: number;
  yearClose: number | null;   // null if year is incomplete
  pctChange: number | null;   // null if year is incomplete
  bars: DailyBar[];
}

export interface SP500Payload {
  lastUpdated: string;
  years: YearData[];
}
