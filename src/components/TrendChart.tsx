"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TimeseriesPoint } from "@/lib/types";

type ChartPoint = {
  date: string;
  score: number | null;
  newsCount: number | null;
  isAnomaly: boolean;
};

function buildChartData(
  points: TimeseriesPoint[],
  mean: number | null | undefined,
  std: number | null | undefined,
  zThreshold: number,
): ChartPoint[] {
  return points.map((p) => {
    const score = p.trends_score ?? null;
    const isAnomaly =
      score != null && mean != null && std != null && std > 0
        ? Math.abs((score - mean) / std) > zThreshold
        : false;
    return {
      date: p.date.slice(5),
      score,
      newsCount: p.news_count ?? null,
      isAnomaly,
    };
  });
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { payload: ChartPoint }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div
      className="rounded-md border px-3 py-2 text-xs shadow-sm"
      style={{
        background: "var(--surface-1)",
        borderColor: "var(--border)",
        color: "var(--text-primary)",
      }}
    >
      <div className="font-medium">{label}</div>
      <div style={{ color: "var(--text-secondary)" }}>
        Trends score: {point.score ?? "—"}
      </div>
      {point.newsCount != null && (
        <div style={{ color: "var(--text-secondary)" }}>News mentions: {point.newsCount}</div>
      )}
      {point.isAnomaly && (
        <div className="mt-1 font-medium" style={{ color: "var(--status-critical)" }}>
          ▲ Anomaly
        </div>
      )}
    </div>
  );
}

function AnomalyDot(props: { cx?: number; cy?: number; payload?: ChartPoint }) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload) return null;
  if (!payload.isAnomaly) {
    return <circle cx={cx} cy={cy} r={2} fill="var(--series-1)" />;
  }
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill="var(--status-critical)"
      stroke="var(--surface-1)"
      strokeWidth={2}
    />
  );
}

export default function TrendChart({
  points,
  rollingMean,
  rollingStd,
  zThreshold = 2,
}: {
  points: TimeseriesPoint[];
  rollingMean?: number | null;
  rollingStd?: number | null;
  zThreshold?: number;
}) {
  const data = buildChartData(points, rollingMean, rollingStd, zThreshold);
  const hasAnomaly = data.some((d) => d.isAnomaly);

  return (
    <div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="var(--gridline)" vertical={false} />
          <XAxis
            dataKey="date"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: "var(--gridline)" }}
            stroke="var(--text-muted)"
          />
          <YAxis
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={32}
            stroke="var(--text-muted)"
          />
          <Tooltip content={<ChartTooltip />} />
          <Line
            type="monotone"
            dataKey="score"
            stroke="var(--series-1)"
            strokeWidth={2}
            dot={<AnomalyDot />}
            connectNulls
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      {hasAnomaly && (
        <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: "var(--status-critical)" }}
          />
          anomaly (z-score &gt; {zThreshold})
        </div>
      )}
    </div>
  );
}
