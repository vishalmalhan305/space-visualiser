package com.space.visualiser_api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableAsync
public class VisualiserApiApplication {
//to do Circuit Breaker
	public static void main(String[] args) {
		SpringApplication.run(VisualiserApiApplication.class, args);
	}
}
