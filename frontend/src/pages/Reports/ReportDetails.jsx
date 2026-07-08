import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FaArrowLeft, FaMapMarkerAlt, FaCalendarAlt, FaUser,
  FaImage, FaExclamationTriangle, FaBan, FaFlag,
  FaShieldAlt, FaUndo, FaCheckCircle,
} from "react-icons/fa";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import Card from "../../components/ui/Card";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

// ─── Analyse automatique de suspicion ────────────────────────────────────────
function analyzeSuspicion(incident) {
  const warnings = [];
  const desc = incident.description || "";
  const words = desc.trim().split(/\s+/).filter(Boolean);

  // 1. Description trop courte
  if (desc.trim().length > 0 && desc.trim().length < 15) {
    warnings.push("Description trop courte (moins de 15 caractères).");
  }

  // 2. Texte répétitif (ex: "aaa", "zzz", mêmes mots répétés)
  const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
  if (words.length >= 3 && uniqueWords.size === 1) {
    warnings.push("Texte répétitif ou sans sens apparent.");
  }

  // 3. Aucune photo jointe
  if (!incident.photoUrl) {
    warnings.push("Aucune photo jointe pour appuyer le signalement.");
  }

  // 4. Localisation GPS uniquement, pas de lieu précis
  if (incident.location && incident.location.startsWith("GPS:")) {
    warnings.push("Localisation uniquement GPS, sans adresse précise.");
  }

  // 5. Description uniquement en chiffres ou caractères spéciaux
  if (desc.trim().length > 0 && /^[\d\s\W]+$/.test(desc.trim())) {
    warnings.push("Description composée uniquement de chiffres ou symboles.");
  }

  return warnings;
}

// ─── Composant : Panneau d'alerte de suspicion (admin uniquement) ─────────────
function SuspicionPanel({ warnings }) {
  if (warnings.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <FaExclamationTriangle className="text-amber-500 text-lg flex-shrink-0" />
        <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wide">
          ⚠ Indicateurs de suspicion détectés
        </h3>
      </div>
      <ul className="space-y-1.5">
        {warnings.map((w, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
            <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
            {w}
          </li>
        ))}
      </ul>
      <p className="text-xs text-amber-600 mt-3 italic">
        Ces indicateurs sont automatiques et ne confirment pas que le signalement est faux.
        Vérifiez et décidez ci-dessous.
      </p>
    </div>
  );
}

