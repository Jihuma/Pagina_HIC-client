import React, { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { Link } from "react-router-dom";
import InfiniteScroll from "react-infinite-scroll-component";
import { useSearchParams } from "react-router-dom";
import Image from "./Image";

// Modificar la función fetchPosts para incluir el parámetro de búsqueda
const fetchPosts = async (pageParam, category, filter, search) => {
  const params = { page: pageParam, limit: 9 };
  
  // Añadir categoría a los parámetros si existe
  if (category) {
    params.cat = category;
  }
  
  // Añadir filtro a los parámetros si existe
  if (filter) {
    params.filter = filter;
  }
  
  // Añadir término de búsqueda a los parámetros si existe
  if (search) {
    params.search = search;
  }
  
  const res = await axios.get(`${import.meta.env.VITE_API_URL}/posts`, {
    params: params,
  });
  return res.data;
};

const FullPostList = ({ onEndReached, selectedFilter }) => {
  const [searchParams] = useSearchParams();
  const category = searchParams.get("cat");
  const search = searchParams.get("search"); // Obtener el término de búsqueda de la URL
  
  // Estado para controlar si no hay resultados
  const [noResults, setNoResults] = useState(false);
  
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    status,
    refetch,
    isFetching,
  } = useInfiniteQuery({
    queryKey: ['fullPosts', category, selectedFilter, search], // Incluir search en la queryKey
    queryFn: ({ pageParam = 1 }) => fetchPosts(pageParam, category, selectedFilter, search),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => lastPage.hasMore ? pages.length + 1 : undefined,
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 3,
  });

  // Asegurar que los datos se carguen al montar el componente o cuando cambia la categoría, el filtro o la búsqueda
  useEffect(() => {
    if (!isFetching) {
      refetch();
    }
  }, [category, selectedFilter, search, refetch, isFetching]);
  
  // Verificar si hay resultados después de cargar
  useEffect(() => {
    if (data && data.pages && data.pages[0] && data.pages[0].posts.length === 0) {
      setNoResults(true);
    } else {
      setNoResults(false);
    }
  }, [data]);

  const allPosts = data?.pages?.flatMap((page) => page.posts) || [];

  if (status === "loading") return (
    <div className="flex justify-center items-center py-10">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
    </div>
  );

  // Modificar esta parte donde se maneja el error
  if (status === "error") {
  // Si tenemos datos en caché, mostrarlos aunque haya un error en la recarga
  if (allPosts && allPosts.length > 0) {
    // Solo registrar el error en la consola, sin mostrar nada al usuario
    console.error("Error al actualizar lista:", error);

  } else {
    // Solo mostrar página de error completa si no hay datos en absoluto
    // y no hay otra opción que mostrar algo al usuario
    return (
      <div className="text-center py-10">
        <i className="fas fa-exclamation-triangle text-3xl mb-3 text-gray-400"></i>
        <p className="text-gray-600">No se pudieron cargar los artículos en este momento.</p>
      </div>
    );
  }
}
  
  // Mostrar mensaje cuando no hay resultados
  if (noResults) {
    return (
      <div className="text-center py-10">
        <i className="fas fa-search text-3xl text-gray-400 mb-3"></i>
        <p className="text-gray-600">
          No se encontraron artículos
          {category ? ` en la categoría "${category}"` : ''}
          {search ? ` con el término "${search}"` : ''}.
        </p>
        {(category || search) && (
          <button 
            onClick={() => window.location.href = '/posts'} 
            className="mt-4 bg-blue-800 text-white px-4 py-2 rounded-md hover:bg-blue-900 transition-colors"
          >
            Ver todos los artículos
          </button>
        )}
      </div>
    );
  }

  // Formatear la fecha para mostrarla en formato "15 de mayo de 2023"
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
  };

  return (
    <div className="pt-6">
      <InfiniteScroll
        dataLength={allPosts.length}
        next={fetchNextPage}
        hasMore={!!hasNextPage}
        loader={
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500 mr-2"></div>
            <span className="text-gray-600">Cargando más artículos...</span>
          </div>
        }
        endMessage={
          <p className="text-center text-gray-500 py-4">
            <b>¡Has visto todos los artículos disponibles!</b>
          </p>
        }
        onScroll={() => {
          // Si no hay más páginas para cargar, activar el footer
          if (!hasNextPage && onEndReached && typeof onEndReached === 'function') {
            onEndReached();
          }
        }}
      >
        <div className="space-y-6">
          {allPosts.map((post) => (
            <div key={post._id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
              <div className="flex flex-col md:flex-row">
                {/* Imagen del artículo con marco */}
                {post.img && (
                  <div className="md:w-1/4 p-3">
                    <div className="overflow-hidden rounded-lg border-4 border-gray-100 shadow-inner h-48 md:h-full">
                    <Link to={`/post/${post.slug}`}>
                        <Image 
                          src={post.img} 
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" 
                          w="300"
                          alt={post.title}
                        />
                      </Link>
                    </div>
                  </div>
                )}
                
                {/* Contenido del artículo */}
                <div className={`p-6 flex flex-col justify-between ${post.img ? 'md:w-3/4' : 'w-full'}`}>
                  <div>
                    {/* Fecha y autor con color verde azulado */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-teal-600">
                        {formatDate(post.createdAt)}
                      </span>
                      {post.user && (
                        <>
                          <span className="text-gray-400 mx-1">•</span>
                          <span className="text-sm text-teal-600">
                            By {post.user.username || "admin"}
                          </span>
                        </>
                      )}
                    </div>
                    
                    {/* Título */}
                    <Link to={`/post/${post.slug}`}
                      className="block text-xl font-semibold text-blue-800 hover:text-blue-600 transition-colors mb-3"
                    >
                      {post.title}
                    </Link>
                    
                    {/* Descripción */}
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {post.desc?.replace(/<[^>]+>/g, "").slice(0, 150)}...
                    </p>
                  </div>
                  
                  {/* Botón de leer más */}
                  <div>
                  <Link to={`/post/${post.slug}`}
                      className="inline-flex items-center text-teal-600 hover:text-teal-800 font-medium"
                    >
                      Leer más <i className="fas fa-arrow-right ml-1 text-xs"></i>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </InfiniteScroll>
    </div>
  );
};

export default FullPostList;