import { Outlet, useLocation } from "react-router-dom"
import Navbar from "../components/Navbar"
import { useState, useEffect } from "react" 
import GlobalDataManager from "../components/GlobalDataManager" 

const MainLayout = () => {
  // Estado para detectar si se ha hecho scroll
  const [scrolled, setScrolled] = useState(false);
  // Obtener la ubicación actual para detectar cambios de ruta
  const location = useLocation();

  // Efecto para detectar el scroll y actualizar el estado
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      if (scrollPosition > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // Limpieza del evento al desmontar el componente
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Efecto para desplazar hacia arriba cuando cambia la ruta
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth' // Para un desplazamiento suave
    });
  }, [location.pathname]); // Se ejecuta cada vez que cambia la ruta

  return (
    <div className='min-h-screen bg-gray-50 font-sans'>
        {/* Incluir nuestro componente de reconexión global */}
        <GlobalDataManager />
        <Navbar/>
        <div 
          className={`relative px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 overflow-hidden transition-all duration-300 ${scrolled ? 'pt-16' : 'pt-24'}`}
        >
            <Outlet/>
        </div>
    </div>
  )
}

export default MainLayout