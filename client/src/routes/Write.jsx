import { useAuth, useUser } from "@clerk/clerk-react"
import 'react-quill-new/dist/quill.snow.css' 
import ReactQuill from 'react-quill-new'
import { useMutation, useQuery } from "@tanstack/react-query"
import axios from "axios"
import { useEffect, useState, useRef } from "react" 
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import Upload from "../components/Upload"
import { Helmet, HelmetProvider } from "react-helmet-async"
import Footer from "../components/Footer"
import Picker from 'emoji-picker-react'; 
import Confetti from "../components/Confetti" 

const ImageResizeModal = ({ isOpen, onClose, onInsert, uploadedImage, setUploadedImage }) => {
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (uploadedImage) {
      const img = new Image();
      img.onload = () => {
        setAspectRatio(img.width / img.height);
        setWidth(img.width.toString());
        setHeight(img.height.toString());
      };
      img.src = uploadedImage;
    }
  }, [uploadedImage]);

  const handleWidthChange = (e) => {
    const newWidth = e.target.value;
    setWidth(newWidth);
    
    if (maintainAspectRatio && aspectRatio && newWidth) {
      const calculatedHeight = Math.round(newWidth / aspectRatio);
      setHeight(calculatedHeight.toString());
    }
  };

  const handleHeightChange = (e) => {
    const newHeight = e.target.value;
    setHeight(newHeight);
    
    if (maintainAspectRatio && aspectRatio && newHeight) {
      const calculatedWidth = Math.round(newHeight * aspectRatio);
      setWidth(calculatedWidth.toString());
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInsert = () => {
    if (uploadedImage && width && height) {
      onInsert({
        url: uploadedImage,
        width: parseInt(width),
        height: parseInt(height)
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setWidth('');
    setHeight('');
    setMaintainAspectRatio(true);
    setAspectRatio(null);
    setUploadedImage(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Insertar y redimensionar imagen</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!uploadedImage ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-gray-600 mb-2">Haz clic para seleccionar una imagen</p>
              <p className="text-sm text-gray-500">JPG, PNG, GIF hasta 10MB</p>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Vista Previa</label>
                <div className="border rounded-lg p-4 bg-gray-50 flex justify-center">
                  <img
                    src={uploadedImage}
                    alt="Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '300px',
                      width: width ? `${width}px` : 'auto',
                      height: height ? `${height}px` : 'auto',
                      objectFit: maintainAspectRatio ? 'contain' : 'fill'
                    }}
                    className="rounded"
                  />
                </div>
                <button onClick={() => fileInputRef.current?.click()} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Cambiar imagen
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Dimensiones (píxeles)</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Ancho</label>
                    <input
                      type="number"
                      value={width}
                      onChange={handleWidthChange}
                      placeholder="Ancho"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Alto</label>
                    <input
                      type="number"
                      value={height}
                      onChange={handleHeightChange}
                      placeholder="Alto"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="aspectRatio"
                    checked={maintainAspectRatio}
                    onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="aspectRatio" className="text-sm text-gray-700">
                    Mantener proporción de aspecto
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs text-gray-600">Tamaños preestablecidos</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Pequeño', width: 300 },
                      { label: 'Mediano', width: 600 },
                      { label: 'Grande', width: 900 },
                      { label: 'Original', width: null }
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          if (preset.width && aspectRatio) {
                            setWidth(preset.width.toString());
                            setHeight(Math.round(preset.width / aspectRatio).toString());
                          } else if (!preset.width) {
                            const img = new Image();
                            img.onload = () => {
                              setWidth(img.width.toString());
                              setHeight(img.height.toString());
                            };
                            img.src = uploadedImage;
                          }
                        }}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button onClick={handleClose} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleInsert}
            disabled={!uploadedImage || !width || !height}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Insertar Imagen
          </button>
        </div>
      </div>
    </div>
  );
};

const Write = () => {

  const {isLoaded, isSignedIn} = useUser();
  const [value, setValue] = useState('');
  const [cover, setCover] = useState('');
  const [img, setImg] = useState('');
  const [video, setVideo] = useState('');
  const [progress, setProgress] = useState(0);
  const quillRef = useRef(null); 
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); 
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState(''); 
  const confetti = Confetti(); 
  const [showImageModal, setShowImageModal] = useState(false);
  const [uploadedImageForResize, setUploadedImageForResize] = useState(null);

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
});

