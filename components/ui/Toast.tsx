import React, { useState, useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type, 
  duration = 3000, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Esperar la animación antes de cerrar
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#10b981',
          borderColor: '#059669'
        };
      case 'error':
        return {
          backgroundColor: '#ef4444',
          borderColor: '#dc2626'
        };
      case 'info':
        return {
          backgroundColor: '#3b82f6',
          borderColor: '#2563eb'
        };
      default:
        return {
          backgroundColor: '#6b7280',
          borderColor: '#4b5563'
        };
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.3s ease-in-out',
        ...getTypeStyles(),
        color: 'white',
        padding: '12px 20px',
        borderRadius: '8px',
        border: '2px solid',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        minWidth: '300px',
        maxWidth: '500px'
      }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px' 
      }}>
        <span style={{ fontSize: '16px' }}>{getIcon()}</span>
        <span>{message}</span>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '18px',
            cursor: 'pointer',
            marginLeft: 'auto',
            opacity: 0.8,
            padding: '0 4px'
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

// Hook para manejar múltiples toasts
export const useToast = () => {
  const [toasts, setToasts] = useState<Array<{
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
    duration?: number;
  }>>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info', duration?: number) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const ToastContainer = () => (
    <div>
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );

  return {
    showToast,
    ToastContainer,
    showSuccess: (message: string, duration?: number) => showToast(message, 'success', duration),
    showError: (message: string, duration?: number) => showToast(message, 'error', duration),
    showInfo: (message: string, duration?: number) => showToast(message, 'info', duration)
  };
};
