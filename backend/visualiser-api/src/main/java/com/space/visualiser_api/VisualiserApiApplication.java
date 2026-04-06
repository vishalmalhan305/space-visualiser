package com.space.visualiser_api;

import com.space.visualiser_api.entity.Asteroid;
import com.space.visualiser_api.repository.AsteroidRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.time.LocalDate;
import java.time.LocalDateTime;

@SpringBootApplication
@EnableScheduling
public class VisualiserApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(VisualiserApiApplication.class, args);

	}
	@Bean
    CommandLineRunner initDatabase(AsteroidRepository repository) {
		return args -> {
			if (repository.count() == 0) {
				System.out.println("--- Seeding Demo Data ---");

				Asteroid demo1 = new Asteroid();
				demo1.setExternalId("demo-1");
				demo1.setName("Test Asteroid Alpha");
				demo1.setCloseApproachDate(LocalDate.now());
				demo1.setMissDistanceKm(150000.0);
				demo1.setHazardous(false);
				demo1.setIngestedAt(LocalDateTime.now());
				repository.save(demo1);
				System.out.println("--- Demo Data Persisted ---");
			} else {
				System.out.println("--- Database already has data, skipping seed ---");
			}
		};
	}
}
