import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../features/auth/AuthProvider";
import { Settings, Plus, RefreshCw } from "lucide-react";

export default function AdminPage() {
  const { isAdmin } = useAuth();
  const [seasonName, setSeasonName] = useState("2026-2027");
  const [startDate, setStartDate] = useState("2026-08-01");
  const [endDate, setEndDate] = useState("2027-06-30");
  const [inviteCode, setInviteCode] = useState("DOMSTAD2026");
  const [msg, setMsg] = useState("");

  if (!isAdmin) return <p className="text-red-400">Geen toegang</p>;

  const createSeason = async () => {
    await supabase.from("seasons").update({ active: false }).eq("active", true);
    await supabase.from("seasons").insert({ name: seasonName, start_date: startDate, end_date: endDate, active: true });
    setMsg("Seizoen aangemaakt!");
  };

  const createInvite = async () => {
    await supabase.from("invites").update({ active: false }).eq("active", true);
    await supabase.from("invites").insert({ code: inviteCode.toUpperCase(), active: true, created_by: null, used_by: null, used_at: null });
    setMsg(`Teamcode ${inviteCode.toUpperCase()} is actief!`);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-club-yellow flex items-center gap-2"><Settings size={24} /> Admin</h2>

      <div className="bg-gray-900 rounded-2xl p-5 space-y-3">
        <h3 className="font-semibold">Seizoen aanmaken</h3>
        <input type="text" value={seasonName} onChange={(e) => setSeasonName(e.target.value)} placeholder="Naam (bijv. 2026-2027)" className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-club-green" />
        <div className="grid grid-cols-2 gap-3">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-4 py-3 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-club-green" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-4 py-3 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-club-green" />
        </div>
        <button onClick={createSeason} className="w-full py-3 rounded-xl bg-club-yellow text-club-black font-bold">Seizoen starten</button>
      </div>

      <div className="bg-gray-900 rounded-2xl p-5 space-y-3">
        <h3 className="font-semibold">Teamcode beheren</h3>
        <input type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="Teamcode" className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-club-green uppercase" />
        <button onClick={createInvite} className="w-full py-3 rounded-xl bg-club-green text-white font-bold hover:bg-club-green-light transition">
          <RefreshCw size={14} className="inline mr-2" /> Code instellen
        </button>
      </div>

      {msg && <p className="text-green-400 text-sm text-center bg-green-900/20 rounded-xl p-3">{msg}</p>}
    </div>
  );
}
