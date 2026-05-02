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

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
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
    void getPhotos_WithValidRover_ReturnsPhotosList() throws Exception {
        MarsPhoto photo = new MarsPhoto();
        photo.setPhotoId(12345L);
        photo.setRover("curiosity");
        photo.setImgSrc("https://images-assets.nasa.gov/image/PIA12345/PIA12345~thumb.jpg");

        when(marsService.getPhotos(eq("curiosity"))).thenReturn(List.of(photo));

        mockMvc.perform(get("/api/mars/photos")
                        .param("rover", "curiosity")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].photoId").value(12345L))
                .andExpect(jsonPath("$[0].rover").value("curiosity"));
    }

    @Test
    void getPhotos_MissingRoverParam_ReturnsBadRequest() throws Exception {
        mockMvc.perform(get("/api/mars/photos")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getPhotos_BlankRover_ThrowsValidationException() throws Exception {
        ServletException exception = assertThrows(
                ServletException.class,
                () -> mockMvc.perform(get("/api/mars/photos")
                                .param("rover", "   ")
                                .contentType(MediaType.APPLICATION_JSON))
                        .andReturn()
        );
        assertTrue(exception.getMessage().contains("ConstraintViolationException"));
    }
}
