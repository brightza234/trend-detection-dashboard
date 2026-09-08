import type { TrendStatusLabel } from "@/lib/types";

const STATUS_STYLE: Record<TrendStatusLabel, { color: string; bg: string; icon: string }> = {
  Spike: { color: "var(--status-critical)", bg: "var(--status-critical-bg)", icon: "▲" },
  Rising: { color: "var(--status-good)", bg: "var(--status-good-bg)", icon: "↗" },
  Declining: { color: "var(--status-serious)", bg: "var(--status-serious-bg)", icon: "↘" },
  Stable: { color: "var(--text-secondary)", bg: "var(--gridline)", icon: "→" },
  "No data": { color: "var(--text-muted)", bg: "var(--gridline)", icon: "·" },
  "Insufficient data": { color: "var(--text-muted)", bg: "var(--gridline)", icon: "·" },
};

export default function StatusBadge({ status }: { status: TrendStatusLabel }) {
  const style = STATUS_STYLE[status] ?? STATUS_STYLE["No data"];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ color: style.color, backgroundColor: style.bg }}
    >
      <span aria-hidden="true">{style.icon}</span>
      {status}
    </span>
  );
}
