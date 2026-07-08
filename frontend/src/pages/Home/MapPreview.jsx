import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

// Dummy data for map preview
const mockAlerts = [
  { id: 1, pos: [9.5092, -13.7122], title: "Nid-de-poule dangereux", type: "infrastructure" }, // Kaloum
  { id: 2, pos: [9.5406, -13.6622], title: "Feu tricolore en panne", type: "danger" }, // Dixinn
  { id: 3, pos: [9.5836, -13.6222], title: "Dépôt d'ordures", type: "cleanliness" }, // Ratoma
];

export default function MapPreview() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState({ danger: 0, infra: 0, clean: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/incidents");
        const incidents = res.data;
        const newStats = { danger: 0, infra: 0, clean: 0 };
        incidents.forEach(inc => {
          const type = (inc.type || inc.category || "").toLowerCase();
          if (type.includes("danger") || type.includes("sécurité") || type.includes("securite")) {
            newStats.danger++;
          } else if (type.includes("propreté") || type.includes("proprete") || type.includes("déchet") || type.includes("dechet")) {
            newStats.clean++;
          } else if (type.includes("infra") || type.includes("poule") || type.includes("éclairage") || type.includes("eclairage") || type.includes("eau")) {
            newStats.infra++;
          }
        });
        setStats(newStats);
      } catch (err) {
        console.error("Failed to fetch map stats", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <section className="py-20 bg-surface">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:w-1/2"
          >
            <h2 
              className="text-3xl md:text-4xl font-bold mb-6"
              dangerouslySetInnerHTML={{ __html: t("home.map_title") }}
            />
            <p className="text-lg text-text-muted mb-8">
              {t('home.map_subtitle')}
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-danger"></div>
                <span className="text-text-main font-medium">{t('home.map_danger')} ({stats.danger})</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-warning"></div>
                <span className="text-text-main font-medium">{t('home.map_infra')} ({stats.infra})</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-success"></div>
                <span className="text-text-main font-medium">{t('home.map_clean')} ({stats.clean})</span>
              </li>
            </ul>
            {(!user || user.role === 'ADMIN') && (
              <Button variant="primary" size="lg" onClick={() => navigate('/map')}>{t('home.map_btn')}</Button>
            )}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:w-1/2 w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl border-4 border-white"
          >
            <MapContainer 
              center={[9.5350, -13.6773]} 
              zoom={12} 
              scrollWheelZoom={false}
              className="w-full h-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {mockAlerts.map(alert => (
                <Marker key={alert.id} position={alert.pos}>
                  <Popup>
                    <div className="font-semibold text-text-main">{alert.title}</div>
                    <div className="text-xs text-text-muted mt-1 capitalize">{alert.type}</div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
