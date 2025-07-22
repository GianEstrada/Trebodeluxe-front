import React, { useState } from 'react';

interface VariantFormData {
  nombre: string;
  precio: number;
  precio_original?: number;
  imagen_url?: string;
  imagen_public_id?: string;
  tallas: Array<{
    id_talla: number;
    nombre_talla: string;
    cantidad: number;
    precio?: number;
  }>;
}

interface ProductFormData {
  producto_nombre: string;
  producto_descripcion: string;
  categoria: string;
  marca: string;
  id_sistema_talla: number;
  variantes: VariantFormData[];
}

interface SizeSystem {
  id_sistema_talla: number;
  nombre: string;
  tallas: Array<{
    id_talla: number;
    nombre_talla: string;
    orden?: number;
  }>;
}

interface Product {
  id_producto: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  marca: string;
  id_sistema_talla?: number;
  sistema_talla?: string;
  activo: boolean;
}

interface VariantFormProps {
  showVariantForm: boolean;
  setShowVariantForm: (show: boolean) => void;
  formType: 'nuevo_producto' | 'nueva_variante';
  setFormType: (type: 'nuevo_producto' | 'nueva_variante') => void;
  selectedProductId: number | null;
  setSelectedProductId: (id: number | null) => void;
  additionalVariants: number;
  setAdditionalVariants: (count: number) => void;
  uploadingImage: boolean;
  sizeSystems: SizeSystem[];
  products: Product[];
  loadVariants: () => void;
  t: (key: string) => string;
  uploadImageToCloudinary: (file: File) => Promise<{url: string, public_id: string}>;
}

