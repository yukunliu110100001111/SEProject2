package site.bjut409.backend.auth;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class TokenStore {

    private final Map<String, Long> tokenUserMap = new ConcurrentHashMap<>();

    public String issue(Long userId) {
        String token = "token-" + userId + "-" + UUID.randomUUID().toString().substring(0, 8);
        tokenUserMap.put(token, userId);
        return token;
    }

    public Long getUserId(String token) {
        return tokenUserMap.get(token);
    }

    public void clear() {
        tokenUserMap.clear();
    }
}
