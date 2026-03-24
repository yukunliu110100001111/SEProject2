package site.bjut409.backend.model;

import lombok.Data;

import java.time.LocalDate;

@Data
public class StockRecordRow {
    private Long stockId;
    private Long ingredientId;
    private Integer currentQtyG;
    private LocalDate expiryDate;
}
