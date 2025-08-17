// test-transform.js - Prueba de la transformación de productos

// Datos simulados de la API
const apiProduct = {
    "id_producto": 4,
    "nombre": "Lucky Club Hoodie",
    "descripcion": "Hoodie Lucky Club de algodon con estampado blanco",
    "id_categoria": 6,
    "marca": "Treboluxe",
    "id_sistema_talla": 1,
    "activo": true,
    "fecha_creacion": "2025-08-16T08:16:53.373Z",
    "categoria_nombre": "Hoodie",
    "variantes": [
        {
            "id_variante": 5,
            "nombre": "Verde",
            "precio": null,
            "descuento_porcentaje": null,
            "imagenes": [
                {
                    "id_imagen": 7,
                    "url": "https://res.cloudinary.com/dyh8tcvzv/image/upload/v1755310611/trebodeluxe/productos/m0zcd0choczexqodiuyl.jpg",
                    "public_id": "trebodeluxe/productos/m0zcd0choczexqodiuyl",
                    "orden": 1
                }
            ],
            "stock_total": 0,
            "disponible": false
        },
        {
            "id_variante": 4,
            "nombre": "Negra",
            "precio": 599,
            "descuento_porcentaje": null,
            "imagenes": [
                {
                    "id_imagen": 5,
                    "url": "https://res.cloudinary.com/dyh8tcvzv/image/upload/v1755310611/trebodeluxe/productos/i92lvcr5heonbnv310hm.jpg",
                    "public_id": "trebodeluxe/productos/i92lvcr5heonbnv310hm",
                    "orden": 1
                }
            ],
            "stock_total": 3,
            "disponible": true
        }
    ],
    "tallas_disponibles": [
        {
            "id_talla": 1,
            "nombre_talla": "XS"
        }
    ]
};

// Función transformToLegacyFormat inline para probar
function transformToLegacyFormat(product) {
    if (!product) return null;

    // Ordenar variantes por ID ascendente y obtener la primera para precio
    const sortedVariants = product.variantes ? 
        [...product.variantes].sort((a, b) => a.id_variante - b.id_variante) : [];
    
    console.log('Variantes ordenadas:', sortedVariants.map(v => ({ id: v.id_variante, nombre: v.nombre, precio: v.precio })));
    
    // Buscar la primera variante que tenga precio válido (no null/undefined)
    const variantWithPrice = sortedVariants.find(v => 
        v.precio !== null && v.precio !== undefined && v.precio > 0
    );
    console.log('Variante con precio:', variantWithPrice ? { id: variantWithPrice.id_variante, nombre: variantWithPrice.nombre, precio: variantWithPrice.precio } : 'ninguna');
    
    const firstVariant = variantWithPrice || sortedVariants[0];
    console.log('Variante elegida:', firstVariant ? { id: firstVariant.id_variante, nombre: firstVariant.nombre, precio: firstVariant.precio } : 'ninguna');
    
    const firstImage = firstVariant && firstVariant.imagenes && firstVariant.imagenes[0];

    // Obtener precio correcto de la variante con precio válido
    let correctPrice = 0;
    if (firstVariant && firstVariant.precio !== null && firstVariant.precio !== undefined) {
        correctPrice = typeof firstVariant.precio === 'string' ? 
            parseFloat(firstVariant.precio) : firstVariant.precio;
    } else if (product.precio_minimo) {
        correctPrice = parseFloat(product.precio_minimo);
    }
    
    console.log('Precio final calculado:', correctPrice);
    
    return {
        id: product.id_producto,
        name: product.nombre || product.producto_nombre,
        price: correctPrice,
        originalPrice: correctPrice * 1.25
    };
}

// Probar la transformación
console.log('=== PROBANDO TRANSFORMACIÓN ===');
const transformedProduct = transformToLegacyFormat(apiProduct);
console.log('Producto transformado:', transformedProduct);
