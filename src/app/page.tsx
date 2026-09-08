import Leaderboard from "@/components/Leaderboard";
import StatusBadge from "@/components/StatusBadge";
import TrendChart from "@/components/TrendChart";
import { getTimeseries, getTrendStatus } from "@/lib/trendData";
import keywordsConfig from "../../config/keywords.json";

export default function Home() {
  const { series } = getTimeseries();
  const { generated_at, keywords: statusByKeyword } = getTrendStatus();
  const keywords: string[] = keywordsConfig.keywords;

  const hasData = Object.values(series).some((points) => points.length > 0);
  const entries: [string, (typeof statusByKeyword)[string]][] = keywords.map((kw) => [
    kw,
    statusByKeyword[kw] ?? { status: "No data", data_points: 0 },
  ]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-2xl font-semibold">Trend Detection Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--text-secondary)" }}>
          Tracking Google Trends search interest for {keywords.length} Thai tech/gadget
          keywords, flagging statistically significant spikes with a rolling z-score, and
          asking Claude to explain the likely cause.
        </p>
        <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
          {generated_at
            ? `Last analyzed: ${new Date(generated_at).toLocaleString("en-GB", { timeZone: "Asia/Bangkok" })} (Bangkok time)`
            : "No analysis run yet — data collection starts once the daily GitHub Actions workflow runs."}
        </p>
      </header>

      {!hasData ? (
        <div
          className="rounded-lg border px-6 py-10 text-center text-sm"
          style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
        >
          No data collected yet. The daily collection workflow appends one data point per
          keyword per day — check back after it has run for a few days to see trends and
          anomalies here.
        </div>
      ) : (
        <>
          <section className="mb-10">
            <h2 className="mb-3 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Trending now
            </h2>
            <Leaderboard entries={entries} />
          </section>

          <section>
            <h2 className="mb-3 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Keyword detail
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {keywords.map((kw) => {
                const status = statusByKeyword[kw];
                const points = series[kw] ?? [];
                return (
                  <div
                    key={kw}
                    className="rounded-lg border p-4"
                    style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium">{kw}</span>
                      <StatusBadge status={status?.status ?? "No data"} />
                    </div>
                    {points.length > 0 ? (
                      <TrendChart
                        points={points}
                        rollingMean={status?.rolling_mean}
                        rollingStd={status?.rolling_std}
                      />
                    ) : (
                      <p className="py-8 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                        No data yet
                      </p>
                    )}
                    {status?.ai_explanation && (
                      <p
                        className="mt-3 rounded-md p-3 text-xs"
                        style={{
                          background: "var(--status-critical-bg)",
                          color: "var(--text-primary)",
                        }}
                      >
                        {status.ai_explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
