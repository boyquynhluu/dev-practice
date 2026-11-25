package com.devpractice.javaapi.common;

import org.springframework.http.HttpStatus;

public class ApiException extends RuntimeException {
    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() { return status; }

    public static ApiException notFound(String message) { return new ApiException(HttpStatus.NOT_FOUND, message); }

    public static ApiException badRequest(String message) { return new ApiException(HttpStatus.BAD_REQUEST, message); }

    public static ApiException tooMany(String message) { return new ApiException(HttpStatus.TOO_MANY_REQUESTS, message); }
}
