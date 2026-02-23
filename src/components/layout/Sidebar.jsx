import { NavLink, useNavigate } from "react-router-dom";
import {
  HouseFill,
  BarChartFill,
  CreditCard2Front,
  Link45deg,
  BoxArrowRight,
} from "react-bootstrap-icons";
import logo from "../../assets/logo/logo-colored.svg";
import { supabase } from "../../utils/supabase";

const navItems = [
  {
    label: "الرئيسية",
    path: "/",
    icon: HouseFill,
  },
  {
    label: "الإحصائيات",
    path: "/stats",
    icon: BarChartFill,
  },
  {
    label: "بطاقات الأذكار",
    path: "/dhikr-cards",
    icon: CreditCard2Front,
  },
  {
    label: "روابط التواصل",
    path: "/social-links",
    icon: Link45deg,
  },
];

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-30 flex w-64 flex-col bg-[#F2F2F2]" style={{borderTopLeftRadius: '22px', borderBottomLeftRadius: '22px'}}>
      {/* Logo */}
      <div className="flex items-center justify-center px-6 py-8">
        <img src={logo} alt="وَذَكِّرْ" className="h-12 w-auto" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4">
        {navItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-pill px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-secondary text-surface"
                  : "text-gray-400 hover:text-white hover:bg-[#398cbfba]"
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-4 pb-6">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-pill px-4 py-3 text-sm font-medium text-danger hover:bg-red-50 transition-colors"
        >
          <BoxArrowRight size={18} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
