import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaSearch, FaMapMarkerAlt, FaCalendarAlt, FaArrowRight,
  FaSpinner, FaLeaf, FaShieldAlt, FaTrophy, FaHeart,
  FaCheckCircle, FaClock, FaFire, FaPlusCircle, FaBan,
  FaExclamationCircle
} from "react-icons/fa";
import { motion } from "framer-motion";
import Sidebar from "../../components/layout/Sidebar";
import Footer from "../../components/layout/Footer";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

// ─── Composant : Badge de statut ──────────────────────────────────────────────
function StatusBadge({ status, flaggedAsFake }) {
  if (flaggedAsFake)
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-red-100 text-red-700 border border-red-200">
        <FaBan /> Rejeté
      </span>
    );
  const s = status?.toLowerCase();
  if (s === "résolu")
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
        <FaCheckCircle /> Résolu
      </span>
    );
  if (s === "en cours")
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
        <FaFire /> En cours
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
      <FaClock /> En attente
    </span>
  );
}

// ─── Composant : Barre de progression du signalement ─────────────────────────
function ProgressTracker({ status }) {
  const s = status?.toLowerCase();
  const steps = [
    { label: "Reçu", done: true },
    { label: "En cours", done: s === "en cours" || s === "résolu" },
    { label: "Résolu", done: s === "résolu" },
  ];
  return (
    <div className="flex items-center w-full mt-4">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                step.done
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : "bg-slate-100 border-slate-300 text-slate-400"
              }`}
            >
              {step.done ? "✓" : i + 1}
            </div>
            <span className={`text-[10px] mt-1 font-semibold ${step.done ? "text-emerald-600" : "text-slate-400"}`}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 mb-4 rounded transition-all duration-300 ${steps[i + 1].done ? "bg-emerald-400" : "bg-slate-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Composant : Carte de signalement citoyen ────────────────────────────────
function CitizenIncidentCard({ incident, index }) {
  const isFlagged = incident.flaggedAsFake === true;

  const categoryColors = {
    "Infrastructures": "from-blue-500 to-indigo-600",
    "Éclairage":       "from-amber-400 to-orange-500",
    "Propreté":        "from-emerald-500 to-teal-600",
    "Espaces verts":   "from-green-500 to-emerald-600",
    "Sécurité":        "from-red-500 to-rose-600",
    "Autre":           "from-slate-500 to-slate-600",
  };
  const gradient = isFlagged
    ? "from-red-400 to-red-600"
    : (categoryColors[incident.category] || "from-primary to-primary-dark");

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={`rounded-2xl shadow-sm border overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col ${
        isFlagged
          ? "border-red-200 bg-red-50/40 dark:bg-red-900/10"
          : "border-slate-100 dark:border-slate-800 bg-surface"
      }`}
    >
      {/* Bande colorée en haut */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />

      <div className="p-5 flex flex-col flex-1">
        {/* Alerte rejet visible pour le citoyen */}
        {isFlagged && (
          <div className="mb-4 flex items-start gap-2 bg-red-100 border border-red-200 rounded-xl p-3">
            <FaBan className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-700">Signalement rejeté par l'administration</p>
              {incident.flagReason && (
                <p className="text-xs text-red-600 mt-0.5">Motif : {incident.flagReason}</p>
              )}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <span className={`text-xs font-bold uppercase tracking-wider bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
            {incident.category}
          </span>
          <StatusBadge status={incident.status} flaggedAsFake={isFlagged} />
        </div>

        {/* Titre */}
        <h3 className="text-lg font-bold text-text-main mb-1 line-clamp-1">
          <span className="text-slate-400 text-sm font-normal">#{incident.id} · </span>
          {incident.type}
        </h3>

        {/* Description */}
        <p className="text-text-muted text-sm mb-4 flex-1 line-clamp-2 leading-relaxed">
          {incident.desc}
        </p>

        {/* Progression (cachée si rejeté) */}
        {!isFlagged && <ProgressTracker status={incident.status} />}

        {/* Réponse de l'admin directement sur la carte */}
        {incident.adminReply && (
          <div className="mt-4 bg-primary/10 border-l-4 border-primary p-3 rounded-r-xl">
            <h4 className="text-[10px] font-bold text-primary uppercase mb-1">Message de l'Administration :</h4>
            <p className="text-xs text-text-main line-clamp-2 italic">"{incident.adminReply}"</p>
          </div>
        )}

        {/* Meta */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <FaMapMarkerAlt className="text-slate-400 flex-shrink-0" />
            <span className="truncate">{incident.location}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <FaCalendarAlt className="text-slate-400 flex-shrink-0" />
            <span>{incident.date}</span>
          </div>
        </div>

        {/* Boutons d'actions */}
        {isFlagged ? (
          <div className="mt-4 flex gap-2 w-full">
            <Link
              to={`/reports/${incident.id}`}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs text-center transition-all duration-300"
            >
              Détails
            </Link>
            <Link
              to={`/report?edit=${incident.id}`}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-xs text-center transition-all duration-300 shadow-sm"
            >
              Corriger
            </Link>
          </div>
        ) : (
          <Link
            to={`/reports/${incident.id}`}
            className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-gradient-to-r hover:from-primary hover:to-primary-dark hover:text-white text-primary font-semibold text-sm transition-all duration-300 group"
          >
            Voir le détail <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>
    </motion.div>
  );
}

// ─── Page principale : Mes Signalements ──────────────────────────────────────
export default function MyReports() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("tous");
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const filters = [
    { key: "tous",      label: "Tous",        icon: <FaHeart /> },
    { key: "nouveau",   label: "En attente",  icon: <FaClock /> },
    { key: "en cours",  label: "En cours",    icon: <FaFire /> },
    { key: "résolu",    label: "Résolus",     icon: <FaCheckCircle /> },
    { key: "rejeté",    label: "Rejetés",     icon: <FaBan /> },
  ];

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const url = `/incidents/user/${user?.email || "anonyme"}`;
        const res = await api.get(url);

        const statusWeight = (inc) => {
          if (inc.flaggedAsFake) return 5;
          const s = inc.status?.toLowerCase();
          if (s === "nouveau" || s === "en attente") return 1;
          if (s === "en cours") return 2;
          if (s === "résolu") return 3;
          return 4;
        };

        const sorted = res.data.sort((a, b) => {
          const wA = statusWeight(a);
          const wB = statusWeight(b);
          if (wA !== wB) return wA - wB;
          return b.id - a.id;
        });

        const mapped = sorted.map((inc) => {
          let formattedDate = "N/A";
          if (inc.createdAt) {
            const d = new Date(inc.createdAt);
            formattedDate =
              d.toLocaleDateString("fr-FR") +
              " à " +
              d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
          } else if (inc.date) {
            formattedDate = inc.date;
          }
          return {
            id:           inc.id,
            type:         inc.type || inc.category || "Autre",
            location:     inc.location || "Coordonnées GPS",
            date:         formattedDate,
            status:       inc.status,
            category:     inc.category || inc.type || "Général",
            desc:         inc.description || "Aucune description fournie.",
            flaggedAsFake: inc.flaggedAsFake,
            flagReason:   inc.flagReason,
          };
        });

        setIncidents(mapped);
      } catch (err) {
        console.error("Erreur chargement signalements", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchIncidents();
  }, [user?.email]);

  // Statistiques rapides
  const total    = incidents.length;
  const resolved = incidents.filter((i) => !i.flaggedAsFake && i.status?.toLowerCase() === "résolu").length;
  const pending  = incidents.filter((i) => {
    if (i.flaggedAsFake) return false;
    const s = i.status?.toLowerCase();
    return s === "nouveau" || s === "en attente";
  }).length;
  const inProgress = incidents.filter((i) => !i.flaggedAsFake && i.status?.toLowerCase() === "en cours").length;
  const rejected = incidents.filter((i) => i.flaggedAsFake).length;

  // Filtrage
  const filtered = incidents.filter((inc) => {
    let matchFilter = false;
    if (activeFilter === "tous") {
      matchFilter = true;
    } else if (activeFilter === "rejeté") {
      matchFilter = inc.flaggedAsFake === true;
    } else {
      if (inc.flaggedAsFake) {
        matchFilter = false;
      } else {
        const s = inc.status?.toLowerCase() || "";
        if (activeFilter === "nouveau") matchFilter = s === "nouveau" || s === "en attente";
        else matchFilter = s === activeFilter;
      }
    }

    const matchSearch =
      inc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.desc.toLowerCase().includes(searchTerm.toLowerCase());
      
    return matchFilter && matchSearch;
  });

  const firstName = user?.fullname?.split(" ")[0] || "Citoyen";

  return (
    <div className="min-h-screen flex bg-background font-sans">
      <Sidebar />
      <div className="flex-1 md:ml-64 w-full flex flex-col">
      {/* ── HERO SECTION ─────────────────────────────────────────── */}
      <section className="relative pt-32 pb-16 px-4 overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-indigo-900">
        {/* Cercles décoratifs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 text-sm font-medium px-4 py-2 rounded-full mb-6 border border-white/20">
              <FaLeaf className="text-emerald-400" />
              Votre espace citoyen
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
              Bonjour, <span className="text-accent">{firstName}</span> 👋
            </h1>

            <p className="text-lg text-white/80 max-w-2xl leading-relaxed mb-8">
              Chaque signalement que vous faites est un <strong className="text-white">acte civique</strong> qui
              améliore la qualité de vie de toute la communauté. Ici, vous pouvez suivre
              l'avancement de vos signalements et voir l'impact concret de vos actions sur votre ville.
            </p>

            {/* Stats rapides */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total envoyés",  value: total,      icon: <FaShieldAlt />,   color: "from-white/20 to-white/10" },
                { label: "En attente",     value: pending,    icon: <FaClock />,        color: "from-blue-400/30 to-blue-500/20" },
                { label: "En traitement",  value: inProgress, icon: <FaFire />,         color: "from-amber-400/30 to-amber-500/20" },
                { label: "Résolus 🎉",     value: resolved,   icon: <FaTrophy />,       color: "from-emerald-400/30 to-emerald-500/20" },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className={`bg-gradient-to-br ${stat.color} backdrop-blur-sm rounded-2xl p-4 border border-white/10`}
                >
                  <div className="text-white/70 text-lg mb-1">{stat.icon}</div>
                  <div className="text-3xl font-extrabold text-white">{stat.value}</div>
                  <div className="text-xs text-white/70 font-medium mt-0.5">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── MESSAGE MOTIVANT (si aucun signalement) ──────────────── */}
      {/* ── CONTENU PRINCIPAL ────────────────────────────────────── */}
      <main className="flex-1 py-12 px-4 max-w-6xl mx-auto w-full">

        {/* Barre de recherche + filtres */}
        <div className="bg-surface rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-5 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <FaSearch className="absolute left-4 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher parmi vos signalements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-background border border-slate-200 dark:border-slate-700 rounded-xl text-text-main focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm"
              />
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap gap-2 justify-center md:justify-end">
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                    activeFilter === f.key
                      ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                      : "bg-background text-text-muted border-slate-200 dark:border-slate-700 hover:border-primary/40"
                  }`}
                >
                  {f.icon} {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Résultats */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-text-muted">
            <FaSpinner className="text-4xl text-primary animate-spin mb-4" />
            <p className="font-medium">Chargement de vos signalements...</p>
          </div>
        ) : incidents.length === 0 ? (
          /* ── ÉTAT VIDE : aucun signalement ──────────────────────── */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-4xl mb-6">
              <FaLeaf />
            </div>
            <h2 className="text-2xl font-bold text-text-main mb-3">
              Vous n'avez pas encore signalé d'incident
            </h2>
            <p className="text-text-muted max-w-md mb-2 leading-relaxed">
              Votre regard sur la ville compte. En signalant un problème — qu'il s'agisse
              d'une route abîmée, d'un lampadaire défectueux ou d'un dépôt sauvage — vous
              devenez un <strong>acteur du changement</strong>.
            </p>
            <p className="text-text-muted max-w-md mb-8 leading-relaxed">
              La mairie reçoit directement votre signalement et vous tient informé de son
              avancement. <span className="text-primary font-semibold">Ensemble, construisons une ville plus belle.</span>
            </p>
            <Link
              to="/report"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-primary to-primary-dark text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              <FaPlusCircle className="text-lg" />
              Faire mon premier signalement
            </Link>
          </motion.div>
        ) : filtered.length === 0 ? (
          /* ── ÉTAT VIDE : aucun résultat de filtre ───────────────── */
          <div className="flex flex-col items-center justify-center py-20 text-center text-text-muted">
            <FaSearch className="text-5xl text-slate-200 mb-4" />
            <h3 className="text-xl font-bold text-text-main mb-2">Aucun résultat</h3>
            <p>Essayez un autre filtre ou terme de recherche.</p>
          </div>
        ) : (
          <>
            {/* Compteur */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-text-muted text-sm font-medium">
                <span className="text-text-main font-bold text-base">{filtered.length}</span>
                {" "}signalement{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}
              </p>
              <Link
                to="/report"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
              >
                <FaPlusCircle /> Nouveau signalement
              </Link>
            </div>

            {/* Grille de cartes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((incident, i) => (
                <CitizenIncidentCard key={incident.id} incident={incident} index={i} />
              ))}
            </div>

            {/* Message d'encouragement en bas */}
            {resolved > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-12 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 text-center"
              >
                <FaTrophy className="text-3xl text-emerald-500 mx-auto mb-3" />
                <p className="font-bold text-text-main text-lg mb-1">
                  Bravo ! {resolved} de vos signalement{resolved > 1 ? "s ont" : " a"} été résolu{resolved > 1 ? "s" : ""}.
                </p>
                <p className="text-text-muted text-sm max-w-md mx-auto">
                  Grâce à vous, la ville s'améliore jour après jour. Continuez à signaler les problèmes
                  que vous observez — chaque action compte pour rendre Conakry plus belle et plus sûre.
                </p>
              </motion.div>
            )}
          </>
        )}
      </main>

      <Footer />
      </div>
    </div>
  );
}
