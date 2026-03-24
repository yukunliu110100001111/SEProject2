package site.bjut409.backend.common;

public class BizException extends RuntimeException {

    private final int httpStatus;
    private final int code;

    public BizException(int httpStatus, int code, String message) {
        super(message);
        this.httpStatus = httpStatus;
        this.code = code;
    }

    public int getHttpStatus() {
        return httpStatus;
    }

    public int getCode() {
        return code;
    }
}
