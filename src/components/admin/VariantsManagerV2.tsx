import React, { useState, useEffect } from 'react';
import VariantFormV2 from './VariantFormV2';
import { useVariantsV2 } from '../../hooks/useVariantsV2';

interface VariantsManagerV2Props {
  currentLanguage: string;
}

const VariantsManagerV2: React.FC<VariantsManagerV2Props> = ({ currentLanguage }) => {
  const { variants, loading, error, refetch, createVariant, updateVariant } = useVariantsV2();
  const [showForm, setShowForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState<any>(null);
  const [productos, setProductos] = useState<any[]>([]);
  const [sistemasTalla, setSistemasTalla] = useState<any[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [filteredVariants, setFilteredVariants] = useState<any[]>([]);

  useEffect(() => {
    fetchProductos();
    fetchSistemasTalla();
  }, []);

  useEffect(() => {
    // Filtrar variantes según el estado del checkbox
    if (showInactive) {
      setFilteredVariants(variants);
    } else {
      setFilteredVariants(variants.filter(variant => variant.variante_activa !== false));
    }
  }, [variants, showInactive]);

  const fetchProductos = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/products', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProductos(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchSistemasTalla = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/size-systems', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSistemasTalla(data.sizeSystems || []);
      }
    } catch (error) {
      console.error('Error fetching size systems:', error);
    }
  };

  const handleCreateVariant = async (data: any) => {
    setFormLoading(true);
    try {
      const success = await createVariant(data);
      if (success) {
        setShowForm(false);
        setEditingVariant(null);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateVariant = async (data: any) => {
    if (!editingVariant) return;
    
    setFormLoading(true);
    try {
      const success = await updateVariant(editingVariant.id_variante, data);
      if (success) {
        setShowForm(false);
        setEditingVariant(null);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (variant: any) => {
    setEditingVariant(variant);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingVariant(null);
  };

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined || isNaN(price) || !isFinite(price)) return '-';
    return `$${price.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Variantes V2</h1>
          <p className="text-gray-600">Sistema actualizado con precios en stock</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nueva Variante
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <strong>Error:</strong> {error}
          <button 
            onClick={() => refetch()}
            className="ml-4 text-red-600 underline hover:text-red-800"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <VariantFormV2
          onSubmit={editingVariant ? handleUpdateVariant : handleCreateVariant}
          onCancel={handleCancel}
          productos={productos}
          sistemas_talla={sistemasTalla}
          loading={formLoading}
          editingVariant={editingVariant}
        />
      )}

      {/* Filtros */}
      <div className="bg-white shadow p-4 rounded-lg mb-6">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="showInactiveVariants"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="showInactiveVariants" className="text-sm font-medium text-gray-700">
            Mostrar variantes inactivas
          </label>
        </div>
      </div>

      {/* Lista de Variantes */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Variantes ({filteredVariants.length})</h2>
        </div>

        {filteredVariants.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {showInactive ? 'No hay variantes registradas' : 'No hay variantes activas'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto / Variante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sistema de Precios
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Imagen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVariants.map((variant) => {
                  const stockTotal = variant.tallas_stock.reduce((sum: number, talla: any) => sum + (talla.cantidad || 0), 0);
                  
                  return (
                    <tr key={variant.id_variante} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{variant.nombre_producto}</div>
                          <div className="text-sm text-blue-600">{variant.nombre_variante}</div>
                          <div className="text-xs text-gray-500">{variant.marca}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {variant.categoria_nombre || variant.categoria}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {formatPrice(variant.precio_base)}
                            {variant.precio_original_base && (
                              <span className="ml-2 text-gray-500 line-through">
                                {formatPrice(variant.precio_original_base)}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {variant.precio_unico ? 'Precio único' : 'Precio por talla'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          stockTotal > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {stockTotal} unidades
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          variant.variante_activa 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {variant.variante_activa ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {variant.imagen_url ? (
                          <img
                            src={variant.imagen_url}
                            alt={variant.nombre_variante}
                            className="h-12 w-12 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400 text-xs">Sin imagen</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(variant)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default VariantsManagerV2;
