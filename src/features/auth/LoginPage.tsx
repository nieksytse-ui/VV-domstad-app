import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { motion } from "framer-motion";

export default function LoginPage() {
  console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
  const [step, setStep] = useState<"code" | "email" | "sent">("code");
  const [teamCode, setTeamCode] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCodeSubmit = async () => {
    setError("");
    setLoading(true);
    // Controleer teamcode
    const { data, error: err } = await supabase
      .from("invites")
      .select("*")
      .eq("code", teamCode.toUpperCase())
      .eq("active", true)
      .limit(1);

    console.log("Invite check:", { data, error: err, code: teamCode.toUpperCase() });

    if (err || !data || data.length === 0) {
      setError("Ongeldige teamcode. Vraag je trainer om de juiste code.");
      setLoading(false);
      return;
    }
    setLoading(false);
    setStep("email");
  };

  const handleEmailSubmit = async () => {
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (err) {
      console.error("OTP error:", err);
      setError(`Fout: ${err.message}`);
      setLoading(false);
      return;
    }
    setLoading(false);
    setStep("sent");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-club-black p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6"
      >
        <div className="text-center">
          <h1 className="text-4xl font-bold text-club-yellow">v.v. Domstad</h1>
          <p className="text-gray-400 mt-2">Welkom bij de teamapp</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 space-y-4">
          {step === "code" && (
            <>
              <label className="block text-sm text-gray-300">Teamcode</label>
              <input
                type="text"
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value)}
                placeholder="Vul je teamcode in"
                className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-club-green"
              />
              <button
                onClick={handleCodeSubmit}
                disabled={loading || !teamCode}
                className="w-full py-3 rounded-xl bg-club-green text-white font-semibold hover:bg-club-green-light transition disabled:opacity-50"
              >
                {loading ? "Controleren..." : "Volgende"}
              </button>
            </>
          )}

          {step === "email" && (
            <>
              <label className="block text-sm text-gray-300">E-mailadres</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jouw@email.nl"
                className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-club-green"
              />
              <button
                onClick={handleEmailSubmit}
                disabled={loading || !email}
                className="w-full py-3 rounded-xl bg-club-green text-white font-semibold hover:bg-club-green-light transition disabled:opacity-50"
              >
                {loading ? "Versturen..." : "Stuur magic link"}
              </button>
              <button
                onClick={() => setStep("code")}
                className="w-full text-sm text-gray-400 hover:text-white"
              >
                ← Terug
              </button>
            </>
          )}

          {step === "sent" && (
            <div className="text-center space-y-2">
              <p className="text-club-yellow text-lg font-semibold">📧 Check je inbox!</p>
              <p className="text-gray-400 text-sm">
                We hebben een inloglink gestuurd naar <strong className="text-white">{email}</strong>.
                Klik op de link om in te loggen.
              </p>
            </div>
          )}

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        </div>
      </motion.div>
    </div>
  );
}
