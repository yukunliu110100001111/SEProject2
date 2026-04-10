package site.bjut409.backend.dto;

import java.util.List;

public record AiChatRequest(List<AiChatMessage> messages) {
}
