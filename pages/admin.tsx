import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUniversalTranslate } from '../hooks/useUniversalTranslate';
import { useAuth } from '../contexts/AuthContext';

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
          <h3 className="text-xl font-semibold text-white mb-4">{t('Configuración de Textos')}</h3>
          
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white">{t('Gestión de Productos')}</h2>
        <button
          onClick={() => {
            setEditingProduct(null);
            setShowProductForm(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          + {t('Nuevo Producto')}
        </button>
      </div>

      {/* Lista de productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="w-full h-48 bg-black/30 rounded-lg overflow-hidden mb-4">
              <Image
                src={product.image}
                alt={product.name}
                width={200}
                height={192}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-white font-semibold mb-2">{product.name}</h3>
            <p className="text-gray-300 text-sm mb-2">{product.category}</p>
            <p className="text-green-400 font-bold mb-2">${product.price}</p>
            <p className="text-gray-400 text-sm mb-4">{product.description}</p>
            <div className="flex justify-between items-center">
              <span className={`px-2 py-1 rounded text-xs ${
                product.inStock ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
              }`}>
                {product.inStock ? t('En Stock') : t('Agotado')}
              </span>
              <div className="space-x-2">
                <button
                  onClick={() => {
                    setEditingProduct(product);
                    setShowProductForm(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  {t('Editar')}
                </button>
                <button
                  onClick={() => deleteProduct(product.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  {t('Eliminar')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Formulario de producto */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black/80 backdrop-blur-md border border-white/20 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-6">
              {editingProduct ? t('Editar Producto') : t('Nuevo Producto')}
            </h3>
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white">{t('Gestión de Promociones')}</h2>
        <button
          onClick={() => {
            setEditingPromotion(null);
            setShowPromotionForm(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          + {t('Nueva Promoción')}
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-black/30 backdrop-blur-lg rounded-xl p-4 border border-white/10">
          <h3 className="text-white/70 text-sm font-medium">{t('Total Promociones')}</h3>
          <p className="text-2xl font-bold text-white">{promotions.length}</p>
        </div>
        <div className="bg-black/30 backdrop-blur-lg rounded-xl p-4 border border-white/10">
          <h3 className="text-white/70 text-sm font-medium">{t('Promociones Activas')}</h3>
          <p className="text-2xl font-bold text-green-400">{promotions.filter(p => p.isActive).length}</p>
        </div>
        <div className="bg-black/30 backdrop-blur-lg rounded-xl p-4 border border-white/10">
          <h3 className="text-white/70 text-sm font-medium">{t('Códigos Promocionales')}</h3>
          <p className="text-2xl font-bold text-blue-400">{promotions.filter(p => p.type === 'promo_code').length}</p>
        </div>
        <div className="bg-black/30 backdrop-blur-lg rounded-xl p-4 border border-white/10">
          <h3 className="text-white/70 text-sm font-medium">{t('Promociones 2x1')}</h3>
          <p className="text-2xl font-bold text-purple-400">{promotions.filter(p => p.type === 'quantity').length}</p>
        </div>
      </div>

      {/* Lista de promociones */}
      <div className="space-y-4">
        {promotions.map(promotion => (
          <div key={promotion.id} className="bg-black/30 backdrop-blur-lg rounded-xl p-6 border border-white/10 shadow-2xl">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-white font-semibold text-lg">{promotion.title}</h3>
                  
                  {/* Badge del tipo de promoción */}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    promotion.type === 'percentage' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    promotion.type === 'quantity' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                    'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {promotion.type === 'percentage' ? t('Descuento %') :
                     promotion.type === 'quantity' ? t('Cantidad') :
                     t('Código')}
                  </span>
                  
                  {/* Badge del estado */}
                  <span className={`px-2 py-1 rounded text-xs ${
                    promotion.isActive ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'
                  }`}>
                    {promotion.isActive ? t('Activa') : t('Inactiva')}
                  </span>
                </div>
                
                <p className="text-gray-300 mb-3">{promotion.description}</p>
                
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  {/* Información específica del tipo */}
                  {promotion.type === 'percentage' && (
                    <span className="text-green-400 font-medium">
                      {promotion.discountPercentage}% OFF
                    </span>
                  )}
                  
                  {promotion.type === 'quantity' && promotion.quantityRequired && promotion.quantityFree && (
                    <span className="text-purple-400 font-medium">
                      {promotion.quantityRequired}x{promotion.quantityRequired - promotion.quantityFree} 
                      ({t('Compra')} {promotion.quantityRequired}, {t('lleva')} {promotion.quantityFree} {t('gratis')})
                    </span>
                  )}
                  
                  {promotion.type === 'promo_code' && (
                    <div className="flex gap-2">
                      <span className="bg-black/40 px-2 py-1 rounded text-blue-400 font-mono">
                        {promotion.promoCode}
                      </span>
                      {promotion.codeDiscountPercentage && (
                        <span className="text-blue-400">
                          {promotion.codeDiscountPercentage}% OFF
                        </span>
                      )}
                      {promotion.codeDiscountAmount && (
                        <span className="text-blue-400">
                          ${promotion.codeDiscountAmount} OFF
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Aplicación */}
                  <span className="text-gray-400">
                    {t('Aplicación')}: {
                      promotion.applicationType === 'all_products' ? t('Todos los productos') :
                      promotion.applicationType === 'specific_category' ? 
                        `${t('Categoría')}: ${availableCategories.find(cat => cat.id === promotion.targetCategoryId)?.name || promotion.targetCategoryId}` :
                      `${t('Producto')}: ${products.find(prod => prod.id === promotion.targetProductId)?.name || `#${promotion.targetProductId}`}`
                    }
                  </span>
                  
                  {/* Fechas */}
                  <span className="text-gray-400">
                    {t('Válido del')} {promotion.validFrom} {t('al')} {promotion.validTo}
                  </span>
                  
                  {/* Uso para códigos promocionales */}
                  {promotion.type === 'promo_code' && promotion.usageLimit && (
                    <span className="text-gray-400">
                      {t('Uso')}: {promotion.currentUsage || 0}/{promotion.usageLimit}
                    </span>
                  )}
                  
                  {/* Compra mínima */}
                  {promotion.minPurchaseAmount && (
                    <span className="text-gray-400">
                      {t('Compra mín')}: ${promotion.minPurchaseAmount}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="space-x-2">
                <button
                  onClick={() => {
                    setEditingPromotion(promotion);
                    setShowPromotionForm(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors"
                >
                  {t('Editar')}
                </button>
                <button
                  onClick={() => deletePromotion(promotion.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm transition-colors"
                >
                  {t('Eliminar')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Formulario de promoción */}
      {showPromotionForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-black/80 backdrop-blur-md border border-white/20 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-6">
                {editingPromotion ? t('Editar Promoción') : t('Nueva Promoción')}
              </h3>
              <PromotionForm
                promotion={editingPromotion}
                onSave={savePromotion}
                onCancel={() => {
                  setShowPromotionForm(false);
                  setEditingPromotion(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
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

  // Componentes de formularios
  const PromoTextForm: React.FC<{
    promoText: PromoText | null;
    onSave: (promoText: Omit<PromoText, 'id'>) => void;
    onCancel: () => void;
  }> = ({ promoText, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      text: promoText?.text || '',
      isActive: promoText?.isActive ?? true,
      order: promoText?.order || 1
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.text.trim()) {
        alert(t('El texto promocional es obligatorio'));
        return;
      }
      onSave(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-white font-medium mb-2">{t('Texto Promocional')}</label>
          <textarea
            value={formData.text}
            onChange={(e) => setFormData({...formData, text: e.target.value})}
            className="w-full bg-black/50 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-400/50 transition-colors resize-none"
            placeholder={t('Escribe el texto promocional que aparecerá en el carrusel del header')}
            rows={3}
            maxLength={100}
            required
          />
          <div className="text-right text-gray-400 text-sm mt-1">
            {formData.text.length}/100 {t('caracteres')}
          </div>
        </div>
        
        <div>
          <label className="block text-white font-medium mb-2">{t('Orden de Aparición')}</label>
          <input
            type="number"
            value={formData.order}
            onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 1})}
            className="w-full bg-black/50 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-400/50 transition-colors"
            min="1"
            placeholder={t('Orden de aparición (1, 2, 3...)')}
          />
        </div>
        
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
            className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
          />
          <label htmlFor="isActive" className="text-white font-medium">
            {t('Activo (aparecerá en el carrusel)')}
          </label>
        </div>
        
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded transition-colors"
          >
            {t('Cancelar')}
          </button>
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition-colors"
          >
            {t('Guardar')}
          </button>
        </div>
      </form>
    );
  };

  const ProductForm: React.FC<{
    product: Product | null;
    onSave: (product: Omit<Product, 'id'>) => void;
    onCancel: () => void;
  }> = ({ product, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      name: product?.name || '',
      price: product?.price || 0,
      originalPrice: product?.originalPrice || 0,
      image: product?.image || '',
      category: product?.category || '',
      description: product?.description || '',
      sizes: product?.sizes?.join(',') || '',
      colors: product?.colors?.join(',') || '',
      inStock: product?.inStock ?? true,
      featured: product?.featured ?? false
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({
        ...formData,
        sizes: formData.sizes.split(',').map(s => s.trim()).filter(s => s),
        colors: formData.colors.split(',').map(c => c.trim()).filter(c => c)
      });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white font-medium mb-2">{t('Nombre del Producto')}</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-black/50 border border-white/20 rounded px-3 py-2 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-white font-medium mb-2">{t('Categoría')}</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full bg-black/50 border border-white/20 rounded px-3 py-2 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-white font-medium mb-2">{t('Precio')}</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
              className="w-full bg-black/50 border border-white/20 rounded px-3 py-2 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-white font-medium mb-2">{t('Precio Original')}</label>
            <input
              type="number"
              step="0.01"
              value={formData.originalPrice}
              onChange={(e) => setFormData({...formData, originalPrice: parseFloat(e.target.value)})}
              className="w-full bg-black/50 border border-white/20 rounded px-3 py-2 text-white"
            />
          </div>
        </div>
        <div>
          <label className="block text-white font-medium mb-2">{t('URL de Imagen')}</label>
          <input
            type="text"
            value={formData.image}
            onChange={(e) => setFormData({...formData, image: e.target.value})}
            className="w-full bg-black/50 border border-white/20 rounded px-3 py-2 text-white"
            required
          />
        </div>
        <div>
          <label className="block text-white font-medium mb-2">{t('Descripción')}</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full bg-black/50 border border-white/20 rounded px-3 py-2 text-white h-24 resize-none"
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white font-medium mb-2">{t('Tallas (separadas por coma)')}</label>
            <input
              type="text"
              value={formData.sizes}
              onChange={(e) => setFormData({...formData, sizes: e.target.value})}
              className="w-full bg-black/50 border border-white/20 rounded px-3 py-2 text-white"
              placeholder="S, M, L, XL"
            />
          </div>
          <div>
            <label className="block text-white font-medium mb-2">{t('Colores (separados por coma)')}</label>
            <input
              type="text"
              value={formData.colors}
              onChange={(e) => setFormData({...formData, colors: e.target.value})}
              className="w-full bg-black/50 border border-white/20 rounded px-3 py-2 text-white"
              placeholder="Rojo, Azul, Verde"
            />
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.inStock}
              onChange={(e) => setFormData({...formData, inStock: e.target.checked})}
              className="w-4 h-4"
            />
            <span className="text-white">{t('En Stock')}</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.featured}
              onChange={(e) => setFormData({...formData, featured: e.target.checked})}
              className="w-4 h-4"
            />
            <span className="text-white">{t('Producto Destacado')}</span>
          </label>
        </div>
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded transition-colors"
          >
            {t('Cancelar')}
          </button>
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition-colors"
          >
            {t('Guardar')}
          </button>
        </div>
      </form>
    );
  };

  const PromotionForm: React.FC<{
    promotion: Promotion | null;
    onSave: (promotion: Omit<Promotion, 'id'>) => void;
    onCancel: () => void;
  }> = ({ promotion, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      title: promotion?.title || '',
      description: promotion?.description || '',
      type: promotion?.type || 'percentage' as Promotion['type'],
      
      // Campos para descuento por porcentaje
      discountPercentage: promotion?.discountPercentage || 0,
      
      // Campos para promoción por cantidad
      quantityRequired: promotion?.quantityRequired || 2,
      quantityFree: promotion?.quantityFree || 1,
      
      // Campos para código promocional
      promoCode: promotion?.promoCode || '',
      codeDiscountPercentage: promotion?.codeDiscountPercentage || 0,
      codeDiscountAmount: promotion?.codeDiscountAmount || 0,
      
      // Aplicación
      applicationType: promotion?.applicationType || 'all_products' as Promotion['applicationType'],
      targetCategoryId: promotion?.targetCategoryId || '',
      targetProductId: promotion?.targetProductId || 0,
      
      validFrom: promotion?.validFrom || '',
      validTo: promotion?.validTo || '',
      isActive: promotion?.isActive ?? true,
      image: promotion?.image || '',
      
      // Límites de uso
      usageLimit: promotion?.usageLimit || 0,
      currentUsage: promotion?.currentUsage || 0,
      minPurchaseAmount: promotion?.minPurchaseAmount || 0
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      // Crear objeto limpio según el tipo de promoción
      const baseData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        applicationType: formData.applicationType,
        validFrom: formData.validFrom,
        validTo: formData.validTo,
        isActive: formData.isActive,
        image: formData.image,
        currentUsage: formData.currentUsage
      };
      
      let cleanedData: any = { ...baseData };
      
      // Agregar campos específicos según el tipo
      if (formData.type === 'percentage') {
        cleanedData.discountPercentage = formData.discountPercentage;
      } else if (formData.type === 'quantity') {
        cleanedData.quantityRequired = formData.quantityRequired;
        cleanedData.quantityFree = formData.quantityFree;
      } else if (formData.type === 'promo_code') {
        cleanedData.promoCode = formData.promoCode;
        if (formData.codeDiscountPercentage > 0) {
          cleanedData.codeDiscountPercentage = formData.codeDiscountPercentage;
        }
        if (formData.codeDiscountAmount > 0) {
          cleanedData.codeDiscountAmount = formData.codeDiscountAmount;
        }
        if (formData.usageLimit > 0) {
          cleanedData.usageLimit = formData.usageLimit;
        }
        if (formData.minPurchaseAmount > 0) {
          cleanedData.minPurchaseAmount = formData.minPurchaseAmount;
        }
      }
      
      // Agregar campos de aplicación específicos
      if (formData.applicationType === 'specific_category') {
        cleanedData.targetCategoryId = formData.targetCategoryId;
      } else if (formData.applicationType === 'specific_product') {
        cleanedData.targetProductId = formData.targetProductId;
      }
      
      onSave(cleanedData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <div className="bg-black/20 rounded-lg p-4 space-y-4">
          <h4 className="text-lg font-semibold text-white">{t('Información Básica')}</h4>
          
          <div>
            <label className="block text-white font-medium mb-2">{t('Título de la Promoción')}</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-gray-400 focus:outline-none"
              required
            />
          </div>
          
          <div>
            <label className="block text-white font-medium mb-2">{t('Descripción')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white h-24 resize-none focus:border-gray-400 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Tipo de promoción */}
        <div className="bg-black/20 rounded-lg p-4 space-y-4">
          <h4 className="text-lg font-semibold text-white">{t('Tipo de Promoción')}</h4>
          
          <div>
            <label className="block text-white font-medium mb-2">{t('Seleccionar Tipo')}</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value as Promotion['type']})}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-gray-400 focus:outline-none"
            >
              <option value="percentage">{t('Descuento por Porcentaje')}</option>
              <option value="quantity">{t('Promoción por Cantidad (2x1, 3x2, etc.)')}</option>
              <option value="promo_code">{t('Código Promocional')}</option>
            </select>
          </div>

          {/* Campos específicos según el tipo */}
          {formData.type === 'percentage' && (
            <div>
              <label className="block text-white font-medium mb-2">{t('Porcentaje de Descuento')}</label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.discountPercentage}
                onChange={(e) => setFormData({...formData, discountPercentage: parseInt(e.target.value) || 0})}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-gray-400 focus:outline-none"
                required
              />
            </div>
          )}

          {formData.type === 'quantity' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-medium mb-2">{t('Cantidad Requerida')}</label>
                <input
                  type="number"
                  min="2"
                  value={formData.quantityRequired}
                  onChange={(e) => setFormData({...formData, quantityRequired: parseInt(e.target.value) || 2})}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-gray-400 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">{t('Cantidad Gratis')}</label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantityFree}
                  onChange={(e) => setFormData({...formData, quantityFree: parseInt(e.target.value) || 1})}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-gray-400 focus:outline-none"
                  required
                />
              </div>
            </div>
          )}

          {formData.type === 'promo_code' && (
            <div className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">{t('Código Promocional')}</label>
                <input
                  type="text"
                  value={formData.promoCode}
                  onChange={(e) => setFormData({...formData, promoCode: e.target.value.toUpperCase()})}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-gray-400 focus:outline-none"
                  placeholder="Ej: SUMMER30"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">{t('Descuento (%)')}</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.codeDiscountPercentage}
                    onChange={(e) => setFormData({...formData, codeDiscountPercentage: parseInt(e.target.value) || 0})}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-gray-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">{t('Descuento ($)')}</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.codeDiscountAmount}
                    onChange={(e) => setFormData({...formData, codeDiscountAmount: parseInt(e.target.value) || 0})}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-gray-400 focus:outline-none"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">{t('Límite de Uso')}</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({...formData, usageLimit: parseInt(e.target.value) || 0})}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-gray-400 focus:outline-none"
                    placeholder="0 = ilimitado"
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">{t('Compra Mínima ($)')}</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minPurchaseAmount}
                    onChange={(e) => setFormData({...formData, minPurchaseAmount: parseInt(e.target.value) || 0})}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-gray-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Aplicación de la promoción */}
        <div className="bg-black/20 rounded-lg p-4 space-y-4">
          <h4 className="text-lg font-semibold text-white">{t('Aplicación de la Promoción')}</h4>
          
          <div>
            <label className="block text-white font-medium mb-2">{t('Aplicar a')}</label>
            <select
              value={formData.applicationType}
              onChange={(e) => setFormData({...formData, applicationType: e.target.value as Promotion['applicationType']})}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-gray-400 focus:outline-none"
            >
              <option value="all_products">{t('Todos los Productos')}</option>
              <option value="specific_category">{t('Categoría Específica')}</option>
              <option value="specific_product">{t('Producto Específico')}</option>
            </select>
          </div>

          {formData.applicationType === 'specific_category' && (
            <div>
              <label className="block text-white font-medium mb-2">{t('Categoría')}</label>
              <select
                value={formData.targetCategoryId}
                onChange={(e) => setFormData({...formData, targetCategoryId: e.target.value})}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-gray-400 focus:outline-none"
                required
              >
                <option value="">{t('Seleccionar categoría...')}</option>
                {availableCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.applicationType === 'specific_product' && (
            <div>
              <label className="block text-white font-medium mb-2">{t('Producto')}</label>
              <select
                value={formData.targetProductId}
                onChange={(e) => setFormData({...formData, targetProductId: parseInt(e.target.value) || 0})}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-gray-400 focus:outline-none"
                required
              >
                <option value={0}>{t('Seleccionar producto...')}</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    #{product.id} - {product.name} (${product.price})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Fechas y configuración */}
        <div className="bg-black/20 rounded-lg p-4 space-y-4">
          <h4 className="text-lg font-semibold text-white">{t('Fechas y Configuración')}</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-medium mb-2">{t('Fecha de Inicio')}</label>
              <input
                type="date"
                value={formData.validFrom}
                onChange={(e) => setFormData({...formData, validFrom: e.target.value})}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-gray-400 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">{t('Fecha de Fin')}</label>
              <input
                type="date"
                value={formData.validTo}
                onChange={(e) => setFormData({...formData, validTo: e.target.value})}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-gray-400 focus:outline-none"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-white font-medium mb-2">{t('URL de Imagen (opcional)')}</label>
            <input
              type="text"
              value={formData.image}
              onChange={(e) => setFormData({...formData, image: e.target.value})}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-gray-400 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                className="w-4 h-4"
              />
              <span className="text-white">{t('Promoción Activa')}</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded transition-colors"
          >
            {t('Cancelar')}
          </button>
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition-colors"
          >
            {t('Guardar')}
          </button>
        </div>
      </form>
    );
  };

  const NoteForm: React.FC<{
    note: Note | null;
    onSave: (note: Omit<Note, 'id' | 'createdAt'>) => void;
    onCancel: () => void;
  }> = ({ note, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      title: note?.title || '',
      content: note?.content || '',
      priority: note?.priority || 'medium' as const
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-white font-medium mb-2">{t('Título de la Nota')}</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full bg-black/50 border border-white/20 rounded px-3 py-2 text-white"
            required
          />
        </div>
        <div>
          <label className="block text-white font-medium mb-2">{t('Contenido')}</label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({...formData, content: e.target.value})}
            className="w-full bg-black/50 border border-white/20 rounded px-3 py-2 text-white h-32 resize-none"
            required
          />
        </div>
        <div>
          <label className="block text-white font-medium mb-2">{t('Prioridad')}</label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({...formData, priority: e.target.value as 'low' | 'medium' | 'high'})}
            className="w-full bg-black/50 border border-white/20 rounded px-3 py-2 text-white"
          >
            <option value="low">{t('Baja')}</option>
            <option value="medium">{t('Media')}</option>
            <option value="high">{t('Alta')}</option>
          </select>
        </div>
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded transition-colors"
          >
            {t('Cancelar')}
          </button>
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition-colors"
          >
            {t('Guardar')}
          </button>
        </div>
      </form>
    );
  };

  const renderNotes = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white">{t('Gestión de Notas')}</h2>
        <button
          onClick={() => {
            setEditingNote(null);
            setShowNoteForm(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          + {t('Nueva Nota')}
        </button>
      </div>

      {/* Lista de notas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes.map(note => (
          <div key={note.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold text-white">{note.title}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                note.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                note.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                'bg-green-500/20 text-green-300'
              }`}>
                {note.priority === 'high' ? t('Alta') : 
                 note.priority === 'medium' ? t('Media') : t('Baja')}
              </span>
            </div>
            <p className="text-gray-300 mb-4 line-clamp-3">{note.content}</p>
            <div className="text-xs text-gray-400 mb-4">
              {t('Creada')}: {new Date(note.createdAt).toLocaleDateString()}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setEditingNote(note);
                  setShowNoteForm(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                {t('Editar')}
              </button>
              <button
                onClick={() => deleteNote(note.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                {t('Eliminar')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Formulario de nota */}
      {showNoteForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingNote ? t('Editar Nota') : t('Nueva Nota')}
            </h3>
            <NoteForm
              note={editingNote}
              onSave={(noteData) => {
                if (editingNote) {
                  const updatedNotes = notes.map(n => 
                    n.id === editingNote.id ? { ...noteData, id: editingNote.id, createdAt: editingNote.createdAt } : n
                  );
                  setNotes(updatedNotes);
                } else {
                  const newNote: Note = {
                    ...noteData,
                    id: Date.now(),
                    createdAt: new Date().toISOString()
                  };
                  setNotes([...notes, newNote]);
                }
                setShowNoteForm(false);
              }}
              onCancel={() => setShowNoteForm(false)}
            />
          </div>
        </div>
      )}
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
