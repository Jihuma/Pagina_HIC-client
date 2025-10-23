import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

// Función para obtener los posts destacados
const fetchFeaturedPosts = async () => {
  const res = await axios.get(`${import.meta.env.VITE_API_URL}/posts`, {
    params: { isFeatured: true, limit: 3 },  // Cambiado de 5 a 3
  });
  return res.data;
};

const FeaturedPosts = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  
  // Obtener los posts destacados desde la API
  const {
    data,
    error,
    status,
  } = useQuery({
    queryKey: ['featuredPosts'],
    queryFn: fetchFeaturedPosts,
    staleTime: 0, // Cambiar a 0 para que siempre considere los datos como obsoletos
    refetchOnWindowFocus: true, // Recargar cuando la ventana recupera el foco
    refetchInterval: 10000, // Recargar cada 10 segundos
  });

  // Preparar los slides basados en los posts destacados
  const slides = data?.posts && data.posts.length > 0 
    ? data.posts.map(post => ({
        id: post._id,
        slug: post.slug,
        title: post.title,
        description: post.desc || 'Leer más sobre este artículo destacado',
        imageUrl: post.img || 'https://via.placeholder.com/1200x600?text=Imagen+no+disponible',
      }))
    : [];

  // Cambiar automáticamente las diapositivas cada 5 segundos si hay slides disponibles
  useEffect(() => {
    if (slides.length === 0) return;
    
    const interval = setInterval(() => {
      setActiveSlide((prevSlide) => (prevSlide + 1) % slides.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [slides.length]);

  // Función para cambiar manualmente la diapositiva
  const handleSlideChange = (index) => {
    setActiveSlide(index);
  };

  // Función para avanzar a la siguiente diapositiva al hacer clic en la imagen
  const handleImageClick = () => {
    if (slides.length === 0) return;
    setActiveSlide((prevSlide) => (prevSlide + 1) % slides.length);
  };

  // Mostrar mensaje de carga o error
  if (status === 'pending') {
    return (
      <div className="relative rounded-lg overflow-hidden shadow-md bg-gray-100 h-[400px] md:h-[500px] flex items-center justify-center">
        <div className="text-gray-600 text-xl">Cargando posts destacados...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative rounded-lg overflow-hidden shadow-md bg-gray-100 h-[400px] md:h-[500px] flex items-center justify-center">
        <div className="text-red-600 text-xl">Error al cargar los posts destacados</div>
      </div>
    );
  }

  // Si no hay posts destacados, mostrar un mensaje
  if (slides.length === 0) {
    return (
      <div className="relative rounded-lg overflow-hidden shadow-md bg-gray-100 h-[400px] md:h-[500px] flex items-center justify-center">
        <div className="text-gray-600 text-xl">No hay posts destacados disponibles</div>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden shadow-md">
      {/* Carrusel */}
      <div className="relative h-[400px] md:h-[500px] overflow-hidden cursor-pointer" onClick={handleImageClick}>
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === activeSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <div className="relative h-full">
              {/* Imagen de fondo */}
              <img
                src={slide.imageUrl}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              
              {/* Overlay con gradiente */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-900/70 to-transparent"></div>
              
              {/* Contenido de texto */}
              <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-16 text-white max-w-2xl">
                <h2 className="text-2xl md:text-4xl font-bold mb-4">{slide.title}</h2>
                <p className="text-sm md:text-base mb-6">{slide.description}</p>
                <Link 
                  to={`/post/${slide.slug}`} 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md inline-block w-fit"
                  onClick={(e) => e.stopPropagation()} // Evita que el clic en el botón active el cambio de diapositiva
                >
                  Leer Más
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Indicadores de diapositivas */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              handleSlideChange(index);
            }}
            className={`w-3 h-3 rounded-full transition-all ${
              index === activeSlide ? 'bg-blue-600 w-6' : 'bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default FeaturedPosts;