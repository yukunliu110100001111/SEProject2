package site.bjut409.backend.auth;

import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class TokenStore {

    private static final String PREFIX = "token-";

    public String issue(Long userId) {
        return PREFIX + userId + "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    public Long getUserId(String token) {
        if (token == null || !token.startsWith(PREFIX)) {
            return null;
        }
        String[] parts = token.split("-");
        if (parts.length < 3) {
            return null;
        }
        try {
            return Long.valueOf(parts[1]);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    public void clear() {
        // Stateless token store: nothing to clear.
    }
}
