
package site.bjut409.backend.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import site.bjut409.backend.service.DemoDataService;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class TokenStoreTest {

    @Autowired
    private TokenStore tokenStore;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private DemoDataService demoDataService;

    @BeforeEach
    void setUp() {
        demoDataService.resetAll();
        tokenStore.clear();
    }

    @Test
    void issue_should_return_token_starting_with_prefix() {
        String token = tokenStore.issue(1L);
        assertNotNull(token);
        assertTrue(token.startsWith("token-"));
    }

    @Test
    void issue_should_return_different_tokens_each_time() {
        String token1 = tokenStore.issue(1L);
        String token2 = tokenStore.issue(1L);
        assertNotEquals(token1, token2);
    }

    @Test
    void getUserId_should_return_user_id_for_valid_token() {
        Long userId = 1L;
        String token = tokenStore.issue(userId);
        
        Long result = tokenStore.getUserId(token);
        assertEquals(userId, result);
    }

    @Test
    void getUserId_should_return_null_for_null_token() {
        Long result = tokenStore.getUserId(null);
        assertNull(result);
    }

    @Test
    void getUserId_should_return_null_for_token_without_prefix() {
        Long result = tokenStore.getUserId("invalid-token");
        assertNull(result);
    }

    @Test
    void getUserId_should_return_null_for_non_existent_token() {
        Long result = tokenStore.getUserId("token-non-existent-123");
        assertNull(result);
    }

    @Test
    void clear_should_remove_all_tokens() {
        String token1 = tokenStore.issue(1L);
        String token2 = tokenStore.issue(2L);
        
        tokenStore.clear();
        
        assertNull(tokenStore.getUserId(token1));
        assertNull(tokenStore.getUserId(token2));
    }
}

