// NotesAdmin.tsx - Componente para gestión de notas generales

import React, { useState, useEffect } from 'react';

interface Note {
  id_nota: number;
  titulo: string;
  contenido: string;
  prioridad: 'baja' | 'normal' | 'alta' | 'urgente';
  id_usuario_creador: number;
  nombre_usuario_creador: string;
  rol_usuario_creador: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  activo: boolean;
  fecha_vencimiento?: string;
  etiquetas: string[];
  color: string;
  vencida: boolean;
  usuario_actual_nombres?: string;
  usuario_actual_apellidos?: string;
}

interface NoteStats {
  total_notas: number;
  notas_activas: number;
  urgentes: number;
  altas: number;
  normales: number;
  bajas: number;
  vencidas: number;
  notas_hoy: number;
  notas_semana: number;
  vencen_pronto: number;
}

const PRIORIDADES = [
  { value: 'urgente', label: 'Urgente', color: 'bg-red-100 text-red-800 border-red-300' },
  { value: 'alta', label: 'Alta', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'baja', label: 'Baja', color: 'bg-gray-100 text-gray-800 border-gray-300' }
];

const COLORES = [
  { value: 'default', label: 'Default', bg: 'bg-gray-50', border: 'border-gray-200' },
  { value: 'red', label: 'Rojo', bg: 'bg-red-50', border: 'border-red-200' },
  { value: 'orange', label: 'Naranja', bg: 'bg-orange-50', border: 'border-orange-200' },
  { value: 'yellow', label: 'Amarillo', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { value: 'green', label: 'Verde', bg: 'bg-green-50', border: 'border-green-200' },
  { value: 'blue', label: 'Azul', bg: 'bg-blue-50', border: 'border-blue-200' },
  { value: 'purple', label: 'Morado', bg: 'bg-purple-50', border: 'border-purple-200' }
];

const NotesAdmin: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState<NoteStats | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');
  
  // Estados para filtros y búsqueda
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    prioridad: '',
    vencidas: '',
    etiqueta: '',
    activo: 'true',
    fecha_desde: '',
    fecha_hasta: '',
    sort_by: 'fecha_creacion',
    sort_order: 'desc'
  });
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 10
  });

  // Estados para formulario
  const [noteForm, setNoteForm] = useState({
    titulo: '',
    contenido: '',
    prioridad: 'normal' as 'baja' | 'normal' | 'alta' | 'urgente',
    fecha_vencimiento: '',
    etiquetas: [] as string[],
    color: 'default',
    activo: true
  });

  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchNotes();
    fetchStats();
    fetchTags();
  }, [filters]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });

      const response = await fetch(`https://trebodeluxe-backend.onrender.com/api/notes?${queryParams}`);
      const data = await response.json();
      
      if (data.success) {
        setNotes(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('https://trebodeluxe-backend.onrender.com/api/notes/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch('https://trebodeluxe-backend.onrender.com/api/notes/tags');
      const data = await response.json();
      
      if (data.success) {
        setTags(data.data);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const openModal = (mode: 'view' | 'edit' | 'create', note?: Note) => {
    setModalMode(mode);
    
    if (note) {
      setSelectedNote(note);
      setNoteForm({
        titulo: note.titulo,
        contenido: note.contenido,
        prioridad: note.prioridad,
        fecha_vencimiento: note.fecha_vencimiento ? note.fecha_vencimiento.split('T')[0] : '',
        etiquetas: note.etiquetas || [],
        color: note.color,
        activo: note.activo
      });
    } else {
      setSelectedNote(null);
      setNoteForm({
        titulo: '',
        contenido: '',
        prioridad: 'normal',
        fecha_vencimiento: '',
        etiquetas: [],
        color: 'default',
        activo: true
      });
    }
    
    setShowModal(true);
  };

  const handleSaveNote = async () => {
    try {
      setSaving(true);
      
      const payload = {
        ...noteForm,
        fecha_vencimiento: noteForm.fecha_vencimiento || null
      };
      
      const url = modalMode === 'create' 
        ? 'https://trebodeluxe-backend.onrender.com/api/notes'
        : `https://trebodeluxe-backend.onrender.com/api/notes/${selectedNote?.id_nota}`;
      
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowModal(false);
        fetchNotes();
        fetchStats();
        alert(`Nota ${modalMode === 'create' ? 'creada' : 'actualizada'} correctamente`);
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Error al guardar la nota');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta nota?')) return;
    
    try {
      const response = await fetch(`https://trebodeluxe-backend.onrender.com/api/notes/${noteId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchNotes();
        fetchStats();
        alert('Nota eliminada correctamente');
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Error al eliminar la nota');
    }
  };

  const addTag = () => {
    if (newTag.trim() && !noteForm.etiquetas.includes(newTag.trim())) {
      setNoteForm({
        ...noteForm,
        etiquetas: [...noteForm.etiquetas, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNoteForm({
      ...noteForm,
      etiquetas: noteForm.etiquetas.filter(tag => tag !== tagToRemove)
    });
  };

  const getPriorityStyle = (prioridad: string) => {
    const priority = PRIORIDADES.find(p => p.value === prioridad);
    return priority ? priority.color : 'bg-gray-100 text-gray-800';
  };

  const getColorStyle = (color: string) => {
    const colorConfig = COLORES.find(c => c.value === color);
    return colorConfig ? `${colorConfig.bg} ${colorConfig.border}` : 'bg-gray-50 border-gray-200';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-MX');
  };

  const isExpiringSoon = (fecha_vencimiento: string) => {
    if (!fecha_vencimiento) return false;
    const vencimiento = new Date(fecha_vencimiento);
    const ahora = new Date();
    const unaSemana = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000);
    return vencimiento >= ahora && vencimiento <= unaSemana;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Notas Generales</h1>
        <button
          onClick={() => openModal('create')}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
        >
          ➕ Nueva Nota
        </button>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-600">Total</h3>
            <p className="text-2xl font-bold text-blue-900">{stats.total_notas}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-600">Activas</h3>
            <p className="text-2xl font-bold text-green-900">{stats.notas_activas}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-red-600">Urgentes</h3>
            <p className="text-2xl font-bold text-red-900">{stats.urgentes}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-orange-600">Altas</h3>
            <p className="text-2xl font-bold text-orange-900">{stats.altas}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-600">Vencidas</h3>
            <p className="text-2xl font-bold text-purple-900">{stats.vencidas}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-600">Vencen Pronto</h3>
            <p className="text-2xl font-bold text-yellow-900">{stats.vencen_pronto}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600">Hoy</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.notas_hoy}</p>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-indigo-600">Esta Semana</h3>
            <p className="text-2xl font-bold text-indigo-900">{stats.notas_semana}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-600">Normales</h3>
            <p className="text-2xl font-bold text-blue-900">{stats.normales}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600">Bajas</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.bajas}</p>
          </div>
        </div>
      )}

      {/* Filtros y búsqueda */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Buscar</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              placeholder="Título, contenido o usuario..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Prioridad</label>
            <select
              value={filters.prioridad}
              onChange={(e) => setFilters({ ...filters, prioridad: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las prioridades</option>
              {PRIORIDADES.map(prioridad => (
                <option key={prioridad.value} value={prioridad.value}>{prioridad.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Estado</label>
            <select
              value={filters.vencidas}
              onChange={(e) => setFilters({ ...filters, vencidas: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              <option value="false">Vigentes</option>
              <option value="true">Vencidas</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Etiqueta</label>
            <select
              value={filters.etiqueta}
              onChange={(e) => setFilters({ ...filters, etiqueta: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las etiquetas</option>
              {tags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de notas */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">Cargando notas...</div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No se encontraron notas</div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id_nota}
              className={`p-4 rounded-lg border-2 ${getColorStyle(note.color)} ${
                note.vencida ? 'opacity-60' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{note.titulo}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityStyle(note.prioridad)}`}>
                      {PRIORIDADES.find(p => p.value === note.prioridad)?.label}
                    </span>
                    {note.vencida && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 border-red-300">
                        VENCIDA
                      </span>
                    )}
                    {note.fecha_vencimiento && isExpiringSoon(note.fecha_vencimiento) && !note.vencida && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 border-yellow-300">
                        VENCE PRONTO
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-700 mb-3 line-clamp-3">{note.contenido}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {note.etiquetas?.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p>👤 <strong>{note.nombre_usuario_creador}</strong> ({note.rol_usuario_creador})</p>
                    <p>📅 Creada: {formatDate(note.fecha_creacion)}</p>
                    {note.fecha_vencimiento && (
                      <p>⏰ Vence: {formatDate(note.fecha_vencimiento)}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => openModal('view', note)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    👁️ Ver
                  </button>
                  <button
                    onClick={() => openModal('edit', note)}
                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note.id_nota)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 mt-6">
          <div className="flex-1 flex justify-between">
            <button
              onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
              disabled={pagination.currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-700">
              Página {pagination.currentPage} de {pagination.totalPages} ({pagination.totalRecords} total)
            </span>
            <button
              onClick={() => setFilters({ ...filters, page: Math.min(pagination.totalPages, filters.page + 1) })}
              disabled={pagination.currentPage === pagination.totalPages}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {modalMode === 'create' ? 'Nueva Nota' : modalMode === 'edit' ? 'Editar Nota' : 'Ver Nota'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {modalMode === 'view' && selectedNote ? (
                // Vista de solo lectura
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Título</h4>
                    <p className="text-gray-700">{selectedNote.titulo}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Contenido</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedNote.contenido}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Prioridad</h4>
                      <span className={`px-2 py-1 text-sm rounded-full ${getPriorityStyle(selectedNote.prioridad)}`}>
                        {PRIORIDADES.find(p => p.value === selectedNote.prioridad)?.label}
                      </span>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Estado</h4>
                      <span className={`px-2 py-1 text-sm rounded-full ${selectedNote.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {selectedNote.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                  </div>
                  
                  {selectedNote.etiquetas && selectedNote.etiquetas.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Etiquetas</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedNote.etiquetas.map((tag, index) => (
                          <span key={index} className="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    <p><strong>Creado por:</strong> {selectedNote.nombre_usuario_creador} ({selectedNote.rol_usuario_creador})</p>
                    <p><strong>Fecha de creación:</strong> {formatDate(selectedNote.fecha_creacion)}</p>
                    <p><strong>Última actualización:</strong> {formatDate(selectedNote.fecha_actualizacion)}</p>
                    {selectedNote.fecha_vencimiento && (
                      <p><strong>Fecha de vencimiento:</strong> {formatDate(selectedNote.fecha_vencimiento)}</p>
                    )}
                  </div>
                </div>
              ) : (
                // Formulario de edición/creación
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Título *</label>
                    <input
                      type="text"
                      value={noteForm.titulo}
                      onChange={(e) => setNoteForm({ ...noteForm, titulo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Contenido *</label>
                    <textarea
                      value={noteForm.contenido}
                      onChange={(e) => setNoteForm({ ...noteForm, contenido: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Prioridad</label>
                      <select
                        value={noteForm.prioridad}
                        onChange={(e) => setNoteForm({ ...noteForm, prioridad: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {PRIORIDADES.map(prioridad => (
                          <option key={prioridad.value} value={prioridad.value}>{prioridad.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Color</label>
                      <select
                        value={noteForm.color}
                        onChange={(e) => setNoteForm({ ...noteForm, color: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {COLORES.map(color => (
                          <option key={color.value} value={color.value}>{color.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Fecha de Vencimiento (Opcional)</label>
                    <input
                      type="date"
                      value={noteForm.fecha_vencimiento}
                      onChange={(e) => setNoteForm({ ...noteForm, fecha_vencimiento: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Etiquetas</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTag()}
                        placeholder="Agregar etiqueta..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Agregar
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {noteForm.etiquetas.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full flex items-center gap-1"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {modalMode === 'edit' && (
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={noteForm.activo}
                          onChange={(e) => setNoteForm({ ...noteForm, activo: e.target.checked })}
                          className="mr-2"
                        />
                        Nota activa
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  {modalMode === 'view' ? 'Cerrar' : 'Cancelar'}
                </button>
                {modalMode !== 'view' && (
                  <button
                    onClick={handleSaveNote}
                    disabled={saving || !noteForm.titulo || !noteForm.contenido}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesAdmin;
