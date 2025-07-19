#!/bin/bash

echo "🔍 Verificando configuración de Trebodeluxe..."
echo

# Verificar directorio actual
echo "📁 Directorio actual:"
pwd
echo

# Verificar archivos principales
echo "📋 Verificando archivos principales:"
if [ -f "package.json" ]; then
    echo "✅ package.json encontrado"
else
    echo "❌ package.json NO encontrado"
fi

if [ -f "next.config.js" ]; then
    echo "✅ next.config.js encontrado"
else
    echo "❌ next.config.js NO encontrado"
fi

echo

# Verificar componentes
echo "🧩 Verificando componentes:"
if [ -f "components/NavigationBar.tsx" ]; then
    echo "✅ NavigationBar.tsx encontrado"
else
    echo "❌ NavigationBar.tsx NO encontrado"
fi

if [ -f "components/Layout.tsx" ]; then
    echo "✅ Layout.tsx encontrado"
else
    echo "❌ Layout.tsx NO encontrado"
fi

echo

# Verificar páginas
echo "📄 Verificando páginas:"
pages=("index.tsx" "catalogo.tsx" "carrito.tsx" "checkout.tsx")
for page in "${pages[@]}"; do
    if [ -f "pages/$page" ]; then
        echo "✅ $page encontrado"
    else
        echo "❌ $page NO encontrado"
    fi
done

echo

# Verificar node_modules
echo "📦 Verificando dependencias:"
if [ -d "node_modules" ]; then
    echo "✅ node_modules encontrado"
else
    echo "❌ node_modules NO encontrado - ejecuta npm install"
fi

echo
echo "🎯 Para iniciar el servidor de desarrollo:"
echo "npm run dev"
echo
echo "🌐 La aplicación debería estar disponible en:"
echo "http://localhost:3000"
