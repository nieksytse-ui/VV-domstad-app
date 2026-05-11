import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./features/auth/AuthProvider";
import LoginPage from "./features/auth/LoginPage";
import OnboardingPage from "./features/auth/OnboardingPage";
import ProtectedRoute from "./features/auth/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import TrainingsPage from "./features/attendance/TrainingsPage";
import MatchesPage from "./features/attendance/MatchesPage";
import FinesPage from "./features/fines/FinesPage";
import AnnouncementsPage from "./features/announcements/AnnouncementsPage";
import PlayersPage from "./features/stats/PlayersPage";
import PlayerDetailPage from "./features/stats/PlayerDetailPage";
import StatsPage from "./features/stats/StatsPage";
import LeaderboardsPage from "./features/stats/LeaderboardsPage";
import RotationPage from "./features/rotation/RotationPage";
import CalendarPage from "./features/calendar/CalendarPage";
import VotingPage from "./features/voting/VotingPage";
import AdminPage from "./pages/AdminPage";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-club-black">
        <div className="animate-spin w-10 h-10 border-4 border-club-green border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
      <Route path="/kalender" element={<ProtectedRoute><AppLayout><CalendarPage /></AppLayout></ProtectedRoute>} />
      <Route path="/trainingen" element={<ProtectedRoute><AppLayout><TrainingsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/wedstrijden" element={<ProtectedRoute><AppLayout><MatchesPage /></AppLayout></ProtectedRoute>} />
      <Route path="/spelers" element={<ProtectedRoute><AppLayout><PlayersPage /></AppLayout></ProtectedRoute>} />
      <Route path="/spelers/:id" element={<ProtectedRoute><AppLayout><PlayerDetailPage /></AppLayout></ProtectedRoute>} />
      <Route path="/boetes" element={<ProtectedRoute><AppLayout><FinesPage /></AppLayout></ProtectedRoute>} />
      <Route path="/prikbord" element={<ProtectedRoute><AppLayout><AnnouncementsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/statistieken" element={<ProtectedRoute><AppLayout><StatsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/leaderboards" element={<ProtectedRoute><AppLayout><LeaderboardsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/rotatie" element={<ProtectedRoute><AppLayout><RotationPage /></AppLayout></ProtectedRoute>} />
      <Route path="/stemmen" element={<ProtectedRoute><AppLayout><VotingPage /></AppLayout></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute role="admin"><AppLayout><AdminPage /></AppLayout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
