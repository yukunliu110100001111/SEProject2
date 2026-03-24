package site.bjut409.backend.model;

import lombok.Data;

@Data
public class UserRecord {
    private Long userId;
    private String username;
    private String passwordHash;
    private String role;
}
