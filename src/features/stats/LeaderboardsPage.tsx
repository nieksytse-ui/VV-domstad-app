import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Trophy } from "lucide-react";

type LeaderboardEntry = { name: string; value: number };

export default function LeaderboardsPage() {
  const [tab, setTab] = useState<"aanwezig" | "topscorer" | "boetes" | "motm">("topscorer");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => { load(); }, [tab]);

  const load = async () => {
    const { data: players } = await supabase.from("players").select("id, name").eq("onboarded", true);
    if (!players) return;

    if (tab === "topscorer") {
      const { data: stats } = await supabase.from("match_stats").select("player_id, goals");
      const totals: Record<string, number> = {};
      (stats ?? []).forEach((s) => { totals[s.player_id] = (totals[s.player_id] ?? 0) + s.goals; });
      setEntries(players.map((p) => ({ name: p.name ?? "?", value: totals[p.id] ?? 0 })).sort((a, b) => b.value - a.value));
    } else if (tab === "boetes") {
      const { data: fines } = await supabase.from("fines").select("player_id, amount");
      const totals: Record<string, number> = {};
      (fines ?? []).forEach((f) => { totals[f.player_id] = (totals[f.player_id] ?? 0) + f.amount; });
      setEntries(players.map((p) => ({ name: p.name ?? "?", value: totals[p.id] ?? 0 })).sort((a, b) => b.value - a.value));
    } else if (tab === "aanwezig") {
      const { data: rsvps } = await supabase.from("rsvps").select("player_id, status");
      const totals: Record<string, { total: number; present: number }> = {};
      (rsvps ?? []).forEach((r) => {
        if (!totals[r.player_id]) totals[r.player_id] = { total: 0, present: 0 };
        totals[r.player_id].total++;
        if (r.status === "aanwezig") totals[r.player_id].present++;
      });
      setEntries(players.map((p) => {
        const t = totals[p.id];
        return { name: p.name ?? "?", value: t ? Math.round((t.present / t.total) * 100) : 0 };
      }).sort((a, b) => b.value - a.value));
    } else if (tab === "motm") {
      const { data: votes } = await supabase.from("motm_votes").select("voted_for_id");
      const totals: Record<string, number> = {};
      (votes ?? []).forEach((v) => { totals[v.voted_for_id] = (totals[v.voted_for_id] ?? 0) + 1; });
      setEntries(players.map((p) => ({ name: p.name ?? "?", value: totals[p.id] ?? 0 })).sort((a, b) => b.value - a.value));
    }
  };

  const unit = tab === "aanwezig" ? "%" : tab === "boetes" ? "€" : "";
  const suffix = tab === "aanwezig" ? "%" : "";

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-club-yellow flex items-center gap-2"><Trophy size={24} /> Leaderboards</h2>

      <div className="flex gap-2 flex-wrap">
        {([["topscorer", "Topscorer"], ["aanwezig", "Aanwezigheid"], ["boetes", "Meeste boetes"], ["motm", "Man of the Match"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`px-3 py-1.5 rounded-xl text-xs font-medium ${tab === key ? "bg-club-green text-white" : "bg-gray-800 text-gray-400"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {entries.map((e, i) => (
          <div key={e.name} className="bg-gray-900 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${i === 0 ? "bg-club-yellow text-club-black" : i === 1 ? "bg-gray-400 text-black" : i === 2 ? "bg-amber-700 text-white" : "bg-gray-700 text-gray-300"}`}>
                {i + 1}
              </span>
              <span className="font-medium">{e.name}</span>
            </div>
            <span className="font-bold text-club-yellow">
              {tab === "boetes" ? `€${e.value.toFixed(2)}` : `${e.value}${suffix}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
