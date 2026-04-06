package com.space.visualiser_api.visualiser.ingestion;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class ApodStartupSeeder implements ApplicationRunner {

    private final ApodIngestionJob apodIngestionJob;

    public ApodStartupSeeder(ApodIngestionJob apodIngestionJob) {
        this.apodIngestionJob = apodIngestionJob;
    }

    @Override
    public void run(ApplicationArguments args) {
        apodIngestionJob.ensureTodayApodExists();
    }
}
