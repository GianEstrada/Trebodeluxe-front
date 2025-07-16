#!/bin/bash

# Script de verificación previa al despliegue
echo "🔍 Verificando configuración para despliegue..."

# Verificar que existe package.json
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json no encontrado"
    exit 1
fi

# Verificar que existe next.config.js
if [ ! -f "next.config.js" ]; then
    echo "❌ Error: next.config.js no encontrado"
    exit 1
fi

# Verificar variables de entorno
if [ ! -f ".env.production" ]; then
    echo "⚠️ Advertencia: .env.production no encontrado"
fi

# Verificar dependencias críticas
echo "📋 Verificando dependencias críticas..."
npm ls next react react-dom > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Error: Dependencias críticas faltantes"
    exit 1
fi

# Verificar sintaxis
echo "🔍 Verificando sintaxis..."
npm run lint > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "⚠️ Advertencia: Problemas de linting encontrados"
fi

# Probar build
echo "🔨 Probando build..."
npm run build > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Error: Build falló"
    exit 1
fi

echo "✅ Todas las verificaciones pasaron"
echo "🚀 Listo para desplegar en Render"

# Limpiar archivos de build para evitar conflictos
rm -rf .next
echo "🧹 Archivos de build limpiados"
