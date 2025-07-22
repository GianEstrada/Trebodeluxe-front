import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUniversalTranslate } from '../hooks/useUniversalTranslate';
import { useAuth } from '../contexts/AuthContext';
import ProductManagement from '../components/admin/ProductManagement';
import SizeManagement from '../components/admin/SizeManagement';
import PromotionManagement from '../components/admin/PromotionManagement';

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  description: string;
  sizes: string[];
  colors: string[];
  inStock: boolean;
  featured: boolean;
}

interface Promotion {
  id: number;
  title: string;
  description: string;
  type: 'percentage' | 'quantity' | 'promo_code';
  
  // Para descuentos de porcentaje
  discountPercentage?: number;
  
  // Para promociones de cantidad (2x1, 3x2, etc.)
  quantityRequired?: number;
  quantityFree?: number;
  
  // Para códigos promocionales
  promoCode?: string;
  codeDiscountPercentage?: number;
  codeDiscountAmount?: number;
  
  // Aplicación de la promoción
  applicationType: 'all_products' | 'specific_category' | 'specific_product';
  targetCategoryId?: string;
  targetProductId?: number;
  
  validFrom: string;
  validTo: string;
  isActive: boolean;
  image?: string;
  
  // Límites de uso
  usageLimit?: number;
  currentUsage?: number;
  minPurchaseAmount?: number;
}

interface Order {
  id: number;
  customerName: string;
  email: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: string;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
}

interface Note {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
}

interface HeaderTexts {
  promoTexts: string[];
  brandName: string;
}

interface PromoText {
  id: number;
  text: string;
  isActive: boolean;
  order: number;
}

interface HomeImages {
  heroImage1: string;
  heroImage2: string;
  promosBannerImage: string;
}

interface SizeSystem {
  id: number;
  nombre: string;
  descripcion?: string;
  talla_1: string;
  talla_2: string;
  talla_3: string;
  talla_4?: string;
  talla_5?: string;
  talla_6?: string;
  talla_7?: string;
  talla_8?: string;
}

