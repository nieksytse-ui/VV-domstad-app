import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { motion } from "framer-motion";
import { Users, User } from "lucide-react";
import { Link } from "react-router-dom";

type Player = {
  id: string;
  name: string | null;
  shirt_number: number | null;
  position: string | null;
  photo_url: string | null;
};

type FineTotal = { player_id: string; total: number };

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [fineTotals, setFineTotals] = useState<FineTotal[]>([]);
  const [sortBy, setSortBy] = useState<"number" | "name" | "fines">("number");

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data: p } = await supabase.from("players").select("id, name, shirt_number, position, photo_url").eq("onboarded", true);
    setPlayers(p ?? []);

    const { data: fines } = await supabase.from("fines").select("player_id, amount, paid");
    const totals: Record<string, number> = {};
    (fines ?? []).forEach((f) => {
      if (!f.paid) totals[f.player_id] = (totals[f.player_id] ?? 0) + f.amount;
    });
    setFineTotals(Object.entries(totals).map(([player_id, total]) => ({ player_id, total })));
  };

  const getFineTotal = (id: string) => fineTotals.find((f) => f.player_id === id)?.total ?? 0;

  const sorted = [...players].sort((a, b) => {
    if (sortBy === "number") return (a.shirt_number ?? 99) - (b.shirt_number ?? 99);
    if (sortBy === "name") return (a.name ?? "").localeCompare(b.name ?? "");
    return getFineTotal(b.id) - getFineTotal(a.id);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-club-yellow flex items-center gap-2"><Users size={24} /> Spelers</h2>
      </div>

      <div className="flex gap-2">
        {([["number", "Rugnummer"], ["name", "Naam"], ["fines", "Boetes"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setSortBy(key)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${sortBy === key ? "bg-club-green text-white" : "bg-gray-800 text-gray-400"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {sorted.map((p) => (
          <Link key={p.id} to={`/spelers/${p.id}`}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gray-900 rounded-2xl p-4 flex items-center gap-4 hover:bg-gray-800 transition cursor-pointer">
              {p.photo_url ? (
                <img src={p.photo_url} alt={p.name ?? ""} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center"><User size={20} className="text-gray-400" /></div>
              )}
              <div className="flex-1">
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-gray-400">{p.position}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-club-yellow">#{p.shirt_number ?? "?"}</p>
                {getFineTotal(p.id) > 0 && <p className="text-xs text-red-400">€{getFineTotal(p.id).toFixed(2)} open</p>}
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
