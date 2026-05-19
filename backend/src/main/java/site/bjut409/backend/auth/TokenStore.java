package site.bjut409.backend.auth;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.UUID;

@Component
public class TokenStore {

    private static final String PREFIX = "token-";
    private static final int SESSION_TTL_HOURS = 12;

    private final JdbcTemplate jdbcTemplate;

    public TokenStore(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public String issue(Long userId) {
        String token = PREFIX + UUID.randomUUID();
        jdbcTemplate.update("""
                insert into auth_sessions(user_id, token_hash, issued_at, expires_at)
                values(?, ?, ?, ?)
                """, userId, hash(token), LocalDateTime.now(), LocalDateTime.now().plusHours(SESSION_TTL_HOURS));
        return token;
    }

    public Long getUserId(String token) {
        if (token == null || !token.startsWith(PREFIX)) {
            return null;
        }
        return jdbcTemplate.query("""
                        select user_id
                        from auth_sessions
                        where token_hash = ?
                          and revoked_at is null
                          and expires_at > ?
                        limit 1
                        """,
                rs -> rs.next() ? rs.getLong("user_id") : null,
                hash(token), LocalDateTime.now());
    }

    public void clear() {
        jdbcTemplate.update("delete from auth_sessions");
    }

    private String hash(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(bytes);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }
}
