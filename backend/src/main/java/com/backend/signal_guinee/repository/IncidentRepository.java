package com.backend.signal_guinee.repository;

import com.backend.signal_guinee.model.Incident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, Long> {
    int countByAuthorEmailAndFlaggedAsFakeTrue(String authorEmail);
}
