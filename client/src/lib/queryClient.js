import { QueryClient } from '@tanstack/react-query';

// Configuración global para React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3, // Número de reintentos para consultas fallidas
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Backoff exponencial
      staleTime: 1000 * 60 * 5, // 5 minutos antes de considerar los datos obsoletos
      cacheTime: 1000 * 60 * 60 * 2, // 2 horas de caché
      refetchOnWindowFocus: 'always', // Siempre revalidar cuando la ventana recupera el foco
      refetchOnReconnect: 'always', // Siempre revalidar cuando se recupera la conexión
      refetchOnMount: true, // Revalidar datos cuando el componente se monta
      keepPreviousData: true, // Mantener los datos anteriores mientras se cargan los nuevos
      refetchInterval: false, // No hacer refetch automático basado en intervalos
      // Configuración para manejar errores de red
      networkMode: 'always', // Intentar siempre, incluso offline
      onError: (error) => {
        console.error('Error en consulta:', error);
        // Marcar error reciente para que el focusManager lo maneje
        if (window.markQueryError) {
          window.markQueryError();
        }
      },
    },
    mutations: {
      retry: 2, // Número de reintentos para mutaciones fallidas
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Backoff exponencial
      networkMode: 'always', // Intentar siempre, incluso offline
    },
  },
});

export default queryClient;