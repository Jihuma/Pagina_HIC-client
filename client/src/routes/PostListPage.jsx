import { useState, useEffect, useRef } from "react"
import { useSearchParams, Link } from "react-router-dom"
import FullPostList from "../components/FullPostList"
import SideMenu from "../components/SideMenu"
import { Helmet, HelmetProvider } from "react-helmet-async"
import { useUser } from "@clerk/clerk-react"
import Footer from "../components/Footer"

const PostListPage = () => {
  const [open, setOpen] = useState(false)
  const [searchParams] = useSearchParams()
  const category = searchParams.get("cat")
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [isScrolling, setIsScrolling] = useState(false)
  const { isSignedIn } = useUser();
  const [showFooter, setShowFooter] = useState(false);
  
  // Cerrar el menú lateral cuando cambia la categoría
  useEffect(() => {
    setOpen(false)
  }, [category])
  
  // Controlar la visibilidad del botón de scroll
  useEffect(() => {
    const handleScroll = () => {
      // Mostrar el botón cuando el usuario ha bajado más de 300px
      if (window.scrollY > 300) {
        setShowScrollButton(true)
      } else {
        setShowScrollButton(false)
      }
    }
    
    // Agregar el event listener
    window.addEventListener('scroll', handleScroll)
    
    // Limpiar el event listener
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])
  
  // Función para volver al inicio de la página con animación
  const scrollToTop = () => {
    setIsScrolling(true)
    
    // Obtener la posición actual del scroll
    const startPosition = window.pageYOffset
    const duration = 1000 // duración en ms
    const startTime = performance.now()
    
    // Función de animación
    const animateScroll = (currentTime) => {
      const elapsedTime = currentTime - startTime
      
      // Calcular la nueva posición usando una función de easing
      const easeInOutQuad = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      const position = startPosition - startPosition * easeInOutQuad(Math.min(elapsedTime / duration, 1))
      
      window.scrollTo(0, position)
      
      if (elapsedTime < duration) {
        requestAnimationFrame(animateScroll)
      } else {
        setIsScrolling(false)
      }
    }
    
    requestAnimationFrame(animateScroll)
  }
  
  // Título dinámico basado en la categoría
  const getPageTitle = () => {
    const category = searchParams.get("cat");
    const search = searchParams.get("search");
    if (search) {
      return `Resultados para "${search}"`;
    } else if (category) {
    // Convertir formato de URL a formato legible
    const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')
    return `Artículos de ${formattedCategory}`
  } else {
    return "Todos los artículos";
  }
  }

  // Función para manejar cuando se llega al final de los artículos
  const handleEndReached = () => {
    setShowFooter(true);
  };
  
  const [selectedFilter, setSelectedFilter] = useState('newest');
  
  // Función para manejar el cambio de filtro
  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
  };

  return (
    <HelmetProvider>
      <Helmet>
        <title>{getPageTitle()} | Hospital Infantil de Chihuahua</title>
        <meta name="description" content={`Explora nuestros artículos y noticias sobre ${category || 'salud infantil'} en el Hospital Infantil de Chihuahua.`} />
        <style>{`
          body {
            background-color: #eff8ff;
            margin: 0;
            padding: 0;
          }
        `}</style>
      </Helmet>
      
      <div className="flex flex-col min-h-screen">
        {/* Contenido principal con fondo extendido */}
        <div className="relative flex-grow -mx-4 md:-mx-8 lg:-mx-16 xl:-mx-32 2xl:-mx-64 px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 py-8 bg-[#eff6ff]">
          {/* Efecto de sombra en la parte superior */}
          <div className="absolute top-[-5px] left-0 right-0 h-1 shadow-top-bottom"></div>
          
          {/* Encabezado de la página */}
          <div className="mb-8 pt-8 mt-6">
            <h1 className="text-2xl md:text-3xl font-bold text-blue-800">{getPageTitle()}</h1>
            <p className="text-gray-600 mt-2">Mantente informado sobre temas importantes de salud infantil</p>
          </div>
          
          {/* Botón de filtro móvil */}
          <button 
            onClick={() => setOpen((prev) => !prev)} 
            className="bg-blue-800 text-sm text-white px-4 py-2 rounded-md md:hidden mb-4 flex items-center"
          >
            <i className={`fas ${open ? 'fa-times' : 'fa-filter'} mr-2`}></i>
            {open ? "Cerrar filtros" : "Filtrar o buscar"}
          </button>
          
          {/* Contenido principal y barra lateral */}
          <div className="flex flex-col-reverse gap-8 md:flex-row">
            {/* Lista de posts */}
            <div className="md:w-3/4">
              <div className="pt-6" id="post-list-container">
                <FullPostList onEndReached={handleEndReached} selectedFilter={selectedFilter} />
              </div>
            </div>
            
            {/* Barra lateral */}
            <div className={`md:w-1/4 ${open ? "block" : "hidden"} md:block`}>
              <SideMenu onFilterChange={handleFilterChange} />
            </div>
          </div>
        </div>
        
        {/* Botón flotante para crear artículos con el nuevo diseño - posicionado a la derecha */}
        {isSignedIn && (
          <div className="fixed bottom-6 right-6 z-50 animate-slideUp">
            <Link 
              to="/write"
            className="group relative flex items-center justify-center w-[50px] h-[50px] rounded-full bg-[#522c45] shadow-lg cursor-pointer transition-all duration-500 overflow-hidden hover:w-[140px] hover:rounded-[50px] hover:bg-[#64599a] hover:scale-105 hover:shadow-xl"
              aria-label="Crear artículo"
            >
              <svg 
                viewBox="0 0 24 24" 
                className="w-[20px] h-[20px] transition-all duration-500 group-hover:opacity-0 group-hover:scale-0 group-hover:rotate-90"
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M12 5v14m-7-7h14" 
                  stroke="white" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
              <span 
                className="absolute flex items-center justify-center w-full h-full text-white font-medium transition-all duration-500 text-[2px] opacity-0 group-hover:text-[18px] group-hover:opacity-100 group-hover:translate-y-0 font-['Comic_Sans_MS'] tracking-wide"
                style={{
                  fontFamily: "'Comic Sans MS', 'Bubblegum Sans', cursive",
                  textAlign: "center",
                  letterSpacing: "1px"
                }}
              >
                Crear
              </span>
            </Link>
          </div>
        )}
        
        {/* Botón de volver arriba con animación mejorada */}
        {showScrollButton && (
          <button 
            onClick={scrollToTop}
            disabled={isScrolling}
            className={`fixed bottom-6 left-6 z-50 bg-blue-700 hover:bg-blue-800 text-white rounded-lg w-10 h-10 flex items-center justify-center shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 group animate-slideUp ${isScrolling ? 'animate-pulse opacity-70' : ''}`}
            aria-label="Volver arriba"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-4 w-4 transition-transform duration-300 ${isScrolling ? 'animate-moveUp' : 'group-hover:-translate-y-1'}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2.5} 
                d="M5 15l7-7 7 7" 
              />
            </svg>
          </button>
        )}
        
        {/* Footer - Aparece cuando se llega al final de los artículos */}
        {showFooter && (
          <div className="-mx-4 md:-mx-8 lg:-mx-16 xl:-mx-32 2xl:-mx-64 mt-auto">
            <Footer />
          </div>
        )}
      </div>

      {/* Estilos para las animaciones y sombras */}
      <style jsx>{`
        @keyframes slideUp {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes moveUp {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-15px);
          }
        }
        
        .animate-slideUp {
          animation: slideUp 0.5s ease-out;
        }
        
        .animate-moveUp {
          animation: moveUp 1s ease-in-out infinite;
        }
        
        .shadow-inner-bottom {
          box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .shadow-top-bottom {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </HelmetProvider>
  )
}

export default PostListPage