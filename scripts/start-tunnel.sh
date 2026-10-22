#!/usr/bin/env bash
# ==============================================================================
# start-tunnel.sh - Lanzador de Cloudflare Tunnel para English Up SENA 2026
# ==============================================================================
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

# 1. Token preconfigurado de Cloudflare Zero Trust
DEFAULT_TOKEN="eyJhIjoiMzgyOWY3Njg4NDRiNTg4ZTY0Mzk4YzE5NTBiZjQ0YjQiLCJ0IjoiYjZlMjc0OWYtYTNlZC00MjgxLWIwMDMtMzkyOTY0MmJjNWI2IiwicyI6Ik0yWmpNMk14Tm1VdFlUa3hNeTAwTVRZM0xXSm1NakF0T0dRMFlUYzBPVFl4WTJFMCJ9"
DEFAULT_HOSTNAME="https://englishup.jmj.agency"

# 2. Detectar binario de cloudflared
CLOUDFLARED_BIN=""
if command -v cloudflared &> /dev/null; then
  CLOUDFLARED_BIN="cloudflared"
elif [ -x "/opt/homebrew/bin/cloudflared" ]; then
  CLOUDFLARED_BIN="/opt/homebrew/bin/cloudflared"
elif [ -x "/usr/local/bin/cloudflared" ]; then
  CLOUDFLARED_BIN="/usr/local/bin/cloudflared"
else
  echo "❌ Error: 'cloudflared' no está instalado."
  echo "👉 En macOS con Homebrew puedes instalarlo ejecutando:"
  echo "   brew install cloudflared"
  exit 1
fi

PORT="${PORT:-8080}"
TARGET_URL="http://localhost:${PORT}"
PUBLIC_URL_FILE="$DIR/frontend/public-tunnel-url.json"
CACHE_FILE="$DIR/.cloudflare-tunnel-url"

# Comprobar opciones pasadas por CLI
USE_QUICK=false
TUNNEL_TOKEN=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --quick)
      USE_QUICK=true
      shift
      ;;
    --token)
      TUNNEL_TOKEN="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

# Si no se forzó --quick y no se especificó otro token, usar el token configurado
if [ "$USE_QUICK" = false ] && [ -z "$TUNNEL_TOKEN" ]; then
  TUNNEL_TOKEN="${CLOUDFLARE_TUNNEL_TOKEN:-$DEFAULT_TOKEN}"
fi

echo "===================================================================="
echo "  🚀 CLOUDFLARE TUNNEL - ENGLISH UP SENA 2026"
echo "===================================================================="
echo "  Servidor local:  $TARGET_URL"
echo "  Binario usado:   $CLOUDFLARED_BIN"
echo "===================================================================="

# ------------------------------------------------------------------------------
# MODO 1: Token Persistente (Cloudflare Zero Trust)
# ------------------------------------------------------------------------------
if [ -n "$TUNNEL_TOKEN" ] && [ "$USE_QUICK" = false ]; then
  echo "🔑 Modo Túnel Nombrado Activo (Cloudflare Zero Trust)."
  echo "🌐 Dominio público asignado: $DEFAULT_HOSTNAME"
  echo "===================================================================="
  echo "  📱 Vista Aprendiz:   $DEFAULT_HOSTNAME/index.html"
  echo "  🖥️ Panel Moderador:  $DEFAULT_HOSTNAME/moderator.html"
  echo "  🎙️ Web Speech API:  HTTPS Activo (Permisos de voz habilitados)"
  echo "===================================================================="
  echo ""
  echo "⚠️ NOTA IMPORTANTE PARA EL DASHBOARD DE CLOUDFLARE:"
  echo "   Asegúrate de que en Cloudflare Zero Trust (Tunnels > Public Hostname)"
  echo "   el servicio apunte a: http://localhost:$PORT (o http://127.0.0.1:$PORT)"
  echo "===================================================================="
  echo ""

  # Guardar para auto-detección inmediata en moderador y códigos QR
  echo "{\"url\": \"$DEFAULT_HOSTNAME\", \"timestamp\": $(date +%s)}" > "$PUBLIC_URL_FILE"
  echo "$DEFAULT_HOSTNAME" > "$CACHE_FILE"

  exec "$CLOUDFLARED_BIN" tunnel run --token "$TUNNEL_TOKEN"
fi

# ------------------------------------------------------------------------------
# MODO 2: Quick Tunnel (Gratis e instantáneo con trycloudflare.com)
# ------------------------------------------------------------------------------
echo "🌐 Conectando Quick Tunnel a Cloudflare (trycloudflare.com)..."
echo "   (Genera un enlace público temporal HTTPS/WSS sin requerir dominio)"
echo ""

LOG_FILE=$(mktemp /tmp/cloudflared-XXXXXX.log)

"$CLOUDFLARED_BIN" tunnel --url "$TARGET_URL" 2>&1 | tee "$LOG_FILE" &
PID=$!

cleanup() {
  echo ""
  echo "🛑 Deteniendo Cloudflare Tunnel (PID: $PID)..."
  kill "$PID" 2>/dev/null || true
  rm -f "$LOG_FILE" "$PUBLIC_URL_FILE" "$CACHE_FILE"
  echo "✔ Túnel cerrado limpiamente."
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

TUNNEL_URL=""
for i in {1..30}; do
  if grep -E "https://[a-zA-Z0-9.-]+\.trycloudflare\.com" "$LOG_FILE" > /dev/null 2>&1; then
    TUNNEL_URL=$(grep -oE "https://[a-zA-Z0-9.-]+\.trycloudflare\.com" "$LOG_FILE" | head -n 1)
    break
  fi
  sleep 1
done

if [ -n "$TUNNEL_URL" ]; then
  echo ""
  echo "===================================================================="
  echo "  🎉 ¡TÚNEL CLOUDFLARE ACTIVO EXITOSAMENTE!"
  echo "===================================================================="
  echo "  🔗 URL Pública HTTPS:   $TUNNEL_URL"
  echo "  📱 Vista Aprendiz:      $TUNNEL_URL/index.html"
  echo "  🖥️ Panel Moderador:     $TUNNEL_URL/moderator.html"
  echo "  🎙️ Web Speech API:     HTTPS Activo (Permisos de voz habilitados)"
  echo "===================================================================="
  echo ""

  echo "{\"url\": \"$TUNNEL_URL\", \"timestamp\": $(date +%s)}" > "$PUBLIC_URL_FILE"
  echo "$TUNNEL_URL" > "$CACHE_FILE"

  echo "💡 El panel de moderador y los códigos QR utilizarán esta URL automáticamente."
  echo "Presiona Ctrl+C para detener el túnel."
  echo ""
else
  echo "⚠️ No se detectó la URL automáticamente. Revisa los logs en vivo:"
fi

wait "$PID"
