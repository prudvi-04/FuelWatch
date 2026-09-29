package com.fuelwatch.controller;

import com.fuelwatch.entity.User;
import com.fuelwatch.repository.UserRepository;
import com.fuelwatch.security.JwtUtil;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepo;
    private final PasswordEncoder encoder;
    private final JwtUtil jwt;

    @Data
    public static class RegisterRequest {
        @NotBlank @Size(min = 3, max = 50)
        private String username;
        @NotBlank @Size(min = 6, max = 100)
        private String password;
        @NotBlank @Size(max = 200)
        private String securityQuestion;
        @NotBlank @Size(min = 2, max = 100)
        private String securityAnswer;
    }

    @Data
    public static class LoginRequest {
        @NotBlank private String username;
        @NotBlank private String password;
    }

    @Data
    public static class GetQuestionRequest {
        @NotBlank private String username;
    }

    @Data
    public static class ResetRequest {
        @NotBlank private String username;
        @NotBlank private String securityAnswer;
        @NotBlank @Size(min = 6, max = 100)
        private String newPassword;
    }

    private String validatePasswordComplexity(String pwd) {
        if (!pwd.matches(".*[A-Za-z].*")) return "Password must contain at least one letter";
        if (!pwd.matches(".*\\d.*")) return "Password must contain at least one number";
        if (!pwd.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?].*"))
            return "Password must contain at least one symbol";
        return null;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        if (userRepo.existsByUsername(req.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
        }
        String pwdError = validatePasswordComplexity(req.getPassword());
        if (pwdError != null) return ResponseEntity.badRequest().body(Map.of("error", pwdError));

        User u = new User();
        u.setUsername(req.getUsername().trim());
        u.setPassword(encoder.encode(req.getPassword()));
        u.setSecurityQuestion(req.getSecurityQuestion().trim());
        u.setSecurityAnswerHash(encoder.encode(req.getSecurityAnswer().trim().toLowerCase()));
        userRepo.save(u);

        String token = jwt.generateToken(u.getUsername(), u.getId());
        return ResponseEntity.ok(Map.of(
                "token", token,
                "username", u.getUsername(),
                "userId", u.getId()
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        return userRepo.findByUsername(req.getUsername())
                .filter(u -> encoder.matches(req.getPassword(), u.getPassword()))
                .map(u -> ResponseEntity.ok((Object) Map.of(
                        "token", jwt.generateToken(u.getUsername(), u.getId()),
                        "username", u.getUsername(),
                        "userId", u.getId()
                )))
                .orElse(ResponseEntity.status(401).body(Map.of("error", "Invalid username or password")));
    }

    // Step 1 — get the user's security question
    @PostMapping("/forgot-password/question")
    public ResponseEntity<?> getQuestion(@Valid @RequestBody GetQuestionRequest req) {
        return userRepo.findByUsername(req.getUsername())
                .map(u -> {
                    if (u.getSecurityQuestion() == null) {
                        return ResponseEntity.badRequest().body((Object) Map.of(
                                "error", "This account has no security question set"));
                    }
                    return ResponseEntity.ok((Object) Map.of("question", u.getSecurityQuestion()));
                })
                .orElse(ResponseEntity.status(404).body(Map.of("error", "Username not found")));
    }

    // Step 2 — verify answer + reset password
    @PostMapping("/forgot-password/reset")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetRequest req) {
        return userRepo.findByUsername(req.getUsername())
                .map(u -> {
                    if (u.getSecurityAnswerHash() == null) {
                        return ResponseEntity.badRequest().body((Object) Map.of(
                                "error", "This account has no security question set"));
                    }
                    String submitted = req.getSecurityAnswer().trim().toLowerCase();
                    if (!encoder.matches(submitted, u.getSecurityAnswerHash())) {
                        return ResponseEntity.status(401).body((Object) Map.of(
                                "error", "Incorrect answer to security question"));
                    }
                    String pwdError = validatePasswordComplexity(req.getNewPassword());
                    if (pwdError != null) return ResponseEntity.badRequest().body((Object) Map.of("error", pwdError));

                    u.setPassword(encoder.encode(req.getNewPassword()));
                    userRepo.save(u);
                    return ResponseEntity.ok((Object) Map.of(
                            "message", "Password reset successfully. Please sign in."));
                })
                .orElse(ResponseEntity.status(404).body(Map.of("error", "Username not found")));
    }
}