package site.bjut409.backend.dto;

import java.util.List;

public record AiChatResponse(String reply,
                             String model,
                             List<String> toolCalls,
                             AiPendingActionView pendingAction) {
}
