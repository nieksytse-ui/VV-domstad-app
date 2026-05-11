import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Plus, Users } from "lucide-react";

type Training = {
  id: string;
  date: string;
  time: string;
  location: string;
  notes: string | null;
};

type Rsvp = {
  player_id: string;
  status: "aanwezig" | "afwezig" | "misschien";
  players: { name: string | null } | null;
};

export default function TrainingsPage() {
  const { user, isAdmin } = useAuth();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [rsvps, setRsvps] = useState<Record<string, Rsvp[]>>({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: "", time: "", location: "", notes: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTrainings();
  }, []);

  const loadTrainings = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("trainings")
      .select("*")
      .gte("date", today)
      .order("date", { ascending: true });
    setTrainings(data ?? []);

    // Load RSVPs for all trainings
    if (data && data.length > 0) {
      const ids = data.map((t) => t.id);
      const { data: rsvpData } = await supabase
        .from("rsvps")
        .select("event_id, player_id, status, players(name)")
        .eq("event_type", "training")
        .in("event_id", ids);

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
    // Get active season
    const { data: season } = await supabase
      .from("seasons")
      .select("id")
      .eq("active", true)
      .single();

    await supabase.from("trainings").insert({
      season_id: season?.id ?? "",
      date: form.date,
      time: form.time,
      location: form.location,
      notes: form.notes || null,
      created_by: user.id,
    });
    setForm({ date: "", time: "", location: "", notes: "" });
    setShowForm(false);
    setLoading(false);
    loadTrainings();
  };

  const handleRsvp = async (trainingId: string, status: "aanwezig" | "afwezig" | "misschien") => {
    if (!user) return;

    const { data: existing } = await supabase
      .from("rsvps")
      .select("id")
      .eq("player_id", user.id)
      .eq("event_id", trainingId)
      .eq("event_type", "training")
      .single();

    if (existing) {
      await supabase.from("rsvps").update({ status }).eq("id", existing.id);
    } else {
      await supabase.from("rsvps").insert({
        player_id: user.id,
        event_id: trainingId,
        event_type: "training",
        status,
      });
    }
    loadTrainings();
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" });

  const getUserRsvp = (trainingId: string) =>
    rsvps[trainingId]?.find((r) => r.player_id === user?.id)?.status ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-club-yellow">Trainingen</h2>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 px-4 py-2 bg-club-green text-white rounded-xl text-sm font-medium hover:bg-club-green-light transition"
          >
            <Plus size={16} /> Nieuwe training
          </button>
        )}
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-gray-900 rounded-2xl p-5 space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="px-4 py-3 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-club-green" />
            <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="px-4 py-3 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-club-green" />
          </div>
          <input type="text" placeholder="Locatie" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-club-green" />
          <input type="text" placeholder="Notities (optioneel)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-club-green" />
          <button onClick={handleCreate} disabled={loading || !form.date || !form.time || !form.location} className="w-full py-3 rounded-xl bg-club-yellow text-club-black font-bold disabled:opacity-50">
            {loading ? "Aanmaken..." : "Training aanmaken"}
          </button>
        </motion.div>
      )}

      {trainings.map((t) => {
        const eventRsvps = rsvps[t.id] ?? [];
        const aanwezig = eventRsvps.filter((r) => r.status === "aanwezig").length;
        const myRsvp = getUserRsvp(t.id);

        return (
          <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gray-900 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Training</h3>
              <span className="flex items-center gap-1 text-sm text-gray-400">
                <Users size={14} /> {aanwezig} aanwezig
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1"><Calendar size={14} /> {formatDate(t.date)}</span>
              <span className="flex items-center gap-1"><Clock size={14} /> {t.time}</span>
              <span className="flex items-center gap-1"><MapPin size={14} /> {t.location}</span>
            </div>
            {t.notes && <p className="text-sm text-gray-500">{t.notes}</p>}

            <div className="flex gap-2">
              {(["aanwezig", "afwezig", "misschien"] as const).map((s) => (
                <button key={s} onClick={() => handleRsvp(t.id, s)} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${myRsvp === s ? (s === "aanwezig" ? "bg-green-600 text-white" : s === "afwezig" ? "bg-red-600 text-white" : "bg-yellow-600 text-white") : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
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
                    <span className={`text-xs font-medium ${r.status === "aanwezig" ? "text-green-400" : r.status === "afwezig" ? "text-red-400" : "text-yellow-400"}`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        );
      })}

      {trainings.length === 0 && (
        <p className="text-gray-500 text-center py-12">Geen aankomende trainingen</p>
      )}
    </div>
  );
}
