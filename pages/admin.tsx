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
      if (editingProduct) {
        // Actualizar producto existente
        const updatedProducts = products.map(p => 
          p.id === editingProduct.id ? { ...productData, id: editingProduct.id } : p
        );
        setProducts(updatedProducts);
        console.log('Updating product:', { ...productData, id: editingProduct.id });
      } else {
        // Crear nuevo producto
        const newProduct = { ...productData, id: Date.now() };
        setProducts([...products, newProduct]);
        console.log('Creating product:', newProduct);
      }
      setShowProductForm(false);
      setEditingProduct(null);
      alert(t('Producto guardado correctamente'));
    } catch (error) {
      console.error('Error saving product:', error);
      alert(t('Error al guardar el producto'));
    }
  };

  const deleteProduct = async (productId: number) => {
    if (confirm(t('¿Estás seguro de que quieres eliminar este producto?'))) {
      try {
        setProducts(products.filter(p => p.id !== productId));
        console.log('Deleting product:', productId);
        alert(t('Producto eliminado correctamente'));
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

  // Componente ProductForm básico
  const ProductForm = ({ product, onSave, onCancel }: any) => {
    const [formData, setFormData] = useState({
      nombre: product?.nombre || '',
      descripcion: product?.descripcion || '',
      precio: product?.precio || '',
      imagen: product?.imagen || '',
      categoria: product?.categoria || '',
      disponible: product?.disponible || true
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {t('Nombre del Producto')}
          </label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => setFormData({...formData, nombre: e.target.value})}
            className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {t('Descripción')}
          </label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
            className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {t('Precio')}
          </label>
          <input
            type="number"
            value={formData.precio}
            onChange={(e) => setFormData({...formData, precio: e.target.value})}
            className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {t('Imagen URL')}
          </label>
          <input
            type="text"
            value={formData.imagen}
            onChange={(e) => setFormData({...formData, imagen: e.target.value})}
            className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {t('Categoría')}
          </label>
          <input
            type="text"
            value={formData.categoria}
            onChange={(e) => setFormData({...formData, categoria: e.target.value})}
            className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.disponible}
            onChange={(e) => setFormData({...formData, disponible: e.target.checked})}
            className="mr-2"
          />
          <label className="text-sm text-gray-300">
            {t('Disponible')}
          </label>
        </div>
        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {t('Guardar')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {t('Cancelar')}
          </button>
        </div>
      </form>
    );
  };

  // Componente PromotionForm básico
  const PromotionForm = ({ promotion, onSave, onCancel }: any) => {
    const [formData, setFormData] = useState({
      titulo: promotion?.titulo || '',
      descripcion: promotion?.descripcion || '',
      descuento: promotion?.descuento || '',
      fechaInicio: promotion?.fechaInicio || '',
      fechaFin: promotion?.fechaFin || '',
      isActive: promotion?.isActive || true
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {t('Título')}
          </label>
          <input
            type="text"
            value={formData.titulo}
            onChange={(e) => setFormData({...formData, titulo: e.target.value})}
            className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {t('Descripción')}
          </label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
            className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {t('Descuento (%)')}
          </label>
          <input
            type="number"
            value={formData.descuento}
            onChange={(e) => setFormData({...formData, descuento: e.target.value})}
            className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
            min="0"
            max="100"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {t('Fecha Inicio')}
            </label>
            <input
              type="date"
              value={formData.fechaInicio}
              onChange={(e) => setFormData({...formData, fechaInicio: e.target.value})}
              className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {t('Fecha Fin')}
            </label>
            <input
              type="date"
              value={formData.fechaFin}
              onChange={(e) => setFormData({...formData, fechaFin: e.target.value})}
              className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
            />
          </div>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
            className="mr-2"
          />
          <label className="text-sm text-gray-300">
            {t('Activa')}
          </label>
        </div>
        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {t('Guardar')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {t('Cancelar')}
          </button>
        </div>
      </form>
    );
  };

  const renderSidebar = () => (
    <div className="w-64 bg-black/80 backdrop-blur-md border-r border-white/20 min-h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-8">{t('Panel de Admin')}</h1>
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
            🖼️ {t('Imágenes Principales')}
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
            📏 {t('Sistemas de Tallas')}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h3 className="text-xl font-semibold text-white mb-4">{t('Pedidos Recientes')}</h3>
          <div className="space-y-3">
            {orders.slice(0, 5).map(order => (
              <div key={order.id} className="flex justify-between items-center p-3 bg-black/30 rounded">
                <div>
                  <p className="text-white font-medium">#{order.id} - {order.customerName}</p>
                  <p className="text-gray-400 text-sm">${order.total}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  order.status === 'pending' ? 'bg-yellow-600 text-white' :
                  order.status === 'processing' ? 'bg-blue-600 text-white' :
                  order.status === 'shipped' ? 'bg-purple-600 text-white' :
                  order.status === 'delivered' ? 'bg-green-600 text-white' :
                  'bg-red-600 text-white'
                }`}>
                  {t(order.status)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h3 className="text-xl font-semibold text-white mb-4">{t('Notas Importantes')}</h3>
          <div className="space-y-3">
            {notes.filter(n => n.priority === 'high').slice(0, 3).map(note => (
              <div key={note.id} className="p-3 bg-red-900/30 border border-red-500/50 rounded">
                <p className="text-white font-medium">{note.title}</p>
                <p className="text-gray-300 text-sm">{note.content.substring(0, 50)}...</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderHeaderTexts = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white mb-6">{t('Gestión de Textos del Header')}</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-black/30 backdrop-blur-lg rounded-xl p-6 border border-white/10 shadow-2xl">
          <h3 className="text-xl font-semibold text-white mb-4">{t('Configuración de Textos')}</h3
          >
          
          <div className="space-y-6">
            <div>
              <label className="block text-white font-medium mb-3">{t('Nombre de la Marca')}</label>
              <input
                type="text"
                value={headerTexts.brandName}
                onChange={(e) => setHeaderTexts({...headerTexts, brandName: e.target.value})}
                className="w-full bg-black/40 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-400/50 transition-colors"
                placeholder={t('Nombre de la marca')}
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-white font-medium">{t('Textos Promocionales')}</label>
                <button
                  onClick={() => {
                    setHeaderTexts({
                      ...headerTexts,
                      promoTexts: [...headerTexts.promoTexts, '']
                    });
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  + {t('Agregar')}
                </button>
              </div>
              
              <div className="space-y-3">
                {headerTexts.promoTexts.map((text, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={text}
                      onChange={(e) => {
                        const newTexts = [...headerTexts.promoTexts];
                        newTexts[index] = e.target.value;
                        setHeaderTexts({...headerTexts, promoTexts: newTexts});
                      }}
                      className="flex-1 bg-black/40 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-400/50 transition-colors"
                      placeholder={t('Texto promocional {{number}}').replace('{{number}}', (index + 1).toString())}
                    />
                    <button
                      onClick={() => {
                        const newTexts = headerTexts.promoTexts.filter((_, i) => i !== index);
                        setHeaderTexts({...headerTexts, promoTexts: newTexts});
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded transition-colors"
                      disabled={headerTexts.promoTexts.length <= 1}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
              
              {headerTexts.promoTexts.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4 border border-dashed border-gray-600 rounded-lg">
                  {t('No hay textos promocionales. Haz clic en "Agregar" para crear uno.')}
                </p>
              )}
            </div>
            
            <button
              onClick={updateHeaderTexts}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {t('Guardar Cambios')}
            </button>
          </div>
        </div>

        <div className="bg-black/30 backdrop-blur-lg rounded-xl p-6 border border-white/10 shadow-2xl">
          <h3 className="text-xl font-semibold text-white mb-4">{t('Vista Previa del Header')}</h3>
          
          {/* Simulación del header */}
          <div className="bg-gradient-to-r from-green-700 to-green-900 rounded-lg p-4 mb-4">
            <div className="text-center">
              <p className="text-white text-lg font-bold tracking-[4px] mb-3">{headerTexts.brandName}</p>
              
              {headerTexts.promoTexts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-300 mb-2">{t('Textos del carrusel:')}</p>
                  {headerTexts.promoTexts.map((text, index) => (
                    <div key={index} className="flex items-center justify-center gap-2">
                      <span className="w-2 h-2 bg-white rounded-full opacity-50"></span>
                      <p className="text-green-200 text-sm text-center">{text || t('(Texto vacío)')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-black/40 backdrop-blur-md rounded p-3 text-xs text-gray-400">
            <p className="font-medium mb-2">{t('Información:')}</p>
            <ul className="space-y-1">
              <li>• {t('Los textos promocionales se mostrarán en rotación')}</li>
              <li>• {t('Mínimo 1 texto promocional requerido')}</li>
              <li>• {t('Máximo recomendado: 5 textos')}</li>
              <li>• {t('Los cambios se aplicarán inmediatamente')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHomeImages = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white mb-6">{t('Gestión de Imágenes Principales')}</h2>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2">
          <span className="text-blue-300 text-sm">💡 {t('Tip: Optimiza tus imágenes para web')}</span>
        </div>
      </div>
      
      {/* Panel de consejos generales */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
        <h3 className="text-yellow-300 font-semibold mb-2">📝 {t('Mejores Prácticas para Imágenes')}</h3>
        <ul className="text-yellow-200 text-sm space-y-1">
          <li>• {t('Usa formatos modernos como WebP cuando sea posible')}</li>
          <li>• {t('Comprime las imágenes sin perder calidad visible')}</li>
          <li>• {t('Asegúrate de que las imágenes se vean bien en dispositivos móviles')}</li>
          <li>• {t('Usa texto alternativo descriptivo para mejor SEO')}</li>
        </ul>
      </div>
      
      <div className="bg-black/30 backdrop-blur-lg rounded-xl p-6 border border-white/10 shadow-2xl space-y-8">
        {/* Imagen Principal 1 */}
        <div className="bg-black/20 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            <label className="text-white font-semibold text-lg">{t('Imagen Principal 1')}</label>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
            <p className="text-blue-300 text-sm font-medium mb-1">📐 {t('Tamaño recomendado:')}</p>
            <p className="text-blue-200 text-sm">1920x800px • Formato: JPG/PNG • Máx: 2MB</p>
            <p className="text-gray-400 text-xs mt-1">{t('Imagen principal del hero section de la página de inicio')}</p>
          </div>
          <input
            type="text"
            value={homeImages.heroImage1}
            onChange={(e) => setHomeImages({...homeImages, heroImage1: e.target.value})}
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-gray-400 focus:outline-none mb-4"
            placeholder={t('URL de la primera imagen')}
          />
          <div className="w-48 h-24 bg-black/40 rounded-lg overflow-hidden border border-white/10">
            <Image
              src={homeImages.heroImage1}
              alt="Imagen 1"
              width={192}
              height={96}
              className="w-full h-full object-cover"
              onError={() => console.log('Error loading image 1')}
            />
          </div>
        </div>
        
        {/* Imagen Principal 2 */}
        <div className="bg-black/20 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
            <label className="text-white font-semibold text-lg">{t('Imagen Principal 2')}</label>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 mb-4">
            <p className="text-purple-300 text-sm font-medium mb-1">📐 {t('Tamaño recomendado:')}</p>
            <p className="text-purple-200 text-sm">1920x800px • Formato: JPG/PNG • Máx: 2MB</p>
            <p className="text-gray-400 text-xs mt-1">{t('Segunda imagen del hero section de la página de inicio')}</p>
          </div>
          <input
            type="text"
            value={homeImages.heroImage2}
            onChange={(e) => setHomeImages({...homeImages, heroImage2: e.target.value})}
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-gray-400 focus:outline-none mb-4"
            placeholder={t('URL de la segunda imagen')}
          />
          <div className="w-48 h-24 bg-black/40 rounded-lg overflow-hidden border border-white/10">
            <Image
              src={homeImages.heroImage2}
              alt="Imagen 2"
              width={192}
              height={96}
              className="w-full h-full object-cover"
              onError={() => console.log('Error loading image 2')}
            />
          </div>
        </div>

        {/* Nueva: Imagen del Banner de Promociones */}
        <div className="bg-black/20 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <label className="text-white font-semibold text-lg">{t('Banner de Promociones Especiales')}</label>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-4">
            <p className="text-green-300 text-sm font-medium mb-1">📐 {t('Tamaño recomendado:')}</p>
            <p className="text-green-200 text-sm">1600x600px • Formato: JPG/PNG • Máx: 3MB</p>
            <p className="text-gray-400 text-xs mt-1">{t('Imagen de fondo para la sección de promociones especiales en la página principal')}</p>
          </div>
          <input
            type="text"
            value={homeImages.promosBannerImage}
            onChange={(e) => setHomeImages({...homeImages, promosBannerImage: e.target.value})}
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-gray-400 focus:outline-none mb-4"
            placeholder={t('URL de la imagen del banner de promociones')}
          />
          
          {/* Vista previa del banner */}
          <div className="mb-4">
            <p className="text-white text-sm font-medium mb-2">{t('Vista previa del banner:')}</p>
            <div className="relative w-full h-32 bg-black/40 rounded-lg overflow-hidden border border-white/10">
              <Image
                src={homeImages.promosBannerImage}
                alt="Banner Promociones Preview"
                fill
                className="object-cover"
                onError={() => console.log('Error loading promo banner preview')}
              />
              {/* Simulación del overlay y texto */}
              <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-start p-4">
                <div className="text-white text-lg font-bold tracking-wider drop-shadow-lg">
                  {t('Promociones')}
                </div>
                <div className="text-white text-lg font-bold tracking-wider drop-shadow-lg">
                  {t('Especiales')}
                </div>
                <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                  🔥 HOT
                </div>
              </div>
            </div>
          </div>
          
          {/* Thumbnail pequeño */}
          <div className="w-48 h-18 bg-black/40 rounded-lg overflow-hidden border border-white/10">
            <Image
              src={homeImages.promosBannerImage}
              alt="Banner Promociones Thumbnail"
              width={192}
              height={72}
              className="w-full h-full object-cover"
              onError={() => console.log('Error loading promo banner thumbnail')}
            />
          </div>
        </div>
        
        {/* Botón de actualización */}
        <div className="flex justify-center pt-4">
          <button
            onClick={updateHomeImages}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
          >
            {t('💾 Actualizar Todas las Imágenes')}
          </button>
        </div>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/20">
      <ProductManagement />
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
