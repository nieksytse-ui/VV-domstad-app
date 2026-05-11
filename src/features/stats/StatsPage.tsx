import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { BarChart3 } from "lucide-react";

type PlayerStat = {
  player_id: string;
  name: string;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  matches_played: number;
};

export default function StatsPage() {
  const [stats, setStats] = useState<PlayerStat[]>([]);
  const [sortBy, setSortBy] = useState<"goals" | "assists" | "yellow_cards" | "red_cards">("goals");

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data: players } = await supabase.from("players").select("id, name").eq("onboarded", true);
    const { data: matchStats } = await supabase.from("match_stats").select("*");

    const result: PlayerStat[] = (players ?? []).map((p) => {
      const ps = (matchStats ?? []).filter((s) => s.player_id === p.id);
      return {
        player_id: p.id,
        name: p.name ?? "Onbekend",
        goals: ps.reduce((a, r) => a + r.goals, 0),
        assists: ps.reduce((a, r) => a + r.assists, 0),
        yellow_cards: ps.reduce((a, r) => a + r.yellow_cards, 0),
        red_cards: ps.reduce((a, r) => a + r.red_cards, 0),
        matches_played: ps.length,
      };
    });
    setStats(result);
  };

  const sorted = [...stats].sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-club-yellow flex items-center gap-2"><BarChart3 size={24} /> Statistieken</h2>

      <div className="flex gap-2 flex-wrap">
        {([["goals", "Doelpunten"], ["assists", "Assists"], ["yellow_cards", "Gele kaarten"], ["red_cards", "Rode kaarten"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setSortBy(key)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${sortBy === key ? "bg-club-green text-white" : "bg-gray-800 text-gray-400"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {sorted.map((p, i) => (
          <div key={p.player_id} className="bg-gray-900 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${i === 0 ? "bg-club-yellow text-club-black" : "bg-gray-700 text-gray-300"}`}>
                {i + 1}
              </span>
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-gray-500">{p.matches_played} wedstrijden</p>
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="text-center"><span className="block font-bold text-green-400">{p.goals}</span><span className="text-xs text-gray-500">Goals</span></span>
              <span className="text-center"><span className="block font-bold text-blue-400">{p.assists}</span><span className="text-xs text-gray-500">Assists</span></span>
              <span className="text-center"><span className="block font-bold text-yellow-400">{p.yellow_cards}</span><span className="text-xs text-gray-500">Geel</span></span>
              <span className="text-center"><span className="block font-bold text-red-400">{p.red_cards}</span><span className="text-xs text-gray-500">Rood</span></span>
            </div>
          </div>
        ))}
      </div>

      {stats.length === 0 && <p className="text-gray-500 text-center py-12">Nog geen statistieken</p>}
    </div>
  );
}
