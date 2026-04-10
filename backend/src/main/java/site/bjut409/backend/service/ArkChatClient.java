package site.bjut409.backend.service;

import java.util.List;
import java.util.Map;

public interface ArkChatClient {

    String chat(List<Map<String, String>> messages, String model);
}
