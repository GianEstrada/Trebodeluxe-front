#!/bin/bash

# Script de despliegue para Render
# Este script se ejecuta automáticamente en Render

echo "🚀 Iniciando despliegue de Treboluxe Frontend..."

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm ci --only=production

# Construir la aplicación
echo "🔨 Construyendo aplicación..."
npm run build

# Verificar que el build fue exitoso
if [ $? -eq 0 ]; then
    echo "✅ Build completado exitosamente"
    echo "🌟 Aplicación lista para servir en producción"
else
    echo "❌ Error en el build"
    exit 1
fi

echo "🎉 Despliegue completado!"
