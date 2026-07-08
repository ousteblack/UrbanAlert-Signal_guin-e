import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaHardHat, FaCheckCircle, FaUsers, FaMapMarked } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import api from "../../services/api";

export default function StatsSection() {
  const { t } = useTranslation();
  const [statsData, setStatsData] = useState({
    resolved: 0,
    reports: 0,
    users: 0,
    zones: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/incidents');
        const incidents = res.data;
        
        const resolved = incidents.filter(i => i.status?.toLowerCase() === 'résolu').length;
        const reports = incidents.length;
        
        // Citoyens uniques basés sur l'email de l'auteur
        const uniqueUsers = new Set(incidents.map(i => i.authorEmail)).size;
        
        // Estimation des zones couvertes (en regroupant les coordonnées à 2 décimales, env. 1km)
        const uniqueZones = new Set(incidents.map(i => {
          return `${Number(i.lat).toFixed(2)},${Number(i.lng).toFixed(2)}`;
        })).size;

        setStatsData({
          resolved,
          reports,
          users: uniqueUsers,
          zones: uniqueZones
        });
      } catch (err) {
        console.error("Erreur lors de la récupération des statistiques en temps réel", err);
      }
    };
    
    fetchStats();
    
    // Optionnel : Mettre à jour toutes les 30 secondes pour un effet "temps réel" continu
    const intervalId = setInterval(fetchStats, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const stats = [
    { id: 1, label: t('home.stats_resolved'), value: statsData.resolved, icon: <FaCheckCircle />, color: "text-success" },
    { id: 2, label: t('home.stats_reports'), value: statsData.reports, icon: <FaHardHat />, color: "text-warning" },
    { id: 3, label: t('home.stats_users'), value: statsData.users, icon: <FaUsers />, color: "text-primary-light" },
    { id: 4, label: t('home.stats_zones'), value: statsData.zones, icon: <FaMapMarked />, color: "text-accent" },
  ];

  return (
    <section className="py-16 bg-slate-50 relative -mt-10 z-20">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-surface rounded-2xl p-6 shadow-xl border border-slate-100 flex flex-col items-center text-center transform hover:-translate-y-1 transition-transform"
            >
              <div className={`text-4xl mb-4 ${stat.color}`}>
                {stat.icon}
              </div>
              <motion.div 
                key={stat.value} // Force l'animation à chaque changement de valeur
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-3xl font-bold text-text-main mb-1"
              >
                {stat.value}
              </motion.div>
              <div className="text-sm font-medium text-text-muted">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