// Establecer la categoría por defecto cuando se cargan las categorías
useEffect(() => {
  if (categoriesData && categoriesData.length > 0 && !category) {
    setCategory(categoriesData[0].slug);
  }
}, [categoriesData, category]);

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

  const handleInsertResizedImage = (imageData) => {
    const editor = quillRef.current?.getEditor();
    if (editor) {
      const range = editor.getSelection(true);
      editor.insertEmbed(range.index, 'image', imageData.url, 'user');
      
      // Aplicar dimensiones personalizadas
      setTimeout(() => {
        const img = editor.root.querySelector(`img[src="${imageData.url}"]`);
        if (img) {
          img.style.width = `${imageData.width}px`;
          img.style.height = `${imageData.height}px`;
          // CLAVE: Forzar el object-fit según la opción elegida
          if (imageData.maintainAspectRatio) {
            img.style.objectFit = 'contain';
          } else {
            img.style.objectFit = 'fill';
          }
          // Asegurar que no haya max-width/max-height que interfieran
          img.style.maxWidth = 'none';
          img.style.maxHeight = 'none';
        }
      }, 100);
      
      editor.setSelection(range.index + 1, 0);
    }
  };

  useEffect(() => {
    if (img && img.url) {
      const editor = quillRef.current?.getEditor();
      if (editor) {
        const range = editor.getSelection(true); 
        editor.insertEmbed(range.index, 'image', img.url, 'user'); 
  
        // No aplicamos alineación automática para permitir al usuario elegir
        editor.setSelection(range.index + 1, 0); 
      } else {
        setValue(prev => prev + `<p><img src="${img.url}" alt="Imagen insertada"/></p>`);
      }
    }
  }, [img])

  useEffect(() =>{
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
  },[video])

  const navigate = useNavigate()

  const { getToken } = useAuth()

  const mutation = useMutation({
    mutationFn: async (newPost) => {
      const token = await getToken()
      return axios.post(`${import.meta.env.VITE_API_URL}/posts`, newPost, {
        headers: {
          Authorization: `Bearer ${ token}`
        },
      })
    },
    onSuccess:(res)=>{
      navigate(`/post/${res.data.slug}`)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create post. Please try again.");
    }
  });

  if(!isLoaded){
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  };


  if(isLoaded && !isSignedIn){
    return (
      <div className="text-center py-20 text-red-500">
        <i className="fas fa-exclamation-triangle text-3xl mb-3"></i>
        <p>Debes iniciar sesión para crear un artículo.</p>
      </div>
    );
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Capturar la posición del clic ahora, antes de las operaciones asíncronas
    const clickPosition = { x: e.clientX, y: e.clientY };
    
    // Validaciones
    if (!title.trim()) {
      toast.error("Por favor, añade un título");
      return;
    }
    
    if (!value.trim() || value === '<p><br></p>') {
      toast.error("Por favor, escribe el contenido del artículo");
      return;
    }

    // Crear el post
    const newPost = {
      title,
      desc,
      content: value,
      category: category, 
    };
    
    // Añadir la imagen solo si existe
    if (cover && cover.url) {
      newPost.img = cover.url;
    }
    
    try {
      await mutation.mutateAsync(newPost);
      toast.success("¡Artículo publicado con éxito!");
      // Pasar un parámetro de estado para indicar que se debe mostrar el confeti
      navigate("/user-articles", { state: { showConfetti: true } });
    } catch (err) {
      console.error("Error al publicar:", err);
    }
  };

  // Function to handle emoji selection
  const onEmojiClick = (emojiObject) => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      const range = editor.getSelection(true); 
      editor.insertText(range.index, emojiObject.emoji, 'user'); 
      editor.setSelection(range.index + emojiObject.emoji.length, 0); 
      setShowEmojiPicker(false); 
    }
  };

  // Funciones para alinear imágenes
const alignImageLeft = () => {
  const editor = quillRef.current?.getEditor();
  if (editor) {
    const range = editor.getSelection();
    if (range) {
      // Buscar el bloque que contiene la posición actual
      const [block] = editor.getLine(range.index);
      // Verificar si el bloque contiene una imagen
      if (block && block.domNode.querySelector('img')) {
        // Obtener el índice del bloque
        const blockIndex = editor.getIndex(block);
        // Aplicar alineación izquierda
        editor.formatLine(blockIndex, 1, 'align', 'left');
      }
    }
  }
};

const alignImageCenter = () => {
  const editor = quillRef.current?.getEditor();
  if (editor) {
    const range = editor.getSelection();
    if (range) {
      const [block] = editor.getLine(range.index);
      if (block && block.domNode.querySelector('img')) {
        const blockIndex = editor.getIndex(block);
        editor.formatLine(blockIndex, 1, 'align', 'center');
      }
    }
  }
};

