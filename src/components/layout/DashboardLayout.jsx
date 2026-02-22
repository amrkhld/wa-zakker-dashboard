import { Outlet, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import symbol from "../../assets/general/symbol.png";
import { supabase } from "../../utils/supabase";

export default function DashboardLayout() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

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
      <Sidebar />

      {/* Main content — offset by sidebar width (right side in RTL) */}
      <main className="relative overflow-hidden mr-64 min-h-screen grid">
        {/* Background symbol — fades out, overflows left and bottom */}
        <img
          src={symbol}
          aria-hidden="true"
          className="pointer-events-none select-none absolute -left-24 -bottom-24 w-[490px] opacity-[0.1]"
        />

        <div className="relative z-10 place-self-center w-full max-w-4xl px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
