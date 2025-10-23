import PostListItem from "./PostListItem";
import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import InfiniteScroll from "react-infinite-scroll-component";
import { useEffect } from "react";

const fetchPosts = async (pageParam, limit = 3) => {
  const res = await axios.get(`${import.meta.env.VITE_API_URL}/posts`, {
    params: { page: pageParam, limit: limit },
  });
  return res.data;
};

const PostList = ({ limit, showPagination = true }) => {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    status,
    refetch,
    isFetching,
  } = useInfiniteQuery({
    queryKey: ['posts', limit],
    queryFn: ({ pageParam = 1 }) => fetchPosts(pageParam, limit),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => lastPage.hasMore && showPagination ? pages.length + 1 : undefined,
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 3,
  });

  // Asegurar que los datos se carguen al montar el componente
  useEffect(() => {
    if (!data && !isFetching) {
      refetch();
    }
  }, [data, isFetching, refetch]);

  let allPosts = data?.pages?.flatMap((page) => page.posts) || [];
  
  // Si hay un límite especificado, recortar la lista de posts
  if (limit && allPosts.length > limit) {
    allPosts = allPosts.slice(0, limit);
  }

  if (status === "loading") return (
    <div className="flex justify-center items-center py-10">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
    </div>
  );

  if (status === error) return (
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

  const postGroups = groupPosts(allPosts);

  return (
    <div className="my-8">
      {showPagination ? (
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
        >
          {postGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-12">
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
        </InfiniteScroll>
      ) : (
        <>
          {postGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-12">
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
        </>
      )}
    </div>
  );
};

export default PostList;