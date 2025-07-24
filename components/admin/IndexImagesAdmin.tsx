import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useUniversalTranslate } from '../../hooks/useUniversalTranslate';

interface IndexImage {
  id_imagen: number;
  nombre: string;
  descripcion?: string;
  url: string;
  public_id: string;
  seccion: 'principal' | 'banner';
  estado: 'activo' | 'inactivo' | 'izquierda' | 'derecha';
  fecha_creacion: string;
  fecha_actualizacion: string;
}

interface Props {
  currentLanguage: string;
}

const IndexImagesAdmin: React.FC<Props> = ({ currentLanguage }) => {
  const { t } = useUniversalTranslate(currentLanguage);

  // Estados
  const [images, setImages] = useState<IndexImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Estados para el formulario
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    seccion: 'principal' as 'principal' | 'banner',
    file: null as File | null,
    previewUrl: ''
  });

  // Función para obtener token de autenticación
  const getAuthToken = () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        return userData.token;
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    return null;
  };

  // Función para hacer peticiones autenticadas
  const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay token de autenticación disponible');
    }

    return fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }, []);

  // Cargar imágenes index
  const loadIndexImages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch('https://trebodeluxe-backend.onrender.com/api/admin/index-images');
      const data = await response.json();
      if (data.success) {
        setImages(data.images);
      }
    } catch (error) {
      console.error('Error loading index images:', error);
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  // Cargar imágenes al montar el componente
  useEffect(() => {
    loadIndexImages();
  }, [loadIndexImages]);

  // Filtrar imágenes por búsqueda
  const filteredImages = images.filter(image =>
    image.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (image.descripcion && image.descripcion.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Separar imágenes por sección
  const principalImages = filteredImages.filter(img => img.seccion === 'principal');
  const bannerImages = filteredImages.filter(img => img.seccion === 'banner');

  // Obtener imagen activa por posición
  const getActiveImage = (seccion: 'principal' | 'banner', estado: string) => {
    return images.find(img => img.seccion === seccion && img.estado === estado);
  };

  // Manejar cambio de estado
  const handleStatusChange = async (imageId: number, newStatus: string) => {
    try {
      const response = await authenticatedFetch(
        `https://trebodeluxe-backend.onrender.com/api/admin/index-images/${imageId}/status`,
        {
          method: 'PUT',
          body: JSON.stringify({ estado: newStatus }),
        }
      );

      const data = await response.json();
      if (data.success) {
        loadIndexImages(); // Recargar para actualizar estados
      } else {
        alert(t('Error al actualizar estado: ') + data.message);
      }
    } catch (error) {
      console.error('Error updating image status:', error);
      alert(t('Error al actualizar el estado'));
    }
  };

  // Eliminar imagen
  const handleDeleteImage = async (imageId: number, imageName: string) => {
    if (!confirm(t(`¿Estás seguro de que deseas eliminar la imagen "${imageName}"?`))) {
      return;
    }

    try {
      const response = await authenticatedFetch(
        `https://trebodeluxe-backend.onrender.com/api/admin/index-images/${imageId}`,
        { method: 'DELETE' }
      );

      const data = await response.json();
      if (data.success) {
        alert(t('Imagen eliminada correctamente'));
        loadIndexImages();
      } else {
        alert(t('Error al eliminar imagen: ') + data.message);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert(t('Error al eliminar la imagen'));
    }
  };

  // Manejar subida de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        file,
        previewUrl: URL.createObjectURL(file)
      }));
    }
  };

  // Subir imagen a Cloudinary
  const uploadToCloudinary = async (file: File): Promise<{url: string, public_id: string}> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const formDataUpload = new FormData();
    formDataUpload.append('image', file);

    const response = await fetch('https://trebodeluxe-backend.onrender.com/api/admin/upload-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formDataUpload,
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Error uploading image');
    }

    return {
      url: data.url,
      public_id: data.public_id
    };
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.file) {
      alert(t('Nombre e imagen son requeridos'));
      return;
    }

    setUploadingImage(true);
    try {
      // Subir imagen a Cloudinary
      const cloudinaryResult = await uploadToCloudinary(formData.file);
      
      // Crear registro en la base de datos
      const response = await authenticatedFetch('https://trebodeluxe-backend.onrender.com/api/admin/index-images', {
        method: 'POST',
        body: JSON.stringify({
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          url: cloudinaryResult.url,
          public_id: cloudinaryResult.public_id,
          seccion: formData.seccion,
          estado: 'inactivo'
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(t('Imagen agregada correctamente'));
        setShowAddForm(false);
        setFormData({
          nombre: '',
          descripcion: '',
          seccion: 'principal',
          file: null,
          previewUrl: ''
        });
        loadIndexImages();
      } else {
        alert(t('Error al agregar imagen: ') + data.message);
      }
    } catch (error) {
      console.error('Error adding image:', error);
      alert(t('Error al agregar la imagen'));
    } finally {
      setUploadingImage(false);
    }
  };

  // Renderizar dropdown de estado
  const renderStatusDropdown = (image: IndexImage) => {
    const options = image.seccion === 'principal' 
      ? [
          { value: 'inactivo', label: t('Inactivo') },
          { value: 'izquierda', label: t('Izquierda') },
          { value: 'derecha', label: t('Derecha') }
        ]
      : [
          { value: 'inactivo', label: t('Inactivo') },
          { value: 'activo', label: t('Activo') }
        ];

    return (
      <select
        value={image.estado}
        onChange={(e) => handleStatusChange(image.id_imagen, e.target.value)}
        className="w-full p-2 bg-black/50 border border-white/20 rounded text-white text-sm"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  };

  // Renderizar card de imagen activa
  const renderActiveImageCard = (title: string, image: IndexImage | undefined) => (
    <div className="bg-gray-800 rounded-lg p-4 border border-white/20">
      <h4 className="text-lg font-semibold text-white mb-3">{title}</h4>
      {image ? (
        <div className="space-y-3">
          <div className="relative w-full h-48 bg-gray-700 rounded-lg overflow-hidden">
            <Image
              src={image.url}
              alt={image.nombre}
              fill
              className="object-cover"
            />
          </div>
          <div className="text-white">
            <p className="font-medium">{image.nombre}</p>
            {image.descripcion && (
              <p className="text-sm text-gray-300 mt-1">{image.descripcion}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full h-48 bg-gray-700 rounded-lg flex items-center justify-center text-gray-400">
          {t('Sin imagen activa')}
        </div>
      )}
    </div>
  );

  // Renderizar card de imagen
  const renderImageCard = (image: IndexImage) => (
    <div key={image.id_imagen} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
      <div className="relative w-full h-32 bg-gray-700 rounded-lg overflow-hidden mb-3">
        <Image
          src={image.url}
          alt={image.nombre}
          fill
          className="object-cover"
        />
      </div>
      <div className="space-y-3">
        <div>
          <h5 className="text-white font-medium text-sm">{image.nombre}</h5>
          {image.descripcion && (
            <p className="text-gray-300 text-xs mt-1">{image.descripcion}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <label className="text-xs text-gray-300">{t('Estado')}:</label>
          {renderStatusDropdown(image)}
        </div>
        
        <button
          onClick={() => handleDeleteImage(image.id_imagen, image.nombre)}
          className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
        >
          🗑️ {t('Eliminar')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white">{t('Gestión de Imágenes Index')}</h2>
        {loading && <div className="text-green-400">⏳ {t('Cargando...')}</div>}
      </div>

      {/* Barra de búsqueda */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder={t('Buscar imágenes...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-400/50"
          />
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            + {t('Agregar Nueva Imagen')}
          </button>
        </div>
      </div>

      {/* Sección Imágenes Principales */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-green-400">{t('Imágenes Principales')}</h3>
        
        {/* Cards fijas de imágenes activas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderActiveImageCard(
            t('Imagen Izquierda'), 
            getActiveImage('principal', 'izquierda')
          )}
          {renderActiveImageCard(
            t('Imagen Derecha'), 
            getActiveImage('principal', 'derecha')
          )}
        </div>

        {/* Grid de todas las imágenes principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {principalImages.map(renderImageCard)}
        </div>
      </div>

      {/* Sección Banner Promoción */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-yellow-400">{t('Banner Promoción')}</h3>
        
        {/* Card fija de imagen activa */}
        <div className="max-w-md">
          {renderActiveImageCard(
            t('Banner Activo'), 
            getActiveImage('banner', 'activo')
          )}
        </div>

        {/* Grid de todas las imágenes de banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {bannerImages.map(renderImageCard)}
        </div>
      </div>

      {/* Modal de agregar imagen */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">{t('Agregar Nueva Imagen')}</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t('Nombre de la imagen')} *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({...prev, nombre: e.target.value}))}
                  className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white focus:outline-none focus:border-green-400/50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t('Sección')} *
                </label>
                <select
                  value={formData.seccion}
                  onChange={(e) => setFormData(prev => ({...prev, seccion: e.target.value as 'principal' | 'banner'}))}
                  className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
                >
                  <option value="principal">{t('Imágenes Principales')}</option>
                  <option value="banner">{t('Banner Promoción')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t('Imagen')} *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-green-600 file:text-white hover:file:bg-green-700"
                  required
                />
                {formData.previewUrl && (
                  <div className="mt-2">
                    <div className="relative w-full h-32 bg-gray-700 rounded-lg overflow-hidden">
                      <Image
                        src={formData.previewUrl}
                        alt="Vista previa"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t('Descripción')}
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({...prev, descripcion: e.target.value}))}
                  className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white focus:outline-none focus:border-green-400/50"
                  rows={3}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={uploadingImage}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    uploadingImage
                      ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {uploadingImage ? t('Subiendo...') : t('Guardar')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {t('Cancelar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndexImagesAdmin;
