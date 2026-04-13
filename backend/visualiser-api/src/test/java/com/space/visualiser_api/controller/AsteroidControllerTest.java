package com.space.visualiser_api.controller;

import com.space.visualiser_api.entity.Asteroid;
import com.space.visualiser_api.service.AsteroidService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AsteroidController.class)
class AsteroidControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AsteroidService asteroidService;

    @Test
    void getAsteroidsPage_ReturnsPaginatedData() throws Exception {
        // Arrange
        Asteroid asteroid = new Asteroid();
        asteroid.setNeoId("123");
        Page<Asteroid> page = new PageImpl<>(List.of(asteroid));
        
        when(asteroidService.getAsteroidsPage(eq(true), eq(0), eq(10)))
                .thenReturn(page);

        // Act & Assert
        mockMvc.perform(get("/api/asteroids/page")
                        .param("hazardous", "true")
                        .param("page", "0")
                        .param("size", "10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].neoId").value("123"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }
}