export const VariantForm: React.FC<VariantFormProps> = ({
  showVariantForm,
  setShowVariantForm,
  formType,
  setFormType,
  selectedProductId,
  setSelectedProductId,
  additionalVariants,
  setAdditionalVariants,
  uploadingImage,
  sizeSystems,
  products,
  loadVariants,
  t,
  uploadImageToCloudinary
}) => {
  const [productFormData, setProductFormData] = useState<ProductFormData>({
    producto_nombre: '',
    producto_descripcion: '',
    categoria: '',
    marca: '',
    id_sistema_talla: 0,
    variantes: [
      {
        nombre: '',
        precio: 0,
        precio_original: undefined,
        imagen_url: undefined,
        imagen_public_id: undefined,
        tallas: []
      }
    ]
  });

  const [singleVariantData, setSingleVariantData] = useState<VariantFormData>({
    nombre: '',
    precio: 0,
    precio_original: undefined,
    imagen_url: undefined,
    imagen_public_id: undefined,
    tallas: []
  });

  const [uniquePrice, setUniquePrice] = useState(true);
  const [uniquePriceValue, setUniquePriceValue] = useState(0);

  const handleSizeSystemChange = (systemId: number) => {
    const system = sizeSystems.find(s => s.id_sistema_talla === systemId);
    if (system) {
      const tallasDefault = system.tallas.map(talla => ({
        id_talla: talla.id_talla,
        nombre_talla: talla.nombre_talla,
        cantidad: 0,
        precio: uniquePrice ? uniquePriceValue : 0
      }));

      if (formType === 'nuevo_producto') {
        setProductFormData(prev => ({
          ...prev,
          id_sistema_talla: systemId,
          variantes: prev.variantes.map((v, index) => 
            index === 0 ? { ...v, tallas: tallasDefault } : v
          )
        }));
      } else {
        setSingleVariantData(prev => ({
          ...prev,
          tallas: tallasDefault
        }));
      }
    }
  };

  const addNewVariant = () => {
    const newVariant: VariantFormData = {
      nombre: '',
      precio: 0,
      precio_original: undefined,
      imagen_url: undefined,
      imagen_public_id: undefined,
      tallas: productFormData.variantes[0]?.tallas || []
    };
    setProductFormData(prev => ({
      ...prev,
      variantes: [...prev.variantes, newVariant]
    }));
  };

  const removeVariant = (index: number) => {
    if (productFormData.variantes.length > 1) {
      setProductFormData(prev => ({
        ...prev,
        variantes: prev.variantes.filter((_, i) => i !== index)
      }));
    }
  };

  const handleImageUpload = async (file: File, variantIndex?: number) => {
    try {
      const result = await uploadImageToCloudinary(file);
      
      if (formType === 'nuevo_producto' && variantIndex !== undefined) {
        setProductFormData(prev => ({
          ...prev,
          variantes: prev.variantes.map((v, i) => 
            i === variantIndex ? { 
              ...v, 
              imagen_url: result.url, 
              imagen_public_id: result.public_id 
            } : v
          )
        }));
      } else if (formType === 'nueva_variante') {
        setSingleVariantData(prev => ({
          ...prev,
          imagen_url: result.url,
          imagen_public_id: result.public_id
        }));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(t('Error al subir la imagen'));
    }
  };

  const saveVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://trebodeluxe-backend.onrender.com' 
        : 'http://localhost:5000';

      if (formType === 'nuevo_producto') {
        // Guardar producto completo con variantes
        const response = await fetch(`${baseUrl}/api/admin/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productFormData),
        });

        const data = await response.json();
        if (data.success) {
          alert(t('Producto creado exitosamente'));
          setShowVariantForm(false);
          loadVariants();
        } else {
          alert(data.message || t('Error al crear el producto'));
        }
      } else {
        // Guardar nueva variante para producto existente
        if (!selectedProductId) {
          alert(t('Debe seleccionar un producto'));
          return;
        }

        const response = await fetch(`${baseUrl}/api/admin/variants`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...singleVariantData,
            id_producto: selectedProductId
          }),
        });

        const data = await response.json();
        if (data.success) {
          alert(t('Variante creada exitosamente'));
          setShowVariantForm(false);
          loadVariants();
        } else {
          alert(data.message || t('Error al crear la variante'));
        }
      }
    } catch (error) {
      console.error('Error saving variant:', error);
      alert(t('Error de conexión'));
    }
  };

  if (!showVariantForm) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-black/90 border border-white/20 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">
            {formType === 'nuevo_producto' ? t('Nuevo Producto') : t('Nueva Variante')}
          </h3>
          <button
            onClick={() => setShowVariantForm(false)}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={saveVariant} className="space-y-6">
          {/* Selector de tipo */}
          <div className="flex gap-4 mb-6">
            <label className="flex items-center text-white">
              <input
                type="radio"
                name="formType"
                value="nuevo_producto"
                checked={formType === 'nuevo_producto'}
                onChange={(e) => setFormType(e.target.value as 'nuevo_producto' | 'nueva_variante')}
                className="mr-2"
              />
              {t('Nuevo Producto')}
            </label>
            <label className="flex items-center text-white">
              <input
                type="radio"
                name="formType"
                value="nueva_variante"
                checked={formType === 'nueva_variante'}
                onChange={(e) => setFormType(e.target.value as 'nuevo_producto' | 'nueva_variante')}
                className="mr-2"
              />
              {t('Nueva Variante para Producto Existente')}
            </label>
          </div>

          {formType === 'nuevo_producto' ? (
            /* Formulario de nuevo producto */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {t('Nombre del Producto')}
                  </label>
                  <input
                    type="text"
                    value={productFormData.producto_nombre}
                    onChange={(e) => setProductFormData(prev => ({...prev, producto_nombre: e.target.value}))}
                    className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {t('Categoría')}
                  </label>
                  <select
                    value={productFormData.categoria}
                    onChange={(e) => setProductFormData(prev => ({...prev, categoria: e.target.value}))}
                    className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
                    required
                  >
                    <option value="">{t('Seleccionar categoría')}</option>
                    <option value="Camisetas">{t('Camisetas')}</option>
                    <option value="Polos">{t('Polos')}</option>
                    <option value="Camisas">{t('Camisas')}</option>
                    <option value="Pantalones">{t('Pantalones')}</option>
                    <option value="Sudaderas">{t('Sudaderas')}</option>
                    <option value="Accesorios">{t('Accesorios')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t('Descripción')}
                </label>
                <textarea
                  value={productFormData.producto_descripcion}
                  onChange={(e) => setProductFormData(prev => ({...prev, producto_descripcion: e.target.value}))}
                  className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {t('Marca')}
                  </label>
                  <input
                    type="text"
                    value={productFormData.marca}
                    onChange={(e) => setProductFormData(prev => ({...prev, marca: e.target.value}))}
                    className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {t('Sistema de Tallas')}
                  </label>
                  <select
                    value={productFormData.id_sistema_talla}
                    onChange={(e) => handleSizeSystemChange(Number(e.target.value))}
                    className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
                    required
                  >
                    <option value={0}>{t('Seleccionar sistema')}</option>
                    {sizeSystems.map((system) => (
                      <option key={system.id_sistema_talla} value={system.id_sistema_talla}>
                        {system.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Variantes del producto */}
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-white">{t('Variantes')}</h4>
                {productFormData.variantes.map((variant, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="text-md font-medium text-green-400">
                        {t('Variante')} {index + 1}
                      </h5>
                      {productFormData.variantes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm text-gray-300 mb-1">
                          {t('Nombre de la Variante')}
                        </label>
                        <input
                          type="text"
                          value={variant.nombre}
                          onChange={(e) => setProductFormData(prev => ({
                            ...prev,
                            variantes: prev.variantes.map((v, i) => 
                              i === index ? {...v, nombre: e.target.value} : v
                            )
                          }))}
                          className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-300 mb-1">
                          {t('Imagen')}
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, index);
                          }}
                          className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm text-gray-300 mb-1">
                          {t('Precio')}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={variant.precio}
                          onChange={(e) => setProductFormData(prev => ({
                            ...prev,
                            variantes: prev.variantes.map((v, i) => 
                              i === index ? {...v, precio: Number(e.target.value)} : v
                            )
                          }))}
                          className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-300 mb-1">
                          {t('Precio Original (opcional)')}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={variant.precio_original || ''}
                          onChange={(e) => setProductFormData(prev => ({
                            ...prev,
                            variantes: prev.variantes.map((v, i) => 
                              i === index ? {...v, precio_original: e.target.value ? Number(e.target.value) : undefined} : v
                            )
                          }))}
                          className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
                        />
                      </div>
                    </div>

                    {/* Tallas y stock */}
                    {variant.tallas.length > 0 && (
                      <div>
                        <h6 className="text-sm font-medium text-gray-300 mb-2">
                          {t('Tallas y Stock')}
                        </h6>
                        <div className="bg-black/30 rounded-lg p-3">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-black/50">
                                {variant.tallas.map((talla) => (
                                  <th key={talla.id_talla} className="p-2 text-white text-center">
                                    {talla.nombre_talla}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                {variant.tallas.map((talla) => (
                                  <td key={`cantidad-${talla.id_talla}`} className="p-2">
                                    <input
                                      type="number"
                                      min="0"
                                      value={talla.cantidad}
                                      onChange={(e) => setProductFormData(prev => ({
                                        ...prev,
                                        variantes: prev.variantes.map((v, i) => 
                                          i === index ? {
                                            ...v,
                                            tallas: v.tallas.map(t => 
                                              t.id_talla === talla.id_talla 
                                                ? {...t, cantidad: Number(e.target.value)}
                                                : t
                                            )
                                          } : v
                                        )
                                      }))}
                                      className="w-full p-1 bg-black/50 border border-white/20 rounded text-white text-center"
                                      placeholder="0"
                                    />
                                  </td>
                                ))}
                              </tr>
                              {!uniquePrice && (
                                <tr>
                                  {variant.tallas.map((talla) => (
                                    <td key={`precio-${talla.id_talla}`} className="p-2">
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={talla.precio || 0}
                                        onChange={(e) => setProductFormData(prev => ({
                                          ...prev,
                                          variantes: prev.variantes.map((v, i) => 
                                            i === index ? {
                                              ...v,
                                              tallas: v.tallas.map(t => 
                                                t.id_talla === talla.id_talla 
                                                  ? {...t, precio: Number(e.target.value)}
                                                  : t
                                              )
                                            } : v
                                          )
                                        }))}
                                        className="w-full p-1 bg-black/50 border border-white/20 rounded text-white text-center"
                                        placeholder="0.00"
                                      />
                                    </td>
                                  ))}
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Botón para agregar variante */}
                <button
                  type="button"
                  onClick={addNewVariant}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  + {t('Nueva Variante')}
                </button>
              </div>
            </div>
          ) : (
            /* Formulario de nueva variante para producto existente */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t('Seleccionar Producto')}
                </label>
                <select
                  value={selectedProductId || ''}
                  onChange={(e) => {
                    const productId = Number(e.target.value);
                    setSelectedProductId(productId);
                    
                    // Auto-configurar tallas basado en el sistema del producto
                    const product = products.find(p => p.id_producto === productId);
                    if (product?.id_sistema_talla) {
                      handleSizeSystemChange(product.id_sistema_talla);
                    }
                  }}
                  className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
                  required
                >
                  <option value="">{t('Seleccionar producto')}</option>
                  {products.map((product) => (
                    <option key={product.id_producto} value={product.id_producto}>
                      {product.nombre} - {product.categoria}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t('Nombre de la Variante')}
                </label>
                <input
                  type="text"
                  value={singleVariantData.nombre}
                  onChange={(e) => setSingleVariantData(prev => ({...prev, nombre: e.target.value}))}
                  className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t('Imagen')}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
                />
              </div>

              <div className="mb-4">
                <label className="flex items-center text-white">
                  <input
                    type="checkbox"
                    checked={uniquePrice}
                    onChange={(e) => setUniquePrice(e.target.checked)}
                    className="mr-2"
                  />
                  {t('Precio único para todas las tallas')}
                </label>
              </div>

              {uniquePrice ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      {t('Precio')}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={singleVariantData.precio}
                      onChange={(e) => setSingleVariantData(prev => ({...prev, precio: Number(e.target.value)}))}
                      className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      {t('Precio Original (opcional)')}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={singleVariantData.precio_original || ''}
                      onChange={(e) => setSingleVariantData(prev => ({...prev, precio_original: e.target.value ? Number(e.target.value) : undefined}))}
                      className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
                    />
                  </div>
                </div>
              ) : null}

              {/* Tallas y stock para variante individual */}
              {singleVariantData.tallas.length > 0 && (
                <div>
                  <h6 className="text-sm font-medium text-gray-300 mb-2">
                    {t('Tallas y Stock')}
                  </h6>
                  <div className="bg-black/30 rounded-lg p-3">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-black/50">
                          {singleVariantData.tallas.map((talla) => (
                            <th key={talla.id_talla} className="p-2 text-white text-center">
                              {talla.nombre_talla}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {singleVariantData.tallas.map((talla) => (
                            <td key={`cantidad-${talla.id_talla}`} className="p-2">
                              <input
                                type="number"
                                min="0"
                                value={talla.cantidad}
                                onChange={(e) => setSingleVariantData(prev => ({
                                  ...prev,
                                  tallas: prev.tallas.map(t => 
                                    t.id_talla === talla.id_talla 
                                      ? {...t, cantidad: Number(e.target.value)}
                                      : t
                                  )
                                }))}
                                className="w-full p-1 bg-black/50 border border-white/20 rounded text-white text-center"
                                placeholder="0"
                              />
                            </td>
                          ))}
                        </tr>
                        {!uniquePrice && (
                          <tr>
                            {singleVariantData.tallas.map((talla) => (
                              <td key={`precio-${talla.id_talla}`} className="p-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={talla.precio || 0}
                                  onChange={(e) => setSingleVariantData(prev => ({
                                    ...prev,
                                    tallas: prev.tallas.map(t => 
                                      t.id_talla === talla.id_talla 
                                        ? {...t, precio: Number(e.target.value)}
                                        : t
                                    )
                                  }))}
                                  className="w-full p-1 bg-black/50 border border-white/20 rounded text-white text-center"
                                  placeholder="0.00"
                                />
                              </td>
                            ))}
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botones del formulario */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              disabled={uploadingImage}
            >
              {uploadingImage ? t('Guardando...') : t('Guardar')}
            </button>
            <button
              type="button"
              onClick={() => setShowVariantForm(false)}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {t('Cancelar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
