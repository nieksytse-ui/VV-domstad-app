import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleReset = async () => {
    setError("");
    if (password.length < 8) {
      setError("Wachtwoord moet minimaal 8 tekens zijn.");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setError(`Fout: ${err.message}`);
      setLoading(false);
      return;
    }
    setSuccess(true);
    setLoading(false);
    setTimeout(() => navigate("/"), 2000);
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
          <p className="text-gray-400 mt-2">Nieuw wachtwoord instellen</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 space-y-4">
          {success ? (
            <div className="text-center space-y-2">
              <p className="text-club-green text-lg font-semibold">✅ Wachtwoord gewijzigd!</p>
              <p className="text-gray-400 text-sm">Je wordt doorgestuurd...</p>
            </div>
          ) : (
            <>
              <label className="block text-sm text-gray-300">Nieuw wachtwoord</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimaal 8 tekens"
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-club-green pr-12"
                  onKeyDown={(e) => e.key === "Enter" && handleReset()}
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
                onClick={handleReset}
                disabled={loading || password.length < 8}
                className="w-full py-3 rounded-xl bg-club-green text-white font-semibold hover:bg-club-green-light transition disabled:opacity-50"
              >
                {loading ? "Opslaan..." : "Wachtwoord opslaan"}
              </button>
            </>
          )}
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        </div>
      </motion.div>
    </div>
  );
}
