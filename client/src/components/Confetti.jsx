import { useState } from 'react';
import ConfettiBoom from 'react-confetti-boom';

const Confetti = () => {
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const fire = (event) => {
    // Capturar la posición exacta del clic o usar el centro de la pantalla
    if (event && event.clientX && event.clientY) {
      setPosition({ x: event.clientX, y: event.clientY });
    } else {
      // Posición centro de la pantalla
      setPosition({ 
        x: window.innerWidth / 2, 
        y: window.innerHeight / 2 
      });
    }
    
    // Activar el confeti
    setIsActive(true);
    
    // Mostrar un mensaje en la consola para depuración
    console.log('Confeti activado en posición:', position);
    
    // Desactivar después de la animación (aumentado a 5 segundos para mayor visibilidad)
    setTimeout(() => {
      setIsActive(false);
      console.log('Confeti desactivado');
    }, 5000);
  };

  return {
    fire,
    component: isActive && (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        zIndex: 9999, 
        pointerEvents: 'none' 
      }}>
        <ConfettiBoom 
          particleCount={300} // Aumentado el número de partículas
          duration={5000} // Aumentado la duración
          colors={['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']} // Más colores
          originX={position.x} 
          originY={position.y} 
          spreadRadius={300} // Aumentado el radio de expansión
        />
      </div>
    )
  };
};

export default Confetti;