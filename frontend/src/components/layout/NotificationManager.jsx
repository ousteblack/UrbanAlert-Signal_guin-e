import { useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { toast } from "react-toastify";

export default function NotificationManager() {
  const { user } = useAuth();
  const previousState = useRef({});

  useEffect(() => {
    // Ne s'exécute que si l'utilisateur est connecté et est un citoyen
    if (!user || user.role === 'ADMIN') return;

    const storageKey = `notificationsState_${user.email}`;

    // Charger l'état initial depuis le localStorage pour comparer les changements
    const storedState = localStorage.getItem(storageKey);
    if (storedState) {
      try {
        previousState.current = JSON.parse(storedState);
      } catch (e) {
        previousState.current = {};
      }
    }

    const checkUpdates = async () => {
      try {
        const res = await api.get(`/incidents/user/${user.email}`);
        const incidents = res.data;

        let hasChanges = false;
        const newState = { ...previousState.current };
        const oldStateKeys = Object.keys(previousState.current);

        incidents.forEach(inc => {
          const oldInc = previousState.current[inc.id];
          
          // Seulement pour les incidents que l'on connaissait déjà (pour éviter de spammer à la première connexion)
          if (oldInc) {
            // Vérification du rejet
            if (!oldInc.flaggedAsFake && inc.flaggedAsFake) {
              toast.error(`❌ Votre signalement "INC-${inc.id}" a été rejeté.`, { autoClose: 5000 });
              hasChanges = true;
            } 
            // Si non rejeté, vérification des changements de statuts
            else if (!inc.flaggedAsFake && oldInc.status !== inc.status) {
              const newStatus = inc.status?.toLowerCase();
              if (newStatus === 'en cours') {
                toast.info(`✅ Signalement "INC-${inc.id}" accepté et en cours de traitement.`, { autoClose: 5000 });
                hasChanges = true;
              } else if (newStatus === 'résolu') {
                toast.success(`🎉 Bonne nouvelle ! Votre signalement "INC-${inc.id}" a été résolu.`, { autoClose: 6000 });
                hasChanges = true;
              }
            }
          }

          // Mise à jour de l'état en mémoire
          newState[inc.id] = {
            status: inc.status,
            flaggedAsFake: inc.flaggedAsFake
          };
        });

        // Si l'état a changé ou si c'est la première fois, on sauvegarde
        if (hasChanges || oldStateKeys.length === 0) {
          localStorage.setItem(storageKey, JSON.stringify(newState));
          previousState.current = newState;
        }

      } catch (error) {
        console.error("Erreur lors de la vérification des notifications", error);
      }
    };

    // Vérifier immédiatement au montage
    checkUpdates();

    // Puis vérifier toutes les 10 secondes pour un effet "temps réel"
    const interval = setInterval(checkUpdates, 10000);

    return () => clearInterval(interval);
  }, [user]);

  // Ce composant ne rend rien visuellement, il tourne en arrière-plan
  return null;
}
