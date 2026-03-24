package site.bjut409.backend.auth;

import org.springframework.stereotype.Component;
import site.bjut409.backend.common.BizException;
import site.bjut409.backend.mapper.UserMapper;
import site.bjut409.backend.model.UserRecord;

import java.util.Objects;

@Component
public class AuthSupport {

    private final TokenStore tokenStore;
    private final UserMapper userMapper;

    public AuthSupport(TokenStore tokenStore, UserMapper userMapper) {
        this.tokenStore = tokenStore;
        this.userMapper = userMapper;
    }

    public String issueToken(Long userId) {
        return tokenStore.issue(userId);
    }

    public AuthUser requireUser(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new BizException(401, 401, "未登录");
        }
        Long userId = tokenStore.getUserId(authorization.substring("Bearer ".length()));
        if (userId == null) {
            throw new BizException(401, 401, "未登录");
        }
        UserRecord user = userMapper.findById(userId);
        if (user == null) {
            throw new BizException(401, 401, "未登录");
        }
        return new AuthUser(user.getUserId(), user.getUsername(), user.getRole());
    }

    public void requireRole(AuthUser user, String... roles) {
        for (String role : roles) {
            if (Objects.equals(user.role(), role)) {
                return;
            }
        }
        throw new BizException(403, 403, "无权限");
    }

    public void requireSelfOrRole(AuthUser user, Long targetUserId, String... roles) {
        if (Objects.equals(user.userId(), targetUserId)) {
            return;
        }
        requireRole(user, roles);
    }
}