// ─── Composant : Panneau de marquage "Faux signalement" (admin) ───────────────
function FlagPanel({ incident, onFlagChange }) {
  const [showForm, setShowForm] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFlagged = incident.flaggedAsFake === true;

  const handleFlag = async (e) => {
    e.preventDefault();
    if (!flagReason.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await api.put(`/incidents/${incident.id}/flag`, {
        flaggedAsFake: "true",
        flagReason: flagReason.trim(),
      });
      onFlagChange(res.data);
      setShowForm(false);
      setFlagReason("");
    } catch (err) {
      console.error(err);
      alert("Erreur lors du marquage.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnflag = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir lever le signalement frauduleux ?")) return;
    setIsSubmitting(true);
    try {
      const res = await api.put(`/incidents/${incident.id}/flag`, {
        flaggedAsFake: "false",
        flagReason: "",
      });
      onFlagChange(res.data);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la levée du flag.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isFlagged) {
    return (
      <div className="mt-6 pt-6 border-t border-red-100">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <FaBan className="text-red-500 text-xl" />
            <h3 className="font-bold text-red-700">Signalement marqué comme FAUX</h3>
          </div>
          <p className="text-sm text-red-600 mb-1">
            <span className="font-semibold">Raison :</span> {incident.flagReason || "Non précisée"}
          </p>
          <p className="text-xs text-red-400 mb-4 italic">
            Le citoyen a été notifié que son rapport a été rejeté.
          </p>
          <button
            onClick={handleUnflag}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <FaUndo /> Lever le rejet (remettre en évaluation)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors"
        >
          <FaFlag /> Marquer comme faux signalement
        </button>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <h3 className="font-bold text-red-700 mb-3 flex items-center gap-2">
            <FaBan /> Confirmer le rejet du signalement
          </h3>
          <form onSubmit={handleFlag} className="space-y-3">
            <div>
              <label className="text-sm font-medium text-red-700 block mb-1">
                Raison du rejet <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-red-200 bg-white text-sm text-slate-700 focus:ring-2 focus:ring-red-300 outline-none mb-2"
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
              >
                <option value="">-- Sélectionner une raison --</option>
                <option value="Description vide ou sans sens">Description vide ou sans sens</option>
                <option value="Signalement doublon (déjà signalé)">Signalement doublon (déjà signalé)</option>
                <option value="Localisation introuvable ou incorrecte">Localisation introuvable ou incorrecte</option>
                <option value="Contenu abusif ou inapproprié">Contenu abusif ou inapproprié</option>
                <option value="Incident inexistant après vérification sur le terrain">Incident inexistant après vérification</option>
                <option value="Signalement de mauvaise foi répété">Signalement de mauvaise foi répété</option>
              </select>
              <textarea
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="Ou précisez une raison personnalisée..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-red-200 bg-white text-sm text-slate-700 focus:ring-2 focus:ring-red-300 outline-none resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting || !flagReason.trim()}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <FaBan /> {isSubmitting ? "Envoi..." : "Confirmer le rejet"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setFlagReason(""); }}
                className="px-5 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function ReportDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  useEffect(() => {
    const fetchIncident = async () => {
      try {
        const res = await api.get(`/incidents/${id}`);
        if (res.data) {
          setIncident(res.data);
        } else {
          setError("Signalement non trouvé");
        }
      } catch (err) {
        console.error(err);
        setError("Erreur de chargement du signalement");
      } finally {
        setLoading(false);
      }
    };
    fetchIncident();
  }, [id]);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setIsReplying(true);
    try {
      const res = await api.put(`/incidents/${id}/reply`, { reply: replyText });
      setIncident(res.data);
      setReplyText("");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'envoi de la réponse");
    } finally {
      setIsReplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-xl text-text-muted">Chargement...</p>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 pt-32 pb-16 px-4 md:px-8 max-w-7xl mx-auto w-full text-center">
          <FaExclamationTriangle className="text-6xl text-danger mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-text-main mb-2">Oups !</h1>
          <p className="text-text-muted mb-8">{error}</p>
          <Link to="/reports" className="text-primary hover:underline font-medium flex items-center justify-center gap-2">
            <FaArrowLeft /> Retour à la liste
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const category = incident.type || incident.category || "Autre";
  const isFlagged = incident.flaggedAsFake === true;

  let formattedDate = "N/A";
  if (incident.createdAt) {
    const d = new Date(incident.createdAt);
    formattedDate =
      d.toLocaleDateString("fr-FR") +
      " à " +
      d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } else if (incident.date) {
    formattedDate = incident.date;
  }

  const s = incident.status?.toLowerCase();
  let colorClass = "bg-slate-100 text-text-muted border-slate-200";
  if (s === "nouveau" || s === "en attente") colorClass = "bg-danger/10 text-danger border-danger/20";
  else if (s === "en cours")  colorClass = "bg-warning/10 text-warning border-warning/20";
  else if (s === "résolu")    colorClass = "bg-success/10 text-success border-success/20";
  else if (s === "rejeté")    colorClass = "bg-red-100 text-red-700 border-red-200";

  // Analyse de suspicion (uniquement pour l'admin)
  const suspicionWarnings = isAdmin ? analyzeSuspicion(incident) : [];

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 px-4 md:px-8 max-w-4xl mx-auto w-full">
        <Link
          to={isAdmin ? "/reports" : "/my-reports"}
          className="inline-flex items-center gap-2 text-text-muted hover:text-primary font-medium mb-8 transition-colors"
        >
          <FaArrowLeft /> {isAdmin ? "Retour aux signalements" : "Retour à mes signalements"}
        </Link>

        {/* ── Bannière "Faux signalement" visible par TOUS (admin + citoyen) ── */}
        {isFlagged && (
          <div className="mb-6 bg-red-600 text-white rounded-2xl p-5 flex items-start gap-4 shadow-lg shadow-red-500/20">
            <FaBan className="text-3xl flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="font-extrabold text-lg mb-1">
                {isAdmin ? "⚠ Ce signalement a été marqué comme FAUX" : "❌ Votre signalement a été rejeté"}
              </h2>
              <p className="text-red-100 text-sm leading-relaxed">
                {isAdmin
                  ? `Raison enregistrée : "${incident.flagReason || "Non précisée"}". Le citoyen a été informé du rejet.`
                  : `Ce signalement n'a pas été retenu par les services de la ville. Motif : "${incident.flagReason || "Non précisé"}". Vous pouvez corriger ou compléter les parties manquantes pour le renvoyer.`}
              </p>
              {!isAdmin && (
                <div className="mt-4">
                  <Link
                    to={`/report?edit=${incident.id}`}
                    className="inline-flex items-center gap-2 bg-white text-red-600 hover:bg-red-50 font-extrabold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md"
                  >
                    Corriger et renvoyer
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        <Card className="border-none shadow-lg overflow-hidden">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-100 dark:border-slate-800 pb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full mb-3 inline-block">
                {category}
              </span>
              <h1 className="text-3xl font-bold text-text-main">
                INC-{incident.id} : {incident.type}
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {isFlagged && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                  <FaBan /> Faux signalement
                </span>
              )}
              <span className={`text-sm font-bold px-4 py-2 rounded-full border ${colorClass}`}>
                {incident.status}
              </span>
            </div>
          </div>

          {/* ── Panneau de suspicion (ADMIN seulement) ── */}
          {isAdmin && <SuspicionPanel warnings={suspicionWarnings} />}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-2">
                  Description du problème
                </h3>
                <p className="text-text-main bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed">
                  {incident.description || "Aucune description fournie."}
                </p>
              </div>

              {/* Audio Message */}
              {incident.audioUrl && (
                <div>
                  <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                    Message Vocal
                  </h3>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-center">
                    <audio src={incident.audioUrl} controls className="w-full max-w-md" />
                  </div>
                </div>
              )}

              {/* Photo */}
              <div>
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                  <FaImage /> Photo jointe
                </h3>
                {incident.photoUrl ? (
                  <div className="rounded-xl overflow-hidden border-2 border-slate-100 dark:border-slate-800 shadow-sm bg-black/5 flex items-center justify-center min-h-[300px]">
                    <img src={incident.photoUrl} alt="Incident" className="w-full max-h-[500px] object-contain" />
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-xl border border-slate-100 dark:border-slate-800 text-center text-text-muted flex flex-col items-center justify-center">
                    <FaImage className="text-4xl text-slate-300 mb-2" />
                    <p>Le citoyen n'a pas joint de photo pour ce signalement.</p>
                  </div>
                )}
              </div>

              {/* Message Admin */}
              {(incident.adminReply || isAdmin) && (
                <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                    <FaUser /> Message de l'Administration
                  </h3>

                  {incident.adminReply ? (
                    <div className="bg-primary/10 border-l-4 border-primary p-4 rounded-r-xl">
                      <p className="text-text-main leading-relaxed whitespace-pre-wrap">{incident.adminReply}</p>
                    </div>
                  ) : isAdmin ? (
                    <form onSubmit={handleReplySubmit} className="space-y-4">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Rédigez votre réponse ou confirmation au citoyen..."
                        className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none resize-none"
                        required
                      />
                      <button
                        type="submit"
                        disabled={isReplying}
                        className="bg-primary hover:bg-accent text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        {isReplying ? "Envoi..." : "Envoyer la réponse"}
                      </button>
                    </form>
                  ) : null}
                </div>
              )}

              {/* ── Zone de Faux Signalement (ADMIN seulement) ── */}
              {isAdmin && (
                <FlagPanel incident={incident} onFlagChange={setIncident} />
              )}

              {/* ── Message au citoyen si son rapport est vérifié comme légit ── */}
              {!isAdmin && !isFlagged && incident.status === "résolu" && (
                <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                  <FaCheckCircle className="text-emerald-500 text-xl flex-shrink-0" />
                  <div>
                    <p className="font-bold text-emerald-700 text-sm">Signalement validé et résolu !</p>
                    <p className="text-emerald-600 text-xs mt-0.5">
                      Merci pour votre vigilance citoyenne. Votre signalement a contribué à améliorer votre ville.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar info */}
            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">
                  Informations
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-text-muted mb-1">
                      <FaMapMarkerAlt /> <span className="text-xs font-medium">Localisation</span>
                    </div>
                    <p className="text-sm font-medium text-text-main">{incident.location || "Non renseignée"}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-text-muted mb-1">
                      <FaCalendarAlt /> <span className="text-xs font-medium">Date du signalement</span>
                    </div>
                    <p className="text-sm font-medium text-text-main">{formattedDate}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-text-muted mb-1">
                      <FaUser /> <span className="text-xs font-medium">Signalé par</span>
                    </div>
                    <p className="text-sm font-medium text-text-main break-all">{incident.authorEmail || "Anonyme"}</p>
                  </div>

                  {/* Crédibilité : visible uniquement pour l'admin */}
                  {isAdmin && (
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 text-text-muted mb-2">
                        <FaShieldAlt /> <span className="text-xs font-medium">Score de crédibilité</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            suspicionWarnings.length === 0
                              ? "bg-emerald-500 w-full"
                              : suspicionWarnings.length === 1
                              ? "bg-amber-400 w-3/4"
                              : suspicionWarnings.length === 2
                              ? "bg-orange-500 w-1/2"
                              : "bg-red-500 w-1/4"
                          }`}
                        />
                      </div>
                      <p className={`text-xs font-semibold mt-1 ${
                        suspicionWarnings.length === 0
                          ? "text-emerald-600"
                          : suspicionWarnings.length === 1
                          ? "text-amber-600"
                          : suspicionWarnings.length === 2
                          ? "text-orange-600"
                          : "text-red-600"
                      }`}>
                        {suspicionWarnings.length === 0 && "Crédible"}
                        {suspicionWarnings.length === 1 && "Légèrement suspect"}
                        {suspicionWarnings.length === 2 && "Suspect"}
                        {suspicionWarnings.length >= 3 && "Très suspect"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
