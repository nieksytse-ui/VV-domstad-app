import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { motion } from "framer-motion";

const POSITIONS = ["Keeper", "Verdediger", "Middenvelder", "Aanvaller"];

export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [shirtNumber, setShirtNumber] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user || !name || !position) return;
    setLoading(true);

    let photo_url: string | null = null;
    if (photo) {
      const ext = photo.name.split(".").pop();
      const path = `avatars/${user.id}.${ext}`;
      await supabase.storage.from("photos").upload(path, photo, { upsert: true });
      const { data } = supabase.storage.from("photos").getPublicUrl(path);
      photo_url = data.publicUrl;
    }

    await supabase.from("players").upsert({
      id: user.id,
      email: user.email!,
      name,
      position,
      shirt_number: shirtNumber ? parseInt(shirtNumber) : null,
      photo_url,
      onboarded: true,
      role: "player",
    });

    await refreshProfile();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-club-black p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-club-yellow">Welkom bij Domstad!</h1>
          <p className="text-gray-400 mt-1">Vul je profiel in om te beginnen</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Naam</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Je volledige naam"
              className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-club-green"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Positie</label>
            <div className="grid grid-cols-2 gap-2">
              {POSITIONS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPosition(p)}
                  className={`py-2 rounded-xl text-sm font-medium transition ${
                    position === p
                      ? "bg-club-green text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Rugnummer</label>
            <input
              type="number"
              value={shirtNumber}
              onChange={(e) => setShirtNumber(e.target.value)}
              placeholder="bijv. 10"
              min={1}
              max={99}
              className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-club-green"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Profielfoto</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-club-green file:text-white file:font-semibold hover:file:bg-club-green-light"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !name || !position}
            className="w-full py-3 rounded-xl bg-club-yellow text-club-black font-bold hover:brightness-110 transition disabled:opacity-50"
          >
            {loading ? "Opslaan..." : "Profiel opslaan"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
