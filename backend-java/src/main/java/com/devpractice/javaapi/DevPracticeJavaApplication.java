package com.devpractice.javaapi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class DevPracticeJavaApplication {
    public static void main(String[] args) {
        SpringApplication.run(DevPracticeJavaApplication.class, args);
    }
}
