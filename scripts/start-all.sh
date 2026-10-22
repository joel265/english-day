#!/usr/bin/env bash
# ==============================================================================
# start-all.sh - Inicia Backend Spring Boot y Cloudflare Tunnel simultáneamente
# ==============================================================================
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "===================================================================="
echo "  🚀 INICIANDO ENTORNO COMPLETO: ENGLISH UP SENA 2026"
echo "===================================================================="

# 1. Comprobar Java
if [ -z "$JAVA_HOME" ]; then
  if [ -d "/Users/joelgelvis/Library/Java/JavaVirtualMachines/jdk-26.0.1.jdk/Contents/Home" ]; then
    export JAVA_HOME="/Users/joelgelvis/Library/Java/JavaVirtualMachines/jdk-26.0.1.jdk/Contents/Home"
  elif /usr/libexec/java_home &> /dev/null; then
    export JAVA_HOME="$(/usr/libexec/java_home)"
  fi
fi

# 2. Comprobar si Spring Boot ya está corriendo en el puerto 8080
if curl -s http://localhost:8080/ > /dev/null 2>&1; then
  echo "✔ Servidor Spring Boot ya detectado y respondiendo en http://localhost:8080"
else
  echo "📦 Compilando e iniciando Spring Boot (Perfil H2)..."
  ./backend/mvnw -f backend/pom.xml spring-boot:run -Dspring-boot.run.profiles=h2 &
  BOOT_PID=$!

  echo "⏳ Esperando a que el backend arranque en http://localhost:8080..."
  for i in {1..40}; do
    if curl -s http://localhost:8080/ > /dev/null 2>&1; then
      echo "✔ Spring Boot listo."
      break
    fi
    sleep 1
  done
fi

# 3. Iniciar Cloudflare Tunnel
echo "🌐 Iniciando túnel de Cloudflare..."
exec ./scripts/start-tunnel.sh "$@"
