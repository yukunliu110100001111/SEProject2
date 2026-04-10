package site.bjut409.backend.dto;

import java.util.Map;

public record AiPendingActionView(String actionId,
                                  String actionType,
                                  String summary,
                                  Map<String, Object> arguments) {
}
