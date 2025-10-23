import { Link } from "react-router-dom";
import Image from "./Image";
import { format } from "timeago.js";

const PostListItem = ({ post, isLarge = false }) => {
  // Formatear la fecha para mostrarla en formato "Octubre 19, 2024"
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
  };

  // Si es una tarjeta pequeña, usa un diseño horizontal
  if (!isLarge) {
    return (
      <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 h-full flex">
        {/* Imagen a la izquierda con marco decorativo */}
        {post.img && (
          <div className="w-1/3 overflow-hidden p-2">
            <div className="rounded-lg overflow-hidden border-4 border-gray-100 shadow-inner h-full">
            <Link to={`/post/${post.slug}`}>
                <Image 
                  src={post.img} 
                  className="w-full h-full object-cover" 
                  w="300"
                  alt={post.title}
                />
              </Link>
            </div>
          </div>
        )}
        
        {/* Contenido a la derecha */}
        <div className="p-4 flex flex-col justify-between w-2/3">
          {/* Metadatos */}
          <div className="flex items-center gap-2 text-xs text-teal-600 mb-2">
            <span className="inline-flex items-center">
              <i className="far fa-calendar-alt mr-1"></i>
              <span>{formatDate(post.createdAt)}</span>
            </span>
            <span className="mx-1">•</span>
            <span className="inline-flex items-center">
              <i className="far fa-user mr-1"></i>
              <span>By {post.user?.username || "admin"}</span>
            </span>
          </div>
          
          {/* Título */}
          <Link to={`/post/${post.slug}`}
            className="block text-lg font-semibold text-blue-800 hover:text-teal-600 transition-colors mb-2"
          >
            {post.title}
          </Link>
          
          {/* Botón de leer más */}
          <div className="mt-auto">
          <Link to={`/post/${post.slug}`}
              className="inline-flex items-center text-teal-600 hover:text-teal-800 text-sm font-medium"
            >
              Read More <i className="fas fa-arrow-right ml-1 text-xs"></i>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Para tarjetas grandes, mantenemos el diseño vertical
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 h-full">
      {/* Contenedor principal con flexbox */}
      <div className="flex flex-col h-full">
        {/* Imagen destacada con marco decorativo */}
        {post.img && (
          <div className="relative overflow-hidden p-3">
            <div className="rounded-lg overflow-hidden border-4 border-gray-100 shadow-inner h-64">
            <Link to={`/post/${post.slug}`}>
                <Image 
                  src={post.img} 
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" 
                  w="600"
                  alt={post.title}
                />
              </Link>
            </div>
          </div>
        )}
        
        {/* Contenido del artículo */}
        <div className="p-5 flex flex-col flex-grow">
          {/* Metadatos */}
          <div className="flex items-center gap-2 text-xs text-teal-600 mb-2">
            <span className="inline-flex items-center">
              <i className="far fa-calendar-alt mr-1"></i>
              <span>{formatDate(post.createdAt)}</span>
            </span>
            <span className="mx-1">•</span>
            <span className="inline-flex items-center">
              <i className="far fa-user mr-1"></i>
              <span>By {post.user?.username || "admin"}</span>
            </span>
          </div>
          
          {/* Título */}
          <Link to={`/post/${post.slug}`}
            className="block text-2xl font-semibold text-blue-800 hover:text-teal-600 transition-colors mb-3"
          >
            {post.title}
          </Link>
          
          {/* Botón de leer más */}
          <div className="mt-auto pt-3">
          <Link to={`/post/${post.slug}`}
              className="inline-flex items-center text-teal-600 hover:text-teal-800 text-sm font-medium"
            >
              Leer más <i className="fas fa-arrow-right ml-1 text-xs"></i>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostListItem;