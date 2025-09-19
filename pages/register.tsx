import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { useState, FormEvent } from "react";
import { useRouter } from "next/router";
import { useUniversalTranslate } from "../hooks/useUniversalTranslate";
import { useAuth } from "../contexts/AuthContext";
import MobileHeaderSimple from "../components/MobileHeaderSimple";
import Footer from "../components/Footer";

const RegisterScreen: NextPage = () => {
  const router = useRouter();
  const { register } = useAuth();
  const [currentLanguage, setCurrentLanguage] = useState("es");
  const { t, isTranslating } = useUniversalTranslate(currentLanguage);
  
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    usuario: '',
    correo: '',
    contrasena: '',
    confirmarContrasena: ''
  });
  
  const [shippingData, setShippingData] = useState({
    nombre_completo: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    estado: '',
    codigo_postal: '',
    pais: '',
    colonia: '',
    referencias: ''
  });
  
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Estados para códigos postales y colonias
  const [colonias, setColonias] = useState<Array<{nombre: string, tipo: string}>>([]);
  const [loadingColonias, setLoadingColonias] = useState(false);
  const [cpError, setCpError] = useState('');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Manejar código postal con lógica especial
    if (name === 'codigo_postal') {
      setShippingData(prev => ({
        ...prev,
        [name]: value,
        colonia: '' // Limpiar colonia al cambiar CP
      }));
      
      // Cargar colonias si el CP tiene 5 dígitos
      if (value.length === 5) {
        loadColoniasByCP(value);
      } else {
        setColonias([]);
        setCpError('');
      }
    } else {
      setShippingData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Función mejorada para cargar colonias por código postal
  const loadColoniasByCP = async (codigoPostal: string) => {
    if (!codigoPostal || codigoPostal.length !== 5) {
      setColonias([]);
      setCpError('');
      return;
    }
    
    setLoadingColonias(true);
    setCpError('');

    try {
      console.log('🔍 [REGISTER-COLONIAS] Buscando colonias para CP:', codigoPostal);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/postal-codes/colonias/${codigoPostal}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [REGISTER-COLONIAS] Colonias encontradas:', data.colonias?.length || 0);
        setColonias(data.colonias || []);
        
        // Auto-llenar ciudad y estado si están disponibles
        if (data.success && data.estado && data.ciudad) {
          setShippingData(prev => ({
            ...prev,
            estado: data.estado || prev.estado,
            ciudad: data.ciudad || prev.ciudad
          }));
        }
      } else {
        const errorData = await response.json();
        console.log('❌ [REGISTER-COLONIAS] CP no encontrado:', errorData.error);
        setColonias([]);
        setCpError(errorData.error || t('Código postal no encontrado'));
      }
    } catch (error) {
      console.error('❌ [REGISTER-COLONIAS] Error:', error);
      setColonias([]);
      setCpError(t('Error al buscar colonias'));
    } finally {
      setLoadingColonias(false);
    }
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validaciones básicas
    if (!formData.nombres || !formData.apellidos || !formData.usuario || !formData.correo || !formData.contrasena) {
      setError(t('Todos los campos son obligatorios'));
      return;
    }
    
    if (formData.contrasena !== formData.confirmarContrasena) {
      setError(t('Las contraseñas no coinciden'));
      return;
    }
    
    if (formData.contrasena.length < 6) {
      setError(t('La contraseña debe tener al menos 6 caracteres'));
      return;
    }
    
    // Validar datos de envío si están habilitados
    if (showShippingForm) {
      if (!shippingData.nombre_completo || !shippingData.telefono || !shippingData.direccion || 
          !shippingData.ciudad || !shippingData.estado || !shippingData.codigo_postal || 
          !shippingData.pais || !shippingData.colonia) {
        setError(t('Todos los campos de envío son obligatorios'));
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      // Crear objeto con datos a enviar al registro
      const registrationData = {
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        correo: formData.correo,
        contrasena: formData.contrasena,
        usuario: formData.usuario,
        // Incluir datos de envío solo si el formulario está habilitado
        shippingInfo: showShippingForm ? shippingData : undefined
      };
      
      await register(registrationData);
      
      // Si llegamos aquí, el registro fue exitoso
      router.push('/catalogo');
    } catch (err) {
      setError(t('Error al registrar usuario. Intente nuevamente.'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleShippingForm = () => {
    if (!showShippingForm) {
      setIsExpanded(true);
      setTimeout(() => {
        setShowShippingForm(true);
      }, 200);
    } else {
      setShowShippingForm(false);
      setTimeout(() => {
        setIsExpanded(false);
      }, 100);
    }
  };
  
  return (
    <div className="w-full min-h-screen [background:linear-gradient(180deg,_#323232,_#000)] flex flex-col">
      {/* Indicador de traducción */}
      {isTranslating && (
        <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-green-600 to-green-400 z-50">
          <div className="h-full bg-white opacity-50 animate-pulse"></div>
        </div>
      )}

      {/* Header móvil simple */}
      <MobileHeaderSimple />

      {/* Header desktop - oculto en móvil */}
      <div className="hidden md:block w-full bg-[#1a6b1a] py-4 px-8">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Link href="/" className="flex items-center">
            <Image
              className="w-[80px] h-[50px] object-contain"
              width={80}
              height={50}
              alt="Logo Treboluxe"
              src="/sin-ttulo1-2@2x.png"
            />
          </Link>
          <div className="text-white font-salsa tracking-[4px] text-xl">
            {t('TREBOLUXE')}
          </div>
          
          {/* Selector de idioma */}
          <div className="flex items-center space-x-4">
            <select
              value={currentLanguage}
              onChange={(e) => setCurrentLanguage(e.target.value)}
              className="bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
            >
              <option value="es" className="text-black">{t('Español')}</option>
              <option value="en" className="text-black">{t('English')}</option>
              <option value="fr" className="text-black">{t('Français')}</option>
              <option value="de" className="text-black">{t('Deutsch')}</option>
              <option value="it" className="text-black">{t('Italiano')}</option>
              <option value="pt" className="text-black">{t('Português')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex items-center justify-center px-4 py-6 md:py-12">
        <div 
          className={`
            transition-all duration-500 ease-in-out 
            ${isExpanded ? 'max-w-5xl' : 'max-w-md'} 
            ${isExpanded ? 'animate-expand' : showShippingForm ? 'animate-contract' : ''}
          `}
          style={{
            '--initial-width': 'min(calc(100vw - 2rem), 28rem)',
            '--expanded-width': 'min(calc(100vw - 2rem), 64rem)'
          } as React.CSSProperties}
        >
          {/* Contenedor único para ambos formularios */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 md:p-10 shadow-2xl transition-all duration-500 max-w-6xl mx-auto">
            <div className="text-center mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-[2px]">
                {t('CREAR CUENTA')}
              </h1>
              <p className="text-gray-300 text-sm md:text-base">
                {t('Únete a Treboluxe')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <div className="flex justify-center mb-4 md:mb-6">
                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 w-fit max-w-lg">
                    <p className="text-red-200 text-sm">{error}</p>
                  </div>
                )}
              </div>

              {/* Contenedor flexible para ambos formularios lado a lado */}
              <div className="flex flex-col md:flex-row gap-6 md:gap-10">
                {/* Formulario principal de registro - Lado izquierdo */}
                <div className={`flex-1 ${!isExpanded ? 'mx-auto max-w-xs' : ''}`}>
                  <div className="text-center mb-4 md:mb-6">
                    <h2 className="text-lg md:text-xl font-bold text-white mb-1">
                      {t('DATOS DEL USUARIO')}
                    </h2>
                    <p className="text-gray-300 text-xs md:text-sm">
                      {t('Información personal')}
                    </p>
                  </div>
                  
                  <div className="space-y-4 md:space-y-6">
                    <div className="flex flex-col mb-3 md:mb-4">
                      <label htmlFor="nombres" className="block text-white font-medium mb-2 text-left text-sm md:text-base">
                        {t('Nombres')}
                      </label>
                      <input
                        type="text"
                        id="nombres"
                        name="nombres"
                        value={formData.nombres}
                        onChange={handleChange}
                        className="px-3 md:px-4 py-2 md:py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200 text-sm md:text-base"
                        placeholder={t('Ingresa tus nombres')}
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div className="flex flex-col mb-3 md:mb-4">
                      <label htmlFor="apellidos" className="block text-white font-medium mb-2 text-left text-sm md:text-base">
                        {t('Apellidos')}
                      </label>
                      <input
                        type="text"
                        id="apellidos"
                        name="apellidos"
                        value={formData.apellidos}
                        onChange={handleChange}
                        className="px-3 md:px-4 py-2 md:py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200 text-sm md:text-base"
                        placeholder={t('Ingresa tus apellidos')}
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div className="flex flex-col mb-4">
                      <label htmlFor="usuario" className="block text-white font-medium mb-2 text-left">
                        {t('Usuario')}
                      </label>
                      <input
                        type="text"
                        id="usuario"
                        name="usuario"
                        value={formData.usuario}
                        onChange={handleChange}
                        className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                        placeholder={t('Ingresa tu nombre de usuario')}
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div className="flex flex-col mb-4">
                      <label htmlFor="correo" className="block text-white font-medium mb-2 text-left">
                        {t('Correo electrónico')}
                      </label>
                      <input
                        type="email"
                        id="correo"
                        name="correo"
                        value={formData.correo}
                        onChange={handleChange}
                        className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                        placeholder={t('Ingresa tu correo electrónico')}
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div className="flex flex-col mb-4">
                      <label htmlFor="contrasena" className="block text-white font-medium mb-2 text-left">
                        {t('Contraseña')}
                      </label>
                      <input
                        type="password"
                        id="contrasena"
                        name="contrasena"
                        value={formData.contrasena}
                        onChange={handleChange}
                        className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                        placeholder={t('Crea tu contraseña')}
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div className="flex flex-col mb-4">
                      <label htmlFor="confirmarContrasena" className="block text-white font-medium mb-2 text-left">
                        {t('Confirmar contraseña')}
                      </label>
                      <input
                        type="password"
                        id="confirmarContrasena"
                        name="confirmarContrasena"
                        value={formData.confirmarContrasena}
                        onChange={handleChange}
                        className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                        placeholder={t('Confirma tu contraseña')}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                {/* Formulario de datos de envío - Lado derecho (condicionalmente renderizado) */}
                {isExpanded && (
                  <div className={`flex-1 transition-all duration-500 ${showShippingForm ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="text-center mb-6">
                      <h2 className="text-xl font-bold text-white mb-1">
                        {t('DATOS DE ENVÍO')}
                      </h2>
                      <p className="text-gray-300 text-sm">
                        {t('Información para entrega de productos')}
                      </p>
                    </div>

                    {showShippingForm && (
                      <div className="animate-fadeIn space-y-6">
                        <div className="flex flex-col mb-4">
                          <label htmlFor="nombre_completo" className="block text-white font-medium mb-2 text-left">
                            {t('Nombre completo')}
                          </label>
                          <input
                            type="text"
                            id="nombre_completo"
                            name="nombre_completo"
                            value={shippingData.nombre_completo}
                            onChange={handleShippingChange}
                            className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                            placeholder={t('Nombre para el envío')}
                            disabled={isLoading}
                          />
                        </div>

                        <div className="flex flex-col mb-4">
                          <label htmlFor="telefono" className="block text-white font-medium mb-2 text-left">
                            {t('Teléfono')}
                          </label>
                          <input
                            type="tel"
                            id="telefono"
                            name="telefono"
                            value={shippingData.telefono}
                            onChange={handleShippingChange}
                            className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                            placeholder={t('Número de contacto')}
                            disabled={isLoading}
                          />
                        </div>

                        <div className="flex flex-col mb-4">
                          <label htmlFor="direccion" className="block text-white font-medium mb-2 text-left">
                            {t('Dirección')}
                          </label>
                          <input
                            type="text"
                            id="direccion"
                            name="direccion"
                            value={shippingData.direccion}
                            onChange={handleShippingChange}
                            className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                            placeholder={t('Dirección completa')}
                            disabled={isLoading}
                          />
                        </div>

                        <div className="flex flex-col mb-4">
                          <label htmlFor="ciudad" className="block text-white font-medium mb-2 text-left">
                            {t('Ciudad')}
                          </label>
                          <input
                            type="text"
                            id="ciudad"
                            name="ciudad"
                            value={shippingData.ciudad}
                            onChange={handleShippingChange}
                            className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                            placeholder={t('Ciudad')}
                            disabled={isLoading}
                          />
                        </div>

                        <div className="flex flex-col mb-4">
                          <label htmlFor="estado" className="block text-white font-medium mb-2 text-left">
                            {t('Estado/Provincia')}
                          </label>
                          <input
                            type="text"
                            id="estado"
                            name="estado"
                            value={shippingData.estado}
                            onChange={handleShippingChange}
                            className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                            placeholder={t('Estado o provincia')}
                            disabled={isLoading}
                          />
                        </div>

                        <div className="flex flex-col mb-4">
                          <label htmlFor="codigo_postal" className="block text-white font-medium mb-2 text-left">
                            {t('Código postal')} *
                          </label>
                          <input
                            type="text"
                            id="codigo_postal"
                            name="codigo_postal"
                            value={shippingData.codigo_postal}
                            onChange={handleShippingChange}
                            className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                            placeholder={t('Código postal')}
                            maxLength={5}
                            disabled={isLoading}
                            required
                          />
                          {cpError && (
                            <div className="mt-2 text-red-400 text-sm">
                              {cpError}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col mb-4">
                          <label htmlFor="colonia" className="block text-white font-medium mb-2 text-left">
                            {t('Colonia')} *
                          </label>
                          {loadingColonias ? (
                            <div className="px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-gray-400 flex items-center">
                              <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                              </svg>
                              {t('Cargando colonias...')}
                            </div>
                          ) : colonias.length > 0 ? (
                            <select
                              id="colonia"
                              name="colonia"
                              value={shippingData.colonia}
                              onChange={handleShippingChange}
                              className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                              disabled={isLoading}
                              required
                            >
                              <option value="">{t('Selecciona una colonia')}</option>
                              {colonias.map((colonia, index) => (
                                <option key={index} value={colonia.nombre} className="text-black">
                                  {colonia.nombre} ({colonia.tipo})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              id="colonia"
                              name="colonia"
                              value={shippingData.colonia}
                              onChange={handleShippingChange}
                              className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                              placeholder={t('Ingresa la colonia manualmente')}
                              disabled={isLoading}
                              required
                            />
                          )}
                        </div>

                        <div className="flex flex-col mb-4">
                          <label htmlFor="referencias" className="block text-white font-medium mb-2 text-left">
                            {t('Referencias del domicilio')}
                          </label>
                          <input
                            type="text"
                            id="referencias"
                            name="referencias"
                            value={shippingData.referencias}
                            onChange={handleShippingChange}
                            className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                            placeholder={t('Ej: Entre calle A y B, edificio azul')}
                            disabled={isLoading}
                          />
                        </div>

                        <div className="flex flex-col mb-4">
                          <label htmlFor="pais" className="block text-white font-medium mb-2 text-left">
                            {t('País')} *
                          </label>
                          <input
                            type="text"
                            id="pais"
                            name="pais"
                            value={shippingData.pais}
                            onChange={handleShippingChange}
                            className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                            placeholder={t('País')}
                            disabled={isLoading}
                            required
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Checkbox para mostrar/ocultar el formulario de datos de envío */}
              <div className="flex items-center mt-10 mb-8 justify-center">
                <input
                  type="checkbox"
                  id="showShippingForm"
                  checked={showShippingForm}
                  onChange={toggleShippingForm}
                  className="w-5 h-5 text-green-600 border-white/30 rounded focus:ring-green-500 focus:ring-opacity-25 bg-white/20"
                  disabled={isLoading}
                />
                <label htmlFor="showShippingForm" className="ml-3 text-white">
                  {t('Quiero agregar mis datos de envío')}
                </label>
              </div>

              <div className="flex justify-center pt-8">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full max-w-xs bg-white text-black py-3 px-6 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? t('Registrando...') : t('Crear Cuenta')}
                </button>
              </div>
            
              <div className="mt-10 text-center">
                <p className="text-gray-300 mb-6">
                  {t('¿Ya tienes una cuenta?')}
                </p>
                <div className="flex justify-center">
                  <Link
                    href="/login"
                    className="w-full max-w-xs text-center bg-transparent border-2 border-white text-white py-3 px-6 rounded-lg font-medium hover:bg-white hover:text-black transition-colors duration-200 inline-block"
                  >
                    {t('Iniciar Sesión')}
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Footer móvil */}
      <Footer />

      {/* Footer desktop hardcodeado - oculto en móvil */}
      <footer className="hidden md:block bg-black/30 border-t border-white/20 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-gray-300 text-sm mb-4 md:mb-0">
              © 2025 Treboluxe. {t('Todos los derechos reservados')}.
            </div>
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-gray-300 hover:text-white text-sm transition-colors duration-200">
                {t('Privacidad')}
              </Link>
              <Link href="/terms" className="text-gray-300 hover:text-white text-sm transition-colors duration-200">
                {t('Términos')}
              </Link>
              <Link href="/contact" className="text-gray-300 hover:text-white text-sm transition-colors duration-200">
                {t('Contacto')}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RegisterScreen;
