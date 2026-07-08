package com.backend.signal_guinee.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Incident {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String type;
    private String description;
    
    // Store JSON as string, or two columns. Let's use two columns for simplicity.
    private Double lat;
    private Double lng;
    
    private String location; // textual location e.g. "Kaloum, Conakry"
    private String status; // nouveau, en cours, résolu
    private String authorEmail; // links incident to citizen
    
    private LocalDateTime createdAt;

    @Column(columnDefinition="TEXT")
    private String photoUrl;
    
    @Column(columnDefinition="TEXT")
    private String audioUrl;
    
    @Column(columnDefinition="TEXT")
    private String adminReply;

    // Système de détection de faux signalements
    private Boolean flaggedAsFake = false;

    @Column(columnDefinition="TEXT")
    private String flagReason; // Raison du rejet par l'admin

    @PrePersist
    public void prePersist() {
        if (this.status == null) {
            this.status = "nouveau";
        }
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.flaggedAsFake == null) {
            this.flaggedAsFake = false;
        }
    }
}
