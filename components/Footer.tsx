import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useUniversalTranslate } from '../hooks/useUniversalTranslate';
import { useCategories } from '../hooks/useCategories';

const Footer: React.FC = () => {
  const { t } = useUniversalTranslate();
  
  // Hook de categorías para cargar las categorías de la BD
  const { activeCategories, loading: categoriesLoading, error: categoriesError } = useCategories();

  return (
    <footer className="self-stretch [background:linear-gradient(180deg,_#000,_#1a6b1a)] overflow-hidden shrink-0 flex flex-col items-start justify-start text-Text-Default-Tertiary font-Body-Font-Family">
      
      {/* Footer Minimalista - Solo Móvil */}
      <div className="block md:hidden w-full px-4 py-8">
        <div className="text-center space-y-6">
          {/* Logo */}
          <div className="flex justify-center">
            <Image
              className="w-12 h-12"
              width={48}
              height={48}
              sizes="100vw"
              alt="Logo Treboluxe"
              src="/sin-ttulo1-2@2x.png"
            />
          </div>
          
          {/* Redes Sociales */}
          <div className="flex justify-center items-center gap-6">
            <a 
              href="https://www.facebook.com/profile.php?id=61576338298512"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <Image
                className="w-6 h-6"
                width={24}
                height={24}
                sizes="100vw"
                alt="Facebook"
                src="/facebook-icon.svg"
              />
            </a>
            <a 
              href="https://www.instagram.com/treboluxe"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <Image
                className="w-6 h-6"
                width={24}
                height={24}
                sizes="100vw"
                alt="Instagram"
                src="/logo-instagram.svg"
              />
            </a>
            <a 
              href="https://www.tiktok.com/@treboluxe5"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <Image
                className="w-6 h-6"
                width={24}
                height={24}
                sizes="100vw"
                alt="TikTok"
                src="/tiktok-icon.svg"
              />
            </a>
            <a 
              href="https://twitter.com/treboluxe?s=21"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <Image
                className="w-6 h-6"
                width={24}
                height={24}
                sizes="100vw"
                alt="Twitter/X"
                src="/x-logo.svg"
              />
            </a>
          </div>
          
          {/* Enlaces principales */}
          <div className="flex justify-center items-center gap-4 text-sm">
            <Link href="/catalogo" className="text-gray-300 hover:text-white transition-colors">
              {t('Catálogo')}
            </Link>
            <span className="text-gray-500">•</span>
            <Link href="/carrito" className="text-gray-300 hover:text-white transition-colors">
              {t('Carrito')}
            </Link>
            <span className="text-gray-500">•</span>
            <Link href="/checkout" className="text-gray-300 hover:text-white transition-colors">
              {t('Checkout')}
            </Link>
          </div>
          
          {/* Copyright */}
          <div className="text-center text-gray-400 text-xs">
            <p>© {new Date().getFullYear()} Treboluxe. {t('Todos los derechos reservados.')}</p>
          </div>
        </div>
      </div>

      {/* Footer Completo - Desktop/Tablet */}
      <div className="hidden md:flex w-full flex-col pt-16 pb-8 px-8">
        <div className="w-full flex flex-row items-start justify-start gap-8 mb-12">
          {/* Logo y redes sociales */}
          <div className="w-60 flex flex-col items-start justify-start gap-6 min-w-[240px]">
            <Image
              className="w-[50px] h-[50px]"
              width={50}
              height={50}
              sizes="100vw"
              alt="Logo Treboluxe"
              src="/sin-ttulo1-2@2x.png"
            />
            <div className="flex flex-col items-start justify-start gap-4">
              <p className="text-white text-sm leading-relaxed">
                {t('Tu tienda de moda online de confianza. Descubre las últimas tendencias y encuentra tu estilo único con nuestra amplia selección de ropa y accesorios.')}
              </p>
              <div className="flex flex-row items-center justify-start gap-4">
                <a 
                  href="https://www.facebook.com/profile.php?id=61576338298512"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <Image
                    className="w-6 relative h-6"
                    width={24}
                    height={24}
                    sizes="100vw"
                    alt="Facebook"
                    src="/facebook-icon.svg"
                  />
                </a>
                <a 
                  href="https://www.instagram.com/treboluxe"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <Image
                    className="w-6 h-6 object-contain filter brightness-0 invert"
                    width={24}
                    height={24}
                    sizes="100vw"
                    alt="Instagram"
                    src="/logo-instagram.svg"
                    onError={(e) => {
                      // Fallback si la imagen no carga
                      (e.target as HTMLImageElement).style.display = 'none';
                      const parent = (e.target as HTMLImageElement).parentElement;
                      if (parent && !parent.querySelector('.fallback-icon')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'w-6 h-6 bg-white rounded text-black text-xs flex items-center justify-center font-bold fallback-icon';
                        fallback.textContent = 'IG';
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </a>
                <a 
                  href="https://www.tiktok.com/@treboluxe5"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <Image
                    className="w-6 h-6 object-contain filter brightness-0 invert"
                    width={24}
                    height={24}
                    sizes="100vw"
                    alt="TikTok"
                    src="/tiktok-icon.svg"
                    onError={(e) => {
                      // Fallback si la imagen no carga
                      (e.target as HTMLImageElement).style.display = 'none';
                      const parent = (e.target as HTMLImageElement).parentElement;
                      if (parent && !parent.querySelector('.fallback-icon')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'w-6 h-6 bg-white rounded text-black text-xs flex items-center justify-center font-bold fallback-icon';
                        fallback.textContent = 'TT';
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </a>
                <a 
                  href="https://twitter.com/treboluxe?s=21"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <Image
                    className="w-6 h-6 object-contain filter brightness-0 invert"
                    width={24}
                    height={24}
                    sizes="100vw"
                    alt="Twitter/X"
                    src="/x-logo.svg"
                    onError={(e) => {
                      // Fallback si la imagen no carga
                      (e.target as HTMLImageElement).style.display = 'none';
                      const parent = (e.target as HTMLImageElement).parentElement;
                      if (parent && !parent.querySelector('.fallback-icon')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'w-6 h-6 bg-white rounded text-black text-xs flex items-center justify-center font-bold fallback-icon';
                        fallback.textContent = 'X';
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </a>
              </div>
            </div>
          </div>
          
          {/* Columna Compras */}
          <div className="w-[262px] flex flex-col items-start justify-start gap-3">
            <div className="self-stretch flex flex-col items-start justify-start pb-4">
              <h3 className="relative leading-[140%] font-semibold text-white text-lg">
                {t('Compras')}
              </h3>
            </div>
            <div className="w-full">
              <Link href="/como-comprar" className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer no-underline">
                {t('Cómo comprar')}
              </Link>
            </div>
            <div className="w-full">
              <Link href="/metodos-pago" className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer no-underline">
                {t('Métodos de pago')}
              </Link>
            </div>
          </div>
          
          {/* Columna Categorías */}
          <div className="w-[262px] flex flex-col items-start justify-start gap-3">
            <div className="self-stretch flex flex-col items-start justify-start pb-4">
              <h3 className="relative leading-[140%] font-semibold text-white text-lg">
                {t('Categorías')}
              </h3>
            </div>
            
            {/* Mostrar loading state */}
            {categoriesLoading && (
              <div className="w-full">
                <div className="text-gray-400 leading-[140%] text-sm">
                  {t('Cargando categorías...')}
                </div>
              </div>
            )}
            
            {/* Mostrar error state */}
            {categoriesError && (
              <div className="w-full">
                <div className="text-red-400 leading-[140%] text-sm">
                  {t('Error al cargar categorías')}
                </div>
              </div>
            )}
            
            {/* Mostrar categorías de la BD */}
            {!categoriesLoading && !categoriesError && activeCategories && activeCategories.length > 0 && 
              activeCategories.slice(0, 7).map((category) => (
                <div key={category.id} className="w-full">
                  <Link href={`/catalogo?categoria=${encodeURIComponent(category.name)}`} className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer no-underline">
                    {t(category.name)}
                  </Link>
                </div>
              ))
            }
            
            {/* Fallback si no hay categorías */}
            {!categoriesLoading && !categoriesError && (!activeCategories || activeCategories.length === 0) && (
              <>
                <div className="w-full">
                  <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                    {t('Mujer')}
                  </div>
                </div>
                <div className="w-full">
                  <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                    {t('Hombre')}
                  </div>
                </div>
                <div className="w-full">
                  <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                    {t('Accesorios')}
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Columna Atención al cliente */}
          <div className="w-[262px] flex flex-col items-start justify-start gap-3">
            <div className="self-stretch flex flex-col items-start justify-start pb-4">
              <h3 className="relative leading-[140%] font-semibold text-white text-lg">
                {t('Atención al cliente')}
              </h3>
            </div>
            <div className="w-full">
              <Link href="/contacto" className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer no-underline">
                {t('Contacto')}
              </Link>
            </div>
          </div>
          
          {/* Columna Legal */}
          <div className="w-[262px] flex flex-col items-start justify-start gap-3">
            <div className="self-stretch flex flex-col items-start justify-start pb-4">
              <h3 className="relative leading-[140%] font-semibold text-white text-lg">
                {t('Legal')}
              </h3>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Términos y condiciones')}
              </div>
            </div>
            <div className="w-full">
              <Link href="/sobre-nosotros" className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer no-underline">
                {t('Sobre nosotros')}
              </Link>
            </div>
          </div>
        </div>
        
        {/* Copyright section */}
        <div className="w-full pt-8 border-t border-white/20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-gray-400 text-sm">
              {t('© 2024 Treboluxe. Todos los derechos reservados.')}
            </div>
          </div>
          <div className="mt-4 text-gray-400 text-xs">
            {t('Treboluxe es una marca registrada. Los precios no incluyen IVA. Los gastos de envío se calculan durante el proceso de compra.')}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
