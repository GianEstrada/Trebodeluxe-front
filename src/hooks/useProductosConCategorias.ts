import { useState, useEffect } from 'react';

interface Producto {
  id_producto: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  marca: string;
  id_categoria?: number;
  categoria_nombre?: string;
  precio_base?: number;
  activo: boolean;
}

interface UseProductosConCategorias {
  productos: Producto[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateProductCategoria: (id: number, categoriaId: number) => Promise<boolean>;
}

export const useProductosConCategorias = (): UseProductosConCategorias => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/products', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar productos');
      }

      const data = await response.json();
      
      // Enriquecer productos con información de categorías
      const productosEnriquecidos = await Promise.all(
        (data.products || []).map(async (producto: any) => {
          // Si el producto tiene id_categoria, obtener el nombre de la categoría
          if (producto.id_categoria) {
            try {
              const categoriaResponse = await fetch(`/api/categorias`);
              if (categoriaResponse.ok) {
                const categoriaData = await categoriaResponse.json();
                const categoria = categoriaData.data.find((c: any) => c.id_categoria === producto.id_categoria);
                if (categoria) {
                  producto.categoria_nombre = categoria.nombre;
                }
              }
            } catch (error) {
              console.warn('Error fetching categoria for product:', producto.id_producto);
            }
          }

          // Obtener precio base desde el primer stock disponible
          try {
            const stockResponse = await fetch(`/api/admin/variants-v2`);
            if (stockResponse.ok) {
              const stockData = await stockResponse.json();
              const productVariants = stockData.variants.filter((v: any) => v.id_producto === producto.id_producto);
              if (productVariants.length > 0) {
                producto.precio_base = productVariants[0].precio_base;
              }
            }
          } catch (error) {
            console.warn('Error fetching stock for product:', producto.id_producto);
          }

          return producto;
        })
      );

      setProductos(productosEnriquecidos);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
      console.error('Error fetching productos con categorias:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProductCategoria = async (id: number, categoriaId: number): Promise<boolean> => {
    try {
      setError(null);
      
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id_categoria: categoriaId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar categoría del producto');
      }

      await fetchProductos(); // Refetch para actualizar la lista
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
      console.error('Error updating product categoria:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  return {
    productos,
    loading,
    error,
    refetch: fetchProductos,
    updateProductCategoria
  };
};

export default useProductosConCategorias;
