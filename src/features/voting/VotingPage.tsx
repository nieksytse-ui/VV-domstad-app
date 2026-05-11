import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { Vote } from "lucide-react";

type Match = { id: string; opponent: string; date: string };
type Player = { id: string; name: string | null };

export default function VotingPage() {
  const { user, isAdmin } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedMatch, setSelectedMatch] = useState("");
  const [voted, setVoted] = useState(false);
  const [results, setResults] = useState<{ name: string; votes: number }[]>([]);
  const [votingOpen, setVotingOpen] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data: m } = await supabase.from("matches").select("id, opponent, date").order("date", { ascending: false }).limit(10);
    setMatches(m ?? []);
    const { data: p } = await supabase.from("players").select("id, name").eq("onboarded", true);
    setPlayers(p ?? []);
  };

  const checkVote = async (matchId: string) => {
    if (!user) return;
    setSelectedMatch(matchId);
    const { data } = await supabase.from("motm_votes").select("*").eq("match_id", matchId).eq("voter_id", user.id);
    setVoted((data ?? []).length > 0);

    // Load results
    const { data: votes } = await supabase.from("motm_votes").select("voted_for_id").eq("match_id", matchId);
    const counts: Record<string, number> = {};
    (votes ?? []).forEach((v) => { counts[v.voted_for_id] = (counts[v.voted_for_id] ?? 0) + 1; });
    setResults(
      Object.entries(counts)
        .map(([id, c]) => ({ name: players.find((p) => p.id === id)?.name ?? "?", votes: c }))
        .sort((a, b) => b.votes - a.votes)
    );
  };

  const castVote = async (playerId: string) => {
    if (!user || !selectedMatch) return;
    await supabase.from("motm_votes").insert({ match_id: selectedMatch, voter_id: user.id, voted_for_id: playerId });
    checkVote(selectedMatch);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-club-yellow flex items-center gap-2"><Vote size={24} /> Man of the Match</h2>

      <div className="space-y-2">
        {matches.map((m) => (
          <button key={m.id} onClick={() => checkVote(m.id)}
            className={`w-full text-left bg-gray-900 rounded-xl p-4 hover:bg-gray-800 transition ${selectedMatch === m.id ? "ring-2 ring-club-yellow" : ""}`}>
            <p className="font-medium">vs. {m.opponent}</p>
            <p className="text-xs text-gray-500">{new Date(m.date).toLocaleDateString("nl-NL")}</p>
          </button>
        ))}
      </div>

      {selectedMatch && !voted && (
        <div className="bg-gray-900 rounded-2xl p-5 space-y-3">
          <h3 className="font-semibold">Stem op een speler</h3>
          <div className="grid grid-cols-2 gap-2">
            {players.filter((p) => p.id !== user?.id).map((p) => (
              <button key={p.id} onClick={() => castVote(p.id)} className="py-3 bg-gray-800 hover:bg-club-green hover:text-white rounded-xl text-sm font-medium transition">
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedMatch && voted && results.length > 0 && (
        <div className="bg-gray-900 rounded-2xl p-5 space-y-3">
          <h3 className="font-semibold text-club-yellow">Resultaten</h3>
          {results.map((r, i) => (
            <div key={r.name} className="flex items-center justify-between bg-gray-800 rounded-xl p-3">
              <span className="flex items-center gap-2">
                {i === 0 && <span className="text-lg">🏆</span>}
                <span className="font-medium">{r.name}</span>
              </span>
              <span className="font-bold text-club-yellow">{r.votes} stem{r.votes !== 1 ? "men" : ""}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
