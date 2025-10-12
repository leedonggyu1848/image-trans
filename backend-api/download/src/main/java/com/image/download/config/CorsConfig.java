package com.image.download.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

	@Override
	public void addCorsMappings(CorsRegistry registry) {
		registry.addMapping("/**") // 모든 경로에 대해
				.allowedOriginPatterns("*") // 허용할 오리진
				.allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS") // 허용할 HTTP 메서드
				.allowedHeaders("*") // 허용할 헤더
				.allowCredentials(true) // 쿠키 인증 요청 허용
				.maxAge(3600); // 프리플라이트 요청 캐시 시간 (초)
	}
}
