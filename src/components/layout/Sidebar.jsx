import { NavLink, useNavigate } from "react-router-dom";
import {
  BarChart,
  CreditCard2Front,
  Link45deg,
  BoxArrowRight,
  XLg,
} from "react-bootstrap-icons";
import logo from "../../assets/logo/logo-colored.svg";
import { supabase } from "../../utils/supabase";

const navItems = [
  {
    label: "الإحصائيات",
    path: "/",
    icon: BarChart,
  },
  // {
  //   label: "الإحصائيات",
  //   path: "/stats",
  //   icon: BarChart,
  // },
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

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-40 flex w-64 flex-col px-3 bg-[#F2F2F2] transition-transform duration-200
        ${isOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0`}
      style={{ borderBottomLeftRadius: '22px', height: 'fit-content' }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-8">
        <img src={logo} alt="وَذَكِّرْ" className="h-12 w-auto" />
        <button
          onClick={onClose}
          className="md:hidden flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:text-primary transition-colors"
          aria-label="إغلاق القائمة"
        >
          <XLg size={14} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4">
        {navItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-pill px-4 py-3 text-sm font-medium transition-colors ${isActive
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
      <div className="px-4 pb-6 mt-4">
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
