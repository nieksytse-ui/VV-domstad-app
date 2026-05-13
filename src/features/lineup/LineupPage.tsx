import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../auth/AuthProvider";

/* ──────────── Types ──────────── */
type Player = {
  id: string;
  name: string | null;
  shirt_number: number | null;
  position: string | null;
};

type PositionSlot = {
  player_id: string;
  x: number; // 0-100 (% from left)
  y: number; // 0-100 (% from top, 0 = keeper end)
  label: string;
};

type Match = {
  id: string;
  date: string;
  opponent: string;
  home_away: "thuis" | "uit";
};

/* ──────────── Formations ──────────── */
const FORMATIONS: Record<string, { label: string; x: number; y: number }[]> = {
  "4-3-3": [
    { label: "GK", x: 50, y: 92 },
    { label: "LB", x: 15, y: 72 },
    { label: "CB", x: 38, y: 75 },
    { label: "CB", x: 62, y: 75 },
    { label: "RB", x: 85, y: 72 },
    { label: "CM", x: 30, y: 52 },
    { label: "CM", x: 50, y: 48 },
    { label: "CM", x: 70, y: 52 },
    { label: "LW", x: 18, y: 25 },
    { label: "ST", x: 50, y: 20 },
    { label: "RW", x: 82, y: 25 },
  ],
  "4-4-2": [
    { label: "GK", x: 50, y: 92 },
    { label: "LB", x: 15, y: 72 },
    { label: "CB", x: 38, y: 75 },
    { label: "CB", x: 62, y: 75 },
    { label: "RB", x: 85, y: 72 },
    { label: "LM", x: 15, y: 50 },
    { label: "CM", x: 38, y: 50 },
    { label: "CM", x: 62, y: 50 },
    { label: "RM", x: 85, y: 50 },
    { label: "ST", x: 38, y: 22 },
    { label: "ST", x: 62, y: 22 },
  ],
  "3-5-2": [
    { label: "GK", x: 50, y: 92 },
    { label: "CB", x: 25, y: 75 },
    { label: "CB", x: 50, y: 77 },
    { label: "CB", x: 75, y: 75 },
    { label: "LWB", x: 10, y: 52 },
    { label: "CM", x: 32, y: 50 },
    { label: "CM", x: 50, y: 46 },
    { label: "CM", x: 68, y: 50 },
    { label: "RWB", x: 90, y: 52 },
    { label: "ST", x: 38, y: 22 },
    { label: "ST", x: 62, y: 22 },
  ],
  "4-2-3-1": [
    { label: "GK", x: 50, y: 92 },
    { label: "LB", x: 15, y: 72 },
    { label: "CB", x: 38, y: 75 },
    { label: "CB", x: 62, y: 75 },
    { label: "RB", x: 85, y: 72 },
    { label: "CDM", x: 38, y: 56 },
    { label: "CDM", x: 62, y: 56 },
    { label: "LW", x: 18, y: 35 },
    { label: "CAM", x: 50, y: 35 },
    { label: "RW", x: 82, y: 35 },
    { label: "ST", x: 50, y: 18 },
  ],
};

