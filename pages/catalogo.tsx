import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useUniversalTranslate } from "../hooks/useUniversalTranslate";
import Layout from "../components/Layout";

const CatalogoScreen: NextPage = () => {
  const router = useRouter();
  
  // Estados para idioma y moneda
  const [currentLanguage, setCurrentLanguage] = useState("es");
  const [currentCurrency, setCurrentCurrency] = useState("MXN");
  
  // Sistema de traducción universal
  const { t, isTranslating } = useUniversalTranslate(currentLanguage);
  
  // Estados específicos del catálogo
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [selectedBrand, setSelectedBrand] = useState("Todas");
  const [selectedColor, setSelectedColor] = useState("Todos");
  const [selectedSize, setSelectedSize] = useState("Todas");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  
  // Efecto para manejar los parámetros URL
  useEffect(() => {
    if (router.isReady) {
      const { categoria, search, filter } = router.query;
      
      if (categoria) {
        setSelectedCategory(categoria as string);
      }
      
      if (search) {
        setSearchTerm(search as string);
      }
      
      if (filter) {
        setActiveFilter(filter as string);
        if (filter === 'promociones') {
          setSelectedCategory("Todas");
        }
      }
    }
  }, [router.isReady, router.query]);

  // Cargar configuración guardada
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language');
    const savedCurrency = localStorage.getItem('preferred-currency');
    if (savedLanguage) setCurrentLanguage(savedLanguage);
    if (savedCurrency) setCurrentCurrency(savedCurrency);
  }, []);

  // Función para formatear precio con la moneda seleccionada
  const formatPrice = (price: number) => {
    const exchangeRates = {
      'EUR': 1,
      'USD': 1.1,
      'MXN': 20.5
    };
    
    const symbols = {
      'EUR': '€',
      'USD': '$',
      'MXN': '$'
    };
    
    const convertedPrice = (price * exchangeRates[currentCurrency as keyof typeof exchangeRates]).toFixed(2);
    const symbol = symbols[currentCurrency as keyof typeof symbols];
    
    return `${symbol}${convertedPrice}`;
  };

  // Datos de productos (en producción vendría de una API)
  const allProducts = [
    {
      id: 1,
      name: "Camiseta Casual Premium",
      price: 25.99,
      originalPrice: 35.99,
      image: "/sin-ttulo1-2@2x.png",
      category: "Camisetas",
      brand: "TreboLux",
      color: "Azul",
      size: "M",
      inStock: true,
      isPromo: true
    },
    {
      id: 2,
      name: "Polo Clásico Elegante",
      price: 32.50,
      originalPrice: 45.00,
      image: "/look-polo-2-1@2x.png",
      category: "Camisetas",
      brand: "Elegance",
      color: "Blanco",
      size: "L",
      inStock: true,
      isPromo: false
    },
    {
      id: 3,
      name: "Gorra Deportiva",
      price: 18.99,
      originalPrice: 24.99,
      image: "/797e7904b64e13508ab322be3107e368-1@2x.png",
      category: "Accesorios",
      brand: "SportWear",
      color: "Negro",
      size: "Única",
      inStock: true,
      isPromo: true
    },
    {
      id: 4,
      name: "Pantalón Casual",
      price: 45.00,
      originalPrice: 60.00,
      image: "/look-polo-2-1@2x.png",
      category: "Pantalones",
      brand: "Comfort",
      color: "Azul",
      size: "32",
      inStock: false,
      isPromo: false
    },
    {
      id: 5,
      name: "Zapatos Deportivos",
      price: 89.99,
      originalPrice: 120.00,
      image: "/petalo-1@2x.png",
      category: "Calzado",
      brand: "Athletic",
      color: "Negro",
      size: "42",
      inStock: true,
      isPromo: true
    },
    {
      id: 6,
      name: "Camiseta Básica",
      price: 19.99,
      originalPrice: 19.99,
      image: "/sin-ttulo1-2@2x.png",
      category: "Camisetas",
      brand: "Basic",
      color: "Blanco",
      size: "S",
      inStock: true,
      isPromo: false
    }
  ];

  // Filtrar productos
  const getFilteredProducts = () => {
    let filtered = allProducts;

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por categoría
    if (selectedCategory !== "Todas") {
      filtered = filtered.filter(product => 
        product.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filtrar por marca
    if (selectedBrand !== "Todas") {
      filtered = filtered.filter(product => product.brand === selectedBrand);
    }

    // Filtrar por color
    if (selectedColor !== "Todos") {
      filtered = filtered.filter(product => product.color === selectedColor);
    }

    // Filtrar por size
    if (selectedSize !== "Todas") {
      filtered = filtered.filter(product => product.size === selectedSize);
    }

    // Filtrar promociones
    if (activeFilter === 'promociones') {
      filtered = filtered.filter(product => product.isPromo);
    }

    return filtered;
  };

  const filteredProducts = getFilteredProducts();
  
  // Obtener opciones únicas para filtros
  const categories = ["Todas", ...Array.from(new Set(allProducts.map(p => p.category)))];
  const brands = ["Todas", ...Array.from(new Set(allProducts.map(p => p.brand)))];
  const colors = ["Todos", ...Array.from(new Set(allProducts.map(p => p.color)))];
  const sizes = ["Todas", ...Array.from(new Set(allProducts.map(p => p.size)))];

  return (
    <Layout>
      <div className="w-full">
        {/* Breadcrumb */}
        <div className="bg-gray-100 py-4 px-4 md:px-8 lg:px-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-2 text-sm">
              <Link href="/" className="text-gray-600 hover:text-black no-underline">
                {t('Inicio')}
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-black font-medium">{t('Catálogo')}</span>
              {selectedCategory !== "Todas" && (
                <>
                  <span className="text-gray-400">/</span>
                  <span className="text-black font-medium">{t(selectedCategory)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Título de la página */}
        <div className="py-8 px-4 md:px-8 lg:px-16">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold tracking-wider mb-4">
              {activeFilter === 'promociones' 
                ? t('PROMOCIONES ESPECIALES')
                : selectedCategory !== "Todas" 
                  ? t(selectedCategory.toUpperCase()) 
                  : t('CATÁLOGO COMPLETO')
              }
            </h1>
            <p className="text-gray-600">
              {t('Descubre nuestra colección completa de productos premium')}
            </p>
          </div>
        </div>

        {/* Filtros y productos */}
        <div className="px-4 md:px-8 lg:px-16 pb-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-8">
              
              {/* Sidebar de filtros */}
              <div className="lg:w-1/4">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="font-bold text-lg mb-6">{t('FILTROS')}</h3>
                  
                  {/* Búsqueda */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('Búsqueda')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('Buscar productos...')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>

                  {/* Categoría */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('Categoría')}
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {t(category)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Marca */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('Marca')}
                    </label>
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      {brands.map(brand => (
                        <option key={brand} value={brand}>
                          {brand === "Todas" ? t(brand) : brand}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Color */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('Color')}
                    </label>
                    <select
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      {colors.map(color => (
                        <option key={color} value={color}>
                          {color === "Todos" ? t(color) : t(color)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Talla */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('Talla')}
                    </label>
                    <select
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      {sizes.map(size => (
                        <option key={size} value={size}>
                          {size === "Todas" ? t(size) : size}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Limpiar filtros */}
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory("Todas");
                      setSelectedBrand("Todas");
                      setSelectedColor("Todos");
                      setSelectedSize("Todas");
                      setActiveFilter(null);
                      router.push('/catalogo', undefined, { shallow: true });
                    }}
                    className="w-full bg-gray-100 text-black py-2 px-4 rounded-md hover:bg-gray-200 transition-colors duration-200"
                  >
                    {t('Limpiar Filtros')}
                  </button>
                </div>
              </div>

              {/* Grid de productos */}
              <div className="lg:w-3/4">
                <div className="flex justify-between items-center mb-6">
                  <p className="text-gray-600">
                    {t('Mostrando')} {filteredProducts.length} {t('productos')}
                  </p>
                </div>

                {filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((product) => (
                      <Link 
                        key={product.id} 
                        href={`/producto/${product.id}`}
                        className="group no-underline"
                      >
                        <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
                          <div className="relative aspect-square bg-gray-100">
                            <Image
                              src={product.image}
                              alt={product.name}
                              width={300}
                              height={300}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {!product.inStock && (
                              <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                                <span className="text-white font-bold text-lg">{t('AGOTADO')}</span>
                              </div>
                            )}
                            {product.isPromo && (
                              <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 text-xs font-bold rounded">
                                {t('OFERTA')}
                              </div>
                            )}
                          </div>
                          
                          <div className="p-4">
                            <h3 className="font-bold text-lg mb-2 text-black group-hover:text-gray-700 transition-colors duration-200">
                              {t(product.name)}
                            </h3>
                            <p className="text-gray-600 text-sm mb-2">
                              {product.brand} • {t(product.color)} • {product.size}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg text-black">
                                {formatPrice(product.price)}
                              </span>
                              {product.originalPrice > product.price && (
                                <span className="text-gray-400 line-through text-sm">
                                  {formatPrice(product.originalPrice)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-bold text-gray-600 mb-2">
                      {t('No se encontraron productos')}
                    </h3>
                    <p className="text-gray-500 mb-6">
                      {t('Intenta ajustar tus filtros o buscar algo diferente')}
                    </p>
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedCategory("Todas");
                        setSelectedBrand("Todas");
                        setSelectedColor("Todos");
                        setSelectedSize("Todas");
                        setActiveFilter(null);
                      }}
                      className="bg-black text-white py-2 px-6 rounded-md hover:bg-gray-800 transition-colors duration-200"
                    >
                      {t('Ver todos los productos')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CatalogoScreen;
