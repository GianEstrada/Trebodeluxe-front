import React, { useState, useEffect } from 'react';
import CategoriaSelector from './CategoriaSelector';

interface Talla {
  id_talla: number;
  nombre_talla: string;
  cantidad: number;
  precio?: number;
  precio_original?: number | null;
}

interface VariantFormV2Props {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  productos: any[];
  sistemas_talla: any[];
  loading?: boolean;
  editingVariant?: any;
}

const VariantFormV2: React.FC<VariantFormV2Props> = ({
  onSubmit,
  onCancel,
  productos,
  sistemas_talla,
  loading = false,
  editingVariant
}) => {
  const [formData, setFormData] = useState({
    id_producto: editingVariant?.id_producto || '',
    nombre: editingVariant?.nombre_variante || '',
    precio_unico: editingVariant?.precio_unico || true,
    precio_base: editingVariant?.precio_base || '',
    precio_original_base: editingVariant?.precio_original_base || '',
    id_categoria: editingVariant?.id_categoria || null
  });

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [tallasDisponibles, setTallasDisponibles] = useState<any[]>([]);
  const [tallasStock, setTallasStock] = useState<Talla[]>([]);
  const [imagenes, setImagenes] = useState<any[]>([]);

  useEffect(() => {
    if (formData.id_producto) {
      const producto = productos.find(p => p.id_producto === parseInt(formData.id_producto));
      setSelectedProduct(producto);

      if (producto?.id_sistema_talla) {
        const sistema = sistemas_talla.find(s => s.id_sistema_talla === producto.id_sistema_talla);
        if (sistema?.tallas) {
          setTallasDisponibles(sistema.tallas);
          
          // Inicializar tallas con stock
          const nuevasTallas = sistema.tallas.map((talla: any) => {
            const existingTalla = editingVariant?.tallas_stock?.find((t: any) => t.id_talla === talla.id_talla);
            return {
              id_talla: talla.id_talla,
              nombre_talla: talla.nombre_talla,
              cantidad: existingTalla?.cantidad || 0,
              precio: existingTalla?.precio || formData.precio_base,
              precio_original: existingTalla?.precio_original || formData.precio_original_base
            };
          });
          setTallasStock(nuevasTallas);
        }
      }
    }
  }, [formData.id_producto, productos, sistemas_talla, editingVariant]);

  // Actualizar precios de tallas cuando cambia el precio base
  useEffect(() => {
    if (formData.precio_unico) {
      setTallasStock(prev => prev.map(talla => ({
        ...talla,
        precio: parseFloat(formData.precio_base) || 0,
        precio_original: formData.precio_original_base ? parseFloat(formData.precio_original_base) : undefined
      })));
    }
  }, [formData.precio_base, formData.precio_original_base, formData.precio_unico]);

  const handleTallaChange = (id_talla: number, field: string, value: any) => {
    setTallasStock(prev => prev.map(talla => 
      talla.id_talla === id_talla 
        ? { ...talla, [field]: field === 'cantidad' ? parseInt(value) || 0 : parseFloat(value) || 0 }
        : talla
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.id_producto || !formData.nombre) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    if (!formData.precio_base || parseFloat(formData.precio_base) <= 0) {
      alert('Por favor ingresa un precio válido');
      return;
    }

    const tallasConStock = tallasStock.filter(talla => talla.cantidad > 0);
    if (tallasConStock.length === 0) {
      alert('Debe haber al menos una talla con stock disponible');
      return;
    }

    const data = {
      ...formData,
      precio_base: parseFloat(formData.precio_base),
      precio_original_base: formData.precio_original_base ? parseFloat(formData.precio_original_base) : null,
      tallas: tallasConStock,
      imagenes
    };

    onSubmit(data);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-6">
        {editingVariant ? 'Editar Variante' : 'Nueva Variante'} (Sistema V2)
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Producto *
            </label>
            <select
              value={formData.id_producto}
              onChange={(e) => setFormData({...formData, id_producto: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
              disabled={!!editingVariant}
            >
              <option value="">Seleccionar producto...</option>
              {productos.map(producto => (
                <option key={producto.id_producto} value={producto.id_producto}>
                  {producto.nombre} - {producto.marca}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Variante *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Azul Marino, Talla M"
              required
            />
          </div>
        </div>

        {/* Categoría */}
        {selectedProduct && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría del Producto
            </label>
            <CategoriaSelector
              value={formData.id_categoria}
              onChange={(categoriaId) => setFormData({...formData, id_categoria: categoriaId})}
              placeholder="Categoría actual del producto"
              className="bg-gray-100"
            />
          </div>
        )}

        {/* Sistema de Precios */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Sistema de Precios</h3>
          
          <div className="mb-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.precio_unico}
                onChange={(e) => setFormData({...formData, precio_unico: e.target.checked})}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Precio único para todas las tallas
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              {formData.precio_unico 
                ? 'Todas las tallas tendrán el mismo precio' 
                : 'Cada talla puede tener un precio diferente'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio {formData.precio_unico ? 'Único' : 'Base'} *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.precio_base}
                onChange={(e) => setFormData({...formData, precio_base: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio Original {formData.precio_unico ? 'Único' : 'Base'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.precio_original_base}
                onChange={(e) => setFormData({...formData, precio_original_base: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Stock por Tallas */}
        {tallasDisponibles.length > 0 && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Stock y Precios por Talla</h3>
            
            <div className="space-y-3">
              {tallasStock.map((talla) => (
                <div key={talla.id_talla} className="grid grid-cols-2 md:grid-cols-4 gap-3 items-center p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium text-gray-700">
                    {talla.nombre_talla}
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
                    <input
                      type="number"
                      min="0"
                      value={talla.cantidad}
                      onChange={(e) => handleTallaChange(talla.id_talla, 'cantidad', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Precio</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={talla.precio || ''}
                      onChange={(e) => handleTallaChange(talla.id_talla, 'precio', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      disabled={formData.precio_unico}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Precio Original</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={talla.precio_original || ''}
                      onChange={(e) => handleTallaChange(talla.id_talla, 'precio_original', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      disabled={formData.precio_unico}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex space-x-4 pt-6 border-t">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Guardando...' : (editingVariant ? 'Actualizar' : 'Crear')} Variante
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default VariantFormV2;
