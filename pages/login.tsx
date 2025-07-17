import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";
import { useUniversalTranslate } from "../hooks/useUniversalTranslate";
import { useAuth } from "../contexts/AuthContext";

const LoginScreen: NextPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState("es");
  const { t, isTranslating } = useUniversalTranslate(currentLanguage);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const success = await login({
        correo: email,
        contrasena: password
      });
      
      if (success) {
        router.push("/");
      } else {
        setError(t('Credenciales inválidas. Por favor, verifica tu correo y contraseña.'));
      }
    } catch (error) {
      setError(t('Error al iniciar sesión. Por favor, inténtalo de nuevo.'));
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
        <div className="w-full max-w-md">
          {/* Contenedor del formulario */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2 tracking-[2px]">
                {t('INICIAR SESIÓN')}
              </h1>
              <p className="text-gray-300">
                {t('Bienvenido de vuelta')}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6 max-w-sm mx-auto">
              <div className="flex justify-center">
                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 w-72">
                    <p className="text-red-200 text-sm">{error}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center">
                <label htmlFor="email" className="block text-white font-medium mb-2 w-72 text-left">
                  {t('Correo electrónico')}
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-72 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                  placeholder={t('Ingresa tu correo electrónico')}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="flex flex-col items-center">
                <label htmlFor="password" className="block text-white font-medium mb-2 w-72 text-left">
                  {t('Contraseña')}
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-72 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                  placeholder={t('Ingresa tu contraseña')}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="flex justify-center">
                <Link 
                  href="/forgot-password" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 text-sm"
                >
                  {t('¿Olvidaste tu contraseña?')}
                </Link>
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-72 bg-white text-black py-3 px-6 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? t('Iniciando sesión...') : t('Iniciar Sesión')}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-300 mb-4">
                {t('¿No tienes una cuenta?')}
              </p>
              <div className="flex justify-center">
                <Link
                  href="/register"
                  className="w-72 text-center bg-transparent border-2 border-white text-white py-3 px-6 rounded-lg font-medium hover:bg-white hover:text-black transition-colors duration-200 inline-block"
                >
                  {t('Registrarse')}
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

export default LoginScreen;
