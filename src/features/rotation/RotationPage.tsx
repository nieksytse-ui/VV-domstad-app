import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { motion } from "framer-motion";
import { RefreshCw, ArrowRightLeft, Check, X } from "lucide-react";

type RotationSlot = {
  player_id: string;
  player_name: string;
  slot_index: number;
  done: boolean;
  flagged: boolean;
};

type Cycle = {
  id: string;
  order: RotationSlot[];
  created_at: string;
};

type Swap = {
  id: string;
  requested_by: string;
  requested_with: string;
  slot_a: number;
  slot_b: number;
  status: "pending" | "accepted" | "declined";
  created_at: string;
};

type Player = { id: string; name: string | null };

export default function RotationPage() {
  const { user, isAdmin } = useAuth();
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [showNewCycle, setShowNewCycle] = useState(false);
  const [swapTarget, setSwapTarget] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data: cycles } = await supabase.from("rotation_cycles").select("*").order("created_at", { ascending: false }).limit(1);
    if (cycles && cycles.length > 0) {
      setCycle({ ...cycles[0], order: cycles[0].order as unknown as RotationSlot[] });
    }

    const { data: sw } = await supabase.from("rotation_swaps").select("*").order("created_at", { ascending: false });
    setSwaps(sw ?? []);

    const { data: p } = await supabase.from("players").select("id, name").eq("onboarded", true);
    setPlayers(p ?? []);
  };

  const createCycle = async () => {
    const sorted = [...players].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    const order: RotationSlot[] = sorted.map((p, i) => ({
      player_id: p.id,
      player_name: p.name ?? "Onbekend",
      slot_index: i,
      done: false,
      flagged: false,
    }));

    const { data: season } = await supabase.from("seasons").select("id").eq("active", true).single();
    await supabase.from("rotation_cycles").insert({ season_id: season?.id ?? "", order: order as any });
    setShowNewCycle(false);
    load();
  };

  const markDone = async (slotIndex: number) => {
    if (!cycle) return;
    const updated = cycle.order.map((s) => s.slot_index === slotIndex ? { ...s, done: true } : s);
    await supabase.from("rotation_cycles").update({ order: updated as any }).eq("id", cycle.id);
    load();
  };

  const requestSwap = async (slotIndex: number) => {
    if (!user || !cycle || !swapTarget) return;
    const mySlot = cycle.order.find((s) => s.player_id === user.id);
    if (!mySlot) return;

    await supabase.from("rotation_swaps").insert({
      cycle_id: cycle.id,
      requested_by: user.id,
      requested_with: swapTarget,
      slot_a: mySlot.slot_index,
      slot_b: slotIndex,
      status: "pending",
    });
    setSwapTarget("");
    load();
  };

  const resolveSwap = async (swapId: string, accept: boolean) => {
    if (!cycle) return;
    const swap = swaps.find((s) => s.id === swapId);
    if (!swap) return;

    if (accept) {
      const updated = cycle.order.map((s) => {
        if (s.slot_index === swap.slot_a) return { ...s, slot_index: swap.slot_b };
        if (s.slot_index === swap.slot_b) return { ...s, slot_index: swap.slot_a };
        return s;
      }).sort((a, b) => a.slot_index - b.slot_index);

      await supabase.from("rotation_cycles").update({ order: updated as any }).eq("id", cycle.id);
    }

    await supabase.from("rotation_swaps").update({
      status: accept ? "accepted" : "declined",
      resolved_at: new Date().toISOString(),
    }).eq("id", swapId);
    load();
  };

  const currentSlot = cycle?.order.find((s) => !s.done);
  const doneCount = cycle?.order.filter((s) => s.done).length ?? 0;
  const totalSlots = cycle?.order.length ?? 0;

  const pendingSwaps = swaps.filter((s) => s.status === "pending" && s.requested_with === user?.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-club-yellow flex items-center gap-2"><RefreshCw size={24} /> Trainingsrotatie</h2>
        {isAdmin && (
          <button onClick={() => setShowNewCycle(true)} className="px-4 py-2 bg-club-green text-white rounded-xl text-sm font-medium hover:bg-club-green-light transition">
            Nieuwe cyclus
          </button>
        )}
      </div>

      {showNewCycle && (
        <div className="bg-gray-900 rounded-2xl p-5 space-y-3">
          <p className="text-gray-300">Start een nieuwe rotatie op alfabetische volgorde?</p>
          <div className="flex gap-2">
            <button onClick={createCycle} className="px-4 py-2 bg-club-yellow text-club-black rounded-xl font-bold">Starten</button>
            <button onClick={() => setShowNewCycle(false)} className="px-4 py-2 bg-gray-800 text-gray-400 rounded-xl">Annuleren</button>
          </div>
        </div>
      )}

      {/* Pending swap requests */}
      {pendingSwaps.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-club-yellow">Swap verzoeken</h3>
          {pendingSwaps.map((s) => {
            const from = players.find((p) => p.id === s.requested_by);
            return (
              <div key={s.id} className="bg-gray-900 rounded-xl p-4 flex items-center justify-between">
                <p className="text-sm"><strong>{from?.name}</strong> wil ruilen met jou</p>
                <div className="flex gap-2">
                  <button onClick={() => resolveSwap(s.id, true)} className="p-2 bg-green-700 rounded-lg hover:bg-green-600"><Check size={16} /></button>
                  <button onClick={() => resolveSwap(s.id, false)} className="p-2 bg-red-700 rounded-lg hover:bg-red-600"><X size={16} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {cycle ? (
        <>
          <div className="bg-gray-900 rounded-2xl p-5">
            <p className="text-gray-400 text-sm">
              Week {doneCount + 1} van {totalSlots} — aan de beurt:{" "}
              <strong className="text-white">{currentSlot?.player_name ?? "Klaar!"}</strong>
            </p>
            <div className="w-full bg-gray-800 rounded-full h-2 mt-3">
              <div className="bg-club-green h-2 rounded-full transition-all" style={{ width: `${(doneCount / totalSlots) * 100}%` }} />
            </div>
          </div>

          <div className="space-y-2">
            {cycle.order.map((slot) => (
              <motion.div key={slot.slot_index} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className={`bg-gray-900 rounded-xl p-4 flex items-center justify-between ${slot.done ? "opacity-50" : ""} ${slot.player_id === currentSlot?.player_id ? "ring-2 ring-club-yellow" : ""}`}>
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 text-sm font-bold">{slot.slot_index + 1}</span>
                  <span className={`font-medium ${slot.done ? "line-through text-gray-500" : ""}`}>{slot.player_name}</span>
                  {slot.flagged && <span className="text-xs text-red-400">⚠️ Niet verschenen</span>}
                </div>
                <div className="flex items-center gap-2">
                  {!slot.done && slot.player_id === user?.id && (
                    <select value={swapTarget} onChange={(e) => { setSwapTarget(e.target.value); if (e.target.value) requestSwap(slot.slot_index); }}
                      className="text-xs bg-gray-800 text-gray-400 rounded-lg px-2 py-1">
                      <option value="">Swap...</option>
                      {cycle.order.filter((s) => !s.done && s.player_id !== user?.id).map((s) => (
                        <option key={s.player_id} value={s.player_id}>{s.player_name}</option>
                      ))}
                    </select>
                  )}
                  {isAdmin && !slot.done && (
                    <button onClick={() => markDone(slot.slot_index)} className="text-xs bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded-lg">
                      <Check size={14} />
                    </button>
                  )}
                  {slot.done && <Check size={16} className="text-green-400" />}
                </div>
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-gray-500 text-center py-12">Nog geen rotatieschema aangemaakt</p>
      )}
    </div>
  );
}
