import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Plus, Users, Swords } from "lucide-react";

type Match = {
  id: string;
  date: string;
  time: string;
  opponent: string;
  home_away: "thuis" | "uit";
  location: string;
  notes: string | null;
};

type Rsvp = {
  player_id: string;
  status: "aanwezig" | "afwezig" | "misschien";
  players: { name: string | null } | null;
};

export default function MatchesPage() {
  const { user, isAdmin } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [rsvps, setRsvps] = useState<Record<string, Rsvp[]>>({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: "", time: "", opponent: "", home_away: "thuis" as "thuis" | "uit", location: "", notes: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadMatches(); }, []);

  const loadMatches = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase.from("matches").select("*").gte("date", today).order("date", { ascending: true });
    setMatches(data ?? []);

    if (data && data.length > 0) {
      const ids = data.map((m) => m.id);
      const { data: rsvpData } = await supabase.from("rsvps").select("event_id, player_id, status, players(name)").eq("event_type", "match").in("event_id", ids);
      const grouped: Record<string, Rsvp[]> = {};
      (rsvpData ?? []).forEach((r: any) => {
        if (!grouped[r.event_id]) grouped[r.event_id] = [];
        grouped[r.event_id].push(r);
      });
      setRsvps(grouped);
    }
  };

  const handleCreate = async () => {
    if (!user) return;
    setLoading(true);
    const { data: season } = await supabase.from("seasons").select("id").eq("active", true).single();
    await supabase.from("matches").insert({
      season_id: season?.id ?? "",
      date: form.date,
      time: form.time,
      opponent: form.opponent,
      home_away: form.home_away,
      location: form.location,
      notes: form.notes || null,
      created_by: user.id,
    });
    setForm({ date: "", time: "", opponent: "", home_away: "thuis", location: "", notes: "" });
    setShowForm(false);
    setLoading(false);
    loadMatches();
  };

  const handleRsvp = async (matchId: string, status: "aanwezig" | "afwezig" | "misschien") => {
    if (!user) return;
    const { data: existing } = await supabase.from("rsvps").select("id").eq("player_id", user.id).eq("event_id", matchId).eq("event_type", "match").single();
    if (existing) {
      await supabase.from("rsvps").update({ status }).eq("id", existing.id);
    } else {
      await supabase.from("rsvps").insert({ player_id: user.id, event_id: matchId, event_type: "match", status });
    }
    loadMatches();
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-club-yellow">Wedstrijden</h2>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 px-4 py-2 bg-club-green text-white rounded-xl text-sm font-medium hover:bg-club-green-light transition">
            <Plus size={16} /> Nieuwe wedstrijd
          </button>
        )}
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-gray-900 rounded-2xl p-5 space-y-3">
          <input type="text" placeholder="Tegenstander" value={form.opponent} onChange={(e) => setForm({ ...form, opponent: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-club-green" />
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="px-4 py-3 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-club-green" />
            <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="px-4 py-3 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-club-green" />
          </div>
          <div className="flex gap-2">
            {(["thuis", "uit"] as const).map((ha) => (
              <button key={ha} onClick={() => setForm({ ...form, home_away: ha })} className={`flex-1 py-2 rounded-xl text-sm font-medium ${form.home_away === ha ? "bg-club-green text-white" : "bg-gray-800 text-gray-400"}`}>
                {ha.charAt(0).toUpperCase() + ha.slice(1)}
              </button>
            ))}
          </div>
          <input type="text" placeholder="Locatie" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-club-green" />
          <input type="text" placeholder="Notities (optioneel)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-club-green" />
          <button onClick={handleCreate} disabled={loading || !form.date || !form.time || !form.opponent || !form.location} className="w-full py-3 rounded-xl bg-club-yellow text-club-black font-bold disabled:opacity-50">
            {loading ? "Aanmaken..." : "Wedstrijd aanmaken"}
          </button>
        </motion.div>
      )}

      {matches.map((m) => {
        const eventRsvps = rsvps[m.id] ?? [];
        const aanwezig = eventRsvps.filter((r) => r.status === "aanwezig").length;
        const myRsvp = eventRsvps.find((r) => r.player_id === user?.id)?.status ?? null;

        return (
          <motion.div key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gray-900 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Swords size={18} className="text-club-yellow" />
                vs. {m.opponent}
                <span className={`text-xs px-2 py-0.5 rounded-full ${m.home_away === "thuis" ? "bg-green-900 text-green-300" : "bg-blue-900 text-blue-300"}`}>
                  {m.home_away}
                </span>
              </h3>
              <span className="flex items-center gap-1 text-sm text-gray-400">
                <Users size={14} /> {aanwezig}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1"><Calendar size={14} /> {formatDate(m.date)}</span>
              <span className="flex items-center gap-1"><Clock size={14} /> {m.time}</span>
              <span className="flex items-center gap-1"><MapPin size={14} /> {m.location}</span>
            </div>
            <div className="flex gap-2">
              {(["aanwezig", "afwezig", "misschien"] as const).map((s) => (
                <button key={s} onClick={() => handleRsvp(m.id, s)} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${myRsvp === s ? (s === "aanwezig" ? "bg-green-600 text-white" : s === "afwezig" ? "bg-red-600 text-white" : "bg-yellow-600 text-white") : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            {isAdmin && eventRsvps.length > 0 && (
              <div className="border-t border-gray-800 pt-3 mt-3 space-y-1">
                <p className="text-xs text-gray-500 font-medium uppercase">Overzicht</p>
                {eventRsvps.map((r) => (
                  <div key={r.player_id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">{(r.players as any)?.name ?? "Onbekend"}</span>
                    <span className={`text-xs font-medium ${r.status === "aanwezig" ? "text-green-400" : r.status === "afwezig" ? "text-red-400" : "text-yellow-400"}`}>{r.status}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        );
      })}

      {matches.length === 0 && <p className="text-gray-500 text-center py-12">Geen aankomende wedstrijden</p>}
    </div>
  );
}
