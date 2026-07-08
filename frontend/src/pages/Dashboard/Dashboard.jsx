import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FaHardHat, FaCheckCircle, FaExclamationTriangle, FaClock, FaFileCsv, FaFilePdf, FaFileWord, FaChevronDown, FaSms, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../services/api";
import Sidebar from "../../components/layout/Sidebar";
import IncidentChart from "../../components/charts/IncidentChart";
import CategoryChart from "../../components/charts/CategoryChart";
import SeasonalChart from "../../components/charts/SeasonalChart";
import Card from "../../components/ui/Card";
import { useGamification } from "../../context/GamificationContext";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { points, badge } = useGamification();
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [allIncidents, setAllIncidents] = useState([]);

  const total = allIncidents.length;
  const waiting = allIncidents.filter(inc => inc.status?.toLowerCase() === 'nouveau' || inc.status?.toLowerCase() === 'en attente').length;
  const inProgress = allIncidents.filter(inc => inc.status?.toLowerCase() === 'en cours').length;
  const resolved = allIncidents.filter(inc => inc.status?.toLowerCase() === 'résolu').length;

  const kpis = [
    { title: t('dashboard.total'), value: total.toString(), trend: "0%", color: "text-primary-light", bg: "bg-blue-50", icon: <FaExclamationTriangle /> },
    { title: t('dashboard.waiting'), value: waiting.toString(), trend: "0%", color: "text-warning", bg: "bg-amber-50", icon: <FaClock /> },
    { title: t('dashboard.in_progress'), value: inProgress.toString(), trend: "0%", color: "text-accent", bg: "bg-orange-50", icon: <FaHardHat /> },
    { title: t('dashboard.resolved'), value: resolved.toString(), trend: "0%", color: "text-success", bg: "bg-emerald-50", icon: <FaCheckCircle /> },
  ];

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const url = isAdmin ? "/incidents" : `/incidents/user/${user?.email || "anonyme"}`;
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
             ...inc,
             date: formattedDate
          };
        });
        setAllIncidents(mapped);
        setRecentIncidents(mapped.slice(0, 5));
      } catch (err) {
        console.error("Failed to load from backend", err);
        setAllIncidents([]);
        setRecentIncidents([]);
      }
    };
    fetchIncidents();
  }, []);

  const navigate = useNavigate();

  const handleStatusChange = async (incidentId, newStatus) => {
    try {
      await api.put(`/incidents/${incidentId}/status`, { status: newStatus });
      
      // Update local state
      const updateList = (list) => list.map(inc => 
        inc.id === incidentId ? { ...inc, status: newStatus } : inc
      );
      setAllIncidents(updateList);
      setRecentIncidents(prev => updateList(prev));
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut", error);
      alert("Erreur lors de la mise à jour du statut");
    }
  };

  const getStatusBadge = (incident) => {
    const s = incident.status?.toLowerCase();
    
    if (isAdmin) {
      return (
        <div className="flex gap-1">
          <button 
            onClick={() => handleStatusChange(incident.id, 'en attente')}
            className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${s === 'nouveau' || s === 'en attente' ? 'bg-red-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            {t('dashboard.status_new')}
          </button>
          <button 
            onClick={() => handleStatusChange(incident.id, 'en cours')}
            className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${s === 'en cours' ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            {t('dashboard.status_progress')}
          </button>
          <button 
            onClick={() => handleStatusChange(incident.id, 'résolu')}
            className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${s === 'résolu' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            {t('dashboard.status_resolved')}
          </button>
        </div>
      );
    }

    switch (s) {
      case "nouveau":
      case "en attente": 
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">{t('dashboard.status_new')}</span>;
      case "en cours": 
        return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">{t('dashboard.status_progress')}</span>;
      case "résolu": 
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">{t('dashboard.status_resolved')}</span>;
      default: return null;
    }
  };

  const downloadCSV = () => {
    const headers = ["ID,Type,Localisation,Date,Statut"];
    const rows = allIncidents.map(inc => 
      `${inc.id},${inc.type},"${inc.location}",${inc.date},${inc.status}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "incidents_conakry.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSimulateSms = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const from = formData.get("from");
    const text = formData.get("text");
    try {
      await api.post("/sms/webhook", { from, text });
      toast.success("SMS simulé avec succès !");
      setIsSmsModalOpen(false);
      window.location.reload();
    } catch (err) {
      toast.error("Erreur lors de la simulation du SMS");
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Derniers signalements - Signal_guinee", 14, 15);
    
    const tableColumn = ["ID", "Type", "Localisation", "Date", "Statut"];
    const tableRows = [];

    allIncidents.forEach(inc => {
      const ticketData = [
        `INC-${inc.id}`,
        inc.type || inc.category || "N/A",
        inc.location || "Coordonnées GPS",
        inc.date,
        inc.status
      ];
      tableRows.push(ticketData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save("incidents_conakry.pdf");
  };

  const downloadWord = () => {
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export</title></head><body>";
    const footer = "</body></html>";
    let html = "<h2>Derniers signalements - Signal_guinee</h2><table border='1' style='border-collapse: collapse; width: 100%;'><tr><th>ID</th><th>Type</th><th>Localisation</th><th>Date</th><th>Statut</th></tr>";
    
    allIncidents.forEach(inc => {
      html += `<tr><td>INC-${inc.id}</td><td>${inc.type || inc.category || "N/A"}</td><td>${inc.location || "Coordonnées GPS"}</td><td>${inc.date}</td><td>${inc.status}</td></tr>`;
    });
    html += "</table>";

    const sourceHTML = header + html + footer;
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = 'incidents_conakry.doc';
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <Sidebar />
      
      <main className="flex-1 md:ml-64 p-4 pb-24 md:p-8 md:pb-8 w-full">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-text-main">{t('dashboard.title')}</h1>
            <p className="text-text-muted">{t('dashboard.subtitle')}</p>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <button 
                onClick={() => setIsSmsModalOpen(true)}
                className="hidden sm:flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <FaSms /> Simuler un SMS
              </button>
            )}
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-sm font-bold text-accent">{points} pts</span>
              <span className="text-xs font-medium text-text-muted">{badge}</span>
            </div>
            <div className="text-sm font-medium text-text-muted hidden md:block">Conakry, Guinée</div>
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shadow-md">
              {user?.fullname ? user.fullname.substring(0, 2).toUpperCase() : 'AM'}
            </div>
          </div>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpis.map((kpi, idx) => (
            <Card key={idx} hover className="border-none shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-text-muted mb-1">{kpi.title}</p>
                  <h3 className="text-3xl font-bold text-text-main">{kpi.value}</h3>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${kpi.bg} ${kpi.color}`}>
                  {kpi.icon}
                </div>
              </div>

            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 border-none shadow-sm">
            <h3 className="text-lg font-bold text-text-main mb-6">{t('dashboard.evolution')}</h3>
            <div className="h-72">
              <IncidentChart incidents={allIncidents} />
            </div>
          </Card>
          
          <Card className="border-none shadow-sm">
            <h3 className="text-lg font-bold text-text-main mb-6">{t('dashboard.distribution')}</h3>
            <div className="h-72">
              <CategoryChart incidents={allIncidents} />
            </div>
          </Card>
        </div>

        {/* Seasonal Trends Chart - Admin Only */}
        {isAdmin && (
          <div className="grid grid-cols-1 mb-8">
            <Card className="border-none shadow-sm">
              <h3 className="text-lg font-bold text-text-main mb-6">Tendances Saisonnières (Inondations vs Voirie)</h3>
              <div className="h-72">
                <SeasonalChart incidents={allIncidents} />
              </div>
            </Card>
          </div>
        )}

        {/* Recent Activity Table */}
        <Card className="border-none shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-text-main">{t('dashboard.recent')}</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button 
                  onClick={() => setIsExportOpen(!isExportOpen)}
                  className="flex items-center gap-2 text-sm font-medium px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                >
                  {t('dashboard.export')} <FaChevronDown className={`transition-transform ${isExportOpen ? "rotate-180" : ""}`} />
                </button>
                
                {isExportOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-md shadow-lg z-10 py-1">
                    <button 
                      onClick={() => { downloadCSV(); setIsExportOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <FaFileCsv className="text-emerald-600" /> CSV
                    </button>
                    <button 
                      onClick={() => { downloadPDF(); setIsExportOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <FaFilePdf className="text-red-500" /> PDF
                    </button>
                    <button 
                      onClick={() => { downloadWord(); setIsExportOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <FaFileWord className="text-blue-600" /> Word
                    </button>
                  </div>
                )}
              </div>
              <button onClick={() => navigate(isAdmin ? '/reports' : '/my-reports')} className="text-sm font-medium text-primary hover:text-primary-dark transition-colors ml-2">
                {t('dashboard.see_all')}
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 px-4 text-sm font-semibold text-text-muted">ID</th>
                  <th className="py-3 px-4 text-sm font-semibold text-text-muted">Type</th>
                  <th className="py-3 px-4 text-sm font-semibold text-text-muted">Localisation</th>
                  <th className="py-3 px-4 text-sm font-semibold text-text-muted">Date</th>
                  <th className="py-3 px-4 text-sm font-semibold text-text-muted">Statut</th>
                </tr>
              </thead>
              <tbody>
                {recentIncidents.map((incident) => (
                  <tr key={incident.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 font-medium text-text-main">INC-{incident.id}</td>
                    <td className="py-4 px-4 text-text-muted">{incident.type || incident.category}</td>
                    <td className="py-4 px-4 text-text-muted">{incident.location || "Coordonnées GPS"}</td>
                    <td className="py-4 px-4 text-text-muted text-sm">{incident.date}</td>
                    <td className="py-4 px-4">{getStatusBadge(incident)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      {/* SMS Modal */}
      {isSmsModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button 
              onClick={() => setIsSmsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <FaTimes />
            </button>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Simuler un SMS entrant</h3>
            <p className="text-sm text-slate-500 mb-6">Ceci simulera un webhook envoyé par un fournisseur SMS (ex: Twilio, Orange).</p>
            
            <form onSubmit={handleSimulateSms} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Numéro de téléphone (From)</label>
                <input 
                  type="text" 
                  name="from" 
                  required 
                  placeholder="+224600000000"
                  defaultValue="+224600000000"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message (Text)</label>
                <textarea 
                  name="text" 
                  required 
                  rows="3"
                  placeholder="Ex: Il y a une fuite d'eau au grand marché de Kaloum"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsSmsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-primary text-white font-medium hover:bg-primary-dark rounded-lg flex items-center gap-2"
                >
                  <FaSms /> Envoyer le SMS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
