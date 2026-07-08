import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useAuth } from "./AuthContext";
import api from "../services/api";

const GamificationContext = createContext();

export function GamificationProvider({ children }) {
  const { user } = useAuth();
  const [points, setPoints] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user || !user.email) {
        setPoints(0);
        return;
      }
      try {
        const res = await api.get(`/incidents/user/${user.email}`);
        let calculatedPoints = 0;
        res.data.forEach(inc => {
          const s = inc.status?.toLowerCase();
          if (s === "résolu") calculatedPoints += 50;
          else if (s === "en cours") calculatedPoints += 20;
          else calculatedPoints += 10;
        });
        setPoints(calculatedPoints);
      } catch (err) {
        console.error("Erreur calcul points:", err);
      }
    };
    fetchStats();
  }, [user]);

  const badge = useMemo(() => {
    if (points >= 500) return "Héros de la Ville 🦸‍♂️";
    if (points >= 300) return "Super Citoyen 🏅";
    if (points >= 100) return "Citoyen Engagé ⭐";
    return "Nouveau Venu 🌱";
  }, [points]);

  const addPoints = (amount) => {
    setPoints(prev => prev + amount);
  };

  return (
    <GamificationContext.Provider value={{ points, badge, addPoints }}>
      {children}
    </GamificationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGamification() {
  return useContext(GamificationContext);
}

