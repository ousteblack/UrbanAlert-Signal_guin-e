import { Link, useLocation } from "react-router-dom";
import { FaHome, FaChartPie, FaExclamationCircle, FaUserCircle, FaSignOutAlt, FaMapMarkedAlt, FaSun, FaMoon } from "react-icons/fa";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar() {
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const menuItems = [
    { name: t('sidebar.dashboard'), path: "/dashboard", icon: <FaChartPie /> },
    { name: t('sidebar.reports'), path: isAdmin ? "/reports" : "/my-reports", icon: <FaExclamationCircle /> },
    { name: t('sidebar.profile'), path: "/profile", icon: <FaUserCircle /> },
  ];

  return (
    <>
      <aside className="hidden md:flex w-64 bg-slate-900 text-white min-h-screen flex-col fixed left-0 top-0 z-50">
      <div className="p-6 border-b border-slate-800">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-primary text-white p-2 rounded-lg group-hover:bg-accent transition-colors">
            <FaMapMarkedAlt className="text-xl" />
          </div>
          <span className="text-2xl font-bold tracking-tight">
            Signal_<span className="text-accent">guinee</span>
          </span>
        </Link>
      </div>

      <div className="flex-1 py-6 px-4">
        <div className="text-xs uppercase text-text-muted font-bold mb-4 tracking-wider">{t('sidebar.navigation')}</div>
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
        
        <div className="text-xs uppercase text-text-muted font-bold mb-4 mt-8 tracking-wider">{t('sidebar.public')}</div>
        <ul className="space-y-2">
          <li>
            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <span className="text-lg"><FaHome /></span>
              {t('sidebar.back_home')}
            </Link>
          </li>
          <li>
            <Link
              to="/report"
              className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-accent hover:text-white hover:bg-accent/20 border border-transparent hover:border-accent/30 transition-colors"
            >
              <span className="text-lg"><FaExclamationCircle /></span>
              {t('sidebar.report_incident')}
            </Link>
          </li>
        </ul>
      </div>

      <div className="p-4 border-t border-slate-800 flex flex-col gap-2">
        <button 
          onClick={toggleTheme}
          className="flex items-center justify-between px-4 py-3 w-full text-left rounded-lg font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <span className="flex items-center gap-3">
            <span className="text-lg">{isDarkMode ? <FaSun /> : <FaMoon />}</span>
            {isDarkMode ? t('sidebar.light_mode') : t('sidebar.dark_mode')}
          </span>
        </button>
        <button className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg font-medium text-slate-400 hover:text-danger hover:bg-danger/10 transition-colors">
          <span className="text-lg"><FaSignOutAlt /></span>
          {t('sidebar.logout')}
        </button>
      </div>
    </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 text-white flex justify-around items-center h-16 z-50 border-t border-slate-800">
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full ${
                isActive ? "text-primary-light" : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="text-xl mb-1">{item.icon}</span>
            </Link>
          );
        })}
        <Link
          to="/report"
          className="flex flex-col items-center justify-center w-full h-full text-accent hover:text-white"
        >
          <span className="text-xl mb-1"><FaExclamationCircle /></span>
        </Link>
      </nav>
    </>
  );
}
