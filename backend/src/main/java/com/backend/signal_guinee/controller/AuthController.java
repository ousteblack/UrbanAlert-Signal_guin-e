package com.backend.signal_guinee.controller;

import com.backend.signal_guinee.model.User;
import com.backend.signal_guinee.repository.UserRepository;
import com.backend.signal_guinee.repository.IncidentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.time.LocalDateTime;
import java.util.Random;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.SimpleMailMessage;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private IncidentRepository incidentRepository;

    @Autowired
    private JavaMailSender mailSender;

    @org.springframework.beans.factory.annotation.Value("${Signal_guinee.mail.sender:ousmanediall240@gmail.com}")
    private String senderEmail;

    private void sendRealEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(senderEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
            System.out.println("Email réellement envoyé à " + to);
        } catch (Exception e) {
            System.err.println("Erreur lors de l'envoi de l'email : " + e.getMessage());
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        String fullname = request.get("fullname");
        String email = request.get("email");
        String phone = request.get("phone");
        String password = request.get("password");

        // Simple validation
        if ((email == null || email.trim().isEmpty()) && (phone == null || phone.trim().isEmpty())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email ou téléphone requis"));
        }

        // Check if user already exists
        if (email != null && !email.trim().isEmpty() && userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email déjà utilisé"));
        }
        if (phone != null && !phone.trim().isEmpty() && userRepository.findByPhone(phone).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Numéro de téléphone déjà utilisé"));
        }

        // Determine role (for demo: if email contains admin -> ADMIN, else CITIZEN)
        String role = (email != null && email.toLowerCase().contains("admin")) ? "ADMIN" : "CITIZEN";

        User user = new User();
        user.setFullname(fullname);
        user.setEmail(email);
        user.setPhone(phone);
        user.setPassword(password); // Should be hashed in production
        user.setRole(role);

        if (email != null && !email.trim().isEmpty()) {
            user.setActive(false);
            String code = String.format("%06d", new Random().nextInt(999999));
            user.setActivationCode(code);
            userRepository.save(user);

            String subject = "Bienvenue sur Signal_guinee ! Activez votre compte";
            String text = "Bonjour " + (fullname != null ? fullname : "") + ",\n\n"
                        + "Merci de vous être inscrit sur Signal_guinee. Voici votre code d'activation : " + code + "\n\n"
                        + "L'équipe Signal_guinee";
            sendRealEmail(email, subject, text);
            return ResponseEntity.ok(Map.of("message", "Compte créé. Veuillez vérifier vos e-mails pour l'activer.", "requires_activation", "true"));
        } else {
            user.setActive(true);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Utilisateur créé avec succès"));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String identifier = request.get("identifier"); // Can be email or phone
        String password = request.get("password");

        if (identifier == null || password == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Identifiants manquants"));
        }

        Optional<User> userOpt = userRepository.findByEmail(identifier);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByPhone(identifier);
        }

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getPassword().equals(password)) {
                // Check if active
                if (!user.isActive()) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Votre compte n'est pas activé. Veuillez vérifier vos e-mails pour le code d'activation.", "requires_activation", "true"));
                }

                // Vérification du nombre de faux signalements
                if (user.getEmail() != null) {
                    int fakeCount = incidentRepository.countByAuthorEmailAndFlaggedAsFakeTrue(user.getEmail());
                    if (fakeCount >= 3) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(Map.of("message", "Votre compte est définitivement bloqué suite à l'envoi de 3 faux signalements ou plus."));
                    }
                }

                // Successful login
                if (user.getEmail() != null && !user.getEmail().trim().isEmpty()) {
                    String subject = "Nouvelle connexion à votre compte Signal_guinee";
                    String text = "Bonjour " + (user.getFullname() != null ? user.getFullname() : "") + ",\n\n"
                                + "Une nouvelle connexion a été détectée sur votre compte Signal_guinee le " + LocalDateTime.now() + ".\n"
                                + "Si ce n'est pas vous, veuillez réinitialiser votre mot de passe immédiatement.\n\n"
                                + "L'équipe Signal_guinee";
                    
                    // Envoi de l'email réel
                    sendRealEmail(user.getEmail(), subject, text);
                }

                Map<String, Object> response = new HashMap<>();
                response.put("token", "dummy-jwt-token-" + user.getId()); // Fake token
                response.put("user", Map.of(
                        "id", user.getId(),
                        "fullname", user.getFullname() != null ? user.getFullname() : "",
                        "email", user.getEmail() != null ? user.getEmail() : "",
                        "phone", user.getPhone() != null ? user.getPhone() : "",
                        "role", user.getRole()
                ));
                return ResponseEntity.ok(response);
            }
        }

        // Failed login
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Identifiants incorrects"));
    }

    @PostMapping("/activate")
    public ResponseEntity<?> activateAccount(@RequestBody Map<String, String> request) {
        String identifier = request.get("identifier");
        String code = request.get("code");

        if (identifier == null || code == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Informations manquantes"));
        }

        Optional<User> userOpt = userRepository.findByEmail(identifier);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByPhone(identifier);
        }

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (code.equals(user.getActivationCode())) {
                user.setActive(true);
                user.setActivationCode(null);
                userRepository.save(user);
                return ResponseEntity.ok(Map.of("message", "Compte activé avec succès. Vous pouvez maintenant vous connecter."));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Code invalide"));
            }
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Utilisateur non trouvé"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String identifier = request.get("identifier");

        if (identifier == null || identifier.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Identifiant manquant"));
        }

        Optional<User> userOpt = userRepository.findByEmail(identifier);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByPhone(identifier);
        }

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // Générer un code à 6 chiffres
            String code = String.format("%06d", new Random().nextInt(999999));
            user.setResetCode(code);
            user.setResetCodeExpiry(LocalDateTime.now().plusMinutes(15));
            userRepository.save(user);

            // Envoi de l'email réel
            String subject = "Votre code de réinitialisation Signal_guinee";
            String text = "Bonjour,\n\nVoici votre code de réinitialisation : " + code + "\n\nIl expire dans 15 minutes.\n\nL'équipe Signal_guinee";
            sendRealEmail(user.getEmail(), subject, text);

            return ResponseEntity.ok(Map.of("message", "Code envoyé avec succès", "code_pour_test", code));
        }

        return ResponseEntity.ok(Map.of("message", "Si cet identifiant existe, un code a été envoyé."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String identifier = request.get("identifier");
        String code = request.get("code");
        String newPassword = request.get("newPassword");

        if (identifier == null || code == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Informations manquantes"));
        }

        Optional<User> userOpt = userRepository.findByEmail(identifier);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByPhone(identifier);
        }

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (code.equals(user.getResetCode()) && user.getResetCodeExpiry() != null && user.getResetCodeExpiry().isAfter(LocalDateTime.now())) {
                user.setPassword(newPassword);
                user.setResetCode(null);
                user.setResetCodeExpiry(null);
                userRepository.save(user);
                return ResponseEntity.ok(Map.of("message", "Mot de passe réinitialisé avec succès"));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Code invalide ou expiré"));
            }
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Utilisateur non trouvé"));
    }
}