const AdminPage: NextPage = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [currentLanguage, setCurrentLanguage] = useState("es");
  const { t, isTranslating } = useUniversalTranslate(currentLanguage);

  // Categorías disponibles para las promociones
  const availableCategories = [
    { id: 'camisetas', name: 'Camisetas' },
    { id: 'pantalones', name: 'Pantalones' },
    { id: 'zapatos', name: 'Zapatos' },
    { id: 'accesorios', name: 'Accesorios' },
    { id: 'chaquetas', name: 'Chaquetas' },
    { id: 'vestidos', name: 'Vestidos' },
    { id: 'faldas', name: 'Faldas' },
    { id: 'ropa-interior', name: 'Ropa Interior' },
    { id: 'deportiva', name: 'Ropa Deportiva' },
    { id: 'formal', name: 'Ropa Formal' }
  ];

  // Estados para las diferentes secciones
  const [activeSection, setActiveSection] = useState('dashboard');
  
  // Estados para Header Texts
  const [headerTexts, setHeaderTexts] = useState<HeaderTexts>({
    promoTexts: [
      'ENVIO GRATIS EN PEDIDOS ARRIBA DE $500 MXN',
      'OFERTA ESPECIAL: 20% DE DESCUENTO EN SEGUNDA PRENDA'
    ],
    brandName: 'TREBOLUXE'
  });

  // Estados para Home Images
  const [homeImages, setHomeImages] = useState<HomeImages>({
    heroImage1: '/797e7904b64e13508ab322be3107e368-1@2x.png',
    heroImage2: '/look-polo-2-1@2x.png',
    promosBannerImage: '/promociones-playa.jpg'
  });

  // Estados para Products CRUD
  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: "Camiseta Básica Premium",
      price: 24.99,
      originalPrice: 29.99,
      image: "/797e7904b64e13508ab322be3107e368-1@2x.png",
      category: "Camisetas",
      description: "Camiseta de algodón 100% premium",
      sizes: ["S", "M", "L", "XL"],
      colors: ["Blanco", "Negro", "Gris"],
      inStock: true,
      featured: true
    }
  ]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);

  // Estados para Promotions CRUD
  const [promotions, setPromotions] = useState<Promotion[]>([
    {
      id: 1,
      title: "Descuento de Verano",
      description: "20% de descuento en toda la colección de verano",
      type: "percentage",
      discountPercentage: 20,
      applicationType: "all_products",
      validFrom: "2025-06-01",
      validTo: "2025-08-31",
      isActive: true,
      currentUsage: 0
    },
    {
      id: 2,
      title: "2x1 en Camisetas",
      description: "Compra 2 camisetas y llévate la segunda gratis",
      type: "quantity",
      quantityRequired: 2,
      quantityFree: 1,
      applicationType: "specific_category",
      targetCategoryId: "camisetas",
      validFrom: "2025-07-01",
      validTo: "2025-07-31",
      isActive: true,
      currentUsage: 0
    },
    {
      id: 3,
      title: "Código SUMMER30",
      description: "30% de descuento con código promocional",
      type: "promo_code",
      promoCode: "SUMMER30",
      codeDiscountPercentage: 30,
      applicationType: "all_products",
      validFrom: "2025-07-01",
      validTo: "2025-08-31",
      isActive: true,
      usageLimit: 100,
      currentUsage: 15,
      minPurchaseAmount: 500
    }
  ]);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [showPromotionForm, setShowPromotionForm] = useState(false);

  // Estados para Orders Management
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 1001,
      customerName: "Juan Pérez",
      email: "juan@email.com",
      total: 149.97,
      status: "processing",
      orderDate: "2025-07-13",
      items: [
        { productName: "Camiseta Básica Premium", quantity: 2, price: 24.99 },
        { productName: "Polo Clásico", quantity: 1, price: 34.99 }
      ]
    }
  ]);

  // Estados para Notes
  const [notes, setNotes] = useState<Note[]>([
    {
      id: 1,
      title: "Recordatorio importante",
      content: "Revisar inventario de productos antes del fin de mes",
      createdAt: "2025-07-13",
      priority: "high"
    }
  ]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showNoteForm, setShowNoteForm] = useState(false);

  // Estados para Size Systems
  const [sizeSystems, setSizeSystems] = useState<SizeSystem[]>([
    {
      id: 1,
      nombre: "Tallas Estándar",
      talla_1: "XS",
      talla_2: "S",
      talla_3: "M",
      talla_4: "L",
      talla_5: "XL",
      talla_6: "XXL",
      talla_7: "",
      talla_8: ""
    },
    {
      id: 2,
      nombre: "Tallas Numéricas",
      talla_1: "36",
      talla_2: "38",
      talla_3: "40",
      talla_4: "42",
      talla_5: "44",
      talla_6: "46",
      talla_7: "48",
      talla_8: "50"
    },
    {
      id: 3,
      nombre: "Tallas de Calzado",
      talla_1: "35",
      talla_2: "36",
      talla_3: "37",
      talla_4: "38",
      talla_5: "39",
      talla_6: "40",
      talla_7: "41",
      talla_8: "42"
    }
  ]);
  const [editingSizeSystem, setEditingSizeSystem] = useState<SizeSystem | null>(null);
  const [showSizeSystemForm, setShowSizeSystemForm] = useState(false);

  // Estados para búsqueda y filtros de productos
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    priceRange: { min: 0, max: 1000 },
  });

  // Verificar si el usuario es administrador
  useEffect(() => {
    // Aquí verificarías con el backend si el usuario es admin
    // Por ahora simularemos que cualquier usuario logueado puede acceder
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Funciones para Header Texts
  const updateHeaderTexts = async () => {
    try {
      // Aquí enviarías los datos al backend
      console.log('Updating header texts:', headerTexts);
      alert(t('Textos del header actualizados correctamente'));
    } catch (error) {
      console.error('Error updating header texts:', error);
      alert(t('Error al actualizar los textos'));
    }
  };

  // Funciones para Home Images
  const updateHomeImages = async () => {
    try {
      // Aquí enviarías las URLs de las imágenes al backend
      console.log('Updating home images:', homeImages);
      alert(t('Imágenes actualizadas correctamente'));
    } catch (error) {
      console.error('Error updating images:', error);
      alert(t('Error al actualizar las imágenes'));
    }
  };

  // Funciones para Products CRUD
  const saveProduct = async (productData: Omit<Product, 'id'>) => {
    try {
      // Transformar los datos del frontend al formato que espera el backend
      // Solo incluir campos que tengan valores válidos
      const backendData: any = {};
      
      if (productData.name && productData.name.trim() !== '') {
        backendData.nombre = productData.name.trim();
      }
      
      if (productData.description && productData.description.trim() !== '') {
        backendData.descripcion = productData.description.trim();
      }
      
      if (productData.price && productData.price > 0) {
        backendData.precio = productData.price;
      }
      
      if (productData.originalPrice && productData.originalPrice > 0) {
        backendData.precio_original = productData.originalPrice;
      }
      
      if (productData.image && productData.image.trim() !== '') {
        backendData.imagen = productData.image.trim();
      }
      
      if (productData.category && productData.category.trim() !== '') {
        backendData.categoria = productData.category.trim();
      }
      
      if (productData.inStock !== undefined) {
        backendData.activo = productData.inStock;
      }

      console.log('Datos a enviar al backend:', backendData);

      if (editingProduct) {
        // Actualizar producto existente en el backend
        const response = await fetch(`/api/admin/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(backendData),
        });

        const result = await response.json();
        
        if (response.ok && result.success) {
          // Actualizar el estado local
          const updatedProducts = products.map(p => 
            p.id === editingProduct.id ? { ...productData, id: editingProduct.id } : p
          );
          setProducts(updatedProducts);
          console.log('Product updated successfully:', result);
          alert(t('Producto actualizado correctamente'));
        } else {
          console.error('Error updating product:', result.message);
          alert(t('Error al actualizar el producto: ') + (result.message || 'Error desconocido'));
        }
      } else {
        // Crear nuevo producto en el backend
        const response = await fetch('/api/admin/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(backendData),
        });

        const result = await response.json();
        
        if (response.ok && result.success) {
          // Agregar el producto al estado local
          const newProduct = { ...productData, id: result.data.id_producto };
          setProducts([...products, newProduct]);
          console.log('Product created successfully:', result);
          alert(t('Producto creado correctamente'));
        } else {
          console.error('Error creating product:', result.message);
          alert(t('Error al crear el producto: ') + (result.message || 'Error desconocido'));
        }
      }
      
      setShowProductForm(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
      alert(t('Error al guardar el producto: ') + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  const deleteProduct = async (productId: number) => {
    if (confirm(t('¿Estás seguro de que quieres eliminar este producto?'))) {
      try {
        const response = await fetch(`/api/admin/products/${productId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();
        
        if (response.ok && result.success) {
          // Remover del estado local
          setProducts(products.filter(p => p.id !== productId));
          console.log('Product deleted successfully:', productId);
          alert(t('Producto eliminado correctamente'));
        } else {
          console.error('Error deleting product:', result.message);
          alert(t('Error al eliminar el producto: ') + (result.message || 'Error desconocido'));
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        alert(t('Error al eliminar el producto'));
      }
    }
  };

  // Funciones para Promotions CRUD
  const savePromotion = async (promotionData: Omit<Promotion, 'id'>) => {
    try {
      if (editingPromotion) {
        const updatedPromotions = promotions.map(p => 
          p.id === editingPromotion.id ? { ...promotionData, id: editingPromotion.id } : p
        );
        setPromotions(updatedPromotions);
        console.log('Updating promotion:', { ...promotionData, id: editingPromotion.id });
      } else {
        const newPromotion = { ...promotionData, id: Date.now() };
        setPromotions([...promotions, newPromotion]);
        console.log('Creating promotion:', newPromotion);
      }
      setShowPromotionForm(false);
      setEditingPromotion(null);
      alert(t('Promoción guardada correctamente'));
    } catch (error) {
      console.error('Error saving promotion:', error);
      alert(t('Error al guardar la promoción'));
    }
  };

  const deletePromotion = async (promotionId: number) => {
    if (confirm(t('¿Estás seguro de que quieres eliminar esta promoción?'))) {
      try {
        setPromotions(promotions.filter(p => p.id !== promotionId));
        console.log('Deleting promotion:', promotionId);
        alert(t('Promoción eliminada correctamente'));
      } catch (error) {
        console.error('Error deleting promotion:', error);
        alert(t('Error al eliminar la promoción'));
      }
    }
  };

  // Funciones para Orders Management
  const updateOrderStatus = async (orderId: number, newStatus: Order['status']) => {
    try {
      const updatedOrders = orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      );
      setOrders(updatedOrders);
      console.log('Updating order status:', orderId, newStatus);
      alert(t('Estado del pedido actualizado'));
    } catch (error) {
      console.error('Error updating order status:', error);
      alert(t('Error al actualizar el estado'));
    }
  };

  // Funciones para Notes
  const saveNote = async (noteData: Omit<Note, 'id' | 'createdAt'>) => {
    try {
      if (editingNote) {
        const updatedNotes = notes.map(n => 
          n.id === editingNote.id ? { ...noteData, id: editingNote.id, createdAt: editingNote.createdAt } : n
        );
        setNotes(updatedNotes);
        console.log('Updating note:', { ...noteData, id: editingNote.id });
      } else {
        const newNote = { 
          ...noteData, 
          id: Date.now(), 
          createdAt: new Date().toISOString().split('T')[0] 
        };
        setNotes([...notes, newNote]);
        console.log('Creating note:', newNote);
      }
      setShowNoteForm(false);
      setEditingNote(null);
      alert(t('Nota guardada correctamente'));
    } catch (error) {
      console.error('Error saving note:', error);
      alert(t('Error al guardar la nota'));
    }
  };

  const deleteNote = async (noteId: number) => {
    if (confirm(t('¿Estás seguro de que quieres eliminar esta nota?'))) {
      try {
        setNotes(notes.filter(n => n.id !== noteId));
        console.log('Deleting note:', noteId);
        alert(t('Nota eliminada correctamente'));
      } catch (error) {
        console.error('Error deleting note:', error);
        alert(t('Error al eliminar la nota'));
      }
    }
  };

  // Funciones para Size Systems CRUD
  const saveSizeSystem = async (editingSystem: SizeSystem | null, formData: any) => {
    try {
      const sizeSystemData = {
        nombre: formData.name,
        descripcion: formData.description,
        talla_1: formData.size1,
        talla_2: formData.size2,
        talla_3: formData.size3,
        talla_4: formData.size4,
        talla_5: formData.size5,
        talla_6: formData.size6,
        talla_7: formData.size7,
        talla_8: formData.size8
      };

      if (editingSystem) {
        const updatedSizeSystems = sizeSystems.map(s => 
          s.id === editingSystem.id ? { ...sizeSystemData, id: editingSystem.id } : s
        );
        setSizeSystems(updatedSizeSystems);
        console.log('Updating size system:', { ...sizeSystemData, id: editingSystem.id });
      } else {
        const newSizeSystem = { ...sizeSystemData, id: Date.now() };
        setSizeSystems([...sizeSystems, newSizeSystem]);
        console.log('Creating size system:', newSizeSystem);
      }
      alert(t('Sistema de tallas guardado correctamente'));
    } catch (error) {
      console.error('Error saving size system:', error);
      alert(t('Error al guardar el sistema de tallas'));
    }
  };

  const deleteSizeSystem = async (sizeSystemId: number) => {
    if (confirm(t('¿Estás seguro de que quieres eliminar este sistema de tallas?'))) {
      try {
        setSizeSystems(sizeSystems.filter(s => s.id !== sizeSystemId));
        console.log('Deleting size system:', sizeSystemId);
        alert(t('Sistema de tallas eliminado correctamente'));
      } catch (error) {
        console.error('Error deleting size system:', error);
        alert(t('Error al eliminar el sistema de tallas'));
      }
    }
  };

  // Función para filtrar productos
  const fetchFilteredProducts = async () => {
    try {
      const response = await fetch(`/api/admin/products?search=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(filters.category)}&minPrice=${filters.priceRange.min}&maxPrice=${filters.priceRange.max}`);
      const data = await response.json();
      if (data.success && data.products) {
        // Transformar los datos del backend al formato del frontend
        const transformedProducts = data.products.map((product: any) => ({
          id: product.id,
          name: product.nombre,
          description: product.descripcion,
          price: product.precio,
          originalPrice: product.precio_original,
          image: product.imagen,
          category: product.categoria,
          inStock: product.disponible,
          featured: product.destacado,
          sizes: product.tallas || [],
          colors: product.colores || []
        }));
        setProducts(transformedProducts);
      } else {
        console.error('Error fetching products:', data.message);
      }
    } catch (error) {
      console.error('Error fetching filtered products:', error);
      alert(t('Error al cargar los productos'));
    }
  };

  // Cargar productos al inicializar el componente
  useEffect(() => {
    if (activeSection === 'products') {
      fetchFilteredProducts();
    }
  }, [activeSection]);

  // Componente ProductForm básico
  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'ml_default'); // Preset por defecto de Cloudinary

    try {
      const response = await fetch('https://api.cloudinary.com/v1_1/dyh8tcvzv/image/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Error uploading image:', error);
      return '';
    }
  };

  const ProductForm = ({ product, onSave, onCancel }: any) => {
    const [formData, setFormData] = useState({
      name: product?.name || '',
      description: product?.description || '',
      price: product?.price || '',
      image: product?.image || '',
      category: product?.category || '',
      inStock: product?.inStock || true,
      featured: product?.featured || false,
      sizes: product?.sizes || [],
      colors: product?.colors || [],
      originalPrice: product?.originalPrice || ''
    });

    const [imageFile, setImageFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      let imageUrl = formData.image;
      
      // Si hay un archivo seleccionado, subirlo a Cloudinary
      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', imageFile);
        uploadFormData.append('upload_preset', 'ml_default'); // Ajusta según tu configuración
        
        try {
          const response = await fetch(`https://api.cloudinary.com/v1_1/dyh8tcvzv/image/upload`, {
            method: 'POST',
            body: uploadFormData,
          });
          const data = await response.json();
          imageUrl = data.secure_url;
        } catch (error) {
          console.error('Error uploading image:', error);
          alert(t('Error al subir la imagen'));
          return;
        }
      }

      const productData = {
        ...formData,
        image: imageUrl,
        price: parseFloat(formData.price.toString()) || 0,
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice.toString()) : undefined
      };
      
      onSave(productData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-xl font-bold text-white mb-4">
          {product ? t('Editar Producto') : t('Nuevo Producto')}
        </h3>
        
        <div>
          <label className="block text-white font-medium mb-2">{t('Nombre del producto')}</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-green-500 transition-colors"
            required
          />
        </div>
        
        <div>
          <label className="block text-white font-medium mb-2">{t('Descripción')}</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-green-500 transition-colors"
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-white font-medium mb-2">{t('Precio')}</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full p-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-green-500 transition-colors"
              required
            />
          </div>
          
          <div>
            <label className="block text-white font-medium mb-2">{t('Precio Original')}</label>
            <input
              type="number"
              step="0.01"
              value={formData.originalPrice}
              onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
              className="w-full p-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-green-500 transition-colors"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-white font-medium mb-2">{t('Categoría')}</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full p-3 bg-black/50 border border-white/20 rounded-lg text-white focus:border-green-500 transition-colors"
          >
            <option value="">{t('Seleccionar categoría')}</option>
            <option value="Camisetas">{t('Camisetas')}</option>
            <option value="Pantalones">{t('Pantalones')}</option>
            <option value="Accesorios">{t('Accesorios')}</option>
            <option value="Zapatos">{t('Zapatos')}</option>
          </select>
        </div>
        
        <div>
          <label className="block text-white font-medium mb-2">{t('Imagen del producto')}</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="w-full p-3 bg-black/50 border border-white/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-white file:bg-green-600 file:hover:bg-green-700 file:cursor-pointer"
          />
          {formData.image && (
            <div className="mt-2">
              <img 
                src={formData.image} 
                alt="Vista previa" 
                className="w-24 h-24 object-cover rounded-lg border border-white/20"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center text-white">
            <input
              type="checkbox"
              checked={formData.inStock}
              onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
              className="mr-2 w-4 h-4 text-green-600 bg-black/50 border-white/20 rounded focus:ring-green-500"
            />
            {t('En stock')}
          </label>
          
          <label className="flex items-center text-white">
            <input
              type="checkbox"
              checked={formData.featured}
              onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
              className="mr-2 w-4 h-4 text-green-600 bg-black/50 border-white/20 rounded focus:ring-green-500"
            />
            {t('Destacado')}
          </label>
        </div>
        
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {t('💾 Guardar')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {t('❌ Cancelar')}
          </button>
        </div>
      </form>
    );
  };

  const renderProducts = () => (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      {/* Barra de búsqueda y filtros */}
      <div className="mb-6 space-y-4">
        <h2 className="text-2xl font-bold text-white mb-4">{t('Gestión de Productos')}</h2>
        
        <input
          type="text"
          placeholder={t('Buscar productos...')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-green-500 transition-colors"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="w-full p-3 bg-black/50 border border-white/20 rounded-lg text-white focus:border-green-500 transition-colors"
          >
            <option value="">{t('Todas las categorías')}</option>
            <option value="Camisetas">{t('Camisetas')}</option>
            <option value="Pantalones">{t('Pantalones')}</option>
            <option value="Accesorios">{t('Accesorios')}</option>
            <option value="Zapatos">{t('Zapatos')}</option>
          </select>
          
          <input
            type="number"
            placeholder={t('Precio mínimo')}
            value={filters.priceRange.min}
            onChange={(e) => setFilters({ ...filters, priceRange: { ...filters.priceRange, min: Number(e.target.value) } })}
            className="w-full p-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-green-500 transition-colors"
          />
          
          <input
            type="number"
            placeholder={t('Precio máximo')}
            value={filters.priceRange.max}
            onChange={(e) => setFilters({ ...filters, priceRange: { ...filters.priceRange, max: Number(e.target.value) } })}
            className="w-full p-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-green-500 transition-colors"
          />
        </div>
        
        <button
          onClick={fetchFilteredProducts}
          className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
        >
          {t('🔍 Aplicar filtros')}
        </button>
      </div>

      {/* Lista de productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-black/30 rounded-lg p-6 border border-white/10 hover:border-green-500/50 transition-colors">
            <div className="aspect-w-1 aspect-h-1 mb-4">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-48 object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                }}
              />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">{product.name}</h3>
            <p className="text-gray-300 text-sm mb-2 line-clamp-2">{product.description}</p>
            <div className="flex justify-between items-center mb-4">
              <p className="text-green-400 font-bold text-xl">${product.price}</p>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                product.inStock 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {product.inStock ? t('En stock') : t('Agotado')}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingProduct(product);
                  setShowProductForm(true);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {t('✏️ Editar')}
              </button>
              <button
                onClick={() => deleteProduct(product.id)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {t('🗑️ Eliminar')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Botón para agregar nuevo producto */}
      <div className="mt-6 text-center">
        <button
          onClick={() => {
            setEditingProduct(null);
            setShowProductForm(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
        >
          {t('➕ Agregar Producto')}
        </button>
      </div>

      {/* Modal de formulario */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <ProductForm 
              product={editingProduct}
              onSave={saveProduct}
              onCancel={() => {
                setShowProductForm(false);
                setEditingProduct(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderPromotions = () => (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/20">
      <PromotionManagement />
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white mb-6">{t('Gestión de Pedidos')}</h2>
      
      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-white font-semibold text-lg">
                  {t('Pedido')} #{order.id}
                </h3>
                <p className="text-gray-300">{order.customerName} - {order.email}</p>
                <p className="text-gray-400 text-sm">{order.orderDate}</p>
              </div>
              <div className="text-right">
                <p className="text-green-400 font-bold text-xl">${order.total}</p>
                <select
                  value={order.status}
                  onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                  className="mt-2 bg-black/50 border border-white/20 rounded px-3 py-1 text-white text-sm"
                >
                  <option value="pending">{t('Pendiente')}</option>
                  <option value="processing">{t('Procesando')}</option>
                  <option value="shipped">{t('Enviado')}</option>
                  <option value="delivered">{t('Entregado')}</option>
                  <option value="cancelled">{t('Cancelado')}</option>
                </select>
              </div>
            </div>
            
            <div className="border-t border-white/20 pt-4">
              <h4 className="text-white font-medium mb-2">{t('Productos:')}</h4>
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-300">
                      {item.productName} x{item.quantity}
                    </span>
                    <span className="text-white">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Estados para el sistema de tallas
  const [showForm, setShowForm] = useState(false);
  const [editingSystem, setEditingSystem] = useState<SizeSystem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    size1: '',
    size2: '',
    size3: '',
    size4: '',
    size5: '',
    size6: '',
    size7: '',
    size8: ''
  });

  const renderSizeSystems = () => (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/20">
      <SizeManagement />
    </div>
  );

  const renderNotes = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white mb-6">{t('Notas')}</h2>
      
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-4">{t('Notas del Sistema')}</h3>
        <div className="space-y-4">
          <div className="bg-black/30 rounded-lg p-4 border border-white/10">
            <p className="text-gray-300">
              {t('Aquí puedes agregar notas importantes sobre el sistema de administración.')}
            </p>
          </div>
          <div className="bg-black/30 rounded-lg p-4 border border-white/10">
            <p className="text-gray-300">
              {t('Funcionalidad de notas en desarrollo.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSidebar = () => (
    <div className="w-64 bg-black/80 backdrop-blur-md border-r border-white/20 min-h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-8">{t('Panel Admin')}</h1>
        <nav className="space-y-2">
          <button
            onClick={() => setActiveSection('dashboard')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeSection === 'dashboard' 
                ? 'bg-green-600 text-white' 
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            📊 {t('Dashboard')}
          </button>
          <button
            onClick={() => setActiveSection('header')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeSection === 'header' 
                ? 'bg-green-600 text-white' 
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            📝 {t('Textos del Header')}
          </button>
          <button
            onClick={() => setActiveSection('images')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeSection === 'images' 
                ? 'bg-green-600 text-white' 
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            🖼️ {t('Imágenes')}
          </button>
          <button
            onClick={() => setActiveSection('products')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeSection === 'products' 
                ? 'bg-green-600 text-white' 
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            📦 {t('Productos')}
          </button>
          <button
            onClick={() => setActiveSection('promotions')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeSection === 'promotions' 
                ? 'bg-green-600 text-white' 
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            🎯 {t('Promociones')}
          </button>
          <button
            onClick={() => setActiveSection('orders')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeSection === 'orders' 
                ? 'bg-green-600 text-white' 
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            📋 {t('Pedidos')}
          </button>
          <button
            onClick={() => setActiveSection('notes')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeSection === 'notes' 
                ? 'bg-green-600 text-white' 
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            📝 {t('Notas')}
          </button>
          <button
            onClick={() => setActiveSection('sizes')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeSection === 'sizes' 
                ? 'bg-green-600 text-white' 
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            📏 {t('Tallas')}
          </button>
        </nav>
      </div>
      <div className="absolute bottom-6 left-6">
        <Link href="/" className="text-gray-400 hover:text-white transition-colors">
          ← {t('Volver al sitio')}
        </Link>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white mb-6">{t('Dashboard')}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-2">{t('Total Productos')}</h3>
          <p className="text-3xl font-bold text-green-400">{products.length}</p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-2">{t('Promociones Activas')}</h3>
          <p className="text-3xl font-bold text-blue-400">{promotions.filter(p => p.isActive).length}</p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-2">{t('Pedidos Pendientes')}</h3>
          <p className="text-3xl font-bold text-yellow-400">{orders.filter(o => o.status === 'pending').length}</p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-2">{t('Notas')}</h3>
          <p className="text-3xl font-bold text-purple-400">{notes.length}</p>
        </div>
      </div>
    </div>
  );

  const renderHeaderTexts = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white mb-6">{t('Gestión de Textos del Header')}</h2>
      
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-4">{t('Configuración de Textos')}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">{t('Nombre de la marca')}</label>
            <input
              type="text"
              value={headerTexts.brandName}
              onChange={(e) => setHeaderTexts({...headerTexts, brandName: e.target.value})}
              className="w-full bg-black/40 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-400/50 transition-colors"
              placeholder={t('Nombre de la marca')}
            />
          </div>
          
          <button
            onClick={updateHeaderTexts}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {t('💾 Actualizar Textos')}
          </button>
        </div>
      </div>
    </div>
  );

  const renderHomeImages = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white mb-6">{t('Gestión de Imágenes Principales')}</h2>
      
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
        <div className="space-y-6">
          <div>
            <label className="block text-white font-medium mb-2">{t('Imagen Principal 1')}</label>
            <input
              type="text"
              value={homeImages.heroImage1}
              onChange={(e) => setHomeImages({...homeImages, heroImage1: e.target.value})}
              className="w-full bg-black/40 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-400/50 transition-colors"
              placeholder={t('URL de la primera imagen')}
            />
          </div>
          
          <div>
            <label className="block text-white font-medium mb-2">{t('Imagen Principal 2')}</label>
            <input
              type="text"
              value={homeImages.heroImage2}
              onChange={(e) => setHomeImages({...homeImages, heroImage2: e.target.value})}
              className="w-full bg-black/40 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-400/50 transition-colors"
              placeholder={t('URL de la segunda imagen')}
            />
          </div>
          
          <button
            onClick={updateHomeImages}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {t('💾 Actualizar Imágenes')}
          </button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboard();
      case 'header':
        return renderHeaderTexts();
      case 'images':
        return renderHomeImages();
      case 'products':
        return renderProducts();
      case 'promotions':
        return renderPromotions();
      case 'orders':
        return renderOrders();
      case 'notes':
        return renderNotes();
      case 'sizes':
        return renderSizeSystems();
      default:
        return renderDashboard();
    }
  };

  if (!user) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white">Cargando...</div>
    </div>;
  }

  return (
    <div className="min-h-screen flex"
         style={{
           background: 'linear-gradient(180deg, #000 0%, #1a6b1a 25%, #0d3d0d 35%, #000 75%, #000 100%)'
         }}>
      
      {/* Indicador de traducción */}
      {isTranslating && (
        <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-green-600 to-green-400 z-50">
          <div className="h-full bg-white opacity-50 animate-pulse"></div>
        </div>
      )}

      {/* Sidebar */}
      {renderSidebar()}

      {/* Main Content */}
      <div className="flex-1 p-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminPage;
