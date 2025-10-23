import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const GlobalDataManager = () => {
  const queryClient = useQueryClient();
  const { getToken, isSignedIn } = useAuth();
  const reconnectingRef = useRef(false);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);

  // Función para verificar la conexión al backend
  const checkBackendConnection = async () => {
    try {
      await axios.get(`${import.meta.env.VITE_API_URL}/posts?limit=1`, { timeout: 10000 });
      return true;
    } catch (error) {
      console.error('Error al verificar conexión con backend:', error);
      return false;
    }
  };

  // Manejar cambios de visibilidad de la página
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('Página visible de nuevo, verificando conexión...');
        
        // Evitar múltiples reconexiones simultáneas
        if (reconnectingRef.current) return;
        reconnectingRef.current = true;
        
        try {
          // Verificar conexión a internet
          const online = navigator.onLine;
          if (!online) {
            console.log('Sin conexión a internet, esperando reconexión...');
            reconnectingRef.current = false;
            return;
          }
          
          // Verificar conexión al backend
          const backendConnected = await checkBackendConnection();
          if (!backendConnected) {
            console.log('No se puede conectar al backend, reintentando más tarde...');
            // Programar un reintento
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = setTimeout(() => {
              handleVisibilityChange();
            }, 5000);
            return;
          }
          
          // Si el usuario está autenticado, renovar el token
          if (isSignedIn) {
            try {
              const token = await getToken({ skipCache: true });
              localStorage.setItem('clerk-auth-token', token);
              console.log('Token renovado correctamente');
            } catch (error) {
              console.error('Error al renovar el token:', error);
            }
          }
          
          // Invalidar todas las consultas activas para forzar su revalidación
          console.log('Revalidando datos...');
          await queryClient.invalidateQueries();
          
        } catch (error) {
          console.error('Error durante la reconexión:', error);
        } finally {
          reconnectingRef.current = false;
        }
      } else if (document.visibilityState === 'hidden') {
        // Cuando la página está oculta, pausar algunas operaciones
        console.log('Página en segundo plano');
      }
    };

    // Manejar eventos de conexión
    const handleOnline = () => {
      console.log('Conexión a internet restaurada');
      toast.success('Conexión restaurada');
      
      // Esperar un momento antes de revalidar para asegurar que la conexión es estable
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(async () => {
        if (!reconnectingRef.current) {
          reconnectingRef.current = true;
          try {
            const backendConnected = await checkBackendConnection();
            if (backendConnected) {
              await queryClient.invalidateQueries();
              console.log('Datos revalidados después de reconexión');
            }
          } catch (error) {
            console.error('Error al revalidar datos después de reconexión:', error);
          } finally {
            reconnectingRef.current = false;
          }
        }
      }, 2000);
    };

    const handleOffline = () => {
      console.log('Conexión a internet perdida');
    };

    // Configurar un ping periódico para mantener la conexión activa
    pingIntervalRef.current = setInterval(async () => {
      if (navigator.onLine && document.visibilityState === 'visible' && !reconnectingRef.current) {
        try {
          const backendConnected = await checkBackendConnection();
          if (!backendConnected) {
            console.log('Ping detectó pérdida de conexión, intentando reconectar...');
            await queryClient.invalidateQueries();
          }
        } catch (error) {
          console.error('Error durante ping periódico:', error);
        }
      }
    }, 3 * 60 * 1000); // Cada 3 minutos

    // Registrar listeners para eventos de visibilidad y conexión
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(reconnectTimeoutRef.current);
      clearInterval(pingIntervalRef.current);
    };
  }, [queryClient, isSignedIn, getToken]);

  // Este componente no renderiza nada, solo maneja la lógica
  return null;
};

export default GlobalDataManager;