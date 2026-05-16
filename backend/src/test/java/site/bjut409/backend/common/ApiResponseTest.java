
package site.bjut409.backend.common;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ApiResponseTest {

    @Test
    void success_with_data_should_create_correct_response() {
        String data = "test data";
        ApiResponse response = ApiResponse.success(data);
        
        assertEquals(200, response.code());
        assertEquals("success", response.message());
        assertEquals(data, response.data());
    }

    @Test
    void success_with_null_data_should_work() {
        ApiResponse response = ApiResponse.success(null);
        
        assertEquals(200, response.code());
        assertEquals("success", response.message());
        assertNull(response.data());
    }

    @Test
    void success_without_data_should_create_correct_response() {
        ApiResponse response = ApiResponse.success();
        
        assertEquals(200, response.code());
        assertEquals("success", response.message());
        assertNull(response.data());
    }

    @Test
    void fail_should_create_correct_response() {
        int errorCode = 400;
        String errorMessage = "Bad Request";
        ApiResponse response = ApiResponse.fail(errorCode, errorMessage);
        
        assertEquals(errorCode, response.code());
        assertEquals(errorMessage, response.message());
        assertNull(response.data());
    }

    @Test
    void fail_with_404_code_should_work() {
        ApiResponse response = ApiResponse.fail(404, "Not Found");
        
        assertEquals(404, response.code());
        assertEquals("Not Found", response.message());
    }

    static class TestData {
        String name;
        int value;
        
        TestData(String name, int value) {
            this.name = name;
            this.value = value;
        }
    }
}

