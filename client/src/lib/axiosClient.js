import axios from 'axios';
import { toast } from 'react-toastify';

// Crear una instancia de axios con la URL base
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000, // Tiempo de espera aumentado a 15 segundos
});

// Configuración para reintentos
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Interceptor para solicitudes
axiosClient.interceptors.request.use(
  (config) => {
    // Añadir token de autenticación si existe
    const token = localStorage.getItem('clerk-auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para respuestas
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Si no hay configuración de reintentos, inicializarla
    if (originalRequest && !originalRequest._retry) {
      originalRequest._retry = 0;
    }
    
    // Si es un error de red o 404/500 y no hemos excedido los reintentos
    if (
      originalRequest && 
      originalRequest._retry < MAX_RETRIES && 
      (error.message.includes('Network Error') || 
       (error.response && (error.response.status === 404 || error.response.status === 500 || error.response.status === 503)))
    ) {
      originalRequest._retry += 1;
      
      // Esperar antes de reintentar (con backoff exponencial)
      const delay = RETRY_DELAY_MS * (2 ** (originalRequest._retry - 1));
      console.log(`Reintentando solicitud (${originalRequest._retry}/${MAX_RETRIES}) después de ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Si es un error de autenticación, intentar renovar el token
      if (error.response && error.response.status === 401) {
        try {
          // Aquí podríamos implementar lógica para renovar el token si es necesario
          console.log('Intentando renovar token...');
          // Por ahora, simplemente continuamos con el reintento
        } catch (refreshError) {
          console.error('Error al renovar token:', refreshError);
          return Promise.reject(error);
        }
      }
      
      // Reintentar la solicitud
      return axiosClient(originalRequest);
    }
    
    // Si hemos agotado los reintentos o es otro tipo de error
    if (originalRequest && originalRequest._retry >= MAX_RETRIES) {
      console.error(`Se agotaron los reintentos (${MAX_RETRIES}) para la solicitud.`);
      // Comentamos los toast para que no se muestren errores de conexión
      // if (!originalRequest.silentError) {
      //   toast.error('Error de conexión. Por favor, verifica tu conexión a internet.');
      // }
    } else if (error.response) {
      // Errores con respuesta del servidor - solo mostrar errores críticos de autenticación
      if (error.response.status === 401 && !originalRequest.silentError) {
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      } else if (error.response.status === 403 && !originalRequest.silentError) {
        toast.error('No tienes permisos para realizar esta acción.');
      } 
      // Comentamos el mensaje genérico de error
      // else if (!originalRequest.silentError) {
      //   toast.error(error.response.data?.message || 'Ha ocurrido un error. Inténtalo de nuevo más tarde.');
      // }
    } 
    // Comentamos el mensaje de error de conexión
    // else if (!originalRequest?.silentError) {
    //   toast.error('Error de conexión. Por favor, verifica tu conexión a internet.');
    // }
    
    return Promise.reject(error);
  }
);

export default axiosClient;