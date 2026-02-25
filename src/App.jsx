import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import Login from "./pages/Login";
import OverviewPage from "./features/overview/components/OverviewPage";
// import StatsPage from "./features/stats/components/StatsPage";
import DhikrCardsPage from "./features/dhikr-cards/components/DhikrCardsPage";
import SocialLinksPage from "./features/social-links/components/SocialLinksPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />

        {/* Dashboard */}
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<OverviewPage />} />
          {/* <Route path="/stats" element={<StatsPage />} /> */}
          <Route path="/dhikr-cards" element={<DhikrCardsPage />} />
          <Route path="/social-links" element={<SocialLinksPage />} />
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
