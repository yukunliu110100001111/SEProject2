package site.bjut409.backend.service;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Component
public class StockStatusHelper {

    public String calcStatus(Integer qty, LocalDate expiryDate) {
        if (qty != null && qty > 5000) {
            return "high_stock";
        }
        if (expiryDate != null && ChronoUnit.DAYS.between(LocalDate.now(), expiryDate) <= 3) {
            return "near_expiry";
        }
        return "normal";
    }
}
