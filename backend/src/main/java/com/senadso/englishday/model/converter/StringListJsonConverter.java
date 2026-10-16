package com.senadso.englishday.model.converter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.ArrayList;
import java.util.List;

/**
 * Convierte un List<String> a JSON String para almacenamiento en la BD (MySQL tipo JSON)
 * y viceversa al leer desde la BD (compatible con MySQL 8.0 y H2 en pruebas).
 */
@Converter
public class StringListJsonConverter implements AttributeConverter<List<String>, String> {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(List<String> attribute) {
        if (attribute == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(attribute);
        } catch (Exception e) {
            throw new IllegalArgumentException("Error al serializar options a formato JSON", e);
        }
    }

    @Override
    public List<String> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return new ArrayList<>();
        }
        try {
            JsonNode node = objectMapper.readTree(dbData);
            // Si el driver de BD o H2 devolvió el JSON envuelto como string literal
            if (node.isTextual()) {
                node = objectMapper.readTree(node.asText());
            }
            if (node.isArray()) {
                List<String> list = new ArrayList<>();
                for (JsonNode item : node) {
                    list.add(item.asText());
                }
                return list;
            }
            return new ArrayList<>();
        } catch (Exception e) {
            throw new IllegalArgumentException("Error al deserializar JSON de options a List<String>: " + dbData, e);
        }
    }
}
