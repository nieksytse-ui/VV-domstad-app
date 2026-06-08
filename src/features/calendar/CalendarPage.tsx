import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { Calendar as CalIcon, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";

type CalendarEvent = {
  id: string;
  date: string;
  type: "training" | "match" | "activiteit";
  label: string;
  time?: string;
  location?: string;
};

const TYPE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  training: { bg: "bg-green-900/50", text: "text-green-300", dot: "bg-green-400" },
  match: { bg: "bg-red-900/50", text: "text-red-300", dot: "bg-red-400" },
  activiteit: { bg: "bg-purple-900/50", text: "text-purple-300", dot: "bg-purple-400" },
};

type NewEvent = {
  type: "training" | "match" | "activiteit";
  date: string;
  time: string;
  location: string;
  opponent: string;
  home_away: "thuis" | "uit";
  title: string;
  notes: string;
};

const emptyEvent: NewEvent = {
  type: "training",
  date: "",
  time: "20:00",
  location: "",
  opponent: "",
  home_away: "thuis",
  title: "",
  notes: "",
};

export default function CalendarPage() {
  const { isAdmin } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [month, setMonth] = useState(new Date());
  const [filter, setFilter] = useState<"all" | "training" | "match" | "activiteit">("all");
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState<NewEvent>({ ...emptyEvent });
  const [saving, setSaving] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [{ data: trainings }, { data: matches }, { data: activities }] = await Promise.all([
      supabase.from("trainings").select("id, date, time, location"),
      supabase.from("matches").select("id, date, time, opponent, location, home_away"),
      supabase.from("activities").select("id, date, time, title, location"),
    ]);

    const evts: CalendarEvent[] = [
      ...(trainings ?? []).map((t) => ({
        id: t.id, date: t.date, type: "training" as const,
        label: "Training", time: t.time, location: t.location,
      })),
      ...(matches ?? []).map((m) => ({
        id: m.id, date: m.date, type: "match" as const,
        label: `${m.home_away === "thuis" ? "vs" : "@"} ${m.opponent}`,
        time: m.time, location: m.location,
      })),
      ...(activities ?? []).map((a) => ({
        id: a.id, date: a.date, type: "activiteit" as const,
        label: a.title, time: a.time ?? undefined, location: a.location ?? undefined,
      })),
    ];
    setEvents(evts);
  };

  const handleSave = async () => {
    setSaving(true);
    const user = (await supabase.auth.getUser()).data.user;
    const { data: season } = await supabase.from("seasons").select("id").eq("active", true).single();

    if (newEvent.type === "training") {
      await supabase.from("trainings").insert({
        date: newEvent.date,
        time: newEvent.time,
        location: newEvent.location,
        season_id: season?.id ?? "",
        created_by: user?.id ?? "",
      } as any);
    } else if (newEvent.type === "match") {
      await supabase.from("matches").insert({
        date: newEvent.date,
        time: newEvent.time,
        location: newEvent.location,
        opponent: newEvent.opponent,
        home_away: newEvent.home_away,
        season_id: season?.id ?? "",
        created_by: user?.id ?? "",
      } as any);
    } else {
      await supabase.from("activities").insert({
        date: newEvent.date,
        time: newEvent.time || null,
        location: newEvent.location || null,
        title: newEvent.title,
        notes: newEvent.notes || null,
        season_id: season?.id ?? null,
        created_by: user?.id ?? null,
      } as any);
    }

    setSaving(false);
    setShowForm(false);
    setNewEvent({ ...emptyEvent });
    load();
  };

  const year = month.getFullYear();
  const mon = month.getMonth();
  const firstDay = new Date(year, mon, 1).getDay();
  const daysInMonth = new Date(year, mon + 1, 0).getDate();
  const offset = (firstDay + 6) % 7;

  const filtered = events.filter((e) => filter === "all" || e.type === filter);

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(mon + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return filtered.filter((e) => e.date === dateStr);
  };

  const monthName = month.toLocaleDateString("nl-NL", { month: "long", year: "numeric" });
  const selectedDayEvents = selectedDay ? filtered.filter((e) => e.date === selectedDay) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-club-yellow flex items-center gap-2">
          <CalIcon size={24} /> Kalender
        </h2>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-club-green text-white text-sm font-semibold hover:bg-club-green-light transition"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? "Sluiten" : "Toevoegen"}
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <div className="bg-gray-900 rounded-2xl p-5 space-y-3">
          <h3 className="font-semibold text-sm text-gray-300">Nieuw evenement</h3>
          <div className="flex gap-2">
            {(["training", "match", "activiteit"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setNewEvent({ ...newEvent, type: t })}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize ${
                  newEvent.type === t
                    ? `${TYPE_COLORS[t].bg} ${TYPE_COLORS[t].text} ring-1 ring-current`
                    : "bg-gray-800 text-gray-400"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} className="px-3 py-2 rounded-xl bg-gray-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-club-green" />
            <input type="time" value={newEvent.time} onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} className="px-3 py-2 rounded-xl bg-gray-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-club-green" />
          </div>
          <input type="text" value={newEvent.location} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} placeholder="Locatie" className="w-full px-3 py-2 rounded-xl bg-gray-800 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-club-green" />
          {newEvent.type === "match" && (
            <div className="grid grid-cols-2 gap-3">
              <input type="text" value={newEvent.opponent} onChange={(e) => setNewEvent({ ...newEvent, opponent: e.target.value })} placeholder="Tegenstander" className="px-3 py-2 rounded-xl bg-gray-800 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-club-green" />
              <select value={newEvent.home_away} onChange={(e) => setNewEvent({ ...newEvent, home_away: e.target.value as "thuis" | "uit" })} className="px-3 py-2 rounded-xl bg-gray-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-club-green">
                <option value="thuis">Thuis</option>
                <option value="uit">Uit</option>
              </select>
            </div>
          )}
          {newEvent.type === "activiteit" && (
            <>
              <input type="text" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="Titel (bijv. BBQ, Teamuitje)" className="w-full px-3 py-2 rounded-xl bg-gray-800 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-club-green" />
              <textarea value={newEvent.notes} onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })} placeholder="Notities (optioneel)" rows={2} className="w-full px-3 py-2 rounded-xl bg-gray-800 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-club-green resize-none" />
            </>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !newEvent.date || (newEvent.type === "match" && !newEvent.opponent) || (newEvent.type === "activiteit" && !newEvent.title)}
            className="w-full py-2.5 rounded-xl bg-club-green text-white font-semibold text-sm hover:bg-club-green-light transition disabled:opacity-50"
          >
            {saving ? "Opslaan..." : "Opslaan"}
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button onClick={() => setMonth(new Date(year, mon - 1))} className="p-2 bg-gray-800 rounded-xl hover:bg-gray-700"><ChevronLeft size={18} /></button>
        <h3 className="text-lg font-semibold capitalize">{monthName}</h3>
        <button onClick={() => setMonth(new Date(year, mon + 1))} className="p-2 bg-gray-800 rounded-xl hover:bg-gray-700"><ChevronRight size={18} /></button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {([["all", "Alles"], ["training", "Training"], ["match", "Wedstrijd"], ["activiteit", "Activiteit"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${filter === key ? "bg-club-green text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
            {key !== "all" && <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${TYPE_COLORS[key].dot}`} />}
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].map((d) => (
          <div key={d} className="text-center text-xs text-gray-500 py-2 font-medium">{d}</div>
        ))}
        {Array.from({ length: offset }, (_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dayEvents = getEventsForDay(day);
          const isToday = new Date().toDateString() === new Date(year, mon, day).toDateString();
          const dateStr = `${year}-${String(mon + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          return (
            <div
              key={day}
              onClick={() => setSelectedDay(selectedDay === dateStr ? null : dateStr)}
              className={`min-h-[60px] rounded-xl p-1.5 text-xs cursor-pointer transition ${isToday ? "bg-gray-800 ring-1 ring-club-yellow" : "bg-gray-900 hover:bg-gray-800"} ${selectedDay === dateStr ? "ring-1 ring-club-green" : ""}`}
            >
              <span className={`font-medium ${isToday ? "text-club-yellow" : "text-gray-300"}`}>{day}</span>
              {dayEvents.map((e) => {
                const colors = TYPE_COLORS[e.type];
                return (
                  <div key={e.id} className={`mt-0.5 px-1 py-0.5 rounded text-[10px] truncate ${colors.bg} ${colors.text}`}>
                    {e.label}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {selectedDay && selectedDayEvents.length > 0 && (
        <div className="bg-gray-900 rounded-2xl p-4 space-y-2">
          <h3 className="text-sm font-semibold text-gray-300">
            {new Date(selectedDay + "T00:00").toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })}
          </h3>
          {selectedDayEvents.map((e) => {
            const colors = TYPE_COLORS[e.type];
            return (
              <div key={e.id} className={`${colors.bg} rounded-xl p-3 space-y-1`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                  <span className={`font-medium text-sm ${colors.text}`}>{e.label}</span>
                  <span className="text-[10px] text-gray-500 uppercase">{e.type}</span>
                </div>
                {(e.time || e.location) && (
                  <p className="text-xs text-gray-400">
                    {e.time && `🕐 ${e.time}`} {e.location && ` 📍 ${e.location}`}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
