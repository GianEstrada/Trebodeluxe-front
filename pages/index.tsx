import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useUniversalTranslate } from "../hooks/useUniversalTranslate";
import Layout from "../components/Layout";

// Definir el tipo para los productos
interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  category: string;
  brand: string;
  color: string;
  size: string;
  inStock: boolean;
}

const HomeScreen: NextPage = () => {
  const [currentLanguage, setCurrentLanguage] = useState("es");
  const [currentCurrency, setCurrentCurrency] = useState("MXN");
  const [selectedCategory, setSelectedCategory] = useState("Camisetas");
  
  // Usar el hook de traducción universal
  const { t, isTranslating } = useUniversalTranslate(currentLanguage);
  
  // Textos originales en español - se traducirán automáticamente
  const promoTexts = [
    "Agrega 4 productos y paga 2",
    "2x1 en gorras"
  ];

  // Estado para las imágenes del administrador (simulado - en producción vendría de una API)
  const [adminImages] = useState({
    heroImage1: '/797e7904b64e13508ab322be3107e368-1@2x.png',
    heroImage2: '/look-polo-2-1@2x.png',
    promosBannerImage: '/promociones-playa.jpg'
  });

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

  // Función para filtrar productos por categoría
  const getFilteredProducts = () => {
    return featuredProducts.filter(product => product.category === selectedCategory);
  };

  const featuredProducts = [
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
      inStock: true
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
      inStock: true
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
      inStock: true
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
      inStock: false
    }
  ];

  // Cargar configuración guardada
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language');
    const savedCurrency = localStorage.getItem('preferred-currency');
    if (savedLanguage) setCurrentLanguage(savedLanguage);
    if (savedCurrency) setCurrentCurrency(savedCurrency);
  }, []);

  return (
    <Layout 
      showPromoBar={true}
      promoTexts={promoTexts}
    >
      <div className="w-full">
        {/* Sección Hero Principal */}
        <div className="relative w-full h-[600px] bg-gray-100">
          <Image
            className="w-full h-full object-cover"
            src={adminImages.heroImage1}
            alt="Hero principal"
            width={1920}
            height={600}
            priority
          />
          
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="text-center text-white px-4">
              <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-wider">
                {t('NUEVA COLECCIÓN')}
              </h1>
              <p className="text-xl md:text-2xl mb-8 tracking-wide">
                {t('Descubre el estilo que te define')}
              </p>
              <Link 
                href="/catalogo"
                className="inline-block bg-white text-black px-8 py-3 text-lg font-medium hover:bg-gray-100 transition-colors duration-200 tracking-wide no-underline"
              >
                {t('EXPLORAR AHORA')}
              </Link>
            </div>
          </div>
        </div>

        {/* Sección de Categorías */}
        <div className="py-16 px-4 md:px-8 lg:px-16">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 tracking-wider">
              {t('NUESTRAS CATEGORÍAS')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Camisetas */}
              <Link href="/catalogo?categoria=camisetas" className="group no-underline">
                <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-square">
                  <Image
                    src="/sin-ttulo1-2@2x.png"
                    alt="Camisetas"
                    width={300}
                    height={300}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-all duration-300 flex items-end">
                    <h3 className="text-white text-xl font-bold p-6 tracking-wide">
                      {t('CAMISETAS')}
                    </h3>
                  </div>
                </div>
              </Link>

              {/* Pantalones */}
              <Link href="/catalogo?categoria=pantalones" className="group no-underline">
                <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-square">
                  <Image
                    src="/look-polo-2-1@2x.png"
                    alt="Pantalones"
                    width={300}
                    height={300}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-all duration-300 flex items-end">
                    <h3 className="text-white text-xl font-bold p-6 tracking-wide">
                      {t('PANTALONES')}
                    </h3>
                  </div>
                </div>
              </Link>

              {/* Accesorios */}
              <Link href="/catalogo?categoria=accesorios" className="group no-underline">
                <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-square">
                  <Image
                    src="/797e7904b64e13508ab322be3107e368-1@2x.png"
                    alt="Accesorios"
                    width={300}
                    height={300}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-all duration-300 flex items-end">
                    <h3 className="text-white text-xl font-bold p-6 tracking-wide">
                      {t('ACCESORIOS')}
                    </h3>
                  </div>
                </div>
              </Link>

              {/* Calzado */}
              <Link href="/catalogo?categoria=calzado" className="group no-underline">
                <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-square">
                  <Image
                    src="/petalo-1@2x.png"
                    alt="Calzado"
                    width={300}
                    height={300}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-all duration-300 flex items-end">
                    <h3 className="text-white text-xl font-bold p-6 tracking-wide">
                      {t('CALZADO')}
                    </h3>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Sección de Productos Destacados */}
        <div className="py-16 px-4 md:px-8 lg:px-16 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 tracking-wider">
              {t('PRODUCTOS DESTACADOS')}
            </h2>
            
            {/* Filtro de categorías */}
            <div className="flex justify-center mb-12">
              <div className="flex flex-wrap gap-4">
                {['Camisetas', 'Pantalones', 'Accesorios'].map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-6 py-2 rounded-full font-medium transition-colors duration-200 ${
                      selectedCategory === category
                        ? 'bg-black text-white'
                        : 'bg-white text-black border border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {t(category)}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid de productos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {getFilteredProducts().map((product) => (
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
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2 text-black group-hover:text-gray-700 transition-colors duration-200">
                        {t(product.name)}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">
                        {t(product.brand)} • {t(product.color)} • {product.size}
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

            <div className="text-center mt-12">
              <Link 
                href="/catalogo"
                className="inline-block bg-black text-white px-8 py-3 text-lg font-medium hover:bg-gray-800 transition-colors duration-200 no-underline"
              >
                {t('VER TODOS LOS PRODUCTOS')}
              </Link>
            </div>
          </div>
        </div>

        {/* Banner promocional */}
        <div className="relative w-full h-[400px]">
          <Image
            src={adminImages.promosBannerImage}
            alt="Promociones"
            width={1920}
            height={400}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-center text-white px-4">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-wider">
                {t('OFERTAS ESPECIALES')}
              </h2>
              <p className="text-xl mb-8 tracking-wide">
                {t('Hasta 50% de descuento en productos seleccionados')}
              </p>
              <Link 
                href="/catalogo?filter=promociones"
                className="inline-block bg-white text-black px-8 py-3 text-lg font-medium hover:bg-gray-100 transition-colors duration-200 no-underline"
              >
                {t('COMPRAR OFERTAS')}
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-black text-white py-16 px-4 md:px-8 lg:px-16">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4 tracking-wider">TREBODELUXE</h3>
                <p className="text-gray-300">
                  {t('Moda premium que define tu estilo único.')}
                </p>
              </div>
              
              <div>
                <h4 className="font-bold mb-4">{t('ENLACES RÁPIDOS')}</h4>
                <ul className="space-y-2">
                  <li><Link href="/catalogo" className="text-gray-300 hover:text-white transition-colors duration-200 no-underline">{t('Catálogo')}</Link></li>
                  <li><Link href="/carrito" className="text-gray-300 hover:text-white transition-colors duration-200 no-underline">{t('Carrito')}</Link></li>
                  <li><Link href="/login" className="text-gray-300 hover:text-white transition-colors duration-200 no-underline">{t('Mi Cuenta')}</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold mb-4">{t('CATEGORÍAS')}</h4>
                <ul className="space-y-2">
                  <li><Link href="/catalogo?categoria=camisetas" className="text-gray-300 hover:text-white transition-colors duration-200 no-underline">{t('Camisetas')}</Link></li>
                  <li><Link href="/catalogo?categoria=pantalones" className="text-gray-300 hover:text-white transition-colors duration-200 no-underline">{t('Pantalones')}</Link></li>
                  <li><Link href="/catalogo?categoria=accesorios" className="text-gray-300 hover:text-white transition-colors duration-200 no-underline">{t('Accesorios')}</Link></li>
                  <li><Link href="/catalogo?categoria=calzado" className="text-gray-300 hover:text-white transition-colors duration-200 no-underline">{t('Calzado')}</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold mb-4">{t('SÍGUENOS')}</h4>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">
                    <Image src="/logo-instagram.svg" alt="Instagram" width={24} height={24} />
                  </a>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">
                    <Image src="/x-logo.svg" alt="X" width={24} height={24} />
                  </a>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">
                    <Image src="/logo-youtube.svg" alt="YouTube" width={24} height={24} />
                  </a>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-300">
              <p>&copy; 2025 TreboDeluxe. {t('Todos los derechos reservados.')}</p>
            </div>
          </div>
        </footer>
      </div>
    </Layout>
  );
};

export default HomeScreen;
