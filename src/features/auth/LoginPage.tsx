import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

const MIN_PASSWORD_LENGTH = 8;

export default function LoginPage() {
  const [step, setStep] = useState<"email" | "login" | "register" | "done">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const cleanEmail = email.trim().toLowerCase();

  // Stap 1: check of het e-mailadres al een account heeft
  const handleEmailCheck = async () => {
    setError("");
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Vul een geldig e-mailadres in.");
      return;
    }
    setLoading(true);
    const { data, error: err } = await supabase.rpc("email_exists", { check_email: cleanEmail });
    setLoading(false);
    if (err) {
      setError(`Fout: ${err.message}`);
      return;
    }
    setPassword("");
    setConfirmPassword("");
    setStep(data ? "login" : "register");
  };

  // Stap 2a: inloggen (bestaand account)
  const handleLogin = async () => {
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    setLoading(false);
    if (err) {
      if (err.message.includes("Invalid login credentials")) {
        setError("Onjuist wachtwoord. Probeer opnieuw of gebruik 'Wachtwoord vergeten?'.");
      } else {
        setError(`Fout: ${err.message}`);
      }
    }
    // Bij succes neemt AuthProvider het over
  };

  // Stap 2b: registreren (nieuw account)
  const handleRegister = async () => {
    setError("");

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Wachtwoord moet minimaal ${MIN_PASSWORD_LENGTH} tekens zijn.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Wachtwoorden komen niet overeen.");
      return;
    }

    setLoading(true);

    // Controleer teamcode
    const { data: invite, error: codeErr } = await supabase
      .from("invites")
      .select("id")
      .eq("code", teamCode.toUpperCase())
      .eq("active", true)
      .limit(1);

    if (codeErr || !invite || invite.length === 0) {
      setLoading(false);
      setError("Ongeldige teamcode. Vraag je trainer om de juiste code.");
      return;
    }

    // Maak account aan
    const { data, error: signUpErr } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
    });

    setLoading(false);

    if (signUpErr) {
      if (signUpErr.message.toLowerCase().includes("already")) {
        setError("Dit account bestaat al. Ga terug en log in.");
      } else {
        setError(`Fout: ${signUpErr.message}`);
      }
      return;
    }

    // E-mailbevestiging uit → direct een sessie (AuthProvider logt in).
    // E-mailbevestiging aan → toon bevestigingsscherm.
    if (!data.session) {
      setStep("done");
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
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
    setStep("done");
  };

  const backToEmail = () => {
    setStep("email");
    setPassword("");
    setConfirmPassword("");
    setTeamCode("");
    setError("");
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
          {step === "email" && (
            <>
              <label className="block text-sm text-gray-300">E-mailadres</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jouw@email.nl"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-club-green"
                onKeyDown={(e) => e.key === "Enter" && handleEmailCheck()}
              />
              <button
                onClick={handleEmailCheck}
                disabled={loading || !email}
                className="w-full py-3 rounded-xl bg-club-green text-white font-semibold hover:bg-club-green-light transition disabled:opacity-50"
              >
                {loading ? "Controleren..." : "Volgende"}
              </button>
            </>
          )}

          {step === "login" && (
            <>
              <p className="text-xs text-gray-500 text-center">{cleanEmail}</p>
              <label className="block text-sm text-gray-300">Wachtwoord</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Jouw wachtwoord"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-club-green pr-12"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <button
                onClick={handleLogin}
                disabled={loading || !password}
                className="w-full py-3 rounded-xl bg-club-green text-white font-semibold hover:bg-club-green-light transition disabled:opacity-50"
              >
                {loading ? "Inloggen..." : "Inloggen"}
              </button>
              <button
                onClick={backToEmail}
                className="w-full text-sm text-gray-400 hover:text-white"
              >
                ← Ander e-mailadres
              </button>
              <button
                onClick={handleForgotPassword}
                disabled={loading}
                className="w-full text-xs text-gray-500 hover:text-club-yellow"
              >
                Wachtwoord vergeten?
              </button>
            </>
          )}

          {step === "register" && (
            <>
              <p className="text-xs text-gray-500 text-center">Nieuw account voor {cleanEmail}</p>

              <label className="block text-sm text-gray-300">Teamcode</label>
              <input
                type="text"
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value)}
                placeholder="Teamcode"
                className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-club-green uppercase"
              />

              <label className="block text-sm text-gray-300">Kies een wachtwoord</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimaal 8 tekens"
                  autoComplete="new-password"
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-club-green pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Herhaal wachtwoord"
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-club-green"
                onKeyDown={(e) => e.key === "Enter" && handleRegister()}
              />

              {password.length > 0 && password.length < MIN_PASSWORD_LENGTH && (
                <p className="text-yellow-500 text-xs">Nog {MIN_PASSWORD_LENGTH - password.length} tekens nodig</p>
              )}
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <p className="text-yellow-500 text-xs">Wachtwoorden komen niet overeen</p>
              )}

              <button
                onClick={handleRegister}
                disabled={loading || !teamCode || password.length < MIN_PASSWORD_LENGTH || password !== confirmPassword}
                className="w-full py-3 rounded-xl bg-club-yellow text-club-black font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? "Account aanmaken..." : "Account aanmaken"}
              </button>
              <button
                onClick={backToEmail}
                className="w-full text-sm text-gray-400 hover:text-white"
              >
                ← Ander e-mailadres
              </button>
            </>
          )}

          {step === "done" && (
            <div className="text-center space-y-2">
              <p className="text-club-yellow text-lg font-semibold">📧 Check je inbox!</p>
              <p className="text-gray-400 text-sm">
                We hebben een e-mail gestuurd naar <strong className="text-white">{cleanEmail}</strong>.
                Volg de link om verder te gaan.
              </p>
            </div>
          )}

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        </div>
      </motion.div>
    </div>
  );
}
