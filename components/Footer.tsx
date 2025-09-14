import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useUniversalTranslate } from '../hooks/useUniversalTranslate';

const Footer: React.FC = () => {
  const { t } = useUniversalTranslate();

  return (
    <footer className="w-full [background:linear-gradient(180deg,_#000,_#1a6b1a)] overflow-hidden flex flex-col items-start justify-start text-Text-Default-Tertiary font-Body-Font-Family">
      
      {/* Footer Minimalista - Solo Móvil */}
      <div className="md:hidden w-full px-4 py-8">
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
            <div className="flex flex-row items-center justify-start gap-4">
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
          </div>

          {/* Navegación */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Productos */}
            <div className="flex flex-col items-start justify-start gap-4">
              <h3 className="relative tracking-[4px] leading-6 font-bold text-white">
                {t('PRODUCTOS')}
              </h3>
              <div className="flex flex-col items-start justify-start gap-3 text-sm">
                <Link href="/catalogo" className="text-gray-300 hover:text-white transition-colors">
                  {t('Catálogo Completo')}
                </Link>
                <Link href="/catalogo?filter=nuevos" className="text-gray-300 hover:text-white transition-colors">
                  {t('Nuevos Productos')}
                </Link>
                <Link href="/catalogo?filter=populares" className="text-gray-300 hover:text-white transition-colors">
                  {t('Más Populares')}
                </Link>
              </div>
            </div>

            {/* Cuenta */}
            <div className="flex flex-col items-start justify-start gap-4">
              <h3 className="relative tracking-[4px] leading-6 font-bold text-white">
                {t('CUENTA')}
              </h3>
              <div className="flex flex-col items-start justify-start gap-3 text-sm">
                <Link href="/login" className="text-gray-300 hover:text-white transition-colors">
                  {t('Iniciar Sesión')}
                </Link>
                <Link href="/register" className="text-gray-300 hover:text-white transition-colors">
                  {t('Crear Cuenta')}
                </Link>
                <Link href="/carrito" className="text-gray-300 hover:text-white transition-colors">
                  {t('Mi Carrito')}
                </Link>
              </div>
            </div>

            {/* Ayuda */}
            <div className="flex flex-col items-start justify-start gap-4">
              <h3 className="relative tracking-[4px] leading-6 font-bold text-white">
                {t('AYUDA')}
              </h3>
              <div className="flex flex-col items-start justify-start gap-3 text-sm">
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  {t('Política de Privacidad')}
                </a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  {t('Términos y Condiciones')}
                </a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  {t('Contacto')}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright Desktop */}
        <div className="w-full border-t border-gray-700 pt-6">
          <div className="text-center text-gray-400 text-sm">
            <p>© {new Date().getFullYear()} Treboluxe. {t('Todos los derechos reservados.')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
