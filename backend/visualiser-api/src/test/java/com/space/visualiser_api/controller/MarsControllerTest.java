package com.space.visualiser_api.controller;

import com.space.visualiser_api.entity.MarsPhoto;
import com.space.visualiser_api.service.MarsService;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(MarsController.class)
class MarsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private MarsService marsService;

    @Test
    void getPhotos_WithValidParams_ReturnsPhotosList() throws Exception {
        // Arrange
        MarsPhoto photo = new MarsPhoto();
        photo.setPhotoId(12345L);
        photo.setRover("curiosity");
        photo.setImgSrc("http://nasa.gov/img.jpg");
        
        when(marsService.getPhotos(eq("curiosity"), eq("FHAZ"), eq(1000)))
                .thenReturn(List.of(photo));

        // Act & Assert
        mockMvc.perform(get("/api/mars/photos")
                        .param("rover", "curiosity")
                        .param("camera", "FHAZ")
                        .param("sol", "1000")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].photoId").value(12345L))
                .andExpect(jsonPath("$[0].rover").value("curiosity"));
    }

    @Test
    void getPhotos_MissingRequiredParam_ReturnsBadRequest() throws Exception {
        mockMvc.perform(get("/api/mars/photos")
                        .param("rover", "curiosity")
                        // missing sol
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getPhotos_InvalidSol_ThrowsValidationException() throws Exception {
        ServletException exception = org.junit.jupiter.api.Assertions.assertThrows(
                ServletException.class,
                () -> mockMvc.perform(get("/api/mars/photos")
                                .param("rover", "curiosity")
                                .param("sol", "-1")
                                .contentType(MediaType.APPLICATION_JSON))
                        .andReturn()
        );
        assertTrue(exception.getMessage().contains("ConstraintViolationException"));
    }
}