const alignImageRight = () => {
  const editor = quillRef.current?.getEditor();
  if (editor) {
    const range = editor.getSelection();
    if (range) {
      const [block] = editor.getLine(range.index);
      if (block && block.domNode.querySelector('img')) {
        const blockIndex = editor.getIndex(block);
        editor.formatLine(blockIndex, 1, 'align', 'right');
      }
    }
  }
};


  return (
    <HelmetProvider>
      <div className="min-h-screen flex flex-col">
        {confetti.component /* Renderizamos el componente de confeti */}
        <Helmet>
          <title>Crear Nuevo Artículo | Hospital Infantil de Las Californias</title>
          <meta name="description" content="Crea un nuevo artículo para el blog del Hospital Infantil de Las Californias" />
        </Helmet>
        

        <div className="relative flex-grow -mx-4 md:-mx-8 lg:-mx-16 xl:-mx-32 2xl:-mx-64 px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 py-8 bg-[#eff6ff]">
          <div className="absolute top-[-5px] left-0 right-0 h-1 shadow-top-bottom"></div>
          <div className="max-w-5xl mx-auto"> 
     
            <div className="mb-8 mt-6 pt-8 text-center"> 
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Crear Nuevo Artículo</h1>
              <div className="text-sm text-gray-600 mb-2">
                Comparte tus conocimientos y experiencias con la comunidad
              </div>
            </div>

  
            <div> 
              <form onSubmit={handleSubmit} className="space-y-6">
            
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Información Principal</h2>
                  
          
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2 text-gray-600">Imagen de Portada</label>
                    <Upload type="image" setProgress={setProgress} setData={setCover}>
                      <button type="button" className="w-max p-2 shadow-md rounded-xl text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 transition duration-300">
                        Añadir imagen de portada
                      </button>
                    </Upload>
                    {cover && cover.filePath && (
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
                  
      
                  <div className="mb-6">
                    <label htmlFor="title" className="block text-sm font-medium mb-2 text-gray-600">Título del Artículo</label>
                    <input 
                      id="title"
                      className="w-full bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                      type="text" 
                      placeholder="El título de tu increíble historia"
                      name="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
        
                  <div className="mb-6">
                    <label htmlFor="category" className="block text-sm font-medium mb-2 text-gray-600">Categoría</label>
                    <select 
                      id="category"
                      className="w-full bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                      name="category"
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
                  
                 
                  <div className="mb-6">
                    <label htmlFor="desc" className="block text-sm font-medium mb-2 text-gray-600">Descripción Corta</label>
                    <textarea 
                      id="desc"
                      className="w-full bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                      name="desc" 
                      placeholder="Una breve descripción de tu artículo"
                      rows="3"
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
            
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Contenido del Artículo</h2>
                  
                  <div className="flex flex-col space-y-4">
                   
                    <div className="flex items-center space-x-2 relative"> 
                        <button 
                          type="button" 
                          onClick={() => setShowImageModal(true)}
                          className="p-2 shadow-md rounded-xl text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 transition duration-300 flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Insertar imagen
                        </button>

                      {/* Botones de alineación de imagen */}
                      <div className="ml-2 flex items-center space-x-1">
                        <span className="text-xs text-gray-500">Alinear:</span>
                        <button 
                          type="button" 
                          onClick={alignImageLeft}
                          className="p-1 shadow-md rounded-xl text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 transition duration-300"
                          title="Alinear a la izquierda"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
                          </svg>
                        </button>
                        <button 
                          type="button" 
                          onClick={alignImageCenter}
                          className="p-1 shadow-md rounded-xl text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 transition duration-300"
                          title="Centrar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" />
                          </svg>
                        </button>
                        <button 
                          type="button" 
                          onClick={alignImageRight}
                          className="p-1 shadow-md rounded-xl text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 transition duration-300"
                          title="Alinear a la derecha"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M4 18h16" />
                          </svg>
                        </button>
                      </div>
              

             
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

             
                      {showEmojiPicker && (
                        <div className="absolute z-10 mt-2" style={{ top: '100%', left: '100px' }}> 
                          <Picker onEmojiClick={onEmojiClick} />
                        </div>
                      )}
                    </div>
                    
                    {progress > 0 && progress < 100 && (
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                      </div>
                    )}
                    
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
                        Publicando...
                      </>
                    ) : (
                      <>Publicar Artículo</>
                    )}
                  </button>
                </div>
            
                {mutation.isError && (
                  <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 mt-4 rounded">
                    <p className="font-medium">Error al publicar:</p>
                    <p>{mutation.error.response?.data?.message || mutation.error.message}</p>
                  </div>
                )}
                
        
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
        
        <ImageResizeModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          onInsert={handleInsertResizedImage}
          uploadedImage={uploadedImageForResize}
          setUploadedImage={setUploadedImageForResize}
        />

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

export default Write;
