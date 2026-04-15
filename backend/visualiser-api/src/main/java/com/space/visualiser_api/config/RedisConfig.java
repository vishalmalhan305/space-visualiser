package com.space.visualiser_api.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializer;

@Configuration
public class RedisConfig {

@Bean
public RedisTemplate<String, Object> redisTemplate(
        RedisConnectionFactory connectionFactory,
        ObjectMapper objectMapper
) {
    RedisTemplate<String, Object> template = new RedisTemplate<>();
    template.setConnectionFactory(connectionFactory);
    
    // Use the non-deprecated constructor for JSON serialization
    var jsonSerializer = new GenericJackson2JsonRedisSerializer(objectMapper);

    template.setKeySerializer(RedisSerializer.string());
    template.setValueSerializer(jsonSerializer);
    
    template.setHashKeySerializer(RedisSerializer.string());
    template.setHashValueSerializer(jsonSerializer);
    
    template.afterPropertiesSet();
    return template;
}}