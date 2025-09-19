// Test de transformación de productos en frontend

// Función transformToLegacyFormat simplificada
function transformToLegacyFormat(product) {
  if (!product) return null;

  console.log('🔧 transformToLegacyFormat - Producto recibido:', {
    id: product.id_producto || product.id,
    nombre: product.nombre,
    variantes: product.variantes?.length || 0,
    tallas_disponibles: product.tallas_disponibles?.length || 0,
  });

  // Ordenar variantes por ID ascendente
  const sortedVariants = product.variantes ? 
    [...product.variantes].sort((a, b) => a.id_variante - b.id_variante) : [];
  
  // Buscar la primera variante que tenga precio válido
  const variantWithPrice = sortedVariants.find(v => 
    v.precio !== null && v.precio !== undefined && v.precio > 0
  );
  const firstVariant = variantWithPrice || sortedVariants[0];
  const firstImage = firstVariant && firstVariant.imagenes && firstVariant.imagenes[0];

  // Obtener todos los nombres de variantes (colores)
  const allColors = sortedVariants.length > 0 ? 
    sortedVariants.map(v => v.nombre).join(', ') : 'Sin color';

  // Obtener precio correcto
  let correctPrice = 0;
  if (firstVariant && firstVariant.precio !== null && firstVariant.precio !== undefined) {
    correctPrice = typeof firstVariant.precio === 'string' ? 
      parseFloat(firstVariant.precio) : firstVariant.precio;
  }

  // Obtener tallas disponibles
  let availableSizes = 'Sin tallas';
  
  if (product.tallas_disponibles && product.tallas_disponibles.length > 0) {
    // Estrategia 1: Usar tallas_disponibles directamente
    availableSizes = product.tallas_disponibles.map(t => t.nombre_talla || t.nombre || t).join(', ');
  }

  const transformedProduct = {
    id: product.id_producto || product.id,
    name: product.nombre || 'Producto sin nombre',
    price: correctPrice,
    originalPrice: correctPrice,
    image: firstImage ? firstImage.url : '/default-image.jpg',
    category: product.categoria_nombre || 'Sin categoría',
    brand: product.marca || 'Sin marca',
    color: allColors,
    size: availableSizes,
    description: product.descripcion,
    inStock: true,
    variantes: product.variantes || [],
    tallas_disponibles: product.tallas_disponibles || []
  };

  console.log('✅ transformToLegacyFormat - Producto transformado:', {
    id: transformedProduct.id,
    name: transformedProduct.name,
    category: transformedProduct.category,
    size: transformedProduct.size,
    color: transformedProduct.color,
    price: transformedProduct.price
  });

  return transformedProduct;
}

// Simular datos del backend
const sampleBackendProduct = {
  id_producto: 6,
  nombre: 'Playera',
  descripcion: 'Playera de mujer',
  categoria_nombre: 'Camisetas',
  marca: 'trevodeluxe',
  variantes: [
    {
      id_variante: 19,
      nombre: 'Gris',
      precio: 150,
      disponible: true,
      stock_total: 8,
      imagenes: [
        {
          id_imagen: 27,
          url: 'https://res.cloudinary.com/dyh8tcvzv/image/upload/v1757488367/trebodeluxe/productos/cuxte7knzuzvte0zucjz.jpg'
        }
      ]
    }
  ],
  tallas_disponibles: [
    {
      id_talla: 1,
      nombre_talla: 'XS'
    },
    {
      id_talla: 2,
      nombre_talla: 'S'
    }
  ]
};

console.log('🧪 PRUEBA DE TRANSFORMACIÓN:');
console.log('📥 Datos del backend:', {
  nombre: sampleBackendProduct.nombre,
  variantes: sampleBackendProduct.variantes.length,
  tallas: sampleBackendProduct.tallas_disponibles.length
});

const transformed = transformToLegacyFormat(sampleBackendProduct);

console.log('📤 Datos transformados para frontend:');
console.log('   - Nombre:', transformed.name);
console.log('   - Precio:', transformed.price);
console.log('   - Color:', transformed.color);
console.log('   - Tallas:', transformed.size);
console.log('   - Categoría:', transformed.category);
console.log('   - En Stock:', transformed.inStock);

console.log('\n🎯 RESULTADO:');
console.log('✅ Color:', transformed.color === 'Sin color' ? '❌ FALTA' : '✅ ' + transformed.color);
console.log('✅ Tallas:', transformed.size === 'Sin tallas' ? '❌ FALTA' : '✅ ' + transformed.size);
console.log('✅ Precio:', transformed.price > 0 ? '✅ $' + transformed.price : '❌ FALTA');

if (transformed.color !== 'Sin color' && transformed.size !== 'Sin tallas' && transformed.price > 0) {
  console.log('\n🎉 ¡ÉXITO! La transformación está funcionando correctamente');
  console.log('   Los productos ahora deben mostrar colores, tallas y precios');
} else {
  console.log('\n❌ Hay problemas en la transformación que necesitan más revisión');
}