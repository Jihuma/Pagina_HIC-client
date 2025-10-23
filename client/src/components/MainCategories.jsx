import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom"

// Componente PuzzleCard para crear tarjetas con forma de piezas de rompecabezas
const PuzzleCard = ({ children, pieceBg, pageBg, className, onClick, style }) => {
  // Determinar si se está usando un color personalizado
  const isCustomColor = style && style.backgroundColor;
  
  return (
    <div 
      className={`puzzle-piece relative ${pieceBg} rounded-lg p-6 shadow-md transition-all duration-300 ${className}`}
      onClick={onClick}
      style={style}
    >
      {/* Contenido de la tarjeta */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Pestañas de rompecabezas en los cuatro lados */}
      {isCustomColor ? (
        <>
          <div className="puzzle-tab puzzle-tab-top" style={{ backgroundColor: style.backgroundColor }}></div>
          <div className="puzzle-tab puzzle-tab-right" style={{ backgroundColor: "#f9fafb" }}></div>
          <div className="puzzle-tab puzzle-tab-bottom" style={{ backgroundColor: style.backgroundColor }}></div>
          <div className="puzzle-tab puzzle-tab-left" style={{ backgroundColor: "#f9fafb" }}></div>
        </>
      ) : (
        <>
          <div className={`puzzle-tab puzzle-tab-top ${pieceBg}`}></div>
          <div className="puzzle-tab puzzle-tab-right" style={{ backgroundColor: "#f9fafb" }}></div>
          <div className={`puzzle-tab puzzle-tab-bottom ${pieceBg}`}></div>
          <div className="puzzle-tab puzzle-tab-left" style={{ backgroundColor: "#f9fafb" }}></div>
        </>
      )}
    </div>
  );
};

const MainCategories = () => {
  const navigate = useNavigate();
  const [startIndex, setStartIndex] = useState(0); // Estado para controlar el índice inicial del carrusel
  const [slideDirection, setSlideDirection] = useState(null); // Estado para controlar la animación de deslizamiento
  const [isAnimating, setIsAnimating] = useState(false);
  const itemsToShow = 4; // Número de categorías a mostrar a la vez
  const [visibleCategories, setVisibleCategories] = useState([]); // Estado para controlar las categorías visibles

  // Añadir esta consulta para obtener las categorías
  const {
    data: categoriesData,
    error: categoriesError,
    status: categoriesStatus,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/categories`);
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Función para manejar el clic en una categoría
  const handleCategoryClick = (categoryLink) => {
    navigate(categoryLink);
    // Desplazar al inicio de la página
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Inicializar las categorías visibles al cargar el componente o cuando se cambian los datos
  useEffect(() => {
    if (categoriesData && categoriesData.length > 0) {
      updateVisibleCategories();
    }
  }, [startIndex, categoriesData]);

 
// Función para actualizar las categorías visibles basadas en el índice actual
const updateVisibleCategories = () => {
  if (!categoriesData || categoriesData.length === 0) return;
  
  const visible = [];
  for (let i = 0; i < itemsToShow; i++) {
    const index = (startIndex + i) % categoriesData.length;
    visible.push({
      ...categoriesData[index],
      position: i // Añadir posición para saber dónde renderizar
    });
  }
  setVisibleCategories(visible);
};

  // Función para navegar a la siguiente página de categorías con animación
  const handleNext = () => {
    if (isAnimating || !categoriesData || categoriesData.length <= itemsToShow) return;
    
    setIsAnimating(true);
    setSlideDirection('left');
    
    // Esperar a que termine la animación antes de cambiar el índice
    setTimeout(() => {
      setStartIndex((prevIndex) => (prevIndex + 1) % categoriesData.length);
      setIsAnimating(false);
      setSlideDirection(null);
    }, 300); // Duración reducida de la animación
  };

  // Función para navegar a la página anterior de categorías con animación
  const handlePrev = () => {
    if (isAnimating || !categoriesData || categoriesData.length <= itemsToShow) return;
    
    setIsAnimating(true);
    setSlideDirection('right');
    
    // Esperar a que termine la animación antes de cambiar el índice
    setTimeout(() => {
      setStartIndex((prevIndex) => (prevIndex - 1 + categoriesData.length) % categoriesData.length);
      setIsAnimating(false);
      setSlideDirection(null);
    }, 300); // Duración reducida de la animación
  };

  // Función para obtener la clase de animación según la dirección
  const getAnimationClass = () => {
    if (!slideDirection) return '';
    
    return slideDirection === 'left' ? 'animate-slide-left' : 'animate-slide-right';
  };

// Función para renderizar una categoría
const renderCategory = (category, index) => {
    // Mostrar mensaje de carga o error
    if (categoriesStatus === 'loading') {
      return (
        <div className="w-full py-12 bg-transparent text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-blue-800 mb-4">Temas de Salud</h2>
            <div className="p-10 rounded-xl shadow-xl bg-white bg-opacity-80">
              <p>Cargando categorías...</p>
            </div>
          </div>
        </div>
      );
    }
  
    if (categoriesError) {
      return (
        <div className="w-full py-12 bg-transparent text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-blue-800 mb-4">Temas de Salud</h2>
            <div className="p-10 rounded-xl shadow-xl bg-white bg-opacity-80">
              <p className="text-red-600">Error al cargar las categorías. Por favor, intente más tarde.</p>
            </div>
          </div>
        </div>
      );
    }
  
    if (!categoriesData || categoriesData.length === 0) {
      return (
        <div className="w-full py-12 bg-transparent text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-blue-800 mb-4">Temas de Salud</h2>
            <div className="p-10 rounded-xl shadow-xl bg-white bg-opacity-80">
              <p>No hay categorías disponibles en este momento.</p>
            </div>
          </div>
        </div>
      );
    }
  return (
    <div 
      key={`${category._id}-${index}`} 
      className={`block transform transition-transform hover:-translate-y-2 ${isAnimating ? getAnimationClass() : ''}`}
    >
      <PuzzleCard 
        pieceBg={category.color.startsWith('#') ? '' : category.color || "bg-[#375D9D] text-white"} 
        pageBg="bg-transparent"
        className={`h-full cursor-pointer`}
        onClick={() => handleCategoryClick(`/posts?cat=${category.slug}`)}
        style={category.color.startsWith('#') ? { backgroundColor: category.color, color: 'white' } : {}}
      >
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center icon-coin-flip">
            <i className={category.icon || "fas fa-folder"}></i>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-center mb-2">{category.name}</h3>
        
        <p className="text-sm text-center opacity-90">{category.description || "Artículos sobre " + category.name}</p>
      </PuzzleCard>
    </div>
  );
};

  return (
    <div className="relative w-full py-12 bg-transparent">
      {/* Fondo de imagen que cubre toda la sección */}
      <div className="absolute inset-0 bg-image-section z-0"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Título de la sección */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-blue-800">Temas de Salud</h2>
        </div>

        {/* Contenedor del carrusel */}
        <div className="relative">
          {/* Botón de navegación izquierdo */}
          <button 
            onClick={handlePrev}
            disabled={isAnimating || !categoriesData || categoriesData.length <= itemsToShow}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 z-20 bg-transparent backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-white hover:bg-opacity-20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed" 
            aria-label="Previous categories"
          >
            <i className="fas fa-chevron-left text-black"></i>
          </button>

          {/* Cuadrícula de categorías con animación */}
          <div className="overflow-hidden bg-[#f9fafb] backdrop-blur-sm p-10 rounded-xl shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 relative">
              {visibleCategories.map((category, index) => renderCategory(category, index))}
            </div>
          </div>

          {/* Botón de navegación derecho */}
          <button 
            onClick={handleNext}
            disabled={isAnimating || !categoriesData || categoriesData.length <= itemsToShow}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 z-20 bg-transparent backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-white hover:bg-opacity-20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next categories"
          >
            <i className="fas fa-chevron-right text-black"></i>
          </button>

          {/* Contenedor del carrusel */}
        </div>
      </div>
      
      {/* Estilos CSS para las piezas de rompecabezas, animaciones y fondo */}
      <style jsx>{`
        .bg-image-section {
          background-image: url('/manchasRedondas.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          opacity: 1;
          width: 100vw;
          left: 50%;
          right: 50%;
          margin-left: -50vw;
          margin-right: -50vw;
          position: absolute;
          top: -16px;
          bottom: -16px;
        }
        
        .text-shadow-lg {
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }
        
        .puzzle-piece {
          position: relative;
          overflow: visible;
        }
        
        .puzzle-tab {
          position: absolute;
          z-index: 5;
        }
        
        .puzzle-tab-darker {
          filter: brightness(0.85);
          box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.3);
        }
        
        .puzzle-tab-top {
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          width: 24px;
          height: 24px;
          border-radius: 50%;
        }
        
        .puzzle-tab-right {
          right: -12px;
          top: 50%;
          transform: translateY(-50%);
          width: 24px;
          height: 24px;
          border-radius: 50%;
        }
        
        .puzzle-tab-bottom {
          bottom: -12px;
          left: 50%;
          transform: translateX(-50%);
          width: 24px;
          height: 24px;
          border-radius: 50%;
        }
        
        .puzzle-tab-left {
          left: -12px;
          top: 50%;
          transform: translateY(-50%);
          width: 24px;
          height: 24px;
          border-radius: 50%;
        }
        
        /* Animación de moneda para los iconos */
        .icon-coin-flip {
          transition: transform 0.6s;
          transform-style: preserve-3d;
        }
        
        .puzzle-piece:hover .icon-coin-flip {
          transform: rotateY(180deg);
          animation: coinFlip 1.5s infinite;
        }
        
        @keyframes coinFlip {
          0% {
            transform: rotateY(0);
          }
          50% {
            transform: rotateY(180deg);
          }
          100% {
            transform: rotateY(360deg);
          }
        }
        
        /* Animaciones de deslizamiento simplificadas */
        @keyframes slideLeft {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        
        @keyframes slideRight {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .animate-slide-left {
          animation: slideLeft 300ms ease-in-out forwards;
        }
        
        .animate-slide-right {
          animation: slideRight 300ms ease-in-out forwards;
        }
      `}</style>
    </div>
  );
};

export default MainCategories;
