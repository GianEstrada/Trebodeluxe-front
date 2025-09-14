import React from 'react';
import Image from 'next/image';
import { useUniversalTranslate } from '../hooks/useUniversalTranslate';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  categories: any[];
  onCategorySelect: (category: any) => void;
  cartItemsCount: number;
  onCartOpen: () => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({
  isOpen,
  onClose,
  content,
  categories,
  onCategorySelect,
  cartItemsCount,
  onCartOpen
}) => {
  const { t } = useUniversalTranslate();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            {content === 'categories' ? t('Categorías') : t('Carrito')}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {content === 'categories' ? (
            // Categories Content
            <div className="p-4 space-y-4">
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  {t('Todas las categorías')}
                </h3>
                <button
                  onClick={() => {
                    onCategorySelect(null);
                    onClose();
                  }}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-sm font-medium">T</span>
                    </div>
                    <span className="text-gray-800 font-medium">{t('Todos los productos')}</span>
                  </div>
                </button>
              </div>

              {categories && categories.length > 0 && (
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        onCategorySelect(category);
                        onClose();
                      }}
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        {category.imagen_url ? (
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                            <Image
                              src={category.imagen_url}
                              alt={category.nombre}
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-gray-600 text-xs font-medium">
                              {category.nombre?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="text-gray-800 font-medium">{category.nombre}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Cart Content
            <div className="p-4 space-y-4">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m2.6 8L6 5H2m3 8h16m-8 0a2 2 0 100 4 2 2 0 000-4zm8 0a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">{t('Tu carrito')}</h3>
                <p className="text-gray-600 mb-4">
                  {cartItemsCount > 0 
                    ? t(`Tienes ${cartItemsCount} productos en tu carrito`)
                    : t('Tu carrito está vacío')
                  }
                </p>
                <button
                  onClick={() => {
                    onCartOpen();
                    onClose();
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                >
                  {t('Ver carrito completo')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MobileSidebar;