/* ──────────── Component ──────────── */
export default function LineupPage() {
  const { isCaptain } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");
  const [formation, setFormation] = useState("4-3-3");
  const [positions, setPositions] = useState<PositionSlot[]>([]);
  const [substitutes, setSubstitutes] = useState<string[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [saving, setSaving] = useState(false);
  const [lineupId, setLineupId] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const fieldRef = useRef<HTMLDivElement>(null);

  /* Fetch players & matches */
  useEffect(() => {
    (async () => {
      const [{ data: pData }, { data: mData }] = await Promise.all([
        supabase.from("players").select("id, name, shirt_number, position").order("shirt_number"),
        supabase.from("matches").select("id, date, opponent, home_away").order("date", { ascending: false }),
      ]);
      setPlayers(pData ?? []);
      setMatches(mData ?? []);
      if (mData && mData.length > 0) setSelectedMatchId(mData[0].id);
    })();
  }, []);

  /* Load existing lineup when match changes */
  useEffect(() => {
    if (!selectedMatchId) return;
    (async () => {
      const { data } = await supabase
        .from("lineups")
        .select("*")
        .eq("match_id", selectedMatchId)
        .single();
      if (data) {
        setFormation(data.formation);
        setPositions(data.positions as unknown as PositionSlot[]);
        setSubstitutes((data.substitutes as string[]) ?? []);
        setLineupId(data.id);
      } else {
        // Reset to blank formation
        resetFormation("4-3-3");
        setSubstitutes([]);
        setLineupId(null);
      }
    })();
  }, [selectedMatchId]);

  const resetFormation = (f: string) => {
    setFormation(f);
    setPositions(
      FORMATIONS[f].map((slot) => ({
        player_id: "",
        x: slot.x,
        y: slot.y,
        label: slot.label,
      }))
    );
  };

  /* Assign a player to a slot */
  const assignPlayer = (slotIdx: number, playerId: string) => {
    setPositions((prev) => {
      const next = [...prev];
      // Remove player from any other slot
      next.forEach((s, i) => {
        if (s.player_id === playerId && i !== slotIdx) s.player_id = "";
      });
      next[slotIdx] = { ...next[slotIdx], player_id: playerId };
      return next;
    });
    // Remove from substitutes if assigned to field
    setSubstitutes((prev) => prev.filter((id) => id !== playerId));
  };

  const removeFromSlot = (slotIdx: number) => {
    setPositions((prev) => {
      const next = [...prev];
      next[slotIdx] = { ...next[slotIdx], player_id: "" };
      return next;
    });
  };

  const toggleSubstitute = (playerId: string) => {
    // Remove from field positions first
    setPositions((prev) =>
      prev.map((p) => (p.player_id === playerId ? { ...p, player_id: "" } : p))
    );
    setSubstitutes((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
  };

  /* Drag on field */
  const handleFieldMouseDown = (idx: number) => {
    if (!isCaptain) return;
    setDragIdx(idx);
  };

  const handleFieldMouseMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (dragIdx === null || !fieldRef.current) return;
      const rect = fieldRef.current.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const x = Math.min(95, Math.max(5, ((clientX - rect.left) / rect.width) * 100));
      const y = Math.min(95, Math.max(5, ((clientY - rect.top) / rect.height) * 100));
      setPositions((prev) => {
        const next = [...prev];
        next[dragIdx] = { ...next[dragIdx], x, y };
        return next;
      });
    },
    [dragIdx]
  );

  const handleFieldMouseUp = () => setDragIdx(null);

  /* Save */
  const save = async () => {
    if (!selectedMatchId) return;
    setSaving(true);
    const payload = {
      match_id: selectedMatchId,
      formation,
      positions: positions as any,
      substitutes,
      created_by: (await supabase.auth.getUser()).data.user?.id ?? "",
    };
    if (lineupId) {
      await supabase.from("lineups").update(payload).eq("id", lineupId);
    } else {
      const { data } = await supabase.from("lineups").insert(payload).select("id").single();
      if (data) setLineupId(data.id);
    }
    setSaving(false);
  };

  /* Helpers */
  const usedPlayerIds = new Set([
    ...positions.map((p) => p.player_id).filter(Boolean),
    ...substitutes,
  ]);
  const availablePlayers = players.filter((p) => !usedPlayerIds.has(p.id));
  const getPlayer = (id: string) => players.find((p) => p.id === id);
  const selectedMatch = matches.find((m) => m.id === selectedMatchId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Opstelling</h1>

      {/* Match selector */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          className="bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700"
          value={selectedMatchId}
          onChange={(e) => setSelectedMatchId(e.target.value)}
        >
          {matches.map((m) => (
            <option key={m.id} value={m.id}>
              {m.date} — {m.home_away === "thuis" ? "vs" : "@"} {m.opponent}
            </option>
          ))}
        </select>

        {isCaptain && (
          <select
            className="bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700"
            value={formation}
            onChange={(e) => resetFormation(e.target.value)}
          >
            {Object.keys(FORMATIONS).map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Soccer field */}
      <div
        ref={fieldRef}
        className="relative w-full aspect-[68/105] max-w-lg mx-auto rounded-2xl overflow-hidden select-none touch-none"
        style={{
          background: "linear-gradient(to bottom, #2d6a30 0%, #3a8c3e 50%, #2d6a30 100%)",
        }}
        onMouseMove={handleFieldMouseMove}
        onMouseUp={handleFieldMouseUp}
        onMouseLeave={handleFieldMouseUp}
        onTouchMove={handleFieldMouseMove}
        onTouchEnd={handleFieldMouseUp}
      >
        {/* Field markings */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 68 105" fill="none">
          {/* Border */}
          <rect x="1" y="1" width="66" height="103" stroke="white" strokeOpacity="0.4" strokeWidth="0.5" />
          {/* Halfway line */}
          <line x1="1" y1="52.5" x2="67" y2="52.5" stroke="white" strokeOpacity="0.4" strokeWidth="0.5" />
          {/* Center circle */}
          <circle cx="34" cy="52.5" r="9.15" stroke="white" strokeOpacity="0.4" strokeWidth="0.5" />
          {/* Penalty areas */}
          <rect x="13.84" y="1" width="40.32" height="16.5" stroke="white" strokeOpacity="0.4" strokeWidth="0.5" />
          <rect x="13.84" y="87.5" width="40.32" height="16.5" stroke="white" strokeOpacity="0.4" strokeWidth="0.5" />
          {/* Goal areas */}
          <rect x="24.84" y="1" width="18.32" height="5.5" stroke="white" strokeOpacity="0.4" strokeWidth="0.5" />
          <rect x="24.84" y="98.5" width="18.32" height="5.5" stroke="white" strokeOpacity="0.4" strokeWidth="0.5" />
        </svg>

        {/* Players on field */}
        {positions.map((slot, idx) => {
          const player = slot.player_id ? getPlayer(slot.player_id) : null;
          return (
            <div
              key={idx}
              className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
              onMouseDown={() => handleFieldMouseDown(idx)}
              onTouchStart={() => handleFieldMouseDown(idx)}
            >
              {/* Shirt circle */}
              <div
                className={`w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center text-xs md:text-sm font-bold shadow-lg border-2 ${
                  player
                    ? "bg-club-yellow text-club-black border-white"
                    : "bg-gray-700 text-gray-400 border-gray-500 border-dashed"
                } ${isCaptain ? "cursor-grab active:cursor-grabbing" : ""}`}
              >
                {player ? (player.shirt_number ?? "?") : slot.label}
              </div>
              {/* Name label */}
              <span className="text-[9px] md:text-[11px] text-white font-medium mt-0.5 whitespace-nowrap drop-shadow">
                {player ? (player.name?.split(" ")[0] ?? "") : slot.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Assign players (admin) */}
      {isCaptain && (
        <div className="space-y-4">
          {/* Position assignment */}
          <div className="bg-gray-900 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-300">Posities toewijzen</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {positions.map((slot, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-10 text-xs font-bold text-club-yellow">{slot.label}</span>
                  <select
                    className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-2 py-1.5 border border-gray-700"
                    value={slot.player_id}
                    onChange={(e) =>
                      e.target.value ? assignPlayer(idx, e.target.value) : removeFromSlot(idx)
                    }
                  >
                    <option value="">— leeg —</option>
                    {players
                      .filter((p) => p.id === slot.player_id || !usedPlayerIds.has(p.id))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.shirt_number ? `#${p.shirt_number} ` : ""}
                          {p.name ?? p.id.slice(0, 6)}
                        </option>
                      ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Substitutes */}
          <div className="bg-gray-900 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-300">Wissels</h3>
            <div className="flex flex-wrap gap-2">
              {availablePlayers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => toggleSubstitute(p.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700 hover:border-club-green hover:text-white transition"
                >
                  {p.shirt_number ? `#${p.shirt_number} ` : ""}
                  {p.name ?? "?"}
                </button>
              ))}
            </div>
            {substitutes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {substitutes.map((id) => {
                  const p = getPlayer(id);
                  return (
                    <span
                      key={id}
                      onClick={() => toggleSubstitute(id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-club-green/20 text-club-green border border-club-green/40 cursor-pointer"
                    >
                      {p?.shirt_number ? `#${p.shirt_number} ` : ""}
                      {p?.name ?? "?"} ✕
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Save button */}
          <button
            onClick={save}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-club-green text-white font-semibold text-sm hover:bg-club-green/90 transition disabled:opacity-50"
          >
            {saving ? "Opslaan..." : "Opstelling opslaan"}
          </button>
        </div>
      )}

      {/* Read-only substitutes view for non-admins */}
      {!isCaptain && substitutes.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-semibold text-gray-300">Wissels</h3>
          <div className="flex flex-wrap gap-2">
            {substitutes.map((id) => {
              const p = getPlayer(id);
              return (
                <span
                  key={id}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700"
                >
                  {p?.shirt_number ? `#${p.shirt_number} ` : ""}
                  {p?.name ?? "?"}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {!selectedMatchId && (
        <p className="text-gray-500 text-sm">Geen wedstrijden gevonden.</p>
      )}
    </div>
  );
}
