import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import CategoriaSelector from './CategoriaSelector';

interface Talla {
  id_talla: number;
  nombre_talla: string;
  cantidad: number;
  precio?: number;
  precio_original?: number | null;
}

interface Producto {
  id_producto: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  marca: string;
  id_sistema_talla?: number;
  id_categoria?: number;
}

interface SistemaTalla {
  id_sistema_talla: number;
  nombre_sistema: string;
  tallas: {
    id_talla: number;
    nombre_talla: string;
  }[];
}

interface VariantFormUpdatedProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  productos: Producto[];
  sistemas_talla: SistemaTalla[];
  loading?: boolean;
  editingVariant?: any;
  formType: 'nuevo_producto' | 'nueva_variante';
  authenticatedFetch: (url: string, options?: any) => Promise<Response>;
  baseUrl: string;
}

const VariantFormUpdated: React.FC<VariantFormUpdatedProps> = ({
  onSubmit,
  onCancel,
  productos,
  sistemas_talla,
  loading = false,
  editingVariant,
  formType,
  authenticatedFetch,
  baseUrl
}) => {
  // Estados principales
  const [formData, setFormData] = useState({
    // Para nuevo producto
    producto_nombre: editingVariant?.nombre_producto || '',
    producto_descripcion: editingVariant?.descripcion_producto || '',
    categoria: editingVariant?.categoria || '',
    marca: editingVariant?.marca || '',
    id_sistema_talla: editingVariant?.id_sistema_talla || 0,
    
    // Para variante
    id_producto: editingVariant?.id_producto || '',
    nombre_variante: editingVariant?.nombre_variante || '',
    precio_unico: true, // Por defecto precio único
    precio_base: editingVariant?.precio || '',
    precio_original_base: editingVariant?.precio_original || '',
    id_categoria: editingVariant?.id_categoria || null,
    
    // Imagen
    imagen_url: editingVariant?.imagen_url || '',
    imagen_public_id: editingVariant?.imagen_public_id || ''
  });

  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [tallasDisponibles, setTallasDisponibles] = useState<any[]>([]);
  const [tallasStock, setTallasStock] = useState<Talla[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Cargar producto seleccionado y sus tallas
  useEffect(() => {
    if (formType === 'nueva_variante' && formData.id_producto) {
      const producto = productos.find(p => p.id_producto === parseInt(formData.id_producto));
      setSelectedProduct(producto || null);
      
      if (producto?.id_sistema_talla) {
        const sistema = sistemas_talla.find(s => s.id_sistema_talla === producto.id_sistema_talla);
        if (sistema?.tallas) {
          setTallasDisponibles(sistema.tallas);
          initializeTallas(sistema.tallas);
        }
      }
    }
  }, [formData.id_producto, productos, sistemas_talla, formType]);

  // Para nuevo producto, cargar tallas cuando se selecciona el sistema
  useEffect(() => {
    if (formType === 'nuevo_producto' && formData.id_sistema_talla) {
      const sistema = sistemas_talla.find(s => s.id_sistema_talla === formData.id_sistema_talla);
      if (sistema?.tallas) {
        setTallasDisponibles(sistema.tallas);
        initializeTallas(sistema.tallas);
      }
    }
  }, [formData.id_sistema_talla, sistemas_talla, formType]);

  const initializeTallas = (tallas: any[]) => {
    const nuevasTallas = tallas.map((talla: any) => {
      const existingTalla = editingVariant?.tallas_stock?.find((t: any) => t.id_talla === talla.id_talla);
      return {
        id_talla: talla.id_talla,
        nombre_talla: talla.nombre_talla,
        cantidad: existingTalla?.cantidad || 0,
        precio: existingTalla?.precio || parseFloat(formData.precio_base) || 0,
        precio_original: existingTalla?.precio_original || (formData.precio_original_base ? parseFloat(formData.precio_original_base) : undefined)
      };
    });
    setTallasStock(nuevasTallas);
  };

  // Actualizar precios de tallas cuando cambia el precio base (solo si precio único está activado)
  useEffect(() => {
    if (formData.precio_unico && formData.precio_base) {
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

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    setUploadingImage(true);
    const formDataImage = new FormData();
    formDataImage.append('image', file);

    try {
      const response = await authenticatedFetch(`${baseUrl}/api/admin/upload-image`, {
        method: 'POST',
        body: formDataImage
      });

      if (response.ok) {
        const result = await response.json();
        setFormData(prev => ({
          ...prev,
          imagen_url: result.secure_url,
          imagen_public_id: result.public_id
        }));
      } else {
        throw new Error('Error al subir imagen');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (formType === 'nuevo_producto') {
      if (!formData.producto_nombre || !formData.producto_descripcion || !formData.categoria || !formData.marca) {
        alert('Por favor completa todos los campos del producto');
        return;
      }
    } else {
      if (!formData.id_producto || !formData.nombre_variante) {
        alert('Por favor completa todos los campos requeridos');
        return;
      }
    }

    if (!formData.precio_base || parseFloat(formData.precio_base) <= 0) {
      alert('Por favor ingresa un precio válido');
      return;
    }

    const tallasConStock = tallasStock.filter(talla => talla.cantidad > 0);
    if (tallasConStock.length === 0) {
      alert('Por favor agrega stock para al menos una talla');
      return;
    }

    // Preparar datos para envío
    const dataToSubmit = {
      // Datos del producto (si es nuevo producto)
      ...(formType === 'nuevo_producto' && {
        producto_nombre: formData.producto_nombre,
        producto_descripcion: formData.producto_descripcion,
        categoria: formData.categoria,
        marca: formData.marca,
        id_sistema_talla: formData.id_sistema_talla,
        id_categoria: formData.id_categoria
      }),
      
      // Datos de la variante
      ...(formType === 'nueva_variante' && {
        id_producto: parseInt(formData.id_producto)
      }),
      
      nombre_variante: formType === 'nuevo_producto' ? formData.producto_nombre : formData.nombre_variante,
      imagen_url: formData.imagen_url,
      imagen_public_id: formData.imagen_public_id,
      
      // Sistema de precios V2: precios van en stock
      precio_unico: formData.precio_unico,
      tallas_stock: tallasConStock.map(talla => ({
        id_talla: talla.id_talla,
        cantidad: talla.cantidad,
        precio: talla.precio,
        precio_original: talla.precio_original || null
      }))
    };

    console.log('📊 Datos a enviar (V2):', dataToSubmit);
    onSubmit(dataToSubmit);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {formType === 'nuevo_producto' ? 'Crear Nuevo Producto' : 'Crear Nueva Variante'}
            {editingVariant ? ' (Editando)' : ''}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Datos del Producto (solo para nuevo producto) */}
          {formType === 'nuevo_producto' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Información del Producto</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    value={formData.producto_nombre}
                    onChange={(e) => setFormData({...formData, producto_nombre: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Camiseta Premium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marca *
                  </label>
                  <input
                    type="text"
                    value={formData.marca}
                    onChange={(e) => setFormData({...formData, marca: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Nike"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción *
                </label>
                <textarea
                  value={formData.producto_descripcion}
                  onChange={(e) => setFormData({...formData, producto_descripcion: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Descripción del producto..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría *
                  </label>
                  <input
                    type="text"
                    value={formData.categoria}
                    onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Camisetas"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sistema de Tallas *
                  </label>
                  <select
                    value={formData.id_sistema_talla}
                    onChange={(e) => setFormData({...formData, id_sistema_talla: parseInt(e.target.value)})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value={0}>Seleccionar sistema de tallas</option>
                    {sistemas_talla.map(sistema => (
                      <option key={sistema.id_sistema_talla} value={sistema.id_sistema_talla}>
                        {sistema.nombre_sistema}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría (Nueva)
                </label>
                <CategoriaSelector
                  value={formData.id_categoria}
                  onChange={(categoriaId) => setFormData({...formData, id_categoria: categoriaId})}
                  placeholder="Seleccionar categoría"
                />
              </div>
            </div>
          )}

          {/* Selección de Producto (solo para nueva variante) */}
          {formType === 'nueva_variante' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Producto *
              </label>
              <select
                value={formData.id_producto}
                onChange={(e) => setFormData({...formData, id_producto: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seleccionar producto existente</option>
                {productos.map(producto => (
                  <option key={producto.id_producto} value={producto.id_producto}>
                    {producto.nombre} - {producto.marca}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Nombre de la Variante */}
          {formType === 'nueva_variante' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Variante *
              </label>
              <input
                type="text"
                value={formData.nombre_variante}
                onChange={(e) => setFormData({...formData, nombre_variante: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Azul Marino, Talla M"
                required
              />
            </div>
          )}

          {/* Imagen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagen de la Variante
            </label>
            <div className="flex items-center gap-4">
              {formData.imagen_url && (
                <div className="w-20 h-20 rounded-lg overflow-hidden">
                  <Image
                    src={formData.imagen_url}
                    alt="Vista previa"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                  className="mb-2"
                  disabled={uploadingImage}
                />
                {uploadingImage && <p className="text-sm text-blue-600">Subiendo imagen...</p>}
              </div>
            </div>
          </div>

          {/* Sistema de Precios V2 */}
          {tallasDisponibles.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Sistema de Precios V2</h3>
              
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
                    ? 'Todas las tallas tendrán el mismo precio (guardado en stock)' 
                    : 'Cada talla puede tener un precio diferente (precio personalizado por stock)'
                  }
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

              {/* Stock por Tallas con Precios V2 */}
              <div>
                <h4 className="text-md font-semibold mb-3">Stock y Precios por Talla</h4>
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
                        <label className="block text-xs text-gray-500 mb-1">Precio (en Stock)</label>
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
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Nuevo Sistema V2:</strong> Los precios ahora se guardan directamente en la tabla de stock, 
                    permitiendo mayor flexibilidad y control por talla.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'Guardando...' : (editingVariant ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VariantFormUpdated;
