package com.senadso.englishday.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Configuración global de CORS y recursos estáticos para los endpoints REST y clientes web
 * de la plataforma English Up.
 * Permite que clientes web y móviles conectados a través de Cloudflare Tunnel
 * o en el mismo origen consuman la API síncrona (/api/**) y las vistas de Frontend.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path frontendDir = resolveFrontendPath();
        if (frontendDir != null) {
            String location = frontendDir.toUri().toString();
            if (!location.endsWith("/")) {
                location = location + "/";
            }
            registry.addResourceHandler("/**")
                    .addResourceLocations(location, "classpath:/static/")
                    .setCacheControl(CacheControl.noCache().mustRevalidate());
        }
    }

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/").setViewName("forward:/index.html");
        registry.addViewController("/moderator").setViewName("forward:/moderator.html");
    }

    private Path resolveFrontendPath() {
        Path direct = Paths.get("frontend").toAbsolutePath().normalize();
        if (Files.isDirectory(direct)) {
            return direct;
        }
        Path parent = Paths.get("..", "frontend").toAbsolutePath().normalize();
        if (Files.isDirectory(parent)) {
            return parent;
        }
        return null;
    }
}
