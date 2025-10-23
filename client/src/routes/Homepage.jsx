import { Link } from "react-router-dom"
import MainCategories from "../components/MainCategories"
import FeaturedPosts from "../components/FeaturedPosts"
import HomePostList from "../components/HomePostList"
import Footer from "../components/Footer"
import ViewAllNewsButton from '../components/ViewAllNewsButton';
import { useState, useEffect } from "react"
import { useUser } from "@clerk/clerk-react"

const Homepage = () => {
  const { isSignedIn } = useUser();
  const [showCreateButton, setShowCreateButton] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  
  // Controlar la visibilidad del botón mientras se hace scroll
  useEffect(() => {
    const handleScroll = () => {
      // Siempre mostrar el botón, pero podríamos añadir lógica adicional si es necesario
      setShowCreateButton(true);
    }
    
    // Agregar el event listener
    window.addEventListener('scroll', handleScroll);
    
    // Limpiar el event listener
    return () => {
      window.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <div className='flex flex-col gap-4'>
      {/*INTRODUCTION*/}
      <div className="flex items-center justify-between">
    
      </div>
      {/*FEATURE POSTS - con fondo de pantalla completa*/}
      <div className="relative -mx-4 md:-mx-8 lg:-mx-16 xl:-mx-32 2xl:-mx-64 -mt-6 px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 py-12 bg-[#eff6ff]">
        <div className="shadow-lg rounded-lg overflow-hidden">
          <FeaturedPosts/>
        </div>
        {/* Efecto de sombra en la parte inferior */}
        <div className="absolute bottom-[-3px] left-0 right-0 h-1 shadow-inner-bottom"></div>
      </div>
      
      {/*CATEGORIES - cambiado de orden*/}
      <MainCategories/>
      
      {/*POST LIST*/}
      <div className="relative -mx-4 md:-mx-8 lg:-mx-16 xl:-mx-32 2xl:-mx-64 px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 py-8 bg-[#eff6ff]">
        {/* Efecto de sombra en la parte superior */}
        <div className="absolute top-[-5px] left-0 right-0 h-1 shadow-top-bottom"></div>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-800">Últimos blog y noticias</h1>
          <p className="text-gray-600 mt-2">Manténgase informado sobre temas importantes de salud infantil</p>
        </div>
        <HomePostList />
        
        {/* Después de mostrar algunos posts, añade el botón */}
        <div className="text-center">
          <ViewAllNewsButton />
        </div>
      </div>
      
      {/* Footer - Eliminado el margen superior y conectado directamente con la sección de posts */}
      <div className="-mx-4 md:-mx-8 lg:-mx-16 xl:-mx-32 2xl:-mx-64 -mt-4 bg-[#eff6ff]">
        <Footer />
      </div>
      
      {/* Botón flotante para crear artículos con el nuevo diseño */}
      {isSignedIn && showCreateButton && (
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
      
      {/* Estilos para la sombra interna en la parte inferior y animaciones */}
      <style jsx>{`
        .shadow-inner-bottom {
          box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .shadow-top-bottom {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
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
        .animate-slideUp {
          animation: slideUp 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}

export default Homepage