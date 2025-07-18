import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const TestPage: React.FC = () => {
  const { user, isAuthenticated, login, logout, register } = useAuth();
  const [testResult, setTestResult] = useState<string>('');

  const testLogin = async () => {
    try {
      setTestResult('Probando login...');
      await login({
        usuario: 'testuser',
        contrasena: 'testpass123'
      });
      setTestResult('Login exitoso');
    } catch (error) {
      setTestResult(`Error en login: ${error}`);
    }
  };

  const testLogout = async () => {
    try {
      setTestResult('Probando logout...');
      await logout();
      setTestResult('Logout exitoso');
    } catch (error) {
      setTestResult(`Error en logout: ${error}`);
    }
  };

  const testRegister = async () => {
    try {
      setTestResult('Probando registro...');
      await register({
        nombres: 'Test',
        apellidos: 'User',
        correo: 'test@example.com',
        contrasena: 'testpass123',
        usuario: 'testuser'
      });
      setTestResult('Registro exitoso');
    } catch (error) {
      setTestResult(`Error en registro: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          Página de Pruebas - Sistema de Autenticación
        </h1>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Estado de Autenticación</h2>
          <p><strong>Autenticado:</strong> {isAuthenticated ? 'Sí' : 'No'}</p>
          {user && (
            <div className="mt-2">
              <p><strong>Usuario:</strong> {user.usuario}</p>
              <p><strong>Nombre:</strong> {user.nombres} {user.apellidos}</p>
              <p><strong>Email:</strong> {user.correo}</p>
              <p><strong>Rol:</strong> {user.rol}</p>
              <p><strong>ID:</strong> {user.id_usuario}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Pruebas</h2>
          
          <div className="flex space-x-4">
            <button
              onClick={testLogin}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              disabled={isAuthenticated}
            >
              Probar Login
            </button>
            
            <button
              onClick={testLogout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              disabled={!isAuthenticated}
            >
              Probar Logout
            </button>
            
            <button
              onClick={testRegister}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              disabled={isAuthenticated}
            >
              Probar Registro
            </button>
          </div>

          {testResult && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800">{testResult}</p>
            </div>
          )}
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Problemas Resueltos</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>✅ Login automático no deseado eliminado</li>
            <li>✅ Botones de login/registro visibles cuando no hay sesión</li>
            <li>✅ Dropdown de admin se cierra al hacer click fuera</li>
            <li>✅ Campo "rol" agregado a la base de datos</li>
            <li>✅ Endpoint de logout implementado en backend</li>
            <li>✅ Botón de admin solo visible para usuarios con rol 'admin'</li>
            <li>✅ Botón "Cerrar sesión" conectado al backend</li>
          </ul>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Cambios Técnicos</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Base de datos: Campo "rol" con valores 'user', 'admin', 'moderator'</li>
            <li>Backend: Endpoint POST /api/auth/logout</li>
            <li>Frontend: Función logout asíncrona con notificación al servidor</li>
            <li>UI: Dropdown de admin en eventos de click outside</li>
            <li>Seguridad: Restricción de acceso por rol de usuario</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
