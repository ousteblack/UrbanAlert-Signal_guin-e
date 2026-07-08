import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { FaFilter, FaSearch, FaTimes, FaSpinner, FaMapMarkerAlt } from "react-icons/fa";
import Navbar from "../../components/layout/Navbar";
import { useTranslation } from "react-i18next";
import api from "../../services/api";
import L from "leaflet";
import { Link } from "react-router-dom";

// Custom Leaflet Icon generator
const createCustomIcon = (status) => {
  let color = "bg-slate-500";
  let ring = "ring-slate-500";
  let animate = "";
  
  const s = status?.toLowerCase() || "";
  if (s === "nouveau" || s === "en attente") {
    color = "bg-red-500";
    ring = "border-red-200";
    animate = "animate-bounce";
  } else if (s === "en cours") {
    color = "bg-amber-500";
    ring = "border-amber-200";
  } else if (s === "résolu") {
    color = "bg-emerald-500";
    ring = "border-emerald-200";
  }

  const html = `
    <div class="relative flex items-center justify-center w-8 h-8">
      <div class="absolute inset-0 rounded-full ${color} opacity-40 animate-ping"></div>
      <div class="relative w-5 h-5 rounded-full border-2 border-white ${color} shadow-lg flex items-center justify-center z-10 ${animate}"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-leaflet-icon bg-transparent border-none",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

export default function MapExplorer() {
  const { t } = useTranslation();
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState(t('map.filter_all'));
  const [activeStatus, setActiveStatus] = useState("Tous");
  
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await api.get("/incidents");
        // Keep only incidents with valid lat/lng and filter out explicitly flagged "fake"
        const validIncidents = res.data.filter(inc => inc.lat != null && inc.lng != null && !inc.flaggedAsFake);
        setIncidents(validIncidents);
      } catch (err) {
        console.error("Failed to load map incidents:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchIncidents();
    // Real-time aspect: poll every 15 seconds
    const intervalId = setInterval(fetchIncidents, 15000);
    return () => clearInterval(intervalId);
  }, []);

  const categories = [
    t('map.filter_all'), 
    t('map.filter_infra'), 
    t('map.filter_clean'), 
    t('map.filter_light'), 
    t('map.filter_green'), 
    t('map.filter_sec')
  ];

  const statuses = ["Tous", "Nouveau", "En cours", "Résolu"];

  const categoryMapping = {
    [t('map.filter_infra')]: "Infrastructures",
    [t('map.filter_clean')]: "Propreté",
    [t('map.filter_light')]: "Éclairage",
    [t('map.filter_green')]: "Espaces verts",
    [t('map.filter_sec')]: "Sécurité"
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchCategory = activeCategory === t('map.filter_all') || incident.type === categoryMapping[activeCategory];
    
    let matchStatus = activeStatus === "Tous";
    if (!matchStatus) {
      const s = incident.status?.toLowerCase() || "";
      if (activeStatus === "Nouveau") matchStatus = s === "nouveau" || s === "en attente";
      else if (activeStatus === "En cours") matchStatus = s === "en cours";
      else if (activeStatus === "Résolu") matchStatus = s === "résolu";
    }

    const matchSearch = incident.type?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        incident.description?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchCategory && matchStatus && matchSearch;
  });

  return (
    <div className="h-screen flex flex-col font-sans">
      <Navbar />
      
      <div className="flex-1 relative pt-20 flex overflow-hidden">
        {/* Mobile Filter Toggle Button */}
        <button 
          onClick={() => setFilterOpen(!filterOpen)}
          className="md:hidden absolute top-24 left-4 z-[400] bg-surface dark:bg-slate-800 p-3 rounded-full shadow-lg text-primary dark:text-white"
        >
          {filterOpen ? <FaTimes /> : <FaFilter />}
        </button>

        {/* Filters Sidebar */}
        <div className={`
          absolute md:relative z-[500] md:z-10 h-full w-80 bg-surface border-r border-slate-200 dark:border-slate-800 shadow-xl md:shadow-none transition-transform duration-300 flex flex-col
          ${filterOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-surface">
            <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
              <FaFilter className="text-primary text-sm" /> {t('map.filters')}
            </h2>
            <button className="md:hidden text-slate-400 hover:text-text-main" onClick={() => setFilterOpen(false)}>
              <FaTimes />
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto bg-surface">
            {/* Search */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-text-main mb-3">{t('map.search_label')}</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-3.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder={t('map.search_placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-slate-200 dark:border-slate-700 rounded-lg text-text-main focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-text-main mb-3">{t('map.categories_label')}</label>
              <div className="space-y-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      activeCategory === cat 
                        ? 'bg-primary/10 text-primary border border-primary/20' 
                        : 'text-text-muted hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Statuses */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-text-main mb-3">Statut</label>
              <div className="space-y-2">
                {statuses.map(stat => (
                  <button
                    key={stat}
                    onClick={() => setActiveStatus(stat)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
                      activeStatus === stat 
                        ? 'bg-slate-800 text-white shadow-md' 
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {stat}
                    {stat === "Nouveau" && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                    {stat === "En cours" && <span className="w-2 h-2 rounded-full bg-amber-500"></span>}
                    {stat === "Résolu" && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800">
            {isLoading ? (
              <p className="text-sm text-text-muted text-center font-medium flex items-center justify-center gap-2">
                <FaSpinner className="animate-spin text-primary" /> Chargement...
              </p>
            ) : (
              <p className="text-sm text-text-muted text-center font-medium">
                <span className="text-primary font-bold">{filteredIncidents.length}</span> signalements trouvés
              </p>
            )}
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 h-full relative z-0">
          <MapContainer 
            center={[9.5350, -13.6773]} 
            zoom={13} 
            className="w-full h-full"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              className="map-tiles"
            />
            {filteredIncidents.map(incident => {
              const s = incident.status?.toLowerCase() || "";
              const isNew = s === "nouveau" || s === "en attente";
              const statusClass = isNew ? "bg-red-100 text-red-700 border-red-200" :
                                  s === "en cours" ? "bg-amber-100 text-amber-700 border-amber-200" :
                                  "bg-emerald-100 text-emerald-700 border-emerald-200";

              return (
                <Marker 
                  key={incident.id} 
                  position={[incident.lat, incident.lng]}
                  icon={createCustomIcon(incident.status)}
                >
                  <Popup className="custom-popup rounded-2xl overflow-hidden border-0 shadow-2xl p-0">
                    <div className="font-sans min-w-[200px]">
                      {incident.photoUrl && (
                        <div className="h-24 w-full bg-slate-100 -mt-4 -mx-4 mb-3 border-b border-slate-200">
                          <img src={incident.photoUrl} alt="Aperçu" className="w-full h-full object-cover" />
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {incident.type}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusClass}`}>
                          {incident.status}
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-slate-800 text-sm mb-2 line-clamp-2">
                        {incident.description || "Signalement sans description"}
                      </h3>
                      
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                        <FaMapMarkerAlt className="text-slate-400" />
                        <span className="truncate">{incident.location || "Coordonnées GPS"}</span>
                      </div>
                      
                      <Link 
                        to={`/reports/${incident.id}`} 
                        className="block w-full text-center bg-slate-100 hover:bg-primary hover:text-white text-primary text-xs font-bold py-2 rounded-lg transition-colors"
                      >
                        Voir les détails
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

