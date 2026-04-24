package site.bjut409.backend.model;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class SustainabilityReportRecord {
    private Long reportId;
    private String summary;
    private String reportData;
    private Long generatedBy;
    private LocalDate rangeStart;
    private LocalDate rangeEnd;
    private LocalDateTime generatedAt;
}
