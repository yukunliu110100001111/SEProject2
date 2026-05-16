
package site.bjut409.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PasswordHasherTest {

    private PasswordHasher passwordHasher;

    @BeforeEach
    void setUp() {
        passwordHasher = new PasswordHasher();
    }

    @Test
    void hash_should_not_return_null_or_empty() {
        String hashed = passwordHasher.hash("password123");
        assertNotNull(hashed);
        assertFalse(hashed.isEmpty());
    }

    @Test
    void hash_should_start_with_prefix() {
        String hashed = passwordHasher.hash("password123");
        assertTrue(hashed.startsWith("pbkdf2$"));
    }

    @Test
    void hash_should_throw_exception_for_null_password() {
        assertThrows(IllegalArgumentException.class, new org.junit.jupiter.api.function.Executable() {
            @Override
            public void execute() throws Throwable {
                passwordHasher.hash(null);
            }
        });
    }

    @Test
    void hash_should_throw_exception_for_empty_password() {
        assertThrows(IllegalArgumentException.class, new org.junit.jupiter.api.function.Executable() {
            @Override
            public void execute() throws Throwable {
                passwordHasher.hash("");
            }
        });
    }

    @Test
    void hash_should_throw_exception_for_blank_password() {
        assertThrows(IllegalArgumentException.class, new org.junit.jupiter.api.function.Executable() {
            @Override
            public void execute() throws Throwable {
                passwordHasher.hash("   ");
            }
        });
    }

    @Test
    void verify_should_return_true_for_correct_password() {
        String password = "securePassword456";
        String hashed = passwordHasher.hash(password);
        assertTrue(passwordHasher.verify(password, hashed));
    }

    @Test
    void verify_should_return_false_for_wrong_password() {
        String password = "securePassword456";
        String hashed = passwordHasher.hash(password);
        assertFalse(passwordHasher.verify("wrongPassword", hashed));
    }

    @Test
    void verify_should_return_false_for_null_password() {
        String hashed = passwordHasher.hash("testPassword");
        assertFalse(passwordHasher.verify(null, hashed));
    }

    @Test
    void verify_should_return_false_for_null_stored_value() {
        assertFalse(passwordHasher.verify("testPassword", null));
    }

    @Test
    void verify_should_return_false_for_empty_stored_value() {
        assertFalse(passwordHasher.verify("testPassword", ""));
    }

    @Test
    void verify_should_return_false_for_invalid_format() {
        assertFalse(passwordHasher.verify("testPassword", "invalid-format"));
    }

    @Test
    void verify_should_support_plain_text_fallback() {
        String plainText = "myPlainPassword";
        assertTrue(passwordHasher.verify(plainText, plainText));
        assertFalse(passwordHasher.verify("wrong", plainText));
    }

    @Test
    void needsRehash_should_return_true_for_null_stored_value() {
        assertTrue(passwordHasher.needsRehash(null));
    }

    @Test
    void needsRehash_should_return_true_for_plain_text() {
        assertTrue(passwordHasher.needsRehash("plainTextPassword"));
    }

    @Test
    void needsRehash_should_return_true_for_invalid_format() {
        assertTrue(passwordHasher.needsRehash("pbkdf2$invalid"));
    }

    @Test
    void needsRehash_should_return_false_for_valid_hash() {
        String hashed = passwordHasher.hash("testPassword");
        assertFalse(passwordHasher.needsRehash(hashed));
    }

    @Test
    void hash_should_produce_different_results_for_same_password() {
        String password = "samePassword";
        String hash1 = passwordHasher.hash(password);
        String hash2 = passwordHasher.hash(password);
        assertNotEquals(hash1, hash2);
    }
}

