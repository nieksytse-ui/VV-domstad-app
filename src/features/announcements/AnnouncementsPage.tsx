import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { motion } from "framer-motion";
import { Plus, Megaphone } from "lucide-react";

const EMOJIS = ["👍", "😂", "🔥", "💪", "❤️"];

type Announcement = {
  id: string;
  title: string;
  body: string;
  emoji: string | null;
  created_at: string;
  created_by: string;
};

type Reaction = {
  announcement_id: string;
  player_id: string;
  emoji: string;
};

export default function AnnouncementsPage() {
  const { user, profile, isAdmin } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", emoji: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data: ann } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    setAnnouncements(ann ?? []);
    const { data: reac } = await supabase.from("announcement_reactions").select("*");
    setReactions(reac ?? []);
  };

  const handleCreate = async () => {
    if (!user) return;
    setLoading(true);
    await supabase.from("announcements").insert({
      title: form.title,
      body: form.body,
      emoji: form.emoji || null,
      created_by: user.id,
    });
    setForm({ title: "", body: "", emoji: "" });
    setShowForm(false);
    setLoading(false);
    load();
  };

  const toggleReaction = async (announcementId: string, emoji: string) => {
    if (!user) return;
    const existing = reactions.find(
      (r) => r.announcement_id === announcementId && r.player_id === user.id && r.emoji === emoji
    );
    if (existing) {
      await supabase.from("announcement_reactions").delete().eq("announcement_id", announcementId).eq("player_id", user.id).eq("emoji", emoji);
    } else {
      await supabase.from("announcement_reactions").insert({ announcement_id: announcementId, player_id: user.id, emoji });
    }
    load();
  };

  const getReactionCount = (announcementId: string, emoji: string) =>
    reactions.filter((r) => r.announcement_id === announcementId && r.emoji === emoji).length;

  const hasReacted = (announcementId: string, emoji: string) =>
    reactions.some((r) => r.announcement_id === announcementId && r.player_id === user?.id && r.emoji === emoji);

  const formatDate = (d: string) => new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-club-yellow flex items-center gap-2"><Megaphone size={24} /> Prikbord</h2>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 px-4 py-2 bg-club-green text-white rounded-xl text-sm font-medium hover:bg-club-green-light transition">
            <Plus size={16} /> Nieuw bericht
          </button>
        )}
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gray-900 rounded-2xl p-5 space-y-3">
          <input type="text" placeholder="Titel" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-club-green" />
          <textarea placeholder="Bericht" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={4} className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-club-green resize-none" />
          <div className="flex gap-2">
            {EMOJIS.map((e) => (
              <button key={e} onClick={() => setForm({ ...form, emoji: form.emoji === e ? "" : e })} className={`text-2xl p-2 rounded-xl transition ${form.emoji === e ? "bg-gray-700 ring-2 ring-club-yellow" : "hover:bg-gray-800"}`}>
                {e}
              </button>
            ))}
          </div>
          <button onClick={handleCreate} disabled={loading || !form.title || !form.body} className="w-full py-3 rounded-xl bg-club-yellow text-club-black font-bold disabled:opacity-50">
            {loading ? "Plaatsen..." : "Plaatsen"}
          </button>
        </motion.div>
      )}

      {announcements.map((a) => (
        <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gray-900 rounded-2xl p-5 space-y-3">
          <div>
            <h3 className="font-semibold text-lg">
              {a.emoji && <span className="mr-2">{a.emoji}</span>}
              {a.title}
            </h3>
            <p className="text-xs text-gray-500 mt-1">{formatDate(a.created_at)}</p>
          </div>
          <p className="text-gray-300 whitespace-pre-wrap">{a.body}</p>
          <div className="flex gap-1.5 pt-1">
            {EMOJIS.map((e) => {
              const count = getReactionCount(a.id, e);
              const active = hasReacted(a.id, e);
              return (
                <button
                  key={e}
                  onClick={() => toggleReaction(a.id, e)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm transition ${active ? "bg-club-green/20 ring-1 ring-club-green" : "bg-gray-800 hover:bg-gray-700"}`}
                >
                  {e} {count > 0 && <span className="text-xs text-gray-400">{count}</span>}
                </button>
              );
            })}
          </div>
        </motion.div>
      ))}

      {announcements.length === 0 && <p className="text-gray-500 text-center py-12">Nog geen aankondigingen</p>}
    </div>
  );
}
