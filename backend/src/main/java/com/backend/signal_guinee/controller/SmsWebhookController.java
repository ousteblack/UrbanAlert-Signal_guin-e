package com.backend.signal_guinee.controller;

import com.backend.signal_guinee.model.Incident;
import com.backend.signal_guinee.repository.IncidentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/sms")
public class SmsWebhookController {

    @Autowired
    private IncidentRepository incidentRepository;

    /**
     * Webhook pour recevoir les SMS entrants des citoyens sans smartphone
     * Format attendu (JSON générique) : {"from": "+224600000000", "text": "Fuite d'eau à Kaloum marché"}
     */
    @CrossOrigin(origins = "*")
    @PostMapping("/webhook")
    public ResponseEntity<String> receiveSms(@RequestBody Map<String, String> payload) {
        String from = payload.get("from");
        String text = payload.get("text");

        if (from == null || text == null || text.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Le numéro de l'expéditeur (from) et le contenu (text) sont requis.");
        }

        // 1. Analyser le texte pour deviner la catégorie (logique basique)
        String type = "Autre";
        String lowerText = text.toLowerCase();
        if (lowerText.contains("eau") || lowerText.contains("fuite") || lowerText.contains("inondation")) {
            type = "Eau / Inondation";
        } else if (lowerText.contains("ordure") || lowerText.contains("poubelle") || lowerText.contains("déchet") || lowerText.contains("propreté")) {
            type = "Propreté";
        } else if (lowerText.contains("route") || lowerText.contains("nid de poule") || lowerText.contains("voirie")) {
            type = "Infrastructures";
        } else if (lowerText.contains("courant") || lowerText.contains("électricité") || lowerText.contains("poteau") || lowerText.contains("éclairage")) {
            type = "Éclairage public";
        }

        // 2. Création automatique de l'incident
        Incident incident = new Incident();
        incident.setAuthorEmail(from); // On utilise le numéro de téléphone comme identifiant (au lieu de l'email)
        incident.setDescription(text);
        incident.setType(type);
        incident.setStatus("nouveau");
        incident.setLocation("Reçu par SMS (À vérifier)");
        incident.setCreatedAt(LocalDateTime.now());
        incident.setFlaggedAsFake(false);

        // Enregistrement
        incidentRepository.save(incident);

        // 3. Réponse OK pour le fournisseur de l'API SMS
        return ResponseEntity.ok("Signalement par SMS enregistré avec succès.");
    }
}
