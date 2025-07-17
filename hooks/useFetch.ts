import { useState, useCallback } from 'react';
import { useLoading } from '../contexts/LoadingContext';

interface FetchOptions extends RequestInit {
  showLoader?: boolean;
  waitForBackend?: boolean;
}

interface UseFetchReturn<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  fetch: (url: string, options?: FetchOptions) => Promise<T | null>;
}

const useFetch = <T = any>(): UseFetchReturn<T> => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const { setLoading, checkBackendStatus, isBackendReady } = useLoading();

  const fetchData = useCallback(
    async (url: string, options: FetchOptions = {}): Promise<T | null> => {
      const {
        showLoader = true,
        waitForBackend = true,
        ...fetchOptions
      } = options;

      try {
        setError(null);
        setIsLocalLoading(true);
        
        if (showLoader) {
          setLoading(true);
        }

        // Si es necesario, verificar y esperar a que el backend esté listo
        if (waitForBackend && !isBackendReady) {
          const isReady = await checkBackendStatus();
          if (!isReady) {
            throw new Error('El servidor está en modo sleep. Despertando...');
          }
        }

        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...(fetchOptions.headers || {})
          },
          ...fetchOptions
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `Error ${response.status}: ${response.statusText}`
          );
        }

        const result = await response.json();
        setData(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return null;
      } finally {
        setIsLocalLoading(false);
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [setLoading, checkBackendStatus, isBackendReady]
  );

  return {
    data,
    error,
    isLoading: isLocalLoading,
    fetch: fetchData
  };
};

export default useFetch;
