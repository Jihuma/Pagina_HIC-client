import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import PostListItem from "./PostListItem";
import { Link } from "react-router-dom";

const fetchHomePosts = async () => {
  const res = await axios.get(`${import.meta.env.VITE_API_URL}/posts`, {
    params: { page: 1, limit: 6 },
  });
  return res.data;
};

const HomePostList = () => {
  const {
    data,
    error,
    status,
  } = useQuery({
    queryKey: ['homePosts'],
    queryFn: fetchHomePosts,
    staleTime: 1000 * 60, // Reducido a 1 minuto
    refetchOnWindowFocus: true, // Cambiado a true para actualizar al volver a la ventana
    refetchInterval: 1000 * 60 * 2, // Añadido: actualiza cada 2 minutos automáticamente
  });

  const posts = data?.posts || [];

  if (status === "loading") return (
    <div className="flex justify-center items-center py-10">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
    </div>
  );

  if (status === "error") return (
    <div className="text-center py-10 text-red-500">
      <i className="fas fa-exclamation-triangle text-3xl mb-3"></i>
      <p>Algo salió mal al cargar los artículos. Por favor, intenta de nuevo más tarde.</p>
    </div>
  );

  // Función para agrupar los posts en conjuntos de 3 (1 grande + 2 pequeños)
  const groupPosts = (posts) => {
    const groups = [];
    for (let i = 0; i < posts.length; i += 3) {
      const group = posts.slice(i, i + 3);
      if (group.length > 0) {
        groups.push(group);
      }
    }
    return groups;
  };

  const postGroups = groupPosts(posts);

  return (
    <div className="my-8">
      {postGroups.map((group, groupIndex) => (
        <div key={groupIndex} className="mb-4">
          {/* Alternamos el diseño basado en el índice del grupo */}
          {groupIndex % 2 === 0 ? (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Tarjeta grande (primer post del grupo) */}
              {group[0] && (
                <div className="lg:w-1/2">
                  <PostListItem post={group[0]} isLarge={true} />
                </div>
              )}
              
              {/* Contenedor para las dos tarjetas pequeñas */}
              <div className="lg:w-1/2 flex flex-col gap-6">
                {/* Primera tarjeta pequeña */}
                {group[1] && (
                  <PostListItem post={group[1]} isLarge={false} />
                )}
                
                {/* Segunda tarjeta pequeña */}
                {group[2] && (
                  <PostListItem post={group[2]} isLarge={false} />
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Contenedor para las dos tarjetas pequeñas (INVERTIDO) */}
              <div className="lg:w-1/2 flex flex-col gap-6">
                {/* Primera tarjeta pequeña */}
                {group[1] && (
                  <PostListItem post={group[1]} isLarge={false} />
                )}
                
                {/* Segunda tarjeta pequeña */}
                {group[2] && (
                  <PostListItem post={group[2]} isLarge={false} />
                )}
              </div>
              
              {/* Tarjeta grande (primer post del grupo) - INVERTIDO */}
              {group[0] && (
                <div className="lg:w-1/2">
                  <PostListItem post={group[0]} isLarge={true} />
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      
      {/* Botón para ver más noticias */}
      <div className="text-center mt-8">
      </div>
    </div>
  );
};

export default HomePostList;