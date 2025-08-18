import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Image from 'next/image';
import { useUniversalTranslate } from '../hooks/useUniversalTranslate';

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

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && product?.variantes?.length > 0) {
      setSelectedVariant(product.variantes[0]);
      setSelectedTalla(null);
      setQuantity(1);
    }
  }, [isOpen, product]);

  // Auto-select first available size when variant changes
  useEffect(() => {
    if (selectedVariant && selectedVariant.tallas_disponibles && selectedVariant.tallas_disponibles.length > 0) {
      const availableTalla = selectedVariant.tallas_disponibles.find(talla => talla.cantidad > 0);
      setSelectedTalla(availableTalla || null);
    }
  }, [selectedVariant]);

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
            className="text-gray-400 hover:text-white transition-colors p-1"
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
                      <p className="text-green-400 text-xs font-bold">${variant.precio?.toFixed(2) || 'N/A'}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Size Selection */}
          {selectedVariant && selectedVariant.tallas_disponibles && (
            <div>
              <h4 className="text-white font-medium mb-3">{t('Selecciona Talla')}</h4>
              <div className="grid grid-cols-3 gap-2">
                {selectedVariant.tallas_disponibles.map((talla) => (
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
              <div className="flex justify-between items-center">
                <span className="text-gray-300">{t('Total')}:</span>
                <span className="text-green-400 font-bold text-lg">
                  ${(selectedVariant.precio * quantity).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-white/20">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-white/30 text-white rounded-lg hover:bg-white/10 transition-colors"
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
