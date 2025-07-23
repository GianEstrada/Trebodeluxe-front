import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { NextPage } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { useUniversalTranslate } from '../../hooks/useUniversalTranslate';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';
import { canAccessAdminPanel } from '../../utils/roles';

// Definimos las interfaces para los datos de la nueva estructura
interface Talla {
  id_talla: number;
  nombre_talla: string;
  cantidad: number;
}

interface Variante {
  id_variante: number;
  nombre_variante: string;
  precio: number;
  precio_original?: number;
  imagen_url?: string;
  activo: boolean;
  tallas: Talla[];
}

interface ProductData {
  id_producto: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  marca: string;
  variantes: Variante[];
}

const ProductPage: NextPage = () => {
  const router = useRouter();
  const { id, variante } = router.query;
  const { user } = useAuth();
  const { addItem } = useCart();
  
  // Estados para idioma
  const [currentLanguage, setCurrentLanguage] = useState("es");
  const { t } = useUniversalTranslate(currentLanguage);
  const { headerSettings } = useSiteSettings();
  
  // Estados específicos del producto
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variante | null>(null);
  const [selectedSize, setSelectedSize] = useState<Talla | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductData[]>([]);

  // Cargar datos del producto
  useEffect(() => {
    if (id) {
      loadProductData();
    }
  }, [id]);

  // Seleccionar variante cuando cambie la URL
  useEffect(() => {
    if (productData && variante) {
      const variant = productData.variantes.find(v => v.id_variante === parseInt(variante as string));
      if (variant) {
        setSelectedVariant(variant);
        // Seleccionar la primera talla disponible
        const firstAvailableSize = variant.tallas.find(t => t.cantidad > 0);
        setSelectedSize(firstAvailableSize || variant.tallas[0] || null);
      }
    } else if (productData && productData.variantes.length > 0) {
      // Si no hay variante especificada, seleccionar la primera
      setSelectedVariant(productData.variantes[0]);
      const firstAvailableSize = productData.variantes[0].tallas.find(t => t.cantidad > 0);
      setSelectedSize(firstAvailableSize || productData.variantes[0].tallas[0] || null);
    }
  }, [productData, variante]);

  // Resetear cantidad cuando cambie variante o talla
  useEffect(() => {
    setQuantity(1);
  }, [selectedVariant, selectedSize]);

  const loadProductData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Obtener todas las variantes y filtrar por producto
      const response = await fetch('https://trebodeluxe-backend.onrender.com/api/admin/variants');
      const variantsData = await response.json();
      
      if (variantsData.success && variantsData.variants) {
        // Filtrar variantes del producto específico
        const productVariants = variantsData.variants.filter((v: any) => 
          v.id_producto === parseInt(id as string)
        );
        
        if (productVariants.length > 0) {
          const firstVariant = productVariants[0];
          const product: ProductData = {
            id_producto: firstVariant.id_producto,
            nombre: firstVariant.nombre_producto,
            descripcion: firstVariant.descripcion_producto,
            categoria: firstVariant.categoria,
            marca: firstVariant.marca,
            variantes: productVariants.map((v: any) => ({
              id_variante: v.id_variante,
              nombre_variante: v.nombre_variante,
              precio: typeof v.precio === 'string' ? parseFloat(v.precio) : (v.precio || 0),
              precio_original: v.precio_original ? (typeof v.precio_original === 'string' ? parseFloat(v.precio_original) : v.precio_original) : undefined,
              imagen_url: v.imagen_url,
              activo: v.variante_activa,
              tallas: v.tallas_stock || []
            }))
          };
          
          setProductData(product);
          
          // Cargar productos relacionados de la misma categoría
          loadRelatedProducts(firstVariant.categoria, firstVariant.id_producto);
        } else {
          setError('Producto no encontrado');
        }
      } else {
        setError('Error al cargar el producto');
      }
    } catch (err) {
      console.error('Error loading product:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedProducts = async (categoria: string, excludeId: number) => {
    try {
      const response = await fetch('https://trebodeluxe-backend.onrender.com/api/admin/variants');
      const variantsData = await response.json();
      
      if (variantsData.success && variantsData.variants) {
        // Agrupar por producto y filtrar por categoría
        const productsMap = new Map();
        
        variantsData.variants
          .filter((v: any) => v.categoria === categoria && v.id_producto !== excludeId)
          .forEach((variant: any) => {
            const productKey = variant.id_producto;
            
            if (!productsMap.has(productKey)) {
              productsMap.set(productKey, {
                id_producto: variant.id_producto,
                nombre: variant.nombre_producto,
                descripcion: variant.descripcion_producto,
                categoria: variant.categoria,
                marca: variant.marca,
                variantes: []
              });
            }
            
            productsMap.get(productKey).variantes.push({
              id_variante: variant.id_variante,
              nombre_variante: variant.nombre_variante,
              precio: typeof variant.precio === 'string' ? parseFloat(variant.precio) : (variant.precio || 0),
              precio_original: variant.precio_original ? (typeof variant.precio_original === 'string' ? parseFloat(variant.precio_original) : variant.precio_original) : undefined,
              imagen_url: variant.imagen_url,
              activo: variant.variante_activa,
              tallas: variant.tallas_stock || []
            });
          });
        
        const relatedArray = Array.from(productsMap.values()).slice(0, 4);
        setRelatedProducts(relatedArray);
      }
    } catch (err) {
      console.error('Error loading related products:', err);
    }
  };

  const handleVariantChange = (variant: Variante) => {
    setSelectedVariant(variant);
    // Actualizar URL
    router.push(`/producto/${id}?variante=${variant.id_variante}`, undefined, { shallow: true });
    // Seleccionar primera talla disponible
    const firstAvailableSize = variant.tallas.find(t => t.cantidad > 0);
    setSelectedSize(firstAvailableSize || variant.tallas[0] || null);
  };

  const handleSizeChange = (size: Talla) => {
    setSelectedSize(size);
  };

  const handleAddToCart = () => {
    if (!selectedVariant || !selectedSize || !productData) {
      alert(t('Selecciona una variante y talla'));
      return;
    }

    if (selectedSize.cantidad === 0) {
      alert(t('Talla sin stock'));
      return;
    }

    const cartItem = {
      id_variante: selectedVariant.id_variante,
      id_producto: productData.id_producto,
      nombre_producto: productData.nombre,
      nombre_variante: selectedVariant.nombre_variante,
      imagen_url: selectedVariant.imagen_url,
      precio: selectedVariant.precio,
      precio_original: selectedVariant.precio_original,
      id_talla: selectedSize.id_talla,
      nombre_talla: selectedSize.nombre_talla,
      categoria: productData.categoria,
      marca: productData.marca
    };

    addItem(cartItem, quantity);
    alert(t('Producto agregado al carrito'));
  };

  const handleBuyNow = () => {
    handleAddToCart();
    // Redirigir al checkout después de agregar al carrito
    setTimeout(() => {
      router.push('/checkout');
    }, 500);
  };

  const formatPrice = (price: number | string | null | undefined) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : (price || 0);
    return `$${numPrice.toFixed(2)}`;
  };

  const calculateDiscount = (original?: number | string | null, current?: number | string | null) => {
    const origNum = typeof original === 'string' ? parseFloat(original) : (original || 0);
    const currNum = typeof current === 'string' ? parseFloat(current) : (current || 0);
    if (!origNum || !currNum || origNum <= currNum) return 0;
    return Math.round(((origNum - currNum) / origNum) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-800 to-black flex items-center justify-center">
        <div className="text-white text-xl">Cargando producto...</div>
      </div>
    );
  }

  if (error || !productData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-800 to-black flex items-center justify-center">
        <div className="text-white text-xl">{error || 'Producto no encontrado'}</div>
      </div>
    );
  }

  return (
    <div className="w-full relative bg-gradient-to-b from-gray-800 to-black min-h-screen text-white">
      {/* Header simplificado */}
      <header className="w-full bg-black/50 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-green-400">
              {headerSettings?.brandName || 'TREBOLUXE'}
            </Link>
            
            <div className="flex items-center space-x-6">
              <Link href="/catalogo" className="text-white hover:text-green-400 transition-colors">
                {t('Catálogo')}
              </Link>
              <Link href="/carrito" className="text-white hover:text-green-400 transition-colors">
                {t('Carrito')}
              </Link>
              {user ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Hola, {user.nombres}</span>
                  {canAccessAdminPanel(user.rol) && (
                    <Link href="/admin" className="text-green-400 hover:text-green-300">
                      Admin
                    </Link>
                  )}
                </div>
              ) : (
                <Link href="/login" className="text-white hover:text-green-400 transition-colors">
                  {t('Iniciar Sesión')}
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <nav className="text-sm text-gray-400">
          <Link href="/" className="hover:text-white">Inicio</Link>
          <span className="mx-2">/</span>
          <Link href="/catalogo" className="hover:text-white">Catálogo</Link>
          <span className="mx-2">/</span>
          <span className="text-white">{productData.nombre}</span>
        </nav>
      </div>

      {/* Contenido principal */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Columna izquierda - Imagen */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-white/10 rounded-lg overflow-hidden">
              <Image
                src={selectedVariant?.imagen_url || '/sin-ttulo1-2@2x.png'}
                alt={`${productData.nombre} - ${selectedVariant?.nombre_variante}`}
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/sin-ttulo1-2@2x.png';
                }}
              />
              {selectedVariant?.precio_original && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-lg font-bold">
                  {calculateDiscount(selectedVariant.precio_original, selectedVariant.precio)}% OFF
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha - Información del producto */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{productData.nombre}</h1>
              <p className="text-gray-400">{productData.categoria} • {productData.marca}</p>
            </div>

            {/* Variantes */}
            {productData.variantes.length > 1 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">{t('Variantes')}:</h3>
                <div className="flex flex-wrap gap-2">
                  {productData.variantes.map((variant) => (
                    <button
                      key={variant.id_variante}
                      onClick={() => handleVariantChange(variant)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        selectedVariant?.id_variante === variant.id_variante
                          ? 'border-green-400 bg-green-400/20 text-green-400'
                          : 'border-white/30 hover:border-white/50'
                      }`}
                    >
                      {variant.nombre_variante}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tallas */}
            {selectedVariant && selectedVariant.tallas.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">{t('Tallas')}:</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedVariant.tallas.map((size) => (
                    <button
                      key={size.id_talla}
                      onClick={() => handleSizeChange(size)}
                      disabled={size.cantidad === 0}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        size.cantidad === 0
                          ? 'border-gray-600 text-gray-500 cursor-not-allowed'
                          : selectedSize?.id_talla === size.id_talla
                          ? 'border-green-400 bg-green-400/20 text-green-400'
                          : 'border-white/30 hover:border-white/50'
                      }`}
                    >
                      {size.nombre_talla}
                      {size.cantidad === 0 && ' (Agotado)'}
                      {size.cantidad > 0 && size.cantidad <= 5 && ` (${size.cantidad} disponibles)`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Precio */}
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <span className="text-3xl font-bold text-green-400">
                  {selectedVariant && formatPrice(selectedVariant.precio)}
                </span>
                {selectedVariant?.precio_original && (
                  <span className="text-xl text-gray-400 line-through">
                    {formatPrice(selectedVariant.precio_original)}
                  </span>
                )}
              </div>
              {selectedVariant?.precio_original && (
                <p className="text-sm text-green-300">
                  Ahorras {formatPrice((typeof selectedVariant.precio_original === 'string' ? parseFloat(selectedVariant.precio_original) : selectedVariant.precio_original) - (typeof selectedVariant.precio === 'string' ? parseFloat(selectedVariant.precio) : selectedVariant.precio))}
                </p>
              )}
            </div>

            {/* Cantidad */}
            <div>
              <h3 className="text-lg font-semibold mb-3">{t('Cantidad')}:</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border border-white/30 hover:border-white/50 flex items-center justify-center transition-colors"
                >
                  -
                </button>
                <span className="text-xl font-semibold w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-lg border border-white/30 hover:border-white/50 flex items-center justify-center transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="space-y-3">
              <button
                onClick={handleBuyNow}
                disabled={!selectedSize || selectedSize.cantidad === 0}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {selectedSize && selectedSize.cantidad === 0 
                  ? t('Sin stock') 
                  : t('Comprar ahora')
                }
              </button>
              
              <button
                onClick={handleAddToCart}
                disabled={!selectedSize || selectedSize.cantidad === 0}
                className="w-full bg-white text-black py-3 px-6 rounded-lg font-semibold hover:bg-gray-100 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {selectedSize && selectedSize.cantidad === 0 
                  ? t('Sin stock') 
                  : t('Agregar al carrito')
                }
              </button>
            </div>

            {/* Información adicional */}
            <div className="space-y-4 pt-4 border-t border-white/20">
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <span>🚚</span>
                <span>Envío gratis en pedidos mayores a $500 MXN</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <span>↩️</span>
                <span>Devoluciones gratis en 30 días</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <span>🔒</span>
                <span>Compra 100% segura</span>
              </div>
            </div>

            {/* Descripción */}
            {productData.descripcion && (
              <div>
                <h3 className="text-lg font-semibold mb-3">{t('Descripción')}:</h3>
                <p className="text-gray-300 leading-relaxed">{productData.descripcion}</p>
              </div>
            )}
          </div>
        </div>

        {/* Productos relacionados */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-8">{t('Productos relacionados')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedProducts.map((product) => {
                const firstVariant = product.variantes[0];
                if (!firstVariant) return null;

                const hasStock = firstVariant.tallas.some(t => t.cantidad > 0);
                const discount = calculateDiscount(firstVariant.precio_original, firstVariant.precio);

                return (
                  <Link 
                    key={product.id_producto} 
                    href={`/producto/${product.id_producto}?variante=${firstVariant.id_variante}`}
                    className="bg-white/10 rounded-lg p-4 hover:bg-white/20 transition-colors group"
                  >
                    <div className="relative aspect-square mb-4 rounded-lg overflow-hidden">
                      <Image
                        src={firstVariant.imagen_url || '/sin-ttulo1-2@2x.png'}
                        alt={`${product.nombre} - ${firstVariant.nombre_variante}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/sin-ttulo1-2@2x.png';
                        }}
                      />
                      {discount > 0 && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
                          {discount}% OFF
                        </div>
                      )}
                      {!hasStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-bold">Sin Stock</span>
                        </div>
                      )}
                    </div>
                    
                    <h3 className="font-semibold mb-1 group-hover:text-green-400 transition-colors line-clamp-1">
                      {product.nombre}
                    </h3>
                    <p className="text-green-400 text-sm mb-2">{firstVariant.nombre_variante}</p>
                    
                    <div className="flex items-center space-x-2">
                      <span className="font-bold">{formatPrice(firstVariant.precio)}</span>
                      {discount > 0 && (
                        <span className="text-gray-400 line-through text-sm">
                          {formatPrice(firstVariant.precio_original!)}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPage;