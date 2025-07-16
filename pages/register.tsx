import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";
import { useUniversalTranslate } from "../hooks/useUniversalTranslate";
import { useAuth } from "../contexts/AuthContext";

const RegisterScreen: NextPage = () => {
  // Estados para el formulario principal
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Estados para el formulario de envío
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  
  const [currentLanguage, setCurrentLanguage] = useState("es");
  const { t, isTranslating } = useUniversalTranslate(currentLanguage);
  const { register } = useAuth();
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    if (password !== confirmPassword) {
      setError(t('Las contraseñas no coinciden'));
      setIsLoading(false);
      return;
    }
    
    const userData = {
      username,
      email,
      password,
      ...(showShippingForm && {
        shippingInfo: {
          fullName,
          phoneNumber,
          address,
          city,
          state,
          postalCode,
          country
        }
      })
    };
    
    try {
      const success = await register(userData);
      if (success) {
        router.push("/");
      } else {
        setError(t('Error al crear la cuenta. Por favor, inténtalo de nuevo.'));
      }
    } catch (error) {
      setError(t('Error al crear la cuenta. Por favor, inténtalo de nuevo.'));
    } finally {
      setIsLoading(false);
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

      {/* Header simplificado */}
      <div className="w-full bg-[#1a6b1a] py-4 px-8">
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
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          {/* Contenedor del formulario */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2 tracking-[2px]">
                {t('CREAR CUENTA')}
              </h1>
              <p className="text-gray-300">
                {t('Únete a nuestra comunidad')}
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              {/* Formulario principal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="username" className="block text-white font-medium mb-2">
                    {t('Nombre de usuario')}
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-11/12 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                    placeholder={t('Elige un nombre de usuario')}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-white font-medium mb-2">
                    {t('Correo electrónico')}
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-11/12 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                    placeholder={t('tu@email.com')}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="password" className="block text-white font-medium mb-2">
                    {t('Contraseña')}
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-11/12 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                    placeholder={t('Crea una contraseña segura')}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-white font-medium mb-2">
                    {t('Confirmar contraseña')}
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-11/12 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                    placeholder={t('Confirma tu contraseña')}
                    required
                  />
                </div>
              </div>

              {/* Checkbox para formulario de envío */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="shippingForm"
                  checked={showShippingForm}
                  onChange={(e) => setShowShippingForm(e.target.checked)}
                  className="w-5 h-5 rounded border-2 border-white/30 bg-white/20 text-white focus:ring-white/50 focus:ring-2"
                />
                <label htmlFor="shippingForm" className="text-white font-medium cursor-pointer">
                  {t('Deseo llenar el formulario de envío')}
                </label>
              </div>

              {/* Formulario secundario de envío */}
              {showShippingForm && (
                <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-lg">
                  <h3 className="text-xl font-bold text-white mb-6 tracking-[2px]">
                    {t('INFORMACIÓN DE ENVÍO')}
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="fullName" className="block text-white font-medium mb-2">
                          {t('Nombre completo')}
                        </label>
                        <input
                          type="text"
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-11/12 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                          placeholder={t('Tu nombre completo')}
                          required={showShippingForm}
                        />
                      </div>

                      <div>
                        <label htmlFor="phoneNumber" className="block text-white font-medium mb-2">
                          {t('Número de contacto')}
                        </label>
                        <input
                          type="tel"
                          id="phoneNumber"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-11/12 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                          placeholder={t('+52 555 123 4567')}
                          required={showShippingForm}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="address" className="block text-white font-medium mb-2">
                        {t('Dirección')}
                      </label>
                      <input
                        type="text"
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-11/12 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                        placeholder={t('Calle, número, colonia')}
                        required={showShippingForm}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label htmlFor="city" className="block text-white font-medium mb-2">
                          {t('Ciudad')}
                        </label>
                        <input
                          type="text"
                          id="city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-11/12 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                          placeholder={t('Ciudad')}
                          required={showShippingForm}
                        />
                      </div>

                      <div>
                        <label htmlFor="state" className="block text-white font-medium mb-2">
                          {t('Estado/Provincia')}
                        </label>
                        <input
                          type="text"
                          id="state"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-11/12 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                          placeholder={t('Estado')}
                          required={showShippingForm}
                        />
                      </div>

                      <div>
                        <label htmlFor="postalCode" className="block text-white font-medium mb-2">
                          {t('Código postal')}
                        </label>
                        <input
                          type="text"
                          id="postalCode"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          className="w-11/12 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                          placeholder={t('12345')}
                          required={showShippingForm}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="country" className="block text-white font-medium mb-2">
                        {t('País')}
                      </label>
                      <select
                        id="country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-11/12 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                        required={showShippingForm}
                      >
                        <option value="" className="text-black">{t('Selecciona tu país')}</option>
                        <option value="MX" className="text-black">{t('México')}</option>
                        <option value="US" className="text-black">{t('Estados Unidos')}</option>
                        <option value="CA" className="text-black">{t('Canadá')}</option>
                        <option value="ES" className="text-black">{t('España')}</option>
                        <option value="FR" className="text-black">{t('Francia')}</option>
                        <option value="DE" className="text-black">{t('Alemania')}</option>
                        <option value="IT" className="text-black">{t('Italia')}</option>
                        <option value="GB" className="text-black">{t('Reino Unido')}</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-4/5 max-w-sm bg-white text-black py-3 px-6 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? t('Creando cuenta...') : t('Crear Cuenta')}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-300 mb-4">
                {t('¿Ya tienes una cuenta?')}
              </p>
              <div className="flex justify-center">
                <Link
                  href="/login"
                  className="w-3/5 max-w-xs text-center inline-block bg-transparent border-2 border-white text-white py-3 px-6 rounded-lg font-medium hover:bg-white hover:text-black transition-colors duration-200"
                >
                  {t('Iniciar Sesión')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer reducido */}
      <footer className="bg-black/30 border-t border-white/20 py-6">
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
