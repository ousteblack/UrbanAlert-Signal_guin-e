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
@Table(name = "app_user")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fullname;
    
    @Column(unique = true)
    private String email;
    
    @Column(unique = true)
    private String phone;
    
    private String password; // In a real app, this should be hashed
    private String role; // "ADMIN" or "CITIZEN"

    private String resetCode;
    private LocalDateTime resetCodeExpiry;

    private boolean isActive = false;
    private String activationCode;

}
