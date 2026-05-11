import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

type Props = {
  children: React.ReactNode;
  role?: "admin" | "player";
};

export default function ProtectedRoute({ children, role }: Props) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-club-black">
        <div className="animate-spin w-8 h-8 border-4 border-club-green border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user && profile && !profile.onboarded) return <Navigate to="/onboarding" replace />;
  if (role === "admin" && profile?.role !== "admin") return <Navigate to="/" replace />;

  return <>{children}</>;
}
