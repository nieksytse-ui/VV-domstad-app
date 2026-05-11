import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Calendar as CalIcon, ChevronLeft, ChevronRight } from "lucide-react";

type CalendarEvent = {
  id: string;
  date: string;
  type: "training" | "match";
  label: string;
};

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [month, setMonth] = useState(new Date());
  const [filter, setFilter] = useState<"all" | "training" | "match">("all");

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data: trainings } = await supabase.from("trainings").select("id, date");
    const { data: matches } = await supabase.from("matches").select("id, date, opponent");

    const evts: CalendarEvent[] = [
      ...(trainings ?? []).map((t) => ({ id: t.id, date: t.date, type: "training" as const, label: "Training" })),
      ...(matches ?? []).map((m) => ({ id: m.id, date: m.date, type: "match" as const, label: `vs. ${m.opponent}` })),
    ];
    setEvents(evts);
  };

  const year = month.getFullYear();
  const mon = month.getMonth();
  const firstDay = new Date(year, mon, 1).getDay();
  const daysInMonth = new Date(year, mon + 1, 0).getDate();
  const offset = (firstDay + 6) % 7; // Monday start

  const filtered = events.filter((e) => filter === "all" || e.type === filter);

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(mon + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return filtered.filter((e) => e.date === dateStr);
  };

  const monthName = month.toLocaleDateString("nl-NL", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-club-yellow flex items-center gap-2"><CalIcon size={24} /> Kalender</h2>

      <div className="flex items-center justify-between">
        <button onClick={() => setMonth(new Date(year, mon - 1))} className="p-2 bg-gray-800 rounded-xl hover:bg-gray-700"><ChevronLeft size={18} /></button>
        <h3 className="text-lg font-semibold capitalize">{monthName}</h3>
        <button onClick={() => setMonth(new Date(year, mon + 1))} className="p-2 bg-gray-800 rounded-xl hover:bg-gray-700"><ChevronRight size={18} /></button>
      </div>

      <div className="flex gap-2">
        {([["all", "Alles"], ["training", "Training"], ["match", "Wedstrijd"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} className={`px-3 py-1.5 rounded-xl text-xs font-medium ${filter === key ? "bg-club-green text-white" : "bg-gray-800 text-gray-400"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].map((d) => (
          <div key={d} className="text-center text-xs text-gray-500 py-2 font-medium">{d}</div>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <div key={`e-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dayEvents = getEventsForDay(day);
          const isToday = new Date().toDateString() === new Date(year, mon, day).toDateString();

          return (
            <div key={day} className={`min-h-[60px] rounded-xl p-1.5 text-xs ${isToday ? "bg-gray-800 ring-1 ring-club-yellow" : "bg-gray-900"}`}>
              <span className={`font-medium ${isToday ? "text-club-yellow" : "text-gray-300"}`}>{day}</span>
              {dayEvents.map((e) => (
                <div key={e.id} className={`mt-0.5 px-1 py-0.5 rounded text-[10px] truncate ${e.type === "match" ? "bg-red-900/50 text-red-300" : "bg-green-900/50 text-green-300"}`}>
                  {e.label}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
