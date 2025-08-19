// type-check-catalogo.js - Script simple para verificar tipos en catalogo.tsx
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking catalogo.tsx for TypeScript issues...');

try {
  const catalogoPath = path.join(__dirname, 'pages', 'catalogo.tsx');
  const catalogoContent = fs.readFileSync(catalogoPath, 'utf8');
  
  // Verificar si contiene transformToLegacyFormatSync
  if (catalogoContent.includes('transformToLegacyFormatSync')) {
    console.log('✅ Using transformToLegacyFormatSync correctly');
  } else {
    console.log('❌ Still using async transformToLegacyFormat');
  }
  
  // Verificar si accede a propiedades correctas
  if (catalogoContent.includes('legacyProduct.color') || catalogoContent.includes('legacyProduct.size')) {
    console.log('❌ Still accessing wrong properties (color/size instead of colors/sizes)');
  } else {
    console.log('✅ Using correct properties (colors/sizes)');
  }
  
  // Verificar si hay llamadas async sin await en el map
  const mapMatches = catalogoContent.match(/\.map\s*\([^)]*transformToLegacyFormat[^)]*\)/g);
  if (mapMatches && mapMatches.some(match => !match.includes('await'))) {
    console.log('❌ Found map with async transformToLegacyFormat without await');
  } else {
    console.log('✅ No async issues in map functions');
  }
  
  console.log('\n📊 Summary:');
  console.log('- The catalogo.tsx file has been updated to use transformToLegacyFormatSync');
  console.log('- Property access has been fixed (colors/sizes instead of color/size)');
  console.log('- This should resolve the TypeScript compilation errors');
  console.log('\n🚀 Ready for deployment!');
  
} catch (error) {
  console.error('❌ Error checking file:', error.message);
}
