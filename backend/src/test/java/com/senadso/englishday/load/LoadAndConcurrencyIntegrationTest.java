package com.senadso.englishday.load;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.TextNode;
import com.senadso.englishday.dto.CreateRoomResponse;
import com.senadso.englishday.dto.JoinRoomRequest;
import com.senadso.englishday.dto.JoinRoomResponse;
import com.senadso.englishday.dto.PodiumResponse;
import com.senadso.englishday.dto.SubmitAnswerRequest;
import com.senadso.englishday.model.Player;
import com.senadso.englishday.model.Question;
import com.senadso.englishday.model.enums.QuestionType;
import com.senadso.englishday.repository.AnswerRepository;
import com.senadso.englishday.repository.PlayerRepository;
import com.senadso.englishday.repository.QuestionRepository;
import com.senadso.englishday.repository.RoomRepository;
import com.senadso.englishday.repository.ScoreRepository;
import com.senadso.englishday.service.AnswerService;
import com.senadso.englishday.service.RoomService;
import com.senadso.englishday.service.ScoreService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pruebas de Carga y Concurrencia para la Tarea 13 de Backend y Tarea 6 de QA:
 * Simulación de 30 a 50 conexiones y peticiones concurrentes simultáneas.
 * Valida los Criterios de Aceptación de EDT 1.5, RNF-02 y Plan de Pruebas §3.3 y §6:
 * - Estabilidad ante 30-50 aprendices concurrentes.
 * - Latencia percentil 95 (p95) < 200 ms.
 * - Integridad transaccional sin bloqueos ni pérdida de datos en MySQL/H2.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class LoadAndConcurrencyIntegrationTest {

    public static final int CONCURRENT_USERS = 50;
    public static final long MAX_P95_LATENCY_MS = 200;

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private RoomService roomService;

    @Autowired
    private AnswerService answerService;

    @Autowired
    private ScoreService scoreService;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private AnswerRepository answerRepository;

    @Autowired
    private ScoreRepository scoreRepository;

    private Question testQuestion;

    @BeforeEach
    void setUp() {
        scoreRepository.deleteAll();
        answerRepository.deleteAll();
        playerRepository.deleteAll();
        roomRepository.deleteAll();
        questionRepository.deleteAll();

        // Configurar pregunta base de prueba
        testQuestion = Question.builder()
                .type(QuestionType.MULTIPLE_CHOICE)
                .prompt("Choose the correct past tense of 'go'.")
                .options(List.of("goed", "went", "gone", "going"))
                .correctAnswer("went")
                .timeLimitSeconds(15)
                .order(1)
                .build();
        testQuestion = questionRepository.save(testQuestion);
    }

    @AfterEach
    void tearDown() {
        scoreRepository.deleteAll();
        answerRepository.deleteAll();
        playerRepository.deleteAll();
        roomRepository.deleteAll();
        questionRepository.deleteAll();
    }

    @Test
    @DisplayName("Tarea 13 / RNF-02: 50 aprendices se unen concurrentemente a la sala (POST /api/rooms/{pin}/join) con latencia p95 < 200ms")
    void testConcurrentRoomJoinLoad() throws InterruptedException {
        // 1. Crear sala para la prueba de carga
        CreateRoomResponse room = roomService.createRoom();
        String pin = room.getPin();

        ExecutorService executor = Executors.newFixedThreadPool(CONCURRENT_USERS);
        CountDownLatch readyLatch = new CountDownLatch(CONCURRENT_USERS);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(CONCURRENT_USERS);

        ConcurrentLinkedQueue<Long> latenciesMs = new ConcurrentLinkedQueue<>();
        AtomicInteger successCount = new AtomicInteger(0);

        for (int i = 1; i <= CONCURRENT_USERS; i++) {
            final String nickname = "aprendiz_" + String.format("%02d", i);
            executor.submit(() -> {
                readyLatch.countDown();
                try {
                    // Esperar señal para disparo simultáneo
                    startLatch.await();

                    long startTime = System.currentTimeMillis();
                    ResponseEntity<JoinRoomResponse> response = restTemplate.postForEntity(
                            "/api/rooms/" + pin + "/join",
                            JoinRoomRequest.builder().nickname(nickname).build(),
                            JoinRoomResponse.class
                    );
                    long elapsed = System.currentTimeMillis() - startTime;
                    latenciesMs.add(elapsed);

                    if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                        successCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        // Asegurar que todos los hilos estén listos antes de liberar el gatillo
        assertThat(readyLatch.await(5, TimeUnit.SECONDS)).isTrue();
        startLatch.countDown();

        // Esperar finalización de las 50 peticiones concurrentes
        assertThat(doneLatch.await(15, TimeUnit.SECONDS)).isTrue();
        executor.shutdown();

        // Validaciones funcionales y de concurrencia
        assertThat(successCount.get()).isEqualTo(CONCURRENT_USERS);
        List<Player> playersInDb = playerRepository.findByRoom_RoomId(room.getRoomId());
        assertThat(playersInDb).hasSize(CONCURRENT_USERS);

        // Validación de métricas de rendimiento (RNF-02 / Criterio de Aceptación Plan de Pruebas §6)
        List<Long> sortedLatencies = new ArrayList<>(latenciesMs);
        Collections.sort(sortedLatencies);
        int p95Index = (int) Math.ceil(sortedLatencies.size() * 0.95) - 1;
        long p95Latency = sortedLatencies.get(Math.max(0, p95Index));

        System.out.println("=== REPORTE DE CARGA TAREA 13: JOIN CONCURRENTE ===");
        System.out.println("Total conexiones: " + CONCURRENT_USERS);
        System.out.println("Exitosas: " + successCount.get());
        System.out.println("Latencia Mínima: " + sortedLatencies.get(0) + " ms");
        System.out.println("Latencia Mediana (p50): " + sortedLatencies.get(sortedLatencies.size() / 2) + " ms");
        System.out.println("Latencia Percentil 95 (p95): " + p95Latency + " ms");
        System.out.println("Latencia Máxima: " + sortedLatencies.get(sortedLatencies.size() - 1) + " ms");

        assertThat(p95Latency)
                .withFailMessage("La latencia p95 (" + p95Latency + " ms) superó el límite de " + MAX_P95_LATENCY_MS + " ms establecido en RNF-02")
                .isLessThanOrEqualTo(MAX_P95_LATENCY_MS);
    }

    @Test
    @DisplayName("Tarea 13 / RNF-02 / CU-04: 50 aprendices envían respuestas simultáneas sin colisiones transaccionales")
    void testConcurrentAnswerSubmissionsLoad() throws InterruptedException {
        // 1. Registrar 50 participantes en la sala
        CreateRoomResponse room = roomService.createRoom();
        List<JoinRoomResponse> players = new ArrayList<>();
        for (int i = 1; i <= CONCURRENT_USERS; i++) {
            JoinRoomResponse p = roomService.joinRoom(
                    room.getPin(),
                    JoinRoomRequest.builder().nickname("runner_" + i).build()
            );
            players.add(p);
        }

        // Iniciar la partida
        roomService.startGame(room.getRoomId());

        ExecutorService executor = Executors.newFixedThreadPool(CONCURRENT_USERS);
        CountDownLatch readyLatch = new CountDownLatch(CONCURRENT_USERS);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(CONCURRENT_USERS);

        ConcurrentLinkedQueue<Long> latenciesMs = new ConcurrentLinkedQueue<>();
        AtomicInteger successCount = new AtomicInteger(0);

        for (int i = 0; i < CONCURRENT_USERS; i++) {
            final JoinRoomResponse player = players.get(i);
            final int responseTimeMs = 1000 + (i * 100);
            executor.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await();

                    long startTime = System.currentTimeMillis();
                    SubmitAnswerRequest request = SubmitAnswerRequest.builder()
                            .playerId(player.getPlayerId())
                            .questionId(testQuestion.getQuestionId())
                            .value(new TextNode("went"))
                            .clientTimestamp(LocalDateTime.now(ZoneOffset.UTC))
                            .build();

                    answerService.processAnswer(room.getRoomId(), request);
                    long elapsed = System.currentTimeMillis() - startTime;
                    latenciesMs.add(elapsed);
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        assertThat(readyLatch.await(5, TimeUnit.SECONDS)).isTrue();
        startLatch.countDown();
        assertThat(doneLatch.await(15, TimeUnit.SECONDS)).isTrue();
        executor.shutdown();

        // Validar integridad en base de datos
        assertThat(successCount.get()).isEqualTo(CONCURRENT_USERS);
        assertThat(answerRepository.count()).isEqualTo(CONCURRENT_USERS);
        assertThat(scoreRepository.count()).isEqualTo(CONCURRENT_USERS);

        // Validar que el p95 de procesamiento concurrentemente no exceda el umbral
        List<Long> sortedLatencies = new ArrayList<>(latenciesMs);
        Collections.sort(sortedLatencies);
        long p95Latency = sortedLatencies.get((int) Math.ceil(sortedLatencies.size() * 0.95) - 1);

        System.out.println("=== REPORTE DE CARGA TAREA 13: RESPUESTAS CONCURRENTES ===");
        System.out.println("Respuestas procesadas: " + successCount.get() + " / " + CONCURRENT_USERS);
        System.out.println("Latencia p95 procesamiento concurrente: " + p95Latency + " ms");

        assertThat(p95Latency).isLessThanOrEqualTo(MAX_P95_LATENCY_MS);
    }

    @Test
    @DisplayName("Tarea 13 / CU-06: 50 consultas concurrentes del Podio Final (GET /api/rooms/{roomId}/results)")
    void testConcurrentPodiumQueriesLoad() throws InterruptedException {
        CreateRoomResponse room = roomService.createRoom();

        // 3 aprendices con puntajes
        for (int i = 1; i <= 3; i++) {
            JoinRoomResponse p = roomService.joinRoom(room.getPin(), JoinRoomRequest.builder().nickname("winner_" + i).build());
            Player pl = playerRepository.findById(p.getPlayerId()).orElseThrow();
            pl.setTotalScore(1000 * i);
            playerRepository.save(pl);
        }

        scoreService.finalizeGameAndBroadcastPodium(room.getRoomId());

        ExecutorService executor = Executors.newFixedThreadPool(CONCURRENT_USERS);
        CountDownLatch readyLatch = new CountDownLatch(CONCURRENT_USERS);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(CONCURRENT_USERS);

        ConcurrentLinkedQueue<Long> latenciesMs = new ConcurrentLinkedQueue<>();
        AtomicInteger successCount = new AtomicInteger(0);

        for (int i = 0; i < CONCURRENT_USERS; i++) {
            executor.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await();
                    long startTime = System.currentTimeMillis();
                    ResponseEntity<PodiumResponse> response = restTemplate.getForEntity(
                            "/api/rooms/" + room.getRoomId() + "/results",
                            PodiumResponse.class
                    );
                    long elapsed = System.currentTimeMillis() - startTime;
                    latenciesMs.add(elapsed);

                    if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                        successCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        assertThat(readyLatch.await(5, TimeUnit.SECONDS)).isTrue();
        startLatch.countDown();
        assertThat(doneLatch.await(15, TimeUnit.SECONDS)).isTrue();
        executor.shutdown();

        assertThat(successCount.get()).isEqualTo(CONCURRENT_USERS);
        List<Long> sortedLatencies = new ArrayList<>(latenciesMs);
        Collections.sort(sortedLatencies);
        long p95Latency = sortedLatencies.get((int) Math.ceil(sortedLatencies.size() * 0.95) - 1);

        System.out.println("=== REPORTE DE CARGA TAREA 13: CONSULTAS DE PODIO ===");
        System.out.println("Peticiones concurrentes exitosas: " + successCount.get() + " / " + CONCURRENT_USERS);
        System.out.println("Latencia p95 consulta podio: " + p95Latency + " ms");

        assertThat(p95Latency).isLessThanOrEqualTo(MAX_P95_LATENCY_MS);
    }
}
