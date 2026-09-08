export type TimeseriesPoint = {
  date: string;
  trends_score?: number;
  news_count?: number;
};

export type TimeseriesData = {
  series: Record<string, TimeseriesPoint[]>;
};

export type TrendStatusLabel =
  | "Spike"
  | "Rising"
  | "Stable"
  | "Declining"
  | "No data"
  | "Insufficient data";

export type KeywordStatus = {
  status: TrendStatusLabel;
  latest_value?: number;
  rolling_mean?: number | null;
  rolling_std?: number | null;
  z_score?: number | null;
  slope_7d?: number | null;
  data_points?: number;
  ai_explanation?: string;
};

export type TrendStatusData = {
  generated_at: string | null;
  keywords: Record<string, KeywordStatus>;
};
