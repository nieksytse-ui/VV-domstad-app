import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { User } from "lucide-react";

type Player = {
  id: string;
  name: string | null;
  shirt_number: number | null;
  position: string | null;
  photo_url: string | null;
  role: string;
};

type Fine = { id: string; category: string; amount: number; created_at: string; paid: boolean };
type Stat = { goals: number; assists: number; yellow_cards: number; red_cards: number };

export default function PlayerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<Player | null>(null);
  const [fines, setFines] = useState<Fine[]>([]);
  const [stats, setStats] = useState<Stat>({ goals: 0, assists: 0, yellow_cards: 0, red_cards: 0 });
  const [attendanceRate, setAttendanceRate] = useState(0);

  useEffect(() => {
    if (!id) return;
    load();
  }, [id]);

  const load = async () => {
    const { data: p } = await supabase.from("players").select("*").eq("id", id!).single();
    setPlayer(p as Player | null);

    const { data: f } = await supabase.from("fines").select("id, category, amount, created_at, paid").eq("player_id", id!).order("created_at", { ascending: false });
    setFines(f ?? []);

    const { data: s } = await supabase.from("match_stats").select("goals, assists, yellow_cards, red_cards").eq("player_id", id!);
    if (s && s.length > 0) {
      setStats({
        goals: s.reduce((a, r) => a + r.goals, 0),
        assists: s.reduce((a, r) => a + r.assists, 0),
        yellow_cards: s.reduce((a, r) => a + r.yellow_cards, 0),
        red_cards: s.reduce((a, r) => a + r.red_cards, 0),
      });
    }

    // Attendance
    const { data: rsvps } = await supabase.from("rsvps").select("status").eq("player_id", id!);
    if (rsvps && rsvps.length > 0) {
      const aanwezig = rsvps.filter((r) => r.status === "aanwezig").length;
      setAttendanceRate(Math.round((aanwezig / rsvps.length) * 100));
    }
  };

  if (!player) return <div className="text-gray-500 text-center py-20">Laden...</div>;

  const totalFines = fines.reduce((s, f) => s + f.amount, 0);
  const unpaidFines = fines.filter((f) => !f.paid).reduce((s, f) => s + f.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-900 rounded-2xl p-6 flex items-center gap-5">
        {player.photo_url ? (
          <img src={player.photo_url} alt={player.name ?? ""} className="w-20 h-20 rounded-full object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center"><User size={32} className="text-gray-400" /></div>
        )}
        <div>
          <h2 className="text-2xl font-bold">{player.name}</h2>
          <p className="text-gray-400">{player.position} · #{player.shirt_number ?? "?"}</p>
          {player.role === "admin" && <span className="text-xs bg-club-yellow text-club-black px-2 py-0.5 rounded-full font-medium">Admin</span>}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Doelpunten", value: stats.goals, color: "text-green-400" },
          { label: "Assists", value: stats.assists, color: "text-blue-400" },
          { label: "Gele kaarten", value: stats.yellow_cards, color: "text-yellow-400" },
          { label: "Rode kaarten", value: stats.red_cards, color: "text-red-400" },
        ].map((s) => (
          <div key={s.label} className="bg-gray-900 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-gray-900 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-club-yellow">{attendanceRate}%</p>
          <p className="text-xs text-gray-400 mt-1">Aanwezigheid</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-400">€{unpaidFines.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">Open boetes</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-300">€{totalFines.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">Totaal boetes</p>
        </div>
      </div>

      {/* Fine history */}
      <div className="bg-gray-900 rounded-2xl p-5 space-y-3">
        <h3 className="font-semibold">Boetegeschiedenis</h3>
        {fines.length > 0 ? (
          fines.map((f) => (
            <div key={f.id} className="flex items-center justify-between text-sm bg-gray-800 rounded-xl px-4 py-3">
              <div>
                <p className="font-medium">{f.category}</p>
                <p className="text-xs text-gray-500">{new Date(f.created_at).toLocaleDateString("nl-NL")}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-club-yellow">€{f.amount.toFixed(2)}</p>
                <p className={`text-xs ${f.paid ? "text-green-400" : "text-red-400"}`}>{f.paid ? "Betaald" : "Open"}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm">Geen boetes</p>
        )}
      </div>
    </div>
  );
}
