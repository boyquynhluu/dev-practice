package com.devpractice.javaapi.runner;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("runner")
public record RunnerProperties(String libDir, int timeoutSeconds, int testTimeoutSeconds, int maxConcurrent,
                               int maxOutputBytes, int maxCodeChars) {
}
