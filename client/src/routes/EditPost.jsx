import { useAuth, useUser } from "@clerk/clerk-react"
import 'react-quill-new/dist/quill.snow.css'
import ReactQuill from 'react-quill-new'
import { useMutation, useQuery } from "@tanstack/react-query"
import axios from "axios"
import { useEffect, useState, useRef } from "react"
import { useNavigate, useParams, useLocation } from "react-router-dom"
import { toast } from "react-toastify"
import Upload from "../components/Upload"
import { Helmet, HelmetProvider } from "react-helmet-async"
import Footer from "../components/Footer"
import Picker from 'emoji-picker-react'

// Descomenta esta importación
import { useQueryClient } from "@tanstack/react-query";

const EditPost = () => {
  // Añade esta línea para inicializar queryClient
  const queryClient = useQueryClient();
  
  const { id } = useParams(); // Obtener el ID del post de la URL
  const { isLoaded, isSignedIn, user } = useUser();
  const [value, setValue] = useState('');
  const [cover, setCover] = useState('');
  const [img, setImg] = useState('');
  const [video, setVideo] = useState('');
  const [progress, setProgress] = useState(0);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('general');
  const [desc, setDesc] = useState('');
  const quillRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const location = useLocation();

  // Consulta para obtener las categorías
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
  });
  
  // Determinar si estamos en modo administrador
  const isAdminMode = location.pathname.includes('/edit-admin/');
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Verificar si el usuario es administrador
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      setIsAdmin(user.publicMetadata.role === "admin");
    }
  }, [isLoaded, isSignedIn, user]);

  // Quill modules configuration
  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['link'],
        ['clean']
      ],
    },
  };

  // Consulta para obtener los datos del post
  const { data: post, isLoading, error } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const token = await getToken();
      console.log(`Fetching post with ID: ${id}`);
      
      // Usar la ruta de administrador si estamos en modo administrador
      const endpoint = isAdminMode 
        ? `${import.meta.env.VITE_API_URL}/api/user-posts/admin/${id}` 
        : `${import.meta.env.VITE_API_URL}/api/user-posts/${id}`;
      
      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Post data received:', response.data);
      return response.data;
    },
    enabled: !!id && isSignedIn && isLoaded,
    onSuccess: (data) => {
      console.log('Setting form data with:', data);
      // Cargar los datos del post en el formulario
      setTitle(data.title || '');
      setCategory(data.category || 'general');
      setDesc(data.desc || '');
      setValue(data.content || '');
      if (data.img) {
        setCover({
          filePath: data.img,
          url: data.img
        });
      }
    },
    onError: (error) => {
      console.error('Error fetching post:', error);
      toast.error(error.response?.data?.message || "Error al cargar el artículo");
      navigate('/user-articles');
    }
  });

  // Añadir este useEffect para asegurarnos de que los datos se carguen cuando post cambie
  useEffect(() => {
    if (post) {
      console.log('Post data changed, updating form:', post);
      setTitle(post.title || '');
      setCategory(post.category || 'general');
      setDesc(post.desc || '');
      setValue(post.content || '');
      if (post.img) {
        setCover({
          filePath: post.img,
          url: post.img
        });
      }
    }
  }, [post]);

  useEffect(() => {
    if (post?.content && quillRef.current) {
      console.log('Setting editor content directly');
      
      // Pequeño retraso para asegurar que el editor esté listo
      setTimeout(() => {
        setValue(post.content);
      }, 100);
    }
  }, [post?.content, quillRef.current]);

  useEffect(() => {
    // Si un usuario no está autenticado, redirigir a la página de inicio de sesión
    if (isLoaded && !isSignedIn) {
      navigate('/login');
    }
  }, [isLoaded, isSignedIn, navigate]);

  useEffect(() => {
    // Si se sube una imagen, insertarla en el cursor y centrarla
    if (img && img.url) {
      const editor = quillRef.current?.getEditor();
      if (editor) {
        const range = editor.getSelection(true);
        editor.insertEmbed(range.index, 'image', img.url, 'user');
        
        const [lineBlot, offsetInLine] = editor.getLine(range.index);
        
        if (lineBlot) {
          const lineIndex = editor.getIndex(lineBlot);
          editor.formatLine(lineIndex, 1, 'align', 'center', 'user');
        }
        
        editor.setSelection(range.index + 1, 0);
      } else {
        setValue(prev => prev + `<p style="text-align:center;"><img src="${img.url}" alt="Imagen insertada"/></p>`);
      }
    }
  }, [img]);

  useEffect(() => {
    // Si se sube un video, insertarlo en el cursor y centrarlo
    if (video && video.url) {
      const editor = quillRef.current?.getEditor();
      if (editor) {
        const range = editor.getSelection(true);
        editor.insertEmbed(range.index, 'video', video.url, 'user');
        editor.formatLine(range.index, 1, 'align', 'center');
        editor.setSelection(range.index + 1, 0);
      } else {
        setValue(prev => prev + `<p style="text-align:center;"><iframe class="ql-video" frameborder="0" allowfullscreen="true" src="${video.url}"></iframe></p>`);
      }
    }
  }, [video]);

  // Mutación para actualizar el post
  const mutation = useMutation({
    mutationFn: async (updatedPost) => {
      const token = await getToken();
      // Usar la ruta de administrador si estamos en modo administrador
      const endpoint = isAdminMode 
        ? `${import.meta.env.VITE_API_URL}/api/user-posts/admin/${id}` 
        : `${import.meta.env.VITE_API_URL}/api/user-posts/${id}`;
      
      return axios.put(endpoint, updatedPost, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    },
    onSuccess: (response) => {
      toast.success("¡Artículo actualizado correctamente!");
      
      // Invalidar las consultas relacionadas para forzar una actualización
      queryClient.invalidateQueries(['post', id]);
      queryClient.invalidateQueries(['userPosts']);
      
      // Obtener el slug del post actualizado de la respuesta
      const updatedSlug = response.data.slug || id;
      
      // Redirigir al post actualizado en lugar de a la lista de artículos
      navigate(`/post/${updatedSlug}`, { replace: true });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Error al actualizar el artículo. Inténtalo de nuevo.");
    }
  });

  // Función para manejar la selección de emojis
  const onEmojiClick = (emojiObject) => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      const range = editor.getSelection(true); 
      editor.insertText(range.index, emojiObject.emoji, 'user'); 
      editor.setSelection(range.index + emojiObject.emoji.length, 0); 
      setShowEmojiPicker(false); 
    }
  };

  // Manejar el envío del formulario
  const handleSubmit = e => {
    e.preventDefault();
    const data = {
      img: cover?.filePath || "",
      title: title,
      category: category,
      desc: desc,
      content: value,
    };
    mutation.mutate(data);
  };

  // Mostrar spinner de carga mientras se cargan los datos del usuario
  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Si los datos del usuario están cargados pero el usuario no ha iniciado sesión, mostrar mensaje
  if (isLoaded && !isSignedIn) {
    return (
      <div className="text-center py-20 text-red-500">
        <i className="fas fa-exclamation-triangle text-3xl mb-3"></i>
        <p>Debes iniciar sesión para editar un artículo.</p>
      </div>
    );
  }

  // Mostrar spinner de carga mientras se cargan los datos del post
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Si hay un error al cargar los datos del post, mostrar mensaje
  if (error) {
    return (
      <div className="text-center py-20 text-red-500">
        <i className="fas fa-exclamation-triangle text-3xl mb-3"></i>
        <p>Error al cargar el artículo. {error.response?.data?.message || error.message}</p>
      </div>
    );
  }

  // Verificar permisos de administrador si estamos en modo administrador
  if (isAdminMode && isLoaded && !isAdmin) {
    return (
      <div className="text-center py-20 text-red-500">
        <i className="fas fa-exclamation-triangle text-3xl mb-3"></i>
        <p>Necesitas permisos de administrador para editar artículos de otros usuarios.</p>
      </div>
    );
  }

  return (
    <HelmetProvider>
      <div className="flex flex-col min-h-screen">
        <Helmet>
          <title>Editar Artículo | Blog</title>
          <meta name="description" content="Edita tu artículo del blog" />
        </Helmet>

        {/* Main content area with background color */}
        <div className="relative flex-grow -mx-4 md:-mx-8 lg:-mx-16 xl:-mx-32 2xl:-mx-64 px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 py-8 bg-[#eff6ff]">
          {/* Top shadow effect */}
          <div className="absolute top-[-5px] left-0 right-0 h-1 shadow-top-bottom"></div>

          {/* Centered content container */}
          <div className="max-w-5xl mx-auto"> 
            {/* Page header */}
            <div className="mb-8 mt-6 pt-8 text-center"> 
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Editar Artículo</h1>
              <div className="text-sm text-gray-600 mb-2">
                Actualiza tu artículo para la comunidad
              </div>
            </div>

            {/* Form section */}
            <div> 
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Main information card */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Información Principal</h2>
                  
                  {/* Cover image upload */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2 text-gray-600">Imagen de Portada</label>
                    <Upload type="image" setProgress={setProgress} setData={setCover}>
                      <button type="button" className="w-max p-2 shadow-md rounded-xl text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 transition duration-300">
                        {cover ? "Cambiar imagen de portada" : "Añadir imagen de portada"}
                      </button>
                    </Upload>
                    {cover && cover.url && (
                      <div className="mt-2 relative">
                        <img 
                          src={cover.url} 
                          alt="Vista previa de portada" 
                          className="w-full h-auto max-h-[300px] object-cover rounded-lg shadow-sm mt-2" 
                        />
                        <button 
                          type="button"
                          onClick={() => setCover('')}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition duration-300"
                          aria-label="Eliminar imagen de portada"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Article title input */}
                  <div className="mb-6">
                    <label htmlFor="title" className="block text-sm font-medium mb-2 text-gray-600">Título del Artículo</label>
                    <input 
                      id="title"
                      className="w-full bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                      type="text" 
                      placeholder="El título de tu increíble historia"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  
                  {/* Category selection */}
                  <div className="mb-6">
                    <label htmlFor="category" className="block text-sm font-medium mb-2 text-gray-600">Categoría</label>
                    <select 
                      id="category"
                      className="w-full bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {categoriesStatus === "loading" ? (
                        <option value="">Cargando categorías...</option>
                      ) : categoriesStatus === "error" ? (
                        <option value="general">General</option>
                      ) : (
                        categoriesData.map((cat) => (
                          <option key={cat._id} value={cat.slug}>
                            {cat.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  
                  {/* Short description textarea */}
                  <div className="mb-6">
                    <label htmlFor="desc" className="block text-sm font-medium mb-2 text-gray-600">Descripción Corta</label>
                    <textarea 
                      id="desc"
                      className="w-full bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                      placeholder="Una breve descripción de tu artículo"
                      rows="3"
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                {/* Article content card */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Contenido del Artículo</h2>
                  
                  <div className="flex flex-col space-y-4">
                    {/* Action buttons: Image, Video, Emoji */}
                    <div className="flex items-center space-x-2 relative"> 
                      <Upload type="image" setProgress={setProgress} setData={setImg}>
                        <button type="button" className="p-2 shadow-md rounded-xl text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 transition duration-300 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Insertar Imagen
                        </button>
                      </Upload>
                      
                      {/* Emoji Button */}
                      <button 
                        type="button" 
                        onClick={() => setShowEmojiPicker(prev => !prev)}
                        className="p-2 shadow-md rounded-xl text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 transition duration-300 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Emoji
                      </button>

                      {/* Emoji Picker Popover */}
                      {showEmojiPicker && (
                        <div className="absolute z-10 mt-2" style={{ top: '100%', left: '100px' }}> 
                          <Picker onEmojiClick={onEmojiClick} />
                        </div>
                      )}
                    </div>
                    
                    {/* Progress bar for uploads */}
                    {progress > 0 && progress < 100 && (
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                      </div>
                    )}
                    
                    {/* ReactQuill editor */}
                    <ReactQuill 
                      ref={quillRef} 
                      theme="snow" 
                      className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[300px]"
                      value={value} 
                      onChange={setValue}
                      readOnly={0 < progress && progress < 100}
                      modules={modules}
                      placeholder="Comienza a escribir tu increíble historia aquí..."
                    />
                  </div>
                </div>
                
                {/* Submit button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={mutation.isPending || (0 < progress && progress < 100)} 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg py-3 px-6 transition duration-300 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center"
                  >
                    {mutation.isPending ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Actualizando...
                      </>
                    ) : (
                      <>Actualizar Artículo</>
                    )}
                  </button>
                </div>
                
                {/* Display error message if mutation fails */}
                {mutation.isError && (
                  <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 mt-4 rounded">
                    <p className="font-medium">Error al actualizar:</p>
                    <p>{mutation.error.response?.data?.message || mutation.error.message}</p>
                  </div>
                )}
                
                {/* Display progress percentage (optional) */}
                {progress > 0 && progress < 100 && (
                  <div className="text-sm text-gray-500 mt-2">Progreso de subida: {progress}%</div>
                )}
              </form>
            </div>
          </div>
        </div>
        
        <div className="-mx-4 md:-mx-8 lg:-mx-16 xl:-mx-32 2xl:-mx-64 mt-auto">
          <Footer />
        </div>
        
        <style jsx>{`
          .shadow-inner-bottom {
            box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .shadow-top-bottom {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
        `}</style>
      </div>
    </HelmetProvider>
  )
}

export default EditPost