import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Image from 'next/image';
import { useUniversalTranslate } from '../hooks/useUniversalTranslate';
import { productsApi } from '../utils/productsApi';
import { promotionsApi } from '../utils/promotionsApi';

interface Variant {
  id_variante: number;
  nombre: string;  // La API devuelve 'nombre', no 'nombre_variante'
  precio: number;
  stock_disponible: number;
  tallas_disponibles?: Talla[];  // La API devuelve 'tallas_disponibles'
  imagenes?: ImagenVariante[];
}

interface Talla {
  id_talla: number;
  nombre_talla: string;
  cantidad: number;  // La API devuelve 'cantidad', no 'stock_disponible'
  precio: number;
}

interface ImagenVariante {
  id_imagen: number;
  url: string;
  public_id: string;
  orden: number;
}

interface Product {
  id_producto: number;
  nombre: string;
  descripcion?: string;
  variantes: Variant[];
  hasDiscount?: boolean;
  originalPrice?: number;
  discountedPrice?: number;
  appliedPromotion?: any;
}

interface PromotionDiscount {
  hasDiscount: boolean;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  promotionName?: string;
}

interface VariantSizeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onAddToCart: (productId: number, variantId: number, tallaId: number, quantity: number) => Promise<void>;
  currentLanguage?: string;
}

const VariantSizeSelector: React.FC<VariantSizeSelectorProps> = ({
  isOpen,
  onClose,
  product,
  onAddToCart,
  currentLanguage = 'es'
}) => {
  const { t } = useUniversalTranslate(currentLanguage);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedTalla, setSelectedTalla] = useState<Talla | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [variantStock, setVariantStock] = useState<{[variantId: number]: Talla[]}>({});
  const [promotionDiscounts, setPromotionDiscounts] = useState<{[key: string]: PromotionDiscount}>({});

  // Helper function para convertir precios de manera segura
  const parsePrice = (price: any): number => {
    if (typeof price === 'number') return price;
    if (typeof price === 'string') {
      const parsed = parseFloat(price);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Helper function para formatear precios
  const formatPrice = (price: any): string => {
    const numPrice = parsePrice(price);
    return `$${numPrice.toFixed(2)}`;
  };

  // Función para calcular promociones
  const calculatePromotionDiscount = async (productId: number, variantId: number, quantity: number): Promise<PromotionDiscount> => {
    try {
      const response = await promotionsApi.calculateDiscount(productId, variantId, quantity) as any;
      
      if (response?.success && response?.data) {
        const { hasDiscount, originalPrice, discountedPrice, discountPercentage, promotionName } = response.data;
        
        return {
          hasDiscount: hasDiscount || false,
          originalPrice: parsePrice(originalPrice) || 0,
          discountedPrice: parsePrice(discountedPrice) || parsePrice(originalPrice) || 0,
          discountPercentage: discountPercentage || 0,
          promotionName: promotionName || ''
        };
      }
    } catch (error) {
      console.error('Error calculating promotion:', error);
    }
    
    return {
      hasDiscount: false,
      originalPrice: 0,
      discountedPrice: 0,
      discountPercentage: 0
    };
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && product?.variantes?.length > 0) {
      setSelectedVariant(product.variantes[0]);
      setSelectedTalla(null);
      setQuantity(1);
      
      // Cargar stock específico para cada variante
      loadStockForAllVariants();
    }
  }, [isOpen, product]);

  // Cargar promociones cuando cambie la variante seleccionada o cantidad
  useEffect(() => {
    if (selectedVariant && product) {
      loadPromotionsForVariant(selectedVariant.id_variante);
    }
  }, [selectedVariant, quantity, product]);

  // Cargar stock específico para todas las variantes
  const loadStockForAllVariants = async () => {
    if (!product?.variantes) return;
    
    const stockData: {[variantId: number]: Talla[]} = {};
    
    for (const variant of product.variantes) {
      try {
        const stockResponse = await productsApi.getStockByVariant(variant.id_variante) as any;
        if (stockResponse.success && stockResponse.data.tallas_stock) {
          stockData[variant.id_variante] = stockResponse.data.tallas_stock;
        } else {
          stockData[variant.id_variante] = [];
        }
      } catch (error) {
        console.error(`Error loading stock for variant ${variant.id_variante}:`, error);
        stockData[variant.id_variante] = [];
      }
    }
    
    setVariantStock(stockData);
  };

  // Cargar promociones para variante seleccionada
  const loadPromotionsForVariant = async (variantId: number) => {
    if (!product) return;
    
    try {
      const promotionKey = `${product.id_producto}-${variantId}-${quantity}`;
      
      // Si el producto ya tiene información de promociones desde la card, usarla
      if (product.hasDiscount && product.originalPrice && product.discountedPrice) {
        console.log('🎯 Using promotion data from card:', {
          hasDiscount: product.hasDiscount,
          originalPrice: product.originalPrice,
          discountedPrice: product.discountedPrice
        });
        
        // Calcular el porcentaje de descuento
        const discountPercentage = Math.round(((product.originalPrice - product.discountedPrice) / product.originalPrice) * 100);
        
        const discount: PromotionDiscount = {
          hasDiscount: true,
          originalPrice: product.originalPrice,
          discountedPrice: product.discountedPrice,
          discountPercentage: discountPercentage,
          promotionName: product.appliedPromotion?.nombre || 'Promoción activa'
        };
        
        setPromotionDiscounts(prev => ({
          ...prev,
          [promotionKey]: discount
        }));
        
        return;
      }
      
      // Fallback: consultar API si no hay datos de promoción
      const discount = await calculatePromotionDiscount(product.id_producto, variantId, quantity);
      
      setPromotionDiscounts(prev => ({
        ...prev,
        [promotionKey]: discount
      }));
    } catch (error) {
      console.error('Error loading promotions:', error);
    }
  };

  // Auto-select first available size when variant changes
  useEffect(() => {
    if (selectedVariant && variantStock[selectedVariant.id_variante]) {
      const availableTallas = variantStock[selectedVariant.id_variante];
      const availableTalla = availableTallas.find(talla => talla.cantidad > 0);
      setSelectedTalla(availableTalla || null);
    }
  }, [selectedVariant, variantStock]);

  // Actualizar la variante seleccionada con el stock cargado
  const getVariantWithStock = (variant: Variant): Variant => {
    return {
      ...variant,
      tallas_disponibles: variantStock[variant.id_variante] || []
    };
  };

  // Helper para obtener precio con promoción aplicada
  const getPriceWithPromotion = (precio: number, variantId: number): { finalPrice: number; hasDiscount: boolean; originalPrice?: number } => {
    if (!product) return { finalPrice: parsePrice(precio), hasDiscount: false };
    
    const promotionKey = `${product.id_producto}-${variantId}-${quantity}`;
    const discount = promotionDiscounts[promotionKey];
    
    if (discount?.hasDiscount) {
      // Aplicar el mismo porcentaje de descuento al precio específico de la talla
      const discountMultiplier = 1 - (discount.discountPercentage / 100);
      const finalPrice = parsePrice(precio) * discountMultiplier;
      
      return {
        finalPrice: finalPrice,
        hasDiscount: true,
        originalPrice: parsePrice(precio)
      };
    }
    
    return { finalPrice: parsePrice(precio), hasDiscount: false };
  };

  const handleAddToCart = async () => {
    if (!selectedVariant || !selectedTalla) {
      alert(t('Por favor selecciona una variante y talla'));
      return;
    }

    if (selectedTalla.cantidad < quantity) {
      alert(t('Stock insuficiente'));
      return;
    }

    try {
      setIsLoading(true);
      await onAddToCart(product.id_producto, selectedVariant.id_variante, selectedTalla.id_talla, quantity);
      onClose();
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert(t('Error al agregar al carrito'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative bg-gradient-to-br from-gray-900 to-black border border-white/20 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h3 className="text-xl font-bold text-white truncate">{product.nombre}</h3>
          <button
            onClick={onClose}
            className="text-red-400 hover:text-white transition-colors bg-transparent p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Variant Selection */}
          <div>
            <h4 className="text-white font-medium mb-3">{t('Selecciona Variante')}</h4>
            <div className="grid grid-cols-2 gap-3">
              {product.variantes.map((variant) => (
                <button
                  key={variant.id_variante}
                  onClick={() => setSelectedVariant(variant)}
                  className={`p-3 rounded-lg border transition-all ${
                    selectedVariant?.id_variante === variant.id_variante
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {variant.imagenes && variant.imagenes.length > 0 && (
                      <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={variant.imagenes[0].url}
                          alt={variant.nombre}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="text-left min-w-0 flex-1">
                      <p className="text-white text-sm font-medium truncate">{variant.nombre}</p>
                      <div className="text-xs space-y-1">
                        {(() => {
                          // Obtener información de promoción para esta variante
                          const promotionKey = `${product.id_producto}-${variant.id_variante}-${quantity}`;
                          const promotion = promotionDiscounts[promotionKey];
                          
                          // Usar el stock cargado dinámicamente para rangos de precio
                          const variantTallas = variantStock[variant.id_variante];
                          let priceDisplay = '';
                          
                          if (variantTallas && variantTallas.length > 0) {
                            const prices = variantTallas
                              .filter(t => t.precio && t.cantidad > 0)
                              .map(t => parsePrice(t.precio))
                              .filter(p => !isNaN(p) && p > 0)
                              .sort((a, b) => a - b);
                            
                            if (prices.length > 0) {
                              let minPrice = prices[0];
                              let maxPrice = prices[prices.length - 1];
                              
                              // Aplicar descuento si existe promoción
                              if (promotion?.hasDiscount) {
                                const discountMultiplier = 1 - (promotion.discountPercentage / 100);
                                minPrice = minPrice * discountMultiplier;
                                maxPrice = maxPrice * discountMultiplier;
                              }
                              
                              if (minPrice === maxPrice) {
                                priceDisplay = formatPrice(minPrice);
                              } else {
                                priceDisplay = `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
                              }
                            }
                          } else {
                            // Fallback al precio general de la variante
                            let basePrice = variant.precio || 0;
                            if (promotion?.hasDiscount) {
                              const discountMultiplier = 1 - (promotion.discountPercentage / 100);
                              basePrice = basePrice * discountMultiplier;
                            }
                            priceDisplay = formatPrice(basePrice);
                          }
                          
                          // Si hay promoción activa, mostrar precio original tachado y precio con descuento
                          if (promotion?.hasDiscount) {
                            // Calcular precio original para mostrar tachado
                            const originalPriceDisplay = (() => {
                              if (variantTallas && variantTallas.length > 0) {
                                const originalPrices = variantTallas
                                  .filter(t => t.precio && t.cantidad > 0)
                                  .map(t => parsePrice(t.precio))
                                  .filter(p => !isNaN(p) && p > 0)
                                  .sort((a, b) => a - b);
                                
                                if (originalPrices.length > 0) {
                                  const minOriginal = originalPrices[0];
                                  const maxOriginal = originalPrices[originalPrices.length - 1];
                                  
                                  if (minOriginal === maxOriginal) {
                                    return formatPrice(minOriginal);
                                  } else {
                                    return `${formatPrice(minOriginal)} - ${formatPrice(maxOriginal)}`;
                                  }
                                }
                              }
                              return formatPrice(variant.precio || 0);
                            })();
                            
                            return (
                              <>
                                <p className="text-red-400 line-through text-xs">
                                  {originalPriceDisplay}
                                </p>
                                <p className="text-green-400 font-bold">
                                  {priceDisplay}
                                </p>
                                <p className="text-yellow-400 text-xs">
                                  -{promotion.discountPercentage}% OFF
                                </p>
                              </>
                            );
                          }
                          
                          return (
                            <p className="text-green-400 font-bold">
                              {priceDisplay}
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Size Selection */}
          {selectedVariant && variantStock[selectedVariant.id_variante] && (
            <div>
              <h4 className="text-white font-medium mb-3">{t('Selecciona Talla')}</h4>
              <div className="grid grid-cols-3 gap-2">
                {variantStock[selectedVariant.id_variante].map((talla) => (
                  <button
                    key={talla.id_talla}
                    onClick={() => setSelectedTalla(talla)}
                    disabled={talla.cantidad === 0}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      selectedTalla?.id_talla === talla.id_talla
                        ? 'border-blue-500 bg-blue-500/20 text-white'
                        : talla.cantidad === 0
                        ? 'border-red-500/30 bg-red-500/10 text-red-400 cursor-not-allowed'
                        : 'border-white/20 bg-white/5 hover:bg-white/10 text-white'
                    }`}
                  >
                    <p className="font-medium">{talla.nombre_talla}</p>
                    <p className="text-xs opacity-70">
                      {talla.cantidad === 0 ? t('Sin stock') : `${talla.cantidad} ${t('disponible')}`}
                    </p>
                    {talla.precio && talla.cantidad > 0 && (
                      <div className="mt-1">
                        {(() => {
                          if (!selectedVariant) return formatPrice(talla.precio);
                          
                          const priceInfo = getPriceWithPromotion(talla.precio, selectedVariant.id_variante);
                          
                          if (priceInfo.hasDiscount && priceInfo.originalPrice) {
                            return (
                              <>
                                <p className="text-red-400 line-through text-xs">
                                  {formatPrice(priceInfo.originalPrice)}
                                </p>
                                <p className="text-green-400 font-bold text-xs">
                                  {formatPrice(priceInfo.finalPrice)}
                                </p>
                              </>
                            );
                          }
                          
                          return (
                            <p className="text-green-400 text-xs font-bold">
                              {formatPrice(priceInfo.finalPrice)}
                            </p>
                          );
                        })()}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selection */}
          {selectedTalla && selectedTalla.cantidad > 0 && (
            <div>
              <h4 className="text-white font-medium mb-3">{t('Cantidad')}</h4>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="text-white font-medium text-lg w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(selectedTalla.cantidad, quantity + 1))}
                  className="w-10 h-10 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors"
                  disabled={quantity >= selectedTalla.cantidad}
                >
                  +
                </button>
                <span className="text-gray-400 text-sm ml-2">
                  {t('Máximo')}: {selectedTalla.cantidad}
                </span>
              </div>
            </div>
          )}

          {/* Price Summary */}
          {selectedVariant && selectedTalla && (
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              {(() => {
                const priceInfo = getPriceWithPromotion(selectedTalla.precio, selectedVariant.id_variante);
                const unitPrice = priceInfo.finalPrice;
                const totalPrice = unitPrice * quantity;
                
                return (
                  <>
                    {/* Mostrar descuento si existe */}
                    {priceInfo.hasDiscount && priceInfo.originalPrice && (
                      <div className="mb-3 p-2 bg-green-500/20 border border-green-400/30 rounded">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-green-200">🎉 {t('Promoción aplicada')}</span>
                          {(() => {
                            const promotionKey = `${product.id_producto}-${selectedVariant.id_variante}-${quantity}`;
                            const promotion = promotionDiscounts[promotionKey];
                            return promotion?.discountPercentage ? (
                              <span className="text-green-300 font-bold">
                                -{promotion.discountPercentage}% OFF
                              </span>
                            ) : null;
                          })()}
                        </div>
                        <div className="flex justify-between items-center text-xs text-green-300 mt-1">
                          <span>{t('Precio original')}:</span>
                          <span className="line-through">
                            {formatPrice(priceInfo.originalPrice * quantity)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-green-300">
                          <span>{t('Tu ahorras')}:</span>
                          <span className="font-bold">
                            {formatPrice((priceInfo.originalPrice - priceInfo.finalPrice) * quantity)}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">{t('Total')}:</span>
                      <span className="text-green-400 font-bold text-lg">
                        {formatPrice(totalPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-2">
                      <span className="text-gray-400">
                        {selectedTalla.nombre_talla} × {quantity}
                      </span>
                      <span className="text-gray-300">
                        {formatPrice(unitPrice)} c/u
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-white/20">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-white/30 text-black rounded-lg hover:bg-white/10 transition-colors"
          >
            {t('Cancelar')}
          </button>
          <button
            onClick={handleAddToCart}
            disabled={!selectedVariant || !selectedTalla || selectedTalla.cantidad === 0 || isLoading}
            className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t('Agregando...') : t('Agregar al Carrito')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VariantSizeSelector;
