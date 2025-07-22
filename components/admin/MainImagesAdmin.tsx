// MainImagesAdmin.tsx - Componente para administrar las imágenes principales del sitio

import React, { useState, useEffect } from 'react';
import { useMainImages } from '../../contexts/MainImagesContext';
import type { MainImage, ImageType } from '../../contexts/MainImagesContext';

interface MainImagesAdminProps {
  onClose?: () => void;
}

const MainImagesAdmin: React.FC<MainImagesAdminProps> = ({ onClose }) => {
  const { images, loading, refreshImages } = useMainImages();
  const [activeTab, setActiveTab] = useState<ImageType>('hero_banner');
  const [editingImage, setEditingImage] = useState<MainImage | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    url: '',
    tipo: 'hero_banner' as ImageType,
    titulo: '',
    subtitulo: '',
    enlace: '',
    orden: 1
  });

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://trebodeluxe-backend.onrender.com';

  const tabs = [
    { key: 'hero_banner', label: 'Imágenes Hero', icon: '🖼️' },
    { key: 'promocion_banner', label: 'Banner Promoción', icon: '🎉' },
    { key: 'categoria_destacada', label: 'Categorías', icon: '📂' }
  ];

  const resetForm = () => {
    setFormData({
      nombre: '',
      url: '',
      tipo: activeTab,
      titulo: '',
      subtitulo: '',
      enlace: '',
      orden: 1
    });
    setEditingImage(null);
  };

  const handleEdit = (image: MainImage) => {
    setEditingImage(image);
    setFormData({
      nombre: image.nombre,
      url: image.url,
      tipo: image.tipo,
      titulo: image.titulo || '',
      subtitulo: image.subtitulo || '',
      enlace: image.enlace || '',
      orden: image.orden
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingImage 
        ? `${API_BASE_URL}/api/main-images/${editingImage.id_imagen}`
        : `${API_BASE_URL}/api/main-images`;
      
      const method = editingImage ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await refreshImages();
        setShowAddModal(false);
        resetForm();
        alert(editingImage ? 'Imagen actualizada exitosamente' : 'Imagen creada exitosamente');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar la imagen');
    }
  };

  const handleDelete = async (imageId: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta imagen?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/main-images/${imageId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await refreshImages();
        alert('Imagen eliminada exitosamente');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar la imagen');
    }
  };

  const currentImages = images?.byType[activeTab] || [];

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Cargando imágenes...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Imágenes Principales</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as ImageType)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Add Button */}
      <div className="mb-6">
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          ➕ Agregar Nueva Imagen
        </button>
      </div>

      {/* Images Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {currentImages.map(image => (
          <div key={image.id_imagen} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="aspect-video relative">
              <img
                src={image.url}
                alt={image.titulo || image.nombre}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-image.jpg';
                }}
              />
            </div>
            
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">{image.nombre}</h3>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Título:</strong> {image.titulo || 'N/A'}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Subtítulo:</strong> {image.subtitulo || 'N/A'}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Orden:</strong> {image.orden}
              </p>
              <p className="text-sm text-gray-600 mb-3">
                <strong>Estado:</strong> {image.activo ? '✅ Activo' : '❌ Inactivo'}
              </p>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(image)}
                  className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => handleDelete(image.id_imagen)}
                  className="flex-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {currentImages.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay imágenes de tipo "{activeTab}". Agrega la primera imagen.
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingImage ? 'Editar Imagen' : 'Agregar Nueva Imagen'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL de la Imagen *
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo *
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({...formData, tipo: e.target.value as ImageType})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                >
                  <option value="hero_banner">Hero Banner</option>
                  <option value="promocion_banner">Banner Promoción</option>
                  <option value="categoria_destacada">Categoría Destacada</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subtítulo
                </label>
                <input
                  type="text"
                  value={formData.subtitulo}
                  onChange={(e) => setFormData({...formData, subtitulo: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enlace
                </label>
                <input
                  type="text"
                  value={formData.enlace}
                  onChange={(e) => setFormData({...formData, enlace: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="/catalogo, /producto/123, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Orden
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.orden}
                  onChange={(e) => setFormData({...formData, orden: parseInt(e.target.value) || 1})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingImage ? 'Actualizar' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainImagesAdmin;
