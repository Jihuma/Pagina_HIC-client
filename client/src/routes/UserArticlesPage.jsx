// Añadir estas importaciones si no existen
import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";
import InfiniteScroll from "react-infinite-scroll-component";
import Image from "../components/Image";
import { toast } from "react-toastify";
import { Helmet, HelmetProvider } from "react-helmet-async";
import Footer from "../components/Footer";
import Confetti from "../components/Confetti";
import FeaturedLimitModal from "../components/FeaturedLimitModal";

// Función para obtener los artículos del usuario


// Modificar la función fetchUserPosts para manejar errores
const fetchUserPosts = async (pageParam, token) => {
  try {
    // Añadir un tiempo de espera más largo para dar tiempo a que el servidor responda
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/user-posts`, {
      params: { page: pageParam, limit: 10 },
      headers: {
        Authorization: `Bearer ${token}`
      },
      timeout: 10000 // Aumentar el tiempo de espera a 10 segundos
    });
    return res.data;
  } catch (error) {
    console.error("Error en fetchUserPosts:", error);
    // Si el error es 404, podría ser un problema temporal
    if (error.response && error.response.status === 404) {
      console.log("Intentando recuperarse de error 404...");
      // toast.error("No se pudo conectar con el servidor. Intentando nuevamente...");
      // Retornar datos vacíos para evitar errores en la UI
      return { posts: [], hasMore: false, totalPosts: 0, page: pageParam };
    }
    throw error;
  }
};

// Función para obtener los formularios de contacto
const fetchContactForms = async (pageParam, token, status) => {
  const params = { page: pageParam, limit: 10 };
  
  // Añadir el parámetro de estado solo si no es "all"
  if (status && status !== "all") {
    params.status = status;
  }
  
  const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/contact-forms`, {
    params,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return res.data;
};

// Añadir función para obtener todos los artículos (solo para administradores)
const fetchAllUserPosts = async (pageParam, token) => {
  try {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/user-posts/all`, {
      params: { page: pageParam, limit: 10 },
      headers: {
        Authorization: `Bearer ${token}`
      },
      timeout: 10000 // Aumentar el tiempo de espera a 10 segundos
    });
    return res.data;
  } catch (error) {
    console.error("Error en fetchAllUserPosts:", error);
    if (error.response && error.response.status === 403) {
      toast.error("No tienes permisos para ver todos los artículos");
    } else if (error.response && error.response.status === 404) {
      console.log("Intentando recuperarse de error 404...");
      // toast.error("No se pudo conectar con el servidor. Intentando nuevamente...");
      // Retornar datos vacíos para evitar errores en la UI
      return { posts: [], hasMore: false, totalPosts: 0, page: pageParam };
    }
    throw error;
  }
};

const UserArticlesPage = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [token, setToken] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // Añadir esta variable de estado para el nuevo tab
  const [activeTab, setActiveTab] = useState("articles"); // Mantener "articles" como pestaña por defecto
  const [selectedStatus, setSelectedStatus] = useState("all"); // Añadir esta línea
  // Añadir estado para verificar si el usuario es administrador
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Añadir estos estados para el modal de eliminación de categorías
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [expandedForm, setExpandedForm] = useState(null);
  const [showFeaturedLimitModal, setShowFeaturedLimitModal] = useState(false);
  
  // Inicializar el confeti
  const confetti = Confetti();
  
  // Añadir estos estados para el manejo de categorías
  const [newCategory, setNewCategory] = useState({
    name: "",
    icon: "fas fa-folder",
    color: "bg-blue-600 text-white",
    hoverColor: "hover:bg-blue-700"
  });
  const [iconOptions] = useState([
    "fas fa-folder", "fas fa-child", "fas fa-syringe", "fas fa-apple-alt", 
    "fas fa-shield-alt", "fas fa-calendar-alt", "fas fa-heartbeat", "fas fa-brain",
    "fas fa-stethoscope", "fas fa-hospital", "fas fa-pills", "fas fa-book-medical",
    "fas fa-baby", "fas fa-graduation-cap", "fas fa-tooth", "fas fa-lungs",
    "fas fa-running", "fas fa-walking", "fas fa-wheelchair", "fas fa-procedures",
    "fas fa-notes-medical", "fas fa-microscope", "fas fa-dna", "fas fa-allergies",
    "fas fa-eye", "fas fa-bone", "fas fa-user-md", "fas fa-heart",
    "fas fa-band-aid", "fas fa-weight", "fas fa-virus"
  ]);
  const [colorOptions] = useState([
    { bg: "bg-blue-600 text-white", hover: "hover:bg-blue-700", text: "Azul", hex: "#2563eb" },
    { bg: "bg-red-600 text-white", hover: "hover:bg-red-700", text: "Rojo", hex: "#dc2626" },
    { bg: "bg-green-600 text-white", hover: "hover:bg-green-700", text: "Verde", hex: "#16a34a" },
    { bg: "bg-yellow-500 text-white", hover: "hover:bg-yellow-600", text: "Amarillo", hex: "#eab308" },
    { bg: "bg-purple-600 text-white", hover: "hover:bg-purple-700", text: "Morado", hex: "#9333ea" },
    { bg: "bg-pink-500 text-white", hover: "hover:bg-pink-600", text: "Rosa", hex: "#ec4899" },
    { bg: "bg-indigo-600 text-white", hover: "hover:bg-indigo-700", text: "Índigo", hex: "#4f46e5" },
    { bg: "bg-gray-700 text-white", hover: "hover:bg-gray-800", text: "Gris", hex: "#374151" },
    { bg: "bg-orange-500 text-white", hover: "hover:bg-orange-600", text: "Naranja", hex: "#f97316" },
    { bg: "bg-teal-500 text-white", hover: "hover:bg-teal-600", text: "Turquesa", hex: "#14b8a6" },
    { bg: "bg-cyan-600 text-white", hover: "hover:bg-cyan-700", text: "Cian", hex: "#0891b2" },
    { bg: "bg-lime-500 text-white", hover: "hover:bg-lime-600", text: "Lima", hex: "#84cc16" },
    { bg: "bg-amber-500 text-white", hover: "hover:bg-amber-600", text: "Ámbar", hex: "#f59e0b" },
    { bg: "bg-emerald-500 text-white", hover: "hover:bg-emerald-600", text: "Esmeralda", hex: "#10b981" },
    { bg: "bg-violet-600 text-white", hover: "hover:bg-violet-700", text: "Violeta", hex: "#7c3aed" },
    { bg: "bg-fuchsia-600 text-white", hover: "hover:bg-fuchsia-700", text: "Fucsia", hex: "#c026d3" },
  ]);
  
  // Añadir estado para el color personalizado
  const [customColor, setCustomColor] = useState("#000000");
  const [useCustomColor, setUseCustomColor] = useState(false);
  
  // Añadir esta consulta para obtener las categorías
  const {
    data: categoriesData,
    error: categoriesError,
    status: categoriesStatus,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/categories`);
      return res.data;
    },
    enabled: activeTab === "categories",
  });
  
  // Constante para el número máximo de reintentos
  const MAX_RETRIES = 3;

  // Añadir esta mutación para crear categorías
  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData) => {
      let retries = 0;
      while (retries < MAX_RETRIES) {
        try {
          // Verificar si el token sigue siendo válido
          const currentToken = await getToken();
          
          const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/categories`, categoryData, {
            headers: {
              Authorization: `Bearer ${currentToken}`
            }
          });
          return response.data;
        } catch (error) {
          retries++;
          if (retries >= MAX_RETRIES) throw error;
          
          // Esperar un momento antes de reintentar
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Si es un error de autenticación, intentar renovar el token
          if (error.response?.status === 401) {
            try {
              await getToken({ skipCache: true });
            } catch (e) {
              console.error("Error renovando token:", e);
            }
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success("Categoría creada correctamente");
      setNewCategory({
        name: "",
        icon: "fas fa-folder",
        color: "bg-blue-600 text-white",
        hoverColor: "hover:bg-blue-700"
      });
    },
    onError: (error) => {
      console.error("Error al crear categoría:", error);
      toast.error(error.response?.data?.message || "Error al crear la categoría");
    }
  });
  
  // Modificar esta mutación para eliminar categorías
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId) => {
      return axios.delete(`${import.meta.env.VITE_API_URL}/api/categories/${categoryId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success("Categoría eliminada correctamente");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Error al eliminar la categoría");
    }
  });
  
  // Añadir esta función para manejar la creación de categorías
  const handleCreateCategory = (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) {
      toast.error("El nombre de la categoría es obligatorio");
      return;
    }
    createCategoryMutation.mutate(newCategory);
  };
  
  // Modificar esta función para manejar la eliminación de categorías
  const handleDeleteCategory = (category) => {
    setCategoryToDelete(category);
    setShowDeleteCategoryModal(true);
  };
  
  // Añadir esta función para confirmar la eliminación de categorías
  const confirmDeleteCategory = () => {
    if (categoryToDelete) {
      setIsDeletingCategory(true);
      deleteCategoryMutation.mutate(categoryToDelete._id, {
        onSuccess: () => {
          setShowDeleteCategoryModal(false);
          setIsDeletingCategory(false);
        },
        onError: () => {
          setIsDeletingCategory(false);
        }
      });
    }
  };
  
  // Obtener el token de autenticación
  useEffect(() => {
    const fetchToken = async () => {
      if (isSignedIn) {
        const token = await getToken();
        setToken(token);
      }
    };
    fetchToken();
  }, [isSignedIn, getToken]);

    // Verificar si el usuario es administrador
    useEffect(() => {
      if (isLoaded && isSignedIn && user) {
        // Verificar si el usuario tiene el rol de administrador en sus metadatos públicos
        const userRole = user.publicMetadata?.role;
        setIsAdmin(userRole === "admin");
      }
    }, [isLoaded, isSignedIn, user]);
    
  // Efecto para mostrar el confeti si se llega desde la página de publicación
  useEffect(() => {
    if (location.state?.showConfetti) {
      // Mostrar el confeti en el centro de la pantalla
      console.log('Mostrando confeti en UserArticlesPage');
      confetti.fire();
      // Limpiar el estado para que no se muestre de nuevo al recargar
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, confetti, navigate]);

  // Añadir esta mutación después de las otras mutaciones existentes
const featureMutation = useMutation({
  mutationFn: async (postId) => {
    const token = await getToken();
    return axios.patch(
      `${import.meta.env.VITE_API_URL}/posts/feature`,
      {
        postId: postId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },
  onSuccess: () => {
    // Invalidar las consultas para actualizar los datos
    queryClient.invalidateQueries({ queryKey: ["userPosts"] });
    queryClient.invalidateQueries({ queryKey: ["allUserPosts"] });
    queryClient.invalidateQueries({ queryKey: ["featuredPosts"] });
    toast.success("Estado destacado actualizado correctamente");
  },
  onError: (error) => {
    // Si el error es porque ya hay 3 posts destacados, mostrar el modal
    if (error.response?.status === 400) {
      setShowFeaturedLimitModal(true);
    } else {
      toast.error(error.response?.data?.message || "Error al actualizar estado destacado");
    }
  },
});

// Función para manejar el destacado de posts
const handleFeature = (postId) => {
  featureMutation.mutate(postId);
};

// 1. Primero definimos todas las consultas
const {
  data: articlesData,
  error: articlesError,
  fetchNextPage: fetchNextArticlesPage,
  hasNextPage: hasNextArticlesPage,
  status: articlesStatus,
  refetch: refetchArticles,
  isFetching: isArticlesFetching,
} = useInfiniteQuery({
  queryKey: ['userPosts'],
  queryFn: async ({ pageParam = 1 }) => {
    if (!token) return { posts: [], hasMore: false, totalPosts: 0, page: 1 };
    return fetchUserPosts(pageParam, token);
  },
  initialPageParam: 1,
  getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined,
  enabled: !!token && activeTab === "articles",
  staleTime: 1000 * 60 * 2, // Reducir a 2 minutos para refrescar más frecuentemente
  retry: 3, // Intentar 3 veces si falla
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Espera exponencial
});

// 2. Consulta para obtener todos los artículos (solo para administradores)
const {
  data: allArticlesData,
  error: allArticlesError,
  fetchNextPage: fetchNextAllArticlesPage,
  hasNextPage: hasNextAllArticlesPage,
  status: allArticlesStatus,
  isFetchingNextPage: isAllArticlesFetchingNextPage,
  refetch: refetchAllArticles,
} = useInfiniteQuery({
  queryKey: ['allUserPosts'],
  queryFn: async ({ pageParam = 1 }) => {
    if (!token) return { posts: [], hasMore: false, totalPosts: 0, page: 1 };
    return fetchAllUserPosts(pageParam, token);
  },
  initialPageParam: 1,
  getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined,
  enabled: !!token && isAdmin && activeTab === "allArticles",
  staleTime: 1000 * 60 * 2, 
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});

// Procesar los datos de todos los artículos
const allUserPosts = allArticlesData?.pages.flatMap(page => page.posts) || [];
const totalAllPosts = allArticlesData?.pages[0]?.totalPosts || 0;

// 3. Consulta para formularios
const {
  data: formsData,
  error: formsError,
  fetchNextPage: fetchNextFormsPage,
  hasNextPage: hasNextFormsPage,
  status: formsStatus,
  isFetchingNextPage: isFormsFetchingNextPage,
  refetch: refetchForms, // Extraer correctamente la función refetch
} = useInfiniteQuery({
  queryKey: ['contactForms', selectedStatus],
  queryFn: async ({ pageParam = 1 }) => {
    if (!token) return { forms: [], hasMore: false, totalForms: 0, page: 1 };
    return fetchContactForms(pageParam, token, selectedStatus);
  },
  initialPageParam: 1,
  getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined,
  enabled: !!token && activeTab === "forms",
  refetchInterval: activeTab === "forms" ? 10000 : false,  // Refrescar cada 10 segundos cuando la pestaña está activa
  staleTime: 5000,  // Considerar los datos obsoletos después de 5 segundos
});

// 4. Ahora que todas las funciones refetch están definidas, podemos usarlas en los efectos
useEffect(() => {
  if (token && activeTab === "articles") {
    refetchArticles();
  }
}, [token, activeTab, refetchArticles]);

useEffect(() => {
  if (token && activeTab === "forms") {
    refetchForms();
  }
}, [token, activeTab, refetchForms]);

// 5. Efecto para manejar cambios de visibilidad
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      console.log("Página visible de nuevo, refrescando datos...");
      // Refrescar token y datos cuando la página vuelve a estar visible
      const refreshData = async () => {
        try {
          // Intentar renovar el token
          if (isSignedIn) {
            const newToken = await getToken({ skipCache: true });
            setToken(newToken);
          }
          
          // Invalidar todas las consultas relevantes
          queryClient.invalidateQueries({ queryKey: ['categories'] });
          queryClient.invalidateQueries({ queryKey: ['userPosts'] });
          queryClient.invalidateQueries({ queryKey: ['allUserPosts'] });
          queryClient.invalidateQueries({ queryKey: ['contactForms'] });
          
          // Refrescar datos según la pestaña activa
          if (activeTab === "articles") {
            refetchArticles();
          } else if (activeTab === "forms") {
            refetchForms();
          } else if (activeTab === "allArticles" && isAdmin) {
            refetchAllArticles();
          }
        } catch (error) {
          console.error("Error al refrescar datos:", error);
        }
      };
      
      refreshData();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, [queryClient, isSignedIn, getToken, activeTab, refetchArticles, refetchForms, refetchAllArticles, isAdmin]);

// Mutación para eliminar un artículo
  const deleteMutation = useMutation({
    mutationFn: async (postId) => {
      return axios.delete(`${import.meta.env.VITE_API_URL}/api/user-posts/${postId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      queryClient.invalidateQueries({ queryKey: ['allUserPosts'] }); 
      toast.success("Artículo eliminado correctamente");
      setShowDeleteModal(false);
      setIsDeleting(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Error al eliminar el artículo");
      setIsDeleting(false);
    }
  });

  // Mutación para eliminar un formulario
  const deleteFormMutation = useMutation({
    mutationFn: async (formId) => {
      return axios.delete(`${import.meta.env.VITE_API_URL}/api/contact-forms/${formId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactForms'] });
      toast.success("Formulario eliminado correctamente");
      setShowDeleteFormModal(false);
      setIsDeletingForm(false);
    },
    onError: (error) => {
      console.error("Error al eliminar formulario:", error);
      toast.error("Error al eliminar el formulario");
      setIsDeletingForm(false);
    }
  });

  // Mutación para actualizar el estado de un formulario
  const updateStatusMutation = useMutation({
    mutationFn: async ({ formId, status }) => {
      return axios.patch(`${import.meta.env.VITE_API_URL}/api/contact-forms/${formId}/status`, 
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactForms'] });
      toast.success("Estado actualizado correctamente");
    },
    onError: (error) => {
      console.error("Error al actualizar estado:", error);
      toast.error("Error al actualizar el estado");
    }
  });

  // Manejar la eliminación de un artículo
  const handleDeleteClick = (post) => {
    setPostToDelete(post);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (postToDelete) {
      setIsDeleting(true);
      deleteMutation.mutate(postToDelete._id);
    }
  };

  // Añadir estos estados para el modal de eliminación de formularios
  const [showDeleteFormModal, setShowDeleteFormModal] = useState(false);
  const [formToDelete, setFormToDelete] = useState(null);
  const [isDeletingForm, setIsDeletingForm] = useState(false);

  // Manejar la eliminación de un formulario
  const handleDeleteForm = (formId, parentName, parentSurname) => {
    setFormToDelete({ id: formId, name: `${parentName} ${parentSurname}` });
    setShowDeleteFormModal(true);
  };
  
  // Añadir función para confirmar eliminación
  const confirmDeleteForm = () => {
    if (formToDelete) {
      setIsDeletingForm(true);
      deleteFormMutation.mutate(formToDelete.id);
    }
  };

  // Función para manejar la expansión/colapso de los motivos de consulta
  const toggleFormExpand = (formId) => {
    setExpandedForm(prev => prev === formId ? null : formId);
  };

  // Manejar el cambio de estado de un formulario
  const handleStatusChange = (formId, newStatus) => {
    updateStatusMutation.mutate({ formId, status: newStatus });
  };

  // Formatear la fecha para mostrarla en formato "Octubre 19, 2024"
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
  };

  // Si el usuario no está autenticado, redirigir a la página de inicio de sesión
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate("/login");
    }
  }, [isLoaded, isSignedIn, navigate]);

  // Mostrar un spinner mientras se carga la información del usuario
  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Si el usuario no está autenticado, mostrar un mensaje
  if (isLoaded && !isSignedIn) {
    return (
      <div className="text-center py-20 text-red-500">
        <i className="fas fa-exclamation-triangle text-3xl mb-3"></i>
        <p>Debes iniciar sesión para ver tus artículos.</p>
      </div>
    );
  }

  const allPosts = articlesData?.pages?.flatMap((page) => page.posts) || [];
  const totalPosts = articlesData?.pages?.[0]?.totalPosts || 0;
  const allForms = formsData?.pages?.flatMap((page) => page.forms) || [];

  return (
    <HelmetProvider>
      <div className="flex flex-col min-h-screen">
        {/* Renderizar el componente de confeti */}
        {confetti.component}
        <Helmet>
          <title>Mi Panel | Administración</title>
          <meta name="description" content="Administra tus artículos y formularios de contacto" />
        </Helmet>

        {/* Contenido principal */}
        <div className="relative flex-grow -mx-4 md:-mx-8 lg:-mx-16 xl:-mx-32 2xl:-mx-64 px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 py-8 bg-[#eff6ff]">
          {/* Sombra superior */}
          <div className="absolute top-[-5px] left-0 right-0 h-1 shadow-top-bottom"></div>

          {/* Contenedor centrado */}
          <div className="max-w-6xl mx-auto">
            {/* Encabezado de la página */}
            <div className="mb-8 mt-6 pt-8 text-center">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Mi Panel</h1>
              <div className="text-sm text-gray-600 mb-6">
                Administra tus artículos y formularios de contacto
              </div>
              
              {/* Botón para crear nuevo artículo */}
              <div className="mb-6">
                <Link 
                  to="/write" 
                  className="inline-flex items-center px-6 py-3 bg-[#522c45] hover:bg-[#64599a] text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    className="w-5 h-5 mr-2"
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
                  Crear nuevo artículo
                </Link>
              </div>
              
              {/* Pestañas de navegación */}
              <div className="flex justify-center mb-8">
                <div className="bg-white rounded-lg shadow-sm p-1 inline-flex flex-wrap">
                  <button 
                    onClick={() => setActiveTab("articles")}
                    className={`px-6 py-3 rounded-md transition-colors ${activeTab === "articles" ? "bg-blue-800 text-white" : "text-gray-700 hover:bg-gray-100"}`}
                  >
                    <i className="fas fa-file-alt mr-2"></i>
                    Mis Artículos
                  </button>
                  {isAdmin && (
                    <>
                      <button 
                        onClick={() => setActiveTab("allArticles")}
                        className={`px-6 py-3 rounded-md transition-colors ${activeTab === "allArticles" ? "bg-blue-800 text-white" : "text-gray-700 hover:bg-gray-100"}`}
                      >
                        <i className="fas fa-globe mr-2"></i>
                        Todos los Artículos
                      </button>
                      <button 
                        onClick={() => setActiveTab("forms")}
                        className={`px-6 py-3 rounded-md transition-colors ${activeTab === "forms" ? "bg-blue-800 text-white" : "text-gray-700 hover:bg-gray-100"}`}
                      >
                        <i className="fas fa-envelope mr-2"></i>
                        Formularios de Contacto
                      </button>
                      <button 
                        onClick={() => setActiveTab("categories")}
                        className={`px-6 py-3 rounded-md transition-colors ${activeTab === "categories" ? "bg-blue-800 text-white" : "text-gray-700 hover:bg-gray-100"}`}
                      >
                        <i className="fas fa-tags mr-2"></i>
                        Categorías
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Contenido de la pestaña de Artículos */}
            {activeTab === "articles" && (
              <>
                {/* Estadísticas */}
                <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Resumen</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <div className="text-3xl font-bold text-blue-800">{totalPosts}</div>
                      <div className="text-sm text-gray-600">Total de Artículos</div>
                    </div>
                    {/* Aquí podrían ir más estadísticas en el futuro */}
                  </div>
                </div>

                {/* Lista de artículos */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="text-xl font-bold text-gray-800 mb-6">Mis Artículos Publicados</h2>

                  {articlesStatus === "loading" && (
                    <div className="flex justify-center items-center py-10">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
                    </div>
                  )}

                  {articlesStatus === "error" && (
                    <div className="text-center py-10 text-red-500">
                      <i className="fas fa-exclamation-triangle text-3xl mb-3"></i>
                      <p>Algo salió mal al cargar tus artículos. Por favor, intenta de nuevo más tarde.</p>
                      <p className="text-sm mt-2">{articlesError.message}</p>
                    </div>
                  )}

                  {articlesStatus === "success" && allPosts.length === 0 && (
                    <div className="text-center py-10">
                      <i className="fas fa-file-alt text-3xl text-gray-400 mb-3"></i>
                      <p className="text-gray-600">Aún no has publicado ningún artículo.</p>
                      <Link 
                        to="/write" 
                        className="mt-4 inline-block bg-blue-800 text-white px-4 py-2 rounded-md hover:bg-blue-900 transition-colors"
                      >
                        Crear tu primer artículo
                      </Link>
                    </div>
                  )}

                  {articlesStatus === "success" && allPosts.length > 0 && (
                    <InfiniteScroll
                      dataLength={allPosts.length}
                      next={fetchNextArticlesPage}
                      hasMore={hasNextArticlesPage}
                      loader={
                        <div className="flex justify-center items-center py-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
                        </div>
                      }
                      endMessage={
                        <div className="text-center py-4 text-gray-500">
                          <p>Has llegado al final de tus artículos</p>
                        </div>
                      }
                    >
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Artículo
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Fecha
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Categoría
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {allPosts.map((post) => (
                              <tr key={post._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    {post.img && (
                                      <div className="flex-shrink-0 h-10 w-10 mr-4">
                                        <Image
                                          src={post.img}
                                          className="h-10 w-10 rounded-md object-cover"
                                          w="40"
                                          h="40"
                                          alt={post.title}
                                        />
                                      </div>
                                    )}
                                    <div className="ml-0">
                                      <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                        {post.title}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">{formatDate(post.createdAt)}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {post.category ? (
                                    <span className="text-sm text-gray-700">
                                      {post.category.name}
                                    </span>
                                  ) : (
                                    <span className="text-sm text-gray-700">
                                      Sin categoría
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex space-x-2">
                                    <Link 
                                      to={`/post/${post.slug}`} 
                                      className="text-blue-600 hover:text-blue-900"
                                      title="Ver artículo"
                                    >
                                      <i className="fas fa-eye"></i>
                                    </Link>
                                    <Link 
                                      to={`/edit/${post._id}`} 
                                      className="text-indigo-600 hover:text-indigo-900"
                                      title="Editar artículo"
                                    >
                                      <i className="fas fa-edit"></i>
                                    </Link>
                                    {isAdmin && (
                                      <button
                                        onClick={() => handleFeature(post._id)}
                                        className="text-yellow-600 hover:text-yellow-900"
                                        title={post.isFeatured ? "Quitar de destacados" : "Marcar como destacado"}
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          viewBox="0 0 24 24"
                                          width="16px"
                                          height="16px"
                                          fill={post.isFeatured ? "currentColor" : "none"}
                                          stroke="currentColor"
                                          strokeWidth="2"
                                        >
                                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                        </svg>
                                      </button>
                                    )}
                                    <button 
                                      onClick={() => handleDeleteClick(post)}
                                      className="text-red-600 hover:text-red-900"
                                      title="Eliminar artículo"
                                    >
                                      <i className="fas fa-trash-alt"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </InfiniteScroll>
                  )}
                </div>
              </>
            )}

              {/* Contenido de la pestaña de Todos los Artículos (solo para administradores) */}
              {activeTab === "allArticles" && (
              <>
                {/* Estadísticas */}
                <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Resumen de Todos los Artículos</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <div className="text-3xl font-bold text-blue-800">{totalAllPosts}</div>
                      <div className="text-sm text-gray-600">Total de Artículos</div>
                    </div>
                  </div>
                </div>

                {/* Lista de todos los artículos */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="text-xl font-bold text-gray-800 mb-6">Todos los Artículos Publicados</h2>

                  {allArticlesStatus === "loading" && (
                    <div className="flex justify-center items-center py-10">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
                    </div>
                  )}

                  {allArticlesStatus === "error" && (
                    <div className="text-center py-10 text-red-500">
                      <i className="fas fa-exclamation-triangle text-3xl mb-3"></i>
                      <p>Algo salió mal al cargar los artículos. Por favor, intenta de nuevo más tarde.</p>
                      <p className="text-sm mt-2">{allArticlesError.message}</p>
                    </div>
                  )}

                  {allArticlesStatus === "success" && allUserPosts.length === 0 && (
                    <div className="text-center py-10">
                      <i className="fas fa-file-alt text-3xl text-gray-400 mb-3"></i>
                      <p className="text-gray-600">No hay artículos publicados en el sistema.</p>
                    </div>
                  )}

                  {allArticlesStatus === "success" && allUserPosts.length > 0 && (
                    <InfiniteScroll
                      dataLength={allUserPosts.length}
                      next={fetchNextAllArticlesPage}
                      hasMore={hasNextAllArticlesPage}
                      loader={
                        <div className="flex justify-center items-center py-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
                        </div>
                      }
                      endMessage={
                        <div className="text-center py-4 text-gray-500">
                          <p>Has llegado al final de los artículos</p>
                        </div>
                      }
                    >
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Artículo
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Autor
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Fecha
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Categoría
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {allUserPosts.map((post) => (
                              <tr key={post._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    {post.img && (
                                      <div className="flex-shrink-0 h-10 w-10 mr-4">
                                        <Image
                                          src={post.img}
                                          className="h-10 w-10 rounded-md object-cover"
                                          w="40"
                                          h="40"
                                          alt={post.title}
                                        />
                                      </div>
                                    )}
                                    <div className="ml-0">
                                      <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                        {post.title}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{post.user?.username || 'Usuario desconocido'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">
                                    {new Date(post.createdAt).toLocaleDateString('es-ES', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {post.category ? post.category.name : "Sin categoría"}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="flex space-x-2">
                                    <Link 
                                      to={`/post/${post.slug}`} 
                                      className="text-blue-600 hover:text-blue-900"
                                    >
                                      <i className="fas fa-eye"></i>
                                    </Link>
                                    <Link 
                                      to={`/edit-admin/${post._id}`} 
                                      className="text-indigo-600 hover:text-indigo-900"
                                      title="Editar artículo"
                                    >
                                      <i className="fas fa-edit"></i>
                                    </Link>
                                    <button
                                      onClick={() => handleFeature(post._id)}
                                      className="text-yellow-600 hover:text-yellow-900"
                                      title={post.isFeatured ? "Quitar de destacados" : "Marcar como destacado"}
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        width="16px"
                                        height="16px"
                                        fill={post.isFeatured ? "currentColor" : "none"}
                                        stroke="currentColor"
                                        strokeWidth="2"
                                      >
                                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteClick(post)}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </InfiniteScroll>
                  )}
                </div>
              </>
            )}

                {/* Contenido de la pestaña de Formularios de Contacto */}
                {activeTab === "forms" && (
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Formularios de Contacto</h2>
                    
                    {/* Filtros de estado */}
                    <div className="mb-6">
                      <label className="mr-2">Filtrar por estado:</label>
                      <select 
                        value={selectedStatus} 
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="border rounded p-2"
                      >
                        <option value="all">Todos</option>
                        <option value="pending">Pendientes</option>
                        <option value="reviewed">Revisados</option>
                        <option value="contacted">Contactados</option>
                      </select>
                    </div>

                    {formsStatus === "loading" ? (
                      <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    ) : formsStatus === "error" ? (
                      <div className="text-center py-10 text-red-500">
                        <p>Error al cargar los formularios: {formsError.message}</p>
                      </div>
                    ) : allForms.length === 0 ? (
                      <div className="text-center py-10 text-gray-500">
                        <p>No hay formularios de contacto disponibles.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {allForms.map((form) => (
                          <div key={form._id} className="border border-gray-200 rounded-lg overflow-hidden">
                            {/* Cabecera del formulario (siempre visible) */}
                            <div 
                              onClick={() => toggleFormExpand(form._id)}
                              className={`flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 ${expandedForm === form._id ? 'bg-blue-50' : 'bg-white'}`}
                            >
                              <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${form.status === 'pending' ? 'bg-yellow-100 text-yellow-600' : form.status === 'reviewed' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                    <i className={`fas ${form.status === 'pending' ? 'fa-clock' : form.status === 'reviewed' ? 'fa-eye' : 'fa-check'}`}></i>
                                  </div>
                                </div>
                                <div>
                                  <h3 className="text-lg font-medium text-gray-900">{form.parentName} {form.parentSurname}</h3>
                                  <p className="text-sm text-gray-500">{formatDate(form.createdAt)}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${form.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : form.status === 'reviewed' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                  {form.status === 'pending' ? 'Pendiente' : form.status === 'reviewed' ? 'Revisado' : 'Contactado'}
                                </span>
                                <i className={`fas ${expandedForm === form._id ? 'fa-chevron-up' : 'fa-chevron-down'} text-gray-400`}></i>
                              </div>
                            </div>
                            
                            {/* Contenido detallado del formulario (visible solo cuando está expandido) */}
                            {expandedForm === form._id && (
                              <div className="p-6 bg-white border-t border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  {/* Información del niño/a */}
                                  <div className="bg-blue-50 p-4 rounded-lg">
                                    <h4 className="text-md font-semibold text-gray-800 mb-3">Información del Niño/a</h4>
                                    <div className="space-y-2">
                                      <div className="flex">
                                        <span className="font-medium w-32">Nombre:</span>
                                        <span>{form.childName}</span>
                                      </div>
                                      <div className="flex">
                                        <span className="font-medium w-32">Género:</span>
                                        <span>{form.childGender}</span>
                                      </div>
                                      <div className="flex">
                                        <span className="font-medium w-32">Expediente:</span>
                                        <span>{form.childAge || 'No especificado'}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Información de contacto */}
                                  <div className="bg-purple-50 p-4 rounded-lg">
                                    <h4 className="text-md font-semibold text-gray-800 mb-3">Información de Contacto</h4>
                                    <div className="space-y-2">
                                      <div className="flex">
                                        <span className="font-medium w-32">Padre/Madre:</span>
                                        <span>{form.parentName} {form.parentSurname}</span>
                                      </div>
                                      <div className="flex">
                                        <span className="font-medium w-32">Teléfono:</span>
                                        <span>{form.contactPhone}</span>
                                      </div>
                                      <div className="flex">
                                        <span className="font-medium w-32">Email:</span>
                                        <span>{form.contactEmail}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Motivo de la consulta */}
                                <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                                  <h4 className="text-md font-semibold text-gray-800 mb-3">Motivo de la Consulta</h4>
                                  <p className="text-gray-700">{form.consultationReason}</p>
                                </div>
                                
                                {/* Acciones */}
                                <div className="mt-6 flex justify-between items-center">
                                  <div>
                                    <label className="mr-2 text-sm font-medium">Cambiar estado:</label>
                                    <select 
                                      value={form.status} 
                                      onChange={(e) => handleStatusChange(form._id, e.target.value)}
                                      className="border rounded p-2 text-sm"
                                    >
                                      <option value="pending">Pendiente</option>
                                      <option value="reviewed">Revisado</option>
                                      <option value="contacted">Contactado</option>
                                    </select>
                                  </div>
                                  <button 
                                    onClick={() => handleDeleteForm(form._id, form.parentName, form.parentSurname)}
                                    className="bg-red-50 text-red-600 px-4 py-2 rounded-md hover:bg-red-100 transition-colors"
                                  >
                                    <i className="fas fa-trash-alt mr-2"></i>
                                    Eliminar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {hasNextFormsPage && (
                          <div className="text-center mt-6">
                            <button
                              onClick={() => fetchNextFormsPage()}
                              disabled={isFormsFetchingNextPage}
                              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition duration-300"
                            >
                              {isFormsFetchingNextPage ? "Cargando más..." : "Cargar más"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Modal de confirmación de eliminación de formulario */}
        {showDeleteFormModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Confirmar eliminación</h3>
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que deseas eliminar el formulario de "{formToDelete?.name}"? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteFormModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  disabled={isDeletingForm}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteForm}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
                  disabled={isDeletingForm}
                >
                  {isDeletingForm ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Eliminando...
                    </>
                  ) : (
                    "Eliminar"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Modal de confirmación de eliminación de formulario */}
        {showDeleteFormModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Confirmar eliminación</h3>
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que deseas eliminar el formulario de "{formToDelete?.name}"? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteFormModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  disabled={isDeletingForm}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteForm}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
                  disabled={isDeletingForm}
                >
                  {isDeletingForm ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Eliminando...
                    </>
                  ) : (
                    "Eliminar"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {showDeleteModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Confirmar eliminación</h3>
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que deseas eliminar el formulario de "{formToDelete?.name}"? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  disabled={isDeleting}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Eliminando...
                    </>
                  ) : (
                    "Eliminar"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

            {/* Contenido de la pestaña de Categorías */}
            {activeTab === "categories" && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Gestión de Categorías</h2>
                
                {/* Formulario para crear nueva categoría */}
                <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Crear Nueva Categoría</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la Categoría</label>
                      <input 
                        type="text" 
                        value={newCategory.name} 
                        onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ej: Nutrición Infantil"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Icono</label>
                      <div className="grid grid-cols-4 gap-2 mb-2 max-h-60 overflow-y-auto p-2">
                        {iconOptions.map((icon, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setNewCategory({...newCategory, icon})}
                            className={`p-3 rounded-md flex flex-col items-center justify-center ${newCategory.icon === icon ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-50 hover:bg-gray-100'}`}
                          >
                            <i className={`${icon} text-xl mb-1`}></i>
                            <span className="text-xs text-gray-600">{icon.replace('fas fa-', '')}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                      
                      {/* Pestañas de navegación */}
                      <div className="flex border-b border-gray-200 mb-4">
                        <button
                          type="button"
                          onClick={() => setUseCustomColor(false)}
                          className={`py-2 px-4 font-medium text-sm rounded-t-md ${!useCustomColor ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                          Colores predeterminados
                        </button>
                        <button
                          type="button"
                          onClick={() => setUseCustomColor(true)}
                          className={`py-2 px-4 font-medium text-sm rounded-t-md ${useCustomColor ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                          Color personalizado
                        </button>
                      </div>
                      
                      {/* Contenido de las pestañas */}
                      {!useCustomColor ? (
                        <div className="grid grid-cols-4 gap-2 mb-4">
                          {colorOptions.map((color, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => {
                                setNewCategory({...newCategory, color: color.bg, hoverColor: color.hover});
                              }}
                              className={`p-3 rounded-md flex items-center justify-center ${color.bg} text-white ${newCategory.color === color.bg ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                            >
                              {color.text}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-3 mb-4">
                          <input 
                            type="color" 
                            value={customColor}
                            onChange={(e) => {
                              setCustomColor(e.target.value);
                              // Actualizar la categoría con el color personalizado
                              setNewCategory({
                                ...newCategory, 
                                color: e.target.value, // Guardar solo el valor hexadecimal
                                hoverColor: `hover:bg-[${e.target.value}]`
                              });
                            }}
                            className="h-10 w-10 rounded cursor-pointer"
                          />
                          <div 
                            className="h-8 w-8 rounded-full ml-2" 
                            style={{ backgroundColor: customColor }}
                          ></div>
                          <span className="text-sm text-gray-700">{customColor}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <button 
                      onClick={handleCreateCategory}
                      className="inline-flex items-center bg-blue-800 text-white px-6 py-3 rounded-lg hover:bg-blue-900 transition-colors"
                    >
                      <i className="fas fa-plus mr-2"></i>
                      Crear Categoría
                    </button>
                  </div>
                </div>
                
                {/* Lista de categorías existentes */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Categorías Existentes</h3>
                  
                  {categoriesStatus === "loading" ? (
                    <div className="flex justify-center py-10">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : categoriesStatus === "error" ? (
                    <div className="text-center py-10 text-red-500">
                      <p>Error al cargar las categorías: {categoriesError.message}</p>
                    </div>
                  ) : categoriesData?.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                      <p>No hay categorías disponibles.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Categoría
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Icono
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Color
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {categoriesData && categoriesData.length > 0 ? (
                            categoriesData.map((category) => (
                              <tr key={category._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{category.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-left">
                  <i className={`${category.icon} text-2xl text-black block mx-auto`}></i>
                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {category.color.startsWith('#') ? (
                                    <span 
                                      className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white"
                                      style={{ backgroundColor: category.color }}
                                    >
                                      Ejemplo
                                    </span>
                                  ) : (
                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${category.color}`}>
                                      Ejemplo
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <button 
                                    onClick={() => handleDeleteCategory(category)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Eliminar
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                No hay categorías disponibles
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>


        {/* Modal de confirmación de eliminación */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Confirmar eliminación</h3>
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que deseas eliminar el artículo "{postToDelete?.title}"? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  disabled={isDeleting}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Eliminando...
                    </>
                  ) : (
                    "Eliminar"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación de eliminación de categorías */}
        {showDeleteCategoryModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Confirmar eliminación</h3>
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que deseas eliminar la categoría "{categoryToDelete?.name}"? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteCategoryModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  disabled={isDeletingCategory}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteCategory}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
                  disabled={isDeletingCategory}
                >
                  {isDeletingCategory ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Eliminando...
                    </>
                  ) : (
                    "Eliminar"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer con fondo extendido a los lados */}
        <div className="-mx-4 md:-mx-8 lg:-mx-16 xl:-mx-32 2xl:-mx-64 mt-auto">
          <Footer />
        </div>
        
        {showFeaturedLimitModal && (
          <FeaturedLimitModal onClose={() => setShowFeaturedLimitModal(false)} />
        )}
      </div>
    </HelmetProvider>
  );
};

export default UserArticlesPage;
