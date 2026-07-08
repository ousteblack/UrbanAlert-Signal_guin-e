import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaBars, FaTimes, FaMapMarkedAlt, FaSun, FaMoon } from "react-icons/fa";
import Button from "../ui/Button";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "fr" ? "en" : "fr");
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isAdmin = user && user.role === 'ADMIN';
  
  const navLinks = [
    { name: t("nav.home"), path: "/" },
    { name: "Mon Espace", path: "/dashboard" },
  ];

  const visibleLinks = navLinks;


  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[9999] transition-all duration-300 ${
        isScrolled
          ? "glassmorphism dark:glassmorphism-dark py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-6 md:px-12 flex justify-between items-center gap-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="bg-primary text-white p-2 rounded-lg group-hover:bg-accent transition-colors">
            <FaMapMarkedAlt className="text-xl" />
          </div>
          <span className={`text-2xl font-bold tracking-tight transition-colors ${isScrolled ? "text-primary dark:text-white" : "text-white"}`}>
            Signal_<span className="text-accent">guinee</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <ul className="flex items-center gap-6">
            {visibleLinks.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.path}
                  className={`font-medium hover:text-accent transition-colors ${
                    isScrolled ? "text-text-main dark:text-slate-300" : "text-white/90"
                  }`}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleLanguage}
              className={`font-bold text-sm px-2 py-1 rounded transition-colors ${isScrolled ? "text-text-muted dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800" : "text-white hover:bg-surface/10"}`}
            >
              {(i18n.language || 'fr').toUpperCase()}
            </button>
            <button 
              onClick={toggleTheme} 
              className={`p-2 rounded-full transition-colors ${isScrolled ? "text-text-muted dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800" : "text-white hover:bg-surface/10"}`}
            >
              {isDarkMode ? <FaSun /> : <FaMoon />}
            </button>
            {user ? (
              <button
                onClick={logout}
                className={`font-medium transition-colors hover:text-accent ${
                  isScrolled ? "text-danger dark:text-red-400" : "text-red-300"
                }`}
              >
                Déconnexion
              </button>
            ) : (
              <Link
                to="/login"
                className={`font-medium transition-colors hover:text-accent ${
                  isScrolled ? "text-primary dark:text-white" : "text-white"
                }`}
              >
                {t("nav.login")}
              </Link>
            )}
            {!isAdmin && (
              <Link to="/report">
                <Button variant="accent" size="sm">
                  {t("nav.report")}
                </Button>
              </Link>
            )}
          </div>
        </nav>

        {/* Mobile Menu Toggle & Theme Toggle */}
        <div className="md:hidden flex items-center gap-4">
          <button 
            onClick={toggleLanguage}
            className={`font-bold text-sm px-2 py-1 rounded transition-colors ${isScrolled ? "text-text-muted dark:text-slate-300" : "text-white"}`}
          >
            {(i18n.language || 'fr').toUpperCase()}
          </button>
          <button 
            onClick={toggleTheme} 
            className={`p-2 rounded-full transition-colors ${isScrolled ? "text-text-muted dark:text-slate-300" : "text-white"}`}
          >
            {isDarkMode ? <FaSun /> : <FaMoon />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`text-2xl transition-colors ${
              isScrolled ? "text-primary dark:text-white" : "text-white"
            }`}
          >
            {mobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <div
        className={`md:hidden absolute top-full left-0 right-0 bg-surface dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xl transition-all duration-300 overflow-hidden ${
          mobileMenuOpen ? "max-h-96 py-4" : "max-h-0 py-0 border-transparent dark:border-transparent"
        }`}
      >
        <nav className="container mx-auto px-6 flex flex-col gap-4">
          {visibleLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg font-medium text-text-main dark:text-slate-200 hover:text-primary transition-colors"
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-3">
            {user ? (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="inline-flex items-center justify-center w-full px-6 py-3 bg-red-100 dark:bg-red-900/30 text-danger dark:text-red-400 font-semibold rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
              >
                Déconnexion
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center justify-center w-full px-6 py-3 bg-slate-100 dark:bg-slate-800 text-text-main dark:text-white font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                {t("nav.login")}
              </Link>
            )}

            {!isAdmin && (
              <Link
                to="/report"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center justify-center w-full px-6 py-3 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-all"
              >
                {t("nav.report")}
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
