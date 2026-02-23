import { Outlet, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { List } from "react-bootstrap-icons";
import Sidebar from "./Sidebar";
import symbol from "../../assets/general/symbol.png";
import logo from "../../assets/logo/logo-colored.svg";
import { supabase } from "../../utils/supabase";

export default function DashboardLayout() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile topbar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between bg-white px-4 h-14 border-b border-gray-100">
        <img src={logo} alt="وَذَكِّرْ" className="h-8 w-auto" />
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-surface transition-colors"
          aria-label="فتح القائمة"
        >
          <List size={22} />
        </button>
      </header>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <main className="relative overflow-hidden mr-0 md:mr-64 min-h-screen grid pt-14 md:pt-0">
        {/* Background symbol */}
        <img
          src={symbol}
          aria-hidden="true"
          className="pointer-events-none select-none fixed -left-24 -bottom-24 w-[490px] opacity-[0.1]"
        />

        <div className="relative z-10 place-self-center w-full max-w-4xl px-4 py-6 sm:px-8 sm:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
