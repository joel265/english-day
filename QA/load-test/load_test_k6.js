import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Script de Carga y Concurrencia k6 - English Up (SENA ADSO)
 * Tarea 13 (Backend) & Tarea 6 (QA)
 *
 * Simulación de 50 usuarios virtuales (VUs) concurrentes.
 * Criterio de Aceptación (RNF-02 / Plan de Pruebas §6):
 * - Latencia p95 < 200 ms
 * - Tasa de error < 1%
 */

export const options = {
    scenarios: {
        concurrent_joins: {
            executor: 'per-vu-iterations',
            vus: 50,
            iterations: 1,
            maxDuration: '30s',
        },
    },
    thresholds: {
        'http_req_duration': ['p(95)<200'], // 95% de peticiones bajo 200 ms
        'http_req_failed': ['rate<0.01'],    // Menos del 1% de errores
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export function setup() {
    // 1. Crear una sala para la prueba de carga
    const res = http.post(`${BASE_URL}/api/rooms`, null, {
        headers: { 'Content-Type': 'application/json' },
    });

    check(res, {
        'Sala creada exitosamente': (r) => r.status === 201,
    });

    const data = JSON.parse(res.body);
    return { pin: data.pin, roomId: data.roomId };
}

export default function (data) {
    const vuId = __VU;
    const nickname = `aprendiz_${String(vuId).padStart(2, '0')}`;

    // 2. Unirse concurrentemente a la sala (POST /api/rooms/{pin}/join)
    const joinPayload = JSON.stringify({ nickname: nickname });
    const joinRes = http.post(`${BASE_URL}/api/rooms/${data.pin}/join`, joinPayload, {
        headers: { 'Content-Type': 'application/json' },
    });

    check(joinRes, {
        'Join exitoso (200 OK)': (r) => r.status === 200,
        'PlayerId generado': (r) => JSON.parse(r.body).playerId !== undefined,
        'Latencia < 200ms': (r) => r.timings.duration < 200,
    });

    sleep(1);

    // 3. Consultar podio/resultados de la sala (GET /api/rooms/{roomId}/results)
    const resultsRes = http.get(`${BASE_URL}/api/rooms/${data.roomId}/results`);
    check(resultsRes, {
        'Consulta de resultados exitosa (200 OK)': (r) => r.status === 200,
    });
}
