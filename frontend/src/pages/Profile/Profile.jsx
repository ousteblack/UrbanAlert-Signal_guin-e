import { useAuth } from "../../context/AuthContext";
import { useGamification } from "../../context/GamificationContext";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { FaUserCircle, FaEnvelope, FaPhone, FaTrophy, FaStar } from "react-icons/fa";

export default function Profile() {
  const { user } = useAuth();
  const { points, badge } = useGamification();

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Navbar />
      <main className="flex-1 py-32 px-4 max-w-4xl mx-auto w-full">
        <div className="bg-surface rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 rounded-full bg-primary text-white flex items-center justify-center text-5xl font-bold shadow-lg">
              {user.fullname ? user.fullname.substring(0, 2).toUpperCase() : 'AM'}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-text-main mb-2">{user.fullname}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-text-muted mb-4">
                <div className="flex items-center gap-2">
                  <FaEnvelope className="text-slate-400" /> {user.email}
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2">
                    <FaPhone className="text-slate-400" /> {user.phone}
                  </div>
                )}
              </div>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full font-bold">
                <FaTrophy /> {badge}
              </div>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-100 dark:border-slate-800 text-center">
              <FaStar className="text-4xl text-amber-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-text-main mb-1">Points d'engagement</h3>
              <p className="text-4xl font-extrabold text-primary">{points}</p>
            </div>
            {/* Autres statistiques futures */}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
