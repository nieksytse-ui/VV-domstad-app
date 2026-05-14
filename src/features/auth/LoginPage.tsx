import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

const MIN_PASSWORD_LENGTH = 8;

export default function LoginPage() {
  const [step, setStep] = useState<"code" | "email" | "password" | "sent">("code");
  const [teamCode, setTeamCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCodeSubmit = async () => {
    setError("");
    setLoading(true);
    const { data, error: err } = await supabase
      .from("invites")
      .select("*")
      .eq("code", teamCode.toUpperCase())
      .eq("active", true)
      .limit(1);

    if (err || !data || data.length === 0) {
      setError("Ongeldige teamcode. Vraag je trainer om de juiste code.");
      setLoading(false);
      return;
    }
    setLoading(false);
    setStep("email");
  };

  const handleEmailSubmit = () => {
    setError("");
    setStep("password");
  };

  const handlePasswordSubmit = async () => {
    setError("");

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Wachtwoord moet minimaal ${MIN_PASSWORD_LENGTH} tekens zijn.`);
      return;
    }

    setLoading(true);

    // Probeer eerst in te loggen
    const { error: loginErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!loginErr) {
      // Succesvol ingelogd
      setLoading(false);
      return;
    }

    // Als inloggen faalt, probeer te registreren
    if (loginErr.message.includes("Invalid login credentials")) {
      if (!isNewUser) {
        // Eerste keer: vraag bevestiging dat ze nieuw zijn
        setIsNewUser(true);
        setError("Geen account gevonden. Klik nogmaals om een account aan te maken.");
        setLoading(false);
        return;
      }

      // Tweede klik: registreer
      const { error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (signUpErr) {
        setError(`Fout: ${signUpErr.message}`);
        setLoading(false);
        return;
      }

      setLoading(false);
      setStep("sent");
      return;
    }

    setError(`Fout: ${loginErr.message}`);
    setLoading(false);
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

        {/* Joachim QR */}
        <div className="rounded-2xl overflow-hidden">
          <img src="/joachim-qr.jpeg" alt="Joachim QR" className="w-full h-auto object-cover rounded-2xl" />
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
                onKeyDown={(e) => e.key === "Enter" && handleCodeSubmit()}
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
                onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
              />
              <button
                onClick={handleEmailSubmit}
                disabled={!email}
                className="w-full py-3 rounded-xl bg-club-green text-white font-semibold hover:bg-club-green-light transition disabled:opacity-50"
              >
                Volgende
              </button>
              <button
                onClick={() => setStep("code")}
                className="w-full text-sm text-gray-400 hover:text-white"
              >
                ← Terug
              </button>
            </>
          )}

          {step === "password" && (
            <>
              <p className="text-xs text-gray-500 text-center">{email}</p>
              <label className="block text-sm text-gray-300">Wachtwoord</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setIsNewUser(false); setError(""); }}
                  placeholder="Minimaal 8 tekens"
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-club-green pr-12"
                  onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {password.length > 0 && password.length < MIN_PASSWORD_LENGTH && (
                <p className="text-yellow-500 text-xs">Nog {MIN_PASSWORD_LENGTH - password.length} tekens nodig</p>
              )}
              <button
                onClick={handlePasswordSubmit}
                disabled={loading || password.length < MIN_PASSWORD_LENGTH}
                className={`w-full py-3 rounded-xl font-semibold transition disabled:opacity-50 ${
                  isNewUser
                    ? "bg-club-yellow text-club-black hover:opacity-90"
                    : "bg-club-green text-white hover:bg-club-green-light"
                }`}
              >
                {loading ? "Bezig..." : isNewUser ? "Account aanmaken" : "Inloggen"}
              </button>
              <button
                onClick={() => { setStep("email"); setPassword(""); setIsNewUser(false); setError(""); }}
                className="w-full text-sm text-gray-400 hover:text-white"
              >
                ← Terug
              </button>
              <button
                onClick={async () => {
                  setError("");
                  setLoading(true);
                  const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-wachtwoord`,
                  });
                  setLoading(false);
                  if (err) {
                    if (err.message.includes("after")) {
                      setError("Even geduld — probeer het over 40 seconden opnieuw.");
                    } else {
                      setError(`Fout: ${err.message}`);
                    }
                    return;
                  }
                  setStep("sent");
                }}
                disabled={loading}
                className="w-full text-xs text-gray-500 hover:text-club-yellow"
              >
                Wachtwoord vergeten?
              </button>
            </>
          )}

          {step === "sent" && (
            <div className="text-center space-y-2">
              <p className="text-club-yellow text-lg font-semibold">📧 Check je inbox!</p>
              <p className="text-gray-400 text-sm">
                We hebben een bevestigingslink gestuurd naar <strong className="text-white">{email}</strong>.
                Klik op de link om je account te activeren.
              </p>
            </div>
          )}

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        </div>
      </motion.div>
    </div>
  );
}
