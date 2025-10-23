import { focusManager } from '@tanstack/react-query';

// Configurar un manejador de foco personalizado que sea más tolerante
export const setupCustomFocusManager = () => {
  // Variable para rastrear si estamos en un estado de error reciente
  let recentError = false;
  let errorTimeout = null;
  
  // Sobrescribir el comportamiento predeterminado de refetch en foco
  const originalOnFocus = focusManager.setFocused;
  
  focusManager.setFocused = (focused) => {
    // Si estamos en un estado de error reciente, retrasar la refetch
    if (recentError && focused === true) {
      console.log('Retrasando refetch debido a error reciente');
      // Esperar un poco más antes de intentar refetch
      setTimeout(() => {
        originalOnFocus(focused);
      }, 5000); // 5 segundos de retraso
      return;
    }
    
    // Comportamiento normal
    originalOnFocus(focused);
  };
  
  // Método para marcar un error reciente
  window.markQueryError = () => {
    recentError = true;
    
    // Limpiar el timeout anterior si existe
    if (errorTimeout) {
      clearTimeout(errorTimeout);
    }
    
    // Resetear después de un tiempo
    errorTimeout = setTimeout(() => {
      recentError = false;
    }, 30000); // 30 segundos
  };
};