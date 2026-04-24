package site.bjut409.backend.service;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Component
public class StockStatusHelper {

    public String calcStatus(Integer qty, LocalDate expiryDate) {
        if (qty != null && qty >= 5000) {
            return "high_stock";
        }
        long days = expiryDate == null ? Long.MAX_VALUE : ChronoUnit.DAYS.between(LocalDate.now(), expiryDate);
        if (expiryDate != null && days >= 0 && days <= 7) {
            return "near_expiry";
        }
        return "normal";
    }
}
