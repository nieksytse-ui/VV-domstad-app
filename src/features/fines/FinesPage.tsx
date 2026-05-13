import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { motion } from "framer-motion";
import { Plus, Banknote, Check } from "lucide-react";

const CATEGORIES = [
  { label: "Te laat verzameltijd", amount: 5 },
  { label: "Te laat starttijd", amount: 5 },
  { label: "Te laat reageren (wedstrijd)", amount: 5 },
  { label: "Te laat reageren (training)", amount: 2.5 },
  { label: "Geen reden bij reageren", amount: 2.5 },
  { label: "Afwezig wedstrijd", amount: 1.5 },
  { label: "Te weinig man en slechte reden", amount: 5 },
  { label: "Niet opdagen", amount: 25 },
  { label: "Onnodige gele kaart", amount: 5 },
  { label: "Later aanwezigheid wijzigen", amount: 5 },
  { label: "Afmelden zonder reden", amount: 2.5 },
  { label: "Custom", amount: 0 },
];

type Fine = {
  id: string;
  player_id: string;
  player_name: string;
  category: string;
  amount: number;
  reason: string | null;
  added_by_name: string;
  created_at: string;
  paid: boolean;
  paid_at: string | null;
  is_correction: boolean;
};

type Player = { id: string; name: string | null };

export default function FinesPage() {
  const { user, profile, isAdmin } = useAuth();
  const [tab, setTab] = useState<"logboek" | "mijn" | "leaderboard">("logboek");
  const [fines, setFines] = useState<Fine[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ player_id: "", category: "", amount: "", reason: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadFines(); loadPlayers(); }, []);

  const loadFines = async () => {
    const { data } = await supabase.from("fines").select("*").order("created_at", { ascending: false });
    setFines(data ?? []);
  };

  const loadPlayers = async () => {
    const { data } = await supabase.from("players").select("id, name").eq("onboarded", true);
    setPlayers(data ?? []);
  };

  const handleCreate = async () => {
    if (!user || !profile) return;
    setLoading(true);
    const cat = CATEGORIES.find((c) => c.label === form.category);
    const amount = form.category === "Custom" ? parseFloat(form.amount) : (cat?.amount ?? 0);
    const player = players.find((p) => p.id === form.player_id);

    await supabase.from("fines").insert({
      player_id: form.player_id,
      player_name: player?.name ?? "Onbekend",
      category: form.category,
      amount,
      reason: form.reason || null,
      added_by: user.id,
      added_by_name: profile.name ?? "Admin",
      paid: false,
      paid_at: null,
      paid_received_by: null,
      is_correction: false,
      correction_of: null,
      match_id: null,
      training_id: null,
    });
    setForm({ player_id: "", category: "", amount: "", reason: "" });
    setShowForm(false);
    setLoading(false);
    loadFines();
  };

  const markPaid = async (fineId: string) => {
    if (!user) return;
    await supabase.from("fines").update({ paid: true, paid_at: new Date().toISOString(), paid_received_by: user.id }).eq("id", fineId);
    loadFines();
  };

  const myFines = fines.filter((f) => f.player_id === user?.id);

  // Leaderboard
  const leaderboard = players
    .map((p) => {
      const pFines = fines.filter((f) => f.player_id === p.id && !f.is_correction);
      const total = pFines.reduce((s, f) => s + f.amount, 0);
      const unpaid = pFines.filter((f) => !f.paid).reduce((s, f) => s + f.amount, 0);
      return { ...p, total, unpaid };
    })
    .sort((a, b) => b.total - a.total);

  const formatDate = (d: string) => new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  const FineCard = ({ f }: { f: Fine }) => (
    <div className={`bg-gray-800 rounded-xl p-4 flex items-center justify-between ${f.is_correction ? "border-l-2 border-yellow-500" : ""}`}>
      <div>
        <p className="font-medium">{f.player_name} — {f.category}</p>
        {f.reason && <p className="text-xs text-gray-500">{f.reason}</p>}
        <p className="text-xs text-gray-500 mt-1">Door {f.added_by_name} · {formatDate(f.created_at)}</p>
      </div>
      <div className="text-right flex items-center gap-3">
        <span className="text-lg font-bold text-club-yellow">€{f.amount.toFixed(2)}</span>
        {f.paid ? (
          <span className="text-xs text-green-400 flex items-center gap-0.5"><Check size={12} /> Betaald</span>
        ) : isAdmin ? (
          <button onClick={() => markPaid(f.id)} className="text-xs bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded-lg transition">Betaald</button>
        ) : (
          <span className="text-xs text-red-400">Open</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-club-yellow flex items-center gap-2"><Banknote size={24} /> Boetepot</h2>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 px-4 py-2 bg-club-green text-white rounded-xl text-sm font-medium hover:bg-club-green-light transition">
            <Plus size={16} /> Boete toevoegen
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([["logboek", "Logboek"], ["mijn", "Mijn boetes"], ["leaderboard", "Leaderboard"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === key ? "bg-club-green text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gray-900 rounded-2xl p-5 space-y-3">
          <select value={form.player_id} onChange={(e) => setForm({ ...form, player_id: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-club-green">
            <option value="">Selecteer speler</option>
            {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((c) => (
              <button key={c.label} onClick={() => setForm({ ...form, category: c.label, amount: c.amount.toString() })} className={`py-2 rounded-xl text-sm font-medium ${form.category === c.label ? "bg-club-green text-white" : "bg-gray-800 text-gray-400"}`}>
                {c.label} {c.amount > 0 && `(€${c.amount})`}
              </button>
            ))}
          </div>
          {form.category === "Custom" && (
            <input type="number" placeholder="Bedrag" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-club-green" />
          )}
          <input type="text" placeholder="Reden (optioneel)" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-club-green" />
          <button onClick={handleCreate} disabled={loading || !form.player_id || !form.category} className="w-full py-3 rounded-xl bg-club-yellow text-club-black font-bold disabled:opacity-50">
            {loading ? "Toevoegen..." : "Boete toevoegen"}
          </button>
        </motion.div>
      )}

      {/* Content */}
      {tab === "logboek" && (
        <div className="space-y-2">
          {fines.map((f) => <FineCard key={f.id} f={f} />)}
          {fines.length === 0 && <p className="text-gray-500 text-center py-12">Nog geen boetes</p>}
        </div>
      )}

      {tab === "mijn" && (
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Openstaand</p>
              <p className="text-3xl font-bold text-club-yellow">
                €{myFines.filter((f) => !f.paid).reduce((s, f) => s + f.amount, 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Totaal</p>
              <p className="text-xl font-bold text-gray-300">
                €{myFines.reduce((s, f) => s + f.amount, 0).toFixed(2)}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {myFines.map((f) => <FineCard key={f.id} f={f} />)}
          </div>
        </div>
      )}

      {tab === "leaderboard" && (
        <div className="space-y-2">
          {leaderboard.map((p, i) => (
            <div key={p.id} className="bg-gray-800 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${i === 0 ? "bg-club-yellow text-club-black" : i === 1 ? "bg-gray-400 text-black" : i === 2 ? "bg-amber-700 text-white" : "bg-gray-700 text-gray-300"}`}>
                  {i + 1}
                </span>
                <span className="font-medium">{p.name}</span>
              </div>
              <div className="text-right">
                <p className="font-bold text-club-yellow">€{p.total.toFixed(2)}</p>
                {p.unpaid > 0 && <p className="text-xs text-red-400">€{p.unpaid.toFixed(2)} open</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
