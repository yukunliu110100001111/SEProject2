
package site.bjut409.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class StockStatusHelperTest {

    private StockStatusHelper stockStatusHelper;

    @BeforeEach
    void setUp() {
        stockStatusHelper = new StockStatusHelper();
    }

    @Test
    void calcStatus_should_return_high_stock_when_quantity_5000_or_more() {
        LocalDate futureDate = LocalDate.now().plusDays(30);
        assertEquals("high_stock", stockStatusHelper.calcStatus(5000, futureDate));
        assertEquals("high_stock", stockStatusHelper.calcStatus(10000, futureDate));
    }

    @Test
    void calcStatus_should_return_high_stock_even_when_near_expiry() {
        LocalDate nearExpiry = LocalDate.now().plusDays(3);
        assertEquals("high_stock", stockStatusHelper.calcStatus(5000, nearExpiry));
    }

    @Test
    void calcStatus_should_return_near_expiry_when_expiry_in_7_days_or_less() {
        LocalDate today = LocalDate.now();
        assertEquals("near_expiry", stockStatusHelper.calcStatus(100, today));
        
        LocalDate in3Days = LocalDate.now().plusDays(3);
        assertEquals("near_expiry", stockStatusHelper.calcStatus(100, in3Days));
        
        LocalDate in7Days = LocalDate.now().plusDays(7);
        assertEquals("near_expiry", stockStatusHelper.calcStatus(100, in7Days));
    }

    @Test
    void calcStatus_should_return_normal_when_expiry_more_than_7_days() {
        LocalDate in8Days = LocalDate.now().plusDays(8);
        assertEquals("normal", stockStatusHelper.calcStatus(100, in8Days));
        
        LocalDate in30Days = LocalDate.now().plusDays(30);
        assertEquals("normal", stockStatusHelper.calcStatus(4999, in30Days));
    }

    @Test
    void calcStatus_should_return_normal_when_expiry_is_past() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        assertEquals("normal", stockStatusHelper.calcStatus(100, yesterday));
    }

    @Test
    void calcStatus_should_return_normal_when_expiry_is_null() {
        assertEquals("normal", stockStatusHelper.calcStatus(100, null));
        assertEquals("normal", stockStatusHelper.calcStatus(4999, null));
    }

    @Test
    void calcStatus_should_return_normal_when_quantity_is_null() {
        LocalDate futureDate = LocalDate.now().plusDays(30);
        assertEquals("normal", stockStatusHelper.calcStatus(null, futureDate));
    }

    @Test
    void calcStatus_should_return_near_expiry_when_quantity_null_and_expiry_near() {
        LocalDate in3Days = LocalDate.now().plusDays(3);
        assertEquals("near_expiry", stockStatusHelper.calcStatus(null, in3Days));
    }

    @Test
    void calcStatus_should_not_return_high_stock_when_quantity_4999() {
        LocalDate futureDate = LocalDate.now().plusDays(30);
        assertEquals("normal", stockStatusHelper.calcStatus(4999, futureDate));
    }

    @Test
    void calcStatus_should_not_return_near_expiry_when_expiry_in_8_days() {
        LocalDate in8Days = LocalDate.now().plusDays(8);
        assertEquals("normal", stockStatusHelper.calcStatus(100, in8Days));
    }

    @Test
    void calcStatus_should_handle_zero_quantity() {
        LocalDate futureDate = LocalDate.now().plusDays(30);
        assertEquals("normal", stockStatusHelper.calcStatus(0, futureDate));
    }

    @Test
    void calcStatus_should_handle_negative_quantity() {
        LocalDate futureDate = LocalDate.now().plusDays(30);
        assertEquals("normal", stockStatusHelper.calcStatus(-100, futureDate));
    }

    @Test
    void calcStatus_should_prefer_high_stock_over_near_expiry() {
        LocalDate nearExpiry = LocalDate.now().plusDays(3);
        assertEquals("high_stock", stockStatusHelper.calcStatus(6000, nearExpiry));
    }
}

