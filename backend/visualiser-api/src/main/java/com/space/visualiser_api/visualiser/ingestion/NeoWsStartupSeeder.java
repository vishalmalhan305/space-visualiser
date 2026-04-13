package com.space.visualiser_api.visualiser.ingestion;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class NeoWsStartupSeeder implements ApplicationRunner {

    private final NeoWsIngestionJob neoWsIngestionJob;

    public NeoWsStartupSeeder(NeoWsIngestionJob neoWsIngestionJob) {
        this.neoWsIngestionJob = neoWsIngestionJob;
    }

    @Override
    public void run(ApplicationArguments args) {
        neoWsIngestionJob.ensureCurrentWeekExists();
    }
}
