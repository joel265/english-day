<#
.SYNOPSIS
    Script de Pruebas de Carga y Concurrencia - English Up (SENA ADSO).
    Tarea 13 de Backend / Tarea 6 de QA (Hito H2 / RNF-02 / CP-01 a CP-11).

.DESCRIPTION
    Simula entre 30 y 50 aprendices concurrentes conectándose, registrándose y consultando
    la plataforma en tiempo real. Valida que el 95% de las peticiones (p95) respondan
    en menos de 200 ms sin pérdida de paquetes ni bloqueos en base de datos.

.PARAMETER BaseUrl
    URL base del backend (ej. http://localhost:8080 o https://tu-tunel.trycloudflare.com).

.PARAMETER TotalUsers
    Cantidad de aprendices concurrentes a simular (por defecto 50).

.PARAMETER Pin
    PIN de sala existente (si no se especifica, el script crea una sala automáticamente).

.EXAMPLE
    .\load_test_simulation.ps1 -BaseUrl "http://localhost:8080" -TotalUsers 50
#>

param(
    [string]$BaseUrl = "http://localhost:8080",
    [int]$TotalUsers = 50,
    [string]$Pin = ""
)

$ErrorActionPreference = "Continue"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  ENGLISH UP (SENA ADSO) - PRUEBA DE CARGA Y CONCURRENCIA" -ForegroundColor Cyan
Write-Host "  Tarea 13 (Backend) & Tarea 6 (QA) | Criterio RNF-02" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Servidor objetivo   : $BaseUrl" -ForegroundColor Yellow
Write-Host "Usuarios simultáneos: $TotalUsers dispositivos" -ForegroundColor Yellow
Write-Host "Límite latencia p95 : 200 ms (Criterio de Aceptación)" -ForegroundColor Yellow
Write-Host "----------------------------------------------------------"

# 1. Crear sala si no se proporcionó PIN
$RoomId = ""
if ([string]::IsNullOrWhiteSpace($Pin)) {
    Write-Host "[1/4] Creando sala para la prueba de carga..." -NoNewline
    try {
        $createRes = Invoke-RestMethod -Uri "$BaseUrl/api/rooms" -Method Post -ContentType "application/json" -TimeoutSec 10
        $Pin = $createRes.pin
        $RoomId = $createRes.roomId
        Write-Host " [OK] PIN generado: $Pin (Room: $RoomId)" -ForegroundColor Green
    } catch {
        Write-Host " [ERROR] No se pudo conectar a $BaseUrl`: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[1/4] Utilizando PIN proporcionado: $Pin" -ForegroundColor Green
}

# 2. Simulación de Join Concurrente (30 a 50 participantes)
Write-Host "`n[2/4] Disparando $TotalUsers peticiones concurrentes de registro (POST /api/rooms/$Pin/join)..."
$latencies = [System.Collections.Concurrent.ConcurrentBag[long]]::new()
$successCount = [System.Threading.Interlocked]::Exchange([ref]0, 0)
$errors = [System.Collections.Concurrent.ConcurrentBag[string]]::new()

$startTime = [System.Diagnostics.Stopwatch]::StartNew()

[System.Threading.Tasks.Parallel]::For(1, $TotalUsers + 1, [System.Action[int]]{
    param($i)
    $nick = "aprendiz_$("{0:D2}" -f $i)"
    $body = @{ nickname = $nick } | ConvertTo-Json

    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $res = Invoke-RestMethod -Uri "$BaseUrl/api/rooms/$Pin/join" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 10
        $sw.Stop()
        $latencies.Add($sw.ElapsedMilliseconds)
        [System.Threading.Interlocked]::Increment([ref]$script:successCount) | Out-Null
    } catch {
        $sw.Stop()
        $errors.Add("H-$i`: $_")
    }
})

$startTime.Stop()
$totalElapsedSec = [math]::Round($startTime.Elapsed.TotalSeconds, 2)

# 3. Cálculo de Estadísticas y Percentiles
$sortedLatencies = $latencies.ToArray() | Sort-Object
$count = $sortedLatencies.Count

if ($count -gt 0) {
    $min = $sortedLatencies[0]
    $max = $sortedLatencies[-1]
    $avg = [math]::Round(($sortedLatencies | Measure-Object -Average).Average, 2)
    $p50Index = [math]::Max(0, [int][math]::Ceiling($count * 0.50) - 1)
    $p95Index = [math]::Max(0, [int][math]::Ceiling($count * 0.95) - 1)
    $p99Index = [math]::Max(0, [int][math]::Ceiling($count * 0.99) - 1)

    $p50 = $sortedLatencies[$p50Index]
    $p95 = $sortedLatencies[$p95Index]
    $p99 = $sortedLatencies[$p99Index]
    $rps = [math]::Round($count / [math]::Max(0.001, $startTime.Elapsed.TotalSeconds), 1)

    Write-Host "`n[3/4] Métricas de Rendimiento Obtenidas:" -ForegroundColor Cyan
    Write-Host "----------------------------------------------------------"
    Write-Host "  Peticiones exitosas   : $count de $TotalUsers ($([math]::Round(($count / $TotalUsers) * 100, 1))%)" -ForegroundColor $(if ($count -eq $TotalUsers) { "Green" } else { "Yellow" })
    Write-Host "  Errores registrados   : $($errors.Count)" -ForegroundColor $(if ($errors.Count -eq 0) { "Green" } else { "Red" })
    Write-Host "  Tiempo total ráfaga   : $totalElapsedSec segundos ($rps req/seg)"
    Write-Host "  Latencia Mínima       : $min ms"
    Write-Host "  Latencia Media        : $avg ms"
    Write-Host "  Latencia Mediana (p50): $p50 ms"
    Write-Host "  Latencia p95 (RNF-02) : $p95 ms" -ForegroundColor $(if ($p95 -le 200) { "Green" } else { "Red" })
    Write-Host "  Latencia p99          : $p99 ms"
    Write-Host "  Latencia Máxima       : $max ms"
    Write-Host "----------------------------------------------------------"

    # 4. Evaluación de Criterio de Aceptación
    Write-Host "`n[4/4] Dictamen de Control de Calidad (Exit Criteria §6):" -ForegroundColor Cyan
    $passedLatency = ($p95 -le 200)
    $passedReliability = ($errors.Count -eq 0)

    if ($passedLatency -and $passedReliability) {
        Write-Host "  >>> RESULTADO: APROBADO (PASS) <<<" -ForegroundColor Green
        Write-Host "  El servidor soporta la carga concurrente con p95 <= 200 ms y 0% de pérdidas." -ForegroundColor Green
    } else {
        Write-Host "  >>> RESULTADO: REPROBADO (FAIL) <<<" -ForegroundColor Red
        if (-not $passedLatency) {
            Write-Host "  - Latencia p95 ($p95 ms) superó el umbral máximo de 200 ms." -ForegroundColor Red
        }
        if (-not $passedReliability) {
            Write-Host "  - Se presentaron $($errors.Count) fallos en las peticiones." -ForegroundColor Red
        }
    }
} else {
    Write-Host "`n[ERROR] Todas las peticiones fallaron. Servidor inalcanzable." -ForegroundColor Red
}
Write-Host "==========================================================`n"
