package com.backend.signal_guinee.controller;

import com.backend.signal_guinee.model.Incident;
import com.backend.signal_guinee.repository.IncidentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/incidents")
@CrossOrigin(origins = "*")
public class IncidentController {

    @Autowired
    private IncidentRepository repository;

    @GetMapping
    public List<Incident> getAllIncidents() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Incident> getIncidentById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{email}")
    public List<Incident> getIncidentsByUser(@PathVariable String email) {
        // Since we don't have a custom query method in the repository yet, 
        // we can filter them here for simplicity, or add it to the repo.
        // We'll filter here to avoid touching the repository interface for now.
        return repository.findAll().stream()
                .filter(i -> email.equals(i.getAuthorEmail()))
                .toList();
    }

    @PostMapping
    public ResponseEntity<Incident> createIncident(@RequestBody Incident incident) {
        incident.setCreatedAt(LocalDateTime.now());
        if (incident.getStatus() == null) {
            incident.setStatus("en attente");
        }
        Incident saved = repository.save(incident);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Incident> updateIncidentStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String newStatus = body.get("status");
        if (newStatus == null || newStatus.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        return repository.findById(id).map(incident -> {
            incident.setStatus(newStatus);
            Incident updated = repository.save(incident);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/reply")
    public ResponseEntity<Incident> replyToIncident(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String reply = body.get("reply");
        if (reply == null || reply.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        return repository.findById(id).map(incident -> {
            incident.setAdminReply(reply);
            Incident updated = repository.save(incident);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/flag")
    public ResponseEntity<Incident> flagIncident(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String flagged = body.get("flaggedAsFake");
        String reason  = body.get("flagReason");

        return repository.findById(id).map(incident -> {
            incident.setFlaggedAsFake("true".equalsIgnoreCase(flagged));
            incident.setFlagReason(reason != null ? reason : "");
            // Si on marque comme faux, on passe le statut en "rejeté"
            if ("true".equalsIgnoreCase(flagged)) {
                incident.setStatus("rejeté");
            } else {
                // Si on enlève le flag, on repasse en "nouveau" pour réévaluation
                incident.setStatus("nouveau");
                incident.setFlagReason(null);
            }
            Incident updated = repository.save(incident);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Incident> updateIncident(@PathVariable Long id, @RequestBody Incident updatedIncident) {
        return repository.findById(id).map(incident -> {
            incident.setType(updatedIncident.getType());
            incident.setDescription(updatedIncident.getDescription());
            incident.setLat(updatedIncident.getLat());
            incident.setLng(updatedIncident.getLng());
            incident.setLocation(updatedIncident.getLocation());
            incident.setPhotoUrl(updatedIncident.getPhotoUrl());
            incident.setAudioUrl(updatedIncident.getAudioUrl());
            // Réinitialisation des indicateurs de rejet lors de la modification par le citoyen
            incident.setStatus("nouveau");
            incident.setFlaggedAsFake(false);
            incident.setFlagReason(null);
            Incident saved = repository.save(incident);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }
}
