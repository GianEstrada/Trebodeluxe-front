Write-Host "🔍 Verificando configuración de Trebodeluxe..." -ForegroundColor Cyan
Write-Host ""

# Verificar directorio actual
Write-Host "📁 Directorio actual:" -ForegroundColor Yellow
Get-Location
Write-Host ""

# Verificar archivos principales
Write-Host "📋 Verificando archivos principales:" -ForegroundColor Yellow
if (Test-Path "package.json") {
    Write-Host "✅ package.json encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ package.json NO encontrado" -ForegroundColor Red
}

if (Test-Path "next.config.js") {
    Write-Host "✅ next.config.js encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ next.config.js NO encontrado" -ForegroundColor Red
}

Write-Host ""

# Verificar componentes
Write-Host "🧩 Verificando componentes:" -ForegroundColor Yellow
if (Test-Path "components\NavigationBar.tsx") {
    Write-Host "✅ NavigationBar.tsx encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ NavigationBar.tsx NO encontrado" -ForegroundColor Red
}

if (Test-Path "components\Layout.tsx") {
    Write-Host "✅ Layout.tsx encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ Layout.tsx NO encontrado" -ForegroundColor Red
}

Write-Host ""

# Verificar páginas
Write-Host "📄 Verificando páginas:" -ForegroundColor Yellow
$pages = @("index.tsx", "catalogo.tsx", "carrito.tsx", "checkout.tsx")
foreach ($page in $pages) {
    if (Test-Path "pages\$page") {
        Write-Host "✅ $page encontrado" -ForegroundColor Green
    } else {
        Write-Host "❌ $page NO encontrado" -ForegroundColor Red
    }
}

Write-Host ""

# Verificar node_modules
Write-Host "📦 Verificando dependencias:" -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✅ node_modules encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ node_modules NO encontrado - ejecuta npm install" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 Para iniciar el servidor de desarrollo:" -ForegroundColor Cyan
Write-Host "npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "🌐 La aplicación debería estar disponible en:" -ForegroundColor Cyan
Write-Host "http://localhost:3000" -ForegroundColor White
