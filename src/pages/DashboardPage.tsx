import { useEffect, useState } from "react";
import { useAuth } from "../features/auth/AuthProvider";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import { Calendar, MapPin, Clock, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";

type Event = {
  id: string;
  date: string;
  time: string;
  location: string;
  type: "training" | "match";
  label: string;
};

type Announcement = {
  id: string;
  title: string;
  body: string;
  emoji: string | null;
  created_at: string;
};

export default function DashboardPage() {
  const { profile, user } = useAuth();
  const [nextEvent, setNextEvent] = useState<Event | null>(null);
  const [currentRsvp, setCurrentRsvp] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [fineBalance, setFineBalance] = useState(0);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];

    // Next training
    const { data: trainings } = await supabase
      .from("trainings")
      .select("*")
      .gte("date", today)
      .order("date", { ascending: true })
      .limit(1);

    // Next match
    const { data: matches } = await supabase
      .from("matches")
      .select("*")
      .gte("date", today)
      .order("date", { ascending: true })
      .limit(1);

    // Determine which is sooner
    const events: Event[] = [];
    if (trainings?.[0]) {
      events.push({
        id: trainings[0].id,
        date: trainings[0].date,
        time: trainings[0].time,
        location: trainings[0].location,
        type: "training",
        label: "Training",
      });
    }
    if (matches?.[0]) {
      events.push({
        id: matches[0].id,
        date: matches[0].date,
        time: matches[0].time,
        location: matches[0].location,
        type: "match",
        label: `Wedstrijd vs. ${matches[0].opponent}`,
      });
    }
    events.sort((a, b) => a.date.localeCompare(b.date));
    const next = events[0] ?? null;
    setNextEvent(next);

    // Get current RSVP for next event
    if (next) {
      const { data: rsvp } = await supabase
        .from("rsvps")
        .select("status")
        .eq("player_id", user.id)
        .eq("event_id", next.id)
        .eq("event_type", next.type)
        .single();
      setCurrentRsvp(rsvp?.status ?? null);
    }

    // Last 3 announcements
    const { data: ann } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(3);
    setAnnouncements(ann ?? []);

    // Fine balance
    const { data: fines } = await supabase
      .from("fines")
      .select("amount, paid")
      .eq("player_id", user.id);
    const balance = (fines ?? [])
      .filter((f) => !f.paid)
      .reduce((sum, f) => sum + f.amount, 0);
    setFineBalance(balance);
  };

  const handleRsvp = async (status: "aanwezig" | "afwezig" | "misschien") => {
    if (!user || !nextEvent) return;
    setRsvpLoading(true);

    // Upsert RSVP
    const { data: existing } = await supabase
      .from("rsvps")
      .select("id")
      .eq("player_id", user.id)
      .eq("event_id", nextEvent.id)
      .eq("event_type", nextEvent.type)
      .single();

    if (existing) {
      await supabase.from("rsvps").update({ status }).eq("id", existing.id);
    } else {
      await supabase.from("rsvps").insert({
        player_id: user.id,
        event_id: nextEvent.id,
        event_type: nextEvent.type,
        status,
      });
    }
    setCurrentRsvp(status);
    setRsvpLoading(false);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-club-yellow">
        Hoi {profile?.name?.split(" ")[0] ?? "speler"} 👋
      </h2>

      {/* Volgende event */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900 rounded-2xl p-5 space-y-3"
      >
        {nextEvent ? (
          <>
            <h3 className="font-semibold text-lg">{nextEvent.label}</h3>
            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar size={14} /> {formatDate(nextEvent.date)}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={14} /> {nextEvent.time}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={14} /> {nextEvent.location}
              </span>
            </div>

            {/* RSVP buttons */}
            <div className="flex gap-2 pt-2">
              {([
                { status: "aanwezig", label: "Aanwezig", icon: CheckCircle, color: "bg-green-600" },
                { status: "afwezig", label: "Afwezig", icon: XCircle, color: "bg-red-600" },
                { status: "misschien", label: "Misschien", icon: HelpCircle, color: "bg-yellow-600" },
              ] as const).map(({ status, label, icon: Icon, color }) => (
                <button
                  key={status}
                  onClick={() => handleRsvp(status)}
                  disabled={rsvpLoading}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition ${
                    currentRsvp === status
                      ? `${color} text-white`
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="text-gray-500">Geen aankomende evenementen</p>
        )}
      </motion.div>

      {/* Boetesaldo */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-900 rounded-2xl p-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Openstaand boetesaldo</p>
            <p className="text-3xl font-bold text-club-yellow">€{fineBalance.toFixed(2)}</p>
          </div>
          <Link
            to="/boetes"
            className="text-sm text-club-green hover:text-club-green-light transition"
          >
            Bekijk details →
          </Link>
        </div>
      </motion.div>

      {/* Aankondigingen */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-900 rounded-2xl p-5 space-y-3"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Laatste aankondigingen</h3>
          <Link to="/prikbord" className="text-sm text-club-green hover:text-club-green-light">
            Alles bekijken →
          </Link>
        </div>
        {announcements.length > 0 ? (
          announcements.map((a) => (
            <div key={a.id} className="border-l-2 border-club-green pl-3">
              <p className="font-medium">
                {a.emoji && <span className="mr-1">{a.emoji}</span>}
                {a.title}
              </p>
              <p className="text-sm text-gray-400 line-clamp-1">{a.body}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm">Nog geen aankondigingen</p>
        )}
      </motion.div>
    </div>
  );
}
