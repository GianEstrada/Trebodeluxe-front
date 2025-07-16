#!/bin/bash
# start.sh - Script de inicio para Render

# Configurar puerto
export PORT=${PORT:-10000}

# Mostrar información del entorno
echo "🚀 Iniciando Treboluxe Frontend..."
echo "📍 Puerto: $PORT"
echo "🌍 Entorno: $NODE_ENV"
echo "🔗 Host: 0.0.0.0"

# Iniciar la aplicación
echo "🎯 Ejecutando: next start -H 0.0.0.0 -p $PORT"
npx next start -H 0.0.0.0 -p $PORT
