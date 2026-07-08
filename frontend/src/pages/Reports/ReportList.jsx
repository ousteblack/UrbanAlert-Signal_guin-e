import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaSearch, FaFilter, FaMapMarkerAlt, FaCalendarAlt, FaArrowRight, FaSpinner, FaBan, FaExclamationTriangle } from "react-icons/fa";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import Card from "../../components/ui/Card";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function ReportList() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Analyse automatique de suspicion
  const getSuspicionLevel = (inc) => {
    let count = 0;
    const desc = inc.desc || "";
    const words = desc.trim().split(/\s+/).filter(Boolean);
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    if (desc.trim().length > 0 && desc.trim().length < 15) count++;
    if (words.length >= 3 && uniqueWords.size === 1) count++;
    if (!inc.photoUrl) count++;
    if (inc.location && inc.location.startsWith("GPS:")) count++;
    if (desc.trim().length > 0 && /^[\d\s\W]+$/.test(desc.trim())) count++;
    return count;
  };
  
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState(t('map.filter_all'));
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const categories = [
    t('map.filter_all'), 
    t('map.filter_infra'), 
    t('map.filter_clean'), 
    t('map.filter_light'), 
    t('map.filter_green'), 
    t('map.filter_sec')
  ];

  const categoryMapping = {
    [t('map.filter_infra')]: "Infrastructures",
    [t('map.filter_clean')]: "Propreté",
    [t('map.filter_light')]: "Éclairage",
    [t('map.filter_green')]: "Espaces verts",
    [t('map.filter_sec')]: "Sécurité"
  };

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const url = isAdmin ? "/incidents" : `/incidents/user/${user?.email || 'anonyme'}`;
        const res = await api.get(url);
        const statusWeight = (status) => {
          const s = status?.toLowerCase();
          if (s === 'nouveau' || s === 'en attente') return 1;
          if (s === 'en cours') return 2;
          if (s === 'résolu') return 3;
          return 4;
        };
        const sorted = res.data.sort((a, b) => {
          const wA = statusWeight(a.status);
          const wB = statusWeight(b.status);
          if (wA !== wB) return wA - wB;
          return b.id - a.id;
        });
        
        const mapped = sorted.map(inc => {
          let formattedDate = "N/A";
          if (inc.createdAt) {
            const d = new Date(inc.createdAt);
            formattedDate = d.toLocaleDateString('fr-FR') + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          } else if (inc.date) {
            formattedDate = inc.date;
          }

          return {
            id: inc.id,
            type: inc.type || inc.category || "Autre",
            location: inc.location || "Coordonnées GPS",
            date: formattedDate,
            status: inc.status,
            category: inc.category || inc.type || "Général",
            desc: inc.description || "Aucune description",
            photoUrl: inc.photoUrl,
            audioUrl: inc.audioUrl,
            flaggedAsFake: inc.flaggedAsFake,
            flagReason: inc.flagReason,
          };
        });
        
        setIncidents(mapped);
      } catch (err) {
        console.error("Failed to load from backend", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchIncidents();
  }, [isAdmin, user?.email]);

  const filteredIncidents = incidents.filter(incident => 
    (activeCategory === t('map.filter_all') || incident.category === categoryMapping[activeCategory]) &&
    (incident.type.toLowerCase().includes(searchTerm.toLowerCase()) || incident.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleStatusChange = async (incidentId, newStatus) => {
    try {
      await api.put(`/incidents/${incidentId}/status`, { status: newStatus });
      setIncidents(prev => prev.map(inc => 
        inc.id === incidentId ? { ...inc, status: newStatus } : inc
      ));
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut", error);
      alert("Erreur lors de la mise à jour du statut");
    }
  };

  const renderStatus = (incident) => {
    const s = incident.status?.toLowerCase();
    
    if (isAdmin) {
      return (
        <div className="flex flex-col sm:flex-row gap-1">
          <button 
            onClick={() => handleStatusChange(incident.id, 'en attente')}
            className={`px-2 py-1 text-[10px] sm:text-xs font-bold rounded-md transition-colors ${s === 'nouveau' || s === 'en attente' ? 'bg-red-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            {t('dashboard.status_new')}
          </button>
          <button 
            onClick={() => handleStatusChange(incident.id, 'en cours')}
            className={`px-2 py-1 text-[10px] sm:text-xs font-bold rounded-md transition-colors ${s === 'en cours' ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            {t('dashboard.status_progress')}
          </button>
          <button 
            onClick={() => handleStatusChange(incident.id, 'résolu')}
            className={`px-2 py-1 text-[10px] sm:text-xs font-bold rounded-md transition-colors ${s === 'résolu' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            {t('dashboard.status_resolved')}
          </button>
        </div>
      );
    }

    let colorClass = "bg-slate-100 text-text-muted";
    if (s === "nouveau" || s === "en attente") colorClass = "bg-danger/10 text-danger border-danger/20";
    else if (s === "en cours") colorClass = "bg-warning/10 text-warning border-warning/20";
    else if (s === "résolu") colorClass = "bg-success/10 text-success border-success/20";
    
    return (
      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${colorClass}`}>
        {incident.status}
      </span>
    );
  };



  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-4xl font-bold text-text-main mb-4">{t('reports.title')}</h1>
          <p className="text-xl text-text-muted max-w-2xl">
            {t('reports.subtitle')}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            
            <div className="relative w-full md:w-96">
              <FaSearch className="absolute left-4 top-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder={t('reports.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-background border border-slate-200 dark:border-slate-700 rounded-xl text-text-main focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              />
            </div>

            <div className="flex flex-wrap gap-2 justify-center md:justify-end w-full md:w-auto">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    activeCategory === cat 
                      ? 'bg-primary text-white border-primary shadow-md' 
                      : 'bg-background text-text-muted border-slate-200 dark:border-slate-700 hover:border-primary/50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* List / Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIncidents.length > 0 ? (
            filteredIncidents.map(incident => (
              <Card key={incident.id} hover className={`border shadow-sm h-full flex flex-col ${
                incident.flaggedAsFake
                  ? 'border-red-200 bg-red-50/50 dark:bg-red-900/10'
                  : isAdmin && getSuspicionLevel(incident) >= 2
                  ? 'border-amber-200 bg-amber-50/50 dark:bg-amber-900/10'
                  : 'border-slate-200 dark:border-slate-800 bg-surface'
              }`}>
                <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
                    {incident.category}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {/* Badge faux signalement */}
                    {isAdmin && incident.flaggedAsFake && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
                        <FaBan className="text-[9px]" /> FAUX
                      </span>
                    )}
                    {/* Badge suspect (admin seulement, non flaggé) */}
                    {isAdmin && !incident.flaggedAsFake && getSuspicionLevel(incident) >= 2 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                        <FaExclamationTriangle className="text-[9px]" /> SUSPECT
                      </span>
                    )}
                    {renderStatus(incident)}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-text-main mb-2 line-clamp-1" title={incident.type}>
                  INC-{incident.id} : {incident.type}
                </h3>
                
                <p className="text-text-muted text-sm mb-6 flex-1 line-clamp-2">
                  {incident.desc}
                </p>
                
                <div className="space-y-2 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50">
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <FaMapMarkerAlt className="text-slate-400" />
                    <span className="truncate">{incident.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <FaCalendarAlt className="text-slate-400" />
                    <span>{incident.date}</span>
                  </div>
                </div>
                
                <Link to={`/reports/${incident.id}`} className="mt-6 flex items-center justify-center gap-2 w-full py-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-primary hover:text-white text-primary font-medium rounded-lg transition-colors group">
                  {t('reports.see_details')} <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-20 text-center text-text-muted bg-surface rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
              <FaFilter className="mx-auto text-4xl text-slate-300 mb-4" />
              <h3 className="text-xl font-bold text-text-main mb-2">{t('reports.no_reports')}</h3>
              <p>{t('reports.try_again')}</p>
            </div>
          )}
        </div>

      </main>

      <Footer />
    </div>
  );
}
