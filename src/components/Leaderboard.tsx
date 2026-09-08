import StatusBadge from "@/components/StatusBadge";
import type { KeywordStatus } from "@/lib/types";

export default function Leaderboard({
  entries,
}: {
  entries: [string, KeywordStatus][];
}) {
  const ranked = [...entries].sort((a, b) => {
    const za = a[1].z_score ?? -Infinity;
    const zb = b[1].z_score ?? -Infinity;
    return zb - za;
  });

  return (
    <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
      <table className="w-full text-sm">
        <thead>
          <tr
            className="text-left text-xs uppercase tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            <th className="px-4 py-3 font-medium">#</th>
            <th className="px-4 py-3 font-medium">Keyword</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium text-right">Z-score</th>
            <th className="px-4 py-3 font-medium text-right">7d slope</th>
            <th className="px-4 py-3 font-medium text-right">Latest</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map(([keyword, status], i) => (
            <tr key={keyword} className="border-t" style={{ borderColor: "var(--border)" }}>
              <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>
                {i + 1}
              </td>
              <td className="px-4 py-3 font-medium">{keyword}</td>
              <td className="px-4 py-3">
                <StatusBadge status={status.status} />
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{status.z_score ?? "—"}</td>
              <td className="px-4 py-3 text-right tabular-nums">{status.slope_7d ?? "—"}</td>
              <td className="px-4 py-3 text-right tabular-nums">{status.latest_value ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
