import DOMPurify from "dompurify";
import { Helmet, HelmetProvider } from "react-helmet-async";
import Image from "../components/Image";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import Footer from "../components/Footer";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";

const fetchPost = async (slug) => {
  const res = await axios.get(`${import.meta.env.VITE_API_URL}/posts/${slug}`);
  return res.data;
};

const SinglePostPage = () => {
  const { slug } = useParams();
  const { isSignedIn } = useUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [formOpacity, setFormOpacity] = useState(1);
  const [formData, setFormData] = useState({
    parentName: "",
    parentSurname: "",
    childName: "",
    childGender: "",
    childAge: "",
    childBirthDate: "",
    contactPhone: "",
    contactEmail: "",
    consultationReason: ""
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const { isPending, error, data } = useQuery({
    queryKey: ["post", slug],
    queryFn: () => fetchPost(slug),
  });

  // Consulta para obtener las categorías
  const {
    data: categoriesData,
    status: categoriesStatus,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/categories`);
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Nueva consulta para obtener posts relacionados por categoría
  useQuery({
    queryKey: ['relatedPosts', data?.category],
    queryFn: async () => {
      if (!data?.category) return { posts: [] };

      const res = await axios.get(`${import.meta.env.VITE_API_URL}/posts`, {
        params: {
          cat: data.category,
          limit: 2,
          page: 1
        }
      });

      // Filtrar para excluir el post actual
      const filteredPosts = res.data.posts.filter(post => post._id !== data._id);
      return { posts: filteredPosts.slice(0, 2) }; // Asegurar máximo 2 artículos
    },
    enabled: !!data?.category, // Solo ejecutar cuando tengamos la categoría del post actual
    staleTime: 0, // Siempre considerar los datos como obsoletos
    cacheTime: 1000 * 60, // Mantener en caché por 1 minuto
    refetchOnMount: true, // Actualizar al montar el componente
    refetchOnWindowFocus: true, // Actualizar cuando la ventana recupera el foco
  });

  // Componente PuzzleCard para las categorías
  const PuzzleCard = ({ children, pieceBg, className, style, onClick }) => {
    return (
      <div 
        className={`puzzle-piece relative ${pieceBg} rounded-lg p-4 shadow-md transition-all duration-300 hover:shadow-lg ${className}`}
        style={style}
        onClick={onClick}
      >
        {/* Contenido de la tarjeta */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  };

  useEffect(() => {
    setFormOpacity(1);
    // Si volvemos a un paso anterior al de éxito, reseteamos el estado de envío
    if (currentStep < 4) {
        setFormSubmitted(false);
        setSubmitError(null); // Limpiar errores previos al cambiar de paso
    }
  }, [currentStep]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prevFormData => ({
      ...prevFormData,
      [id]: value
    }));
  };

  const changeStep = (newStep) => {
    setFormOpacity(0); 
    setTimeout(() => {
      setCurrentStep(newStep);
    }, 300); // Duración del fade-out
  };
  
  const handleSubmitForm = async () => {
    try {
      setSubmitError(null); // Limpiar errores previos
      setFormSubmitted(false); // Resetear estado de envío para nuevo intento

      // Validar que todos los campos requeridos estén completos
      const requiredFields = {
        parentName: "Nombres del Padre/Madre/Tutor",
        parentSurname: "Apellidos del Padre/Madre/Tutor",
        contactPhone: "Teléfono de Contacto",
        contactEmail: "Correo Electrónico",
        consultationReason: "Motivo de la Consulta"
      };
      
      
      const missingFields = Object.entries(requiredFields)
        .filter(([fieldKey]) => !formData[fieldKey] || formData[fieldKey].trim() === "")
        .map(([, fieldName]) => fieldName);

      if (missingFields.length > 0) {
        setSubmitError(`Por favor complete todos los campos requeridos: ${missingFields.join(', ')}.`);
        return;
      }

      // Validar formato de email
      if (!/\S+@\S+\.\S+/.test(formData.contactEmail)) {
        setSubmitError("Por favor ingrese un correo electrónico válido.");
        return;
      }
      // Validar formato de teléfono
      if (!/^\+?(\d[\s-]?){6,14}\d$/.test(formData.contactPhone)) {
         setSubmitError("Por favor ingrese un número de teléfono válido.");
         return;
      }
      await axios.post(`${import.meta.env.VITE_API_URL}/api/contact-forms`, {
        ...formData,
        postId: data?._id, // Relacionar con el artículo actual, verificar si data existe
        postTitle: data?.title 
      });

      setFormSubmitted(true); // Indicar que el formulario fue enviado exitosamente
      changeStep(4); // Avanzar al paso de éxito
    } catch (error) {
      console.error("Error al enviar formulario:", error.response ? error.response.data : error.message);
      setSubmitError(error.response?.data?.message || "Ocurrió un error al enviar el formulario. Por favor intente nuevamente más tarde.");
    }
  };

  if (isPending) return (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
  
  if (error) {
    if (data) {
      console.error("Error al actualizar datos:", error);
      
    } else {
      // Solo mostrar página de error completa si no hay datos en absoluto
      return (
        <div className="text-center py-20 text-red-500">
          <i className="fas fa-exclamation-triangle text-3xl mb-3"></i>
          <p>Algo salió mal al cargar el artículo. Por favor, intenta de nuevo más tarde.</p>
          <p className="text-sm mt-2">{error.message}</p>
        </div>
      );
    }
  }

  if (!data) return (
    <div className="text-center py-20 text-gray-500">
      <i className="fas fa-search text-3xl mb-3"></i>
      <p>Artículo no encontrado o datos no disponibles.</p>
    </div>
  );


  // Mejorar la sanitización con más debugging
  const sanitizedContent = data?.content ? (() => {
  console.log("Contenido antes de sanitizar:", data.content.substring(0, 200) + "...");
  const sanitized = DOMPurify.sanitize(data.content, {
  ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'ul', 'ol', 'li', 'blockquote', 'img', 'em', 'strong', 'br', 'div', 'span'],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'style', 'align', 'data-align']
  });
  console.log("Contenido después de sanitizar:", sanitized.substring(0, 200) + "...");
  return sanitized;
  })() : "";
  const sanitizedDesc = data.desc ? DOMPurify.sanitize(data.desc).replace(/<[^>]+>/g, "").slice(0, 160) : "Descripción no disponible.";
  
  const formatDate = (dateString) => {
    if (!dateString) return "Fecha no disponible";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Fecha inválida";
    
    // Obtener los componentes de la fecha
    const day = date.getDate();
    const month = date.toLocaleString('es-ES', { month: 'short' });
    const year = date.getFullYear();
    
    return `${day} ${month}, ${year}`;
  };
  const handleNextStep = () => {
    if (currentStep === 3) {
        handleSubmitForm();
    } else if (currentStep < 4) { // pasos 1 y 2, simplemente avanza
        changeStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      changeStep(currentStep - 1);
    }
  };

  const getStepIndicatorClass = (stepNumber, type = "icon") => {
    if (type === "icon") {
      return currentStep >= stepNumber ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-700";
    }
    if (type === "line") {
      return currentStep > stepNumber ? "bg-blue-500" : "bg-gray-300";
    }
    if (type === "text") {
      return currentStep >= stepNumber ? "text-blue-600 font-semibold" : "text-gray-500";
    }
    return "";
  };
  


  return (
    <HelmetProvider>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Helmet>
          <title>{data.title || "Artículo"} | Blog</title>
          <meta name="description" content={sanitizedDesc} />
          <meta name="author" content={data.user ? data.user.username : 'Autor desconocido'} />
          <meta property="og:title" content={data.title || "Artículo"} />
          <meta property="og:description" content={sanitizedDesc} />
          <meta property="og:type" content="article" />
          {data.img && <meta property="og:image" content={data.img} />}
        </Helmet>

        <div className="relative flex-grow -mx-4 md:-mx-8 lg:-mx-16 xl:-mx-32 2xl:-mx-64 px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 py-8 bg-[#eff6ff]">
          <div className="absolute top-[-5px] left-0 right-0 h-1 shadow-top-bottom"></div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              {/* 1. Imagen principal del post */}
              {data.img && (
                <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
                  <Image 
                    src={data.img} 
                    className="w-full h-auto max-h-[500px] object-cover rounded-lg shadow-md" 
                    w="1200"
                    h="500"
                    alt={data.title || "Imagen del artículo"}
                  />
                </div>
              )}
              
              {/* 2. Título del post */}
              <div className="mb-4">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">{data.title}</h1>
                
                {/* 3. Información del autor, fecha y categoría */}
                <div className="flex flex-wrap items-center text-sm text-gray-600 mb-4">
                  <i className="fas fa-user-circle text-gray-500 mr-1"></i>
                  <span>Por </span>
                  {data.user ? (
                    <Link to={`/author/${data.user.username}`} className="text-blue-600 hover:underline mx-1">
                      {data.user.username}
                    </Link>
                  ) : (
                    <span className="text-gray-600 mx-1">Autor desconocido</span>
                  )}
                  <span className="mx-1">•</span>
                  <i className="fas fa-calendar-alt text-gray-500 mr-1"></i>
                  <span>Publicado: {formatDate(data.createdAt)}</span>
                  <span className="mx-1">•</span>
                  <span>Categoría: </span>
                  <Link to={`/posts?cat=${data.category}`} className="text-blue-600 hover:underline mx-1">
                    {data.category}
                  </Link>
                </div>
                
                {/* 4. Descripción del post con estilo morado */}
                {data.desc && (
                  <div className="mb-6 text-lg text-purple-700 bg-purple-50 p-5 rounded-lg border-l-4 border-purple-400 shadow-sm">
                    {sanitizedDesc}
                  </div>
                )}
              </div>
              
              {/* 5. Contenido completo del post */}
              <div 
                className="post-content prose prose-lg prose-img:m-0 prose-img:!inline max-w-none mb-12 bg-white p-6 rounded-lg shadow-sm"
              >
                {sanitizedContent ? (
                  <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
                ) : (
                  <p>No hay contenido disponible para este artículo.</p>
                )}
              </div>
              
              <h2 className="text-3xl font-bold text-center text-gray-700 mb-8">
                Formulario de Contacto Médico para Padres
              </h2>
              <div className="mb-12 bg-white rounded-lg shadow-lg p-6 md:p-8 text-gray-800">
                
                {/* Indicador de progreso */}
                <div className="flex items-center mb-8">
                  {/* Step 1 */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center ${getStepIndicatorClass(1)} transition-colors duration-300`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <p className={`text-xs mt-1 ${getStepIndicatorClass(1, "text")} transition-colors duration-300`}>Datos Padres</p>
                  </div>
                  <div className={`flex-grow h-1 mx-2 rounded-full ${getStepIndicatorClass(1, "line")} transition-colors duration-300`}></div>
                  {/* Step 2 */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center ${getStepIndicatorClass(2)} transition-colors duration-300`}>
                     {/* Icono cambiado a uno infantil */}
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M7 16a6 6 0 0 0 10 0" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" /></svg>
                    </div>
                     <p className={`text-xs mt-1 ${getStepIndicatorClass(2, "text")} transition-colors duration-300`}>Datos Niño/a</p>
                  </div>
                  <div className={`flex-grow h-1 mx-2 rounded-full ${getStepIndicatorClass(2, "line")} transition-colors duration-300`}></div>
                  {/* Step 3 */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center ${getStepIndicatorClass(3)} transition-colors duration-300`}>
                       {/* Icono cambiado a uno de comunicación/carta */}
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                    <p className={`text-xs mt-1 ${getStepIndicatorClass(3, "text")} transition-colors duration-300`}>Motivo Comunicación</p>
                  </div>
                  <div className={`flex-grow h-1 mx-2 rounded-full ${getStepIndicatorClass(3, "line")} transition-colors duration-300`}></div>
                  {/* Step 4 */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center ${getStepIndicatorClass(4)} transition-colors duration-300`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <p className={`text-xs mt-1 ${getStepIndicatorClass(4, "text")} transition-colors duration-300`}>Éxito</p>
                  </div>
                </div>
                
                {/* Mensaje de error global para el formulario */}
                {submitError && currentStep === 3 && ( // Mostrar error solo en el paso de envío si persiste
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                        {submitError}
                    </div>
                )}

                <div style={{ transition: 'opacity 0.3s ease-in-out', opacity: formOpacity }}>
                  {currentStep === 1 && (
                    <div>
                      <h2 className="text-2xl font-bold mb-6 text-gray-700">Datos del Padre/Madre/Tutor</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label htmlFor="parentName" className="block text-sm mb-2 text-gray-600">Nombres</label>
                          <input 
                            type="text" id="parentName" placeholder="Nombres del padre/madre/tutor"
                            value={formData.parentName} onChange={handleInputChange}
                            className="w-full bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label htmlFor="parentSurname" className="block text-sm mb-2 text-gray-600">Apellidos</label>
                          <input 
                            type="text" id="parentSurname" placeholder="Apellidos del padre/madre/tutor"
                            value={formData.parentSurname} onChange={handleInputChange}
                            className="w-full bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div>
                      <h2 className="text-2xl font-bold mb-6 text-gray-700">Datos del Niño/a</h2>
                      <div className="mb-6">
                        <label htmlFor="childName" className="block text-sm font-medium mb-1 text-gray-600">Nombre completo del Niño/a</label>
                        <input 
                          type="text" id="childName" placeholder="Ej: Juanito Pérez Rodríguez"
                          value={formData.childName} onChange={handleInputChange}
                          className="w-full bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div>
                          <label htmlFor="childGender" className="block text-sm font-medium mb-1 text-gray-600">Género</label>
                          <select 
                            id="childGender" value={formData.childGender} onChange={handleInputChange}
                            className="w-full bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">Seleccione...</option>
                            <option value="masculino">Masculino</option>
                            <option value="femenino">Femenino</option>
                            <option value="otro">Otro</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="childAge" className="block text-sm font-medium mb-1 text-gray-600">Número de Expediente</label>
                          <input 
                            type="text" id="childAge" placeholder="Ej: 74367401"
                            value={formData.childAge} onChange={handleInputChange}
                            className="w-full bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label htmlFor="childBirthDate" className="block text-sm font-medium mb-1 text-gray-600">Fecha de Nacimiento</label>
                          <input 
                            type="date" id="childBirthDate"
                            value={formData.childBirthDate} onChange={handleInputChange}
                            className="w-full bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div>
                      <h2 className="text-2xl font-bold mb-6 text-gray-700">Información de Contacto y Motivo</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label htmlFor="contactPhone" className="block text-sm font-medium mb-1 text-gray-600">Teléfono de Contacto</label>
                          <input 
                            type="tel" id="contactPhone" placeholder="Ej: (614) 123-4567"
                            value={formData.contactPhone} onChange={handleInputChange}
                            className="w-full bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label htmlFor="contactEmail" className="block text-sm font-medium mb-1 text-gray-600">Correo Electrónico</label>
                          <input 
                            type="email" id="contactEmail" placeholder="Ej: correo@ejemplo.com"
                            value={formData.contactEmail} onChange={handleInputChange}
                            className="w-full bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="mb-6">
                        <label htmlFor="consultationReason" className="block text-sm font-medium mb-1 text-gray-600">Motivo de la Consulta</label>
                        <textarea 
                          id="consultationReason" rows="5" placeholder="Describa brevemente el motivo de comunicación..."
                          value={formData.consultationReason} onChange={handleInputChange}
                          className="w-full bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        ></textarea>
                      </div>
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className="text-center py-8">
                      {formSubmitted && !submitError ? (
                        <>
                          <div className="w-20 h-20 rounded-full bg-green-500 text-white flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </div>
                          <h2 className="text-2xl font-bold mb-3 text-gray-700">¡Formulario Enviado con Éxito!</h2>
                          <p className="text-gray-600 mb-6">Gracias por contactarnos. Nos pondremos en contacto contigo pronto.</p>
                        </>
                      ) : submitError ? (
                         <>
                            <div className="w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <h2 className="text-2xl font-bold mb-3 text-red-700">Error al Enviar</h2>
                            <p className="text-gray-600 mb-6">{submitError}</p>
                         </>
                      ) : (
                        // Estado intermedio o inesperado
                        <p className="text-gray-600">Procesando...</p>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Botones de navegación del formulario */}
                {currentStep < 4 && (
                  <div className="flex justify-between items-center mt-8">
                    {currentStep > 1 ? (
                      <button 
                        onClick={handlePreviousStep}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-6 rounded-md transition duration-300"
                      >
                        Regresar
                      </button>
                    ) : ( <div></div> ) /* Placeholder para mantener el botón "Siguiente" a la derecha */}
                    
                    <button 
                      onClick={handleNextStep} 
                      className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-6 rounded-md transition duration-300"
                    >
                      {currentStep === 3 ? 'Enviar Formulario' : 'Siguiente'}
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Barra lateral */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-8">
                {/* Presentación de la institución */}
                <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
                  <div className="flex justify-center mb-2">
                    <img 
                      src="/LogoOficial_HIC.png" 
                      alt="Logo HIC" 
                      className="h-24 object-contain"
                    />
                  </div>
                  <p className="text-gray-600 text-sm">
                  El Hospital Infantil de las Californias brinda desde 1994 servicios de salud a niños, niñas y adolescentes desde recién nacidos hasta cumplir 18 años de edad, sin importar su nivel socioeconómico, raza o religión. Cuenta con más de 20 especialidades pediátricas, cirugías de corta estancia, farmacia, rehabilitación y terapia física, Centro Integral de Psicología y Psicopedagogía Infantil, Clínica de Odontología Infantil, así como programas educativos enfocados en la nutrición y prevención.
                  </p>
                </div>
                
                {/* Categorías - Estilo SideMenu */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Categorías</h2>
                  
                  <div className="flex flex-col gap-4">
                    {categoriesStatus === "loading" ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                      </div>
                    ) : categoriesStatus === "error" ? (
                      <div className="text-center py-4 text-red-500">
                        Error al cargar categorías
                      </div>
                    ) : categoriesData && categoriesData.length > 0 ? (
                      categoriesData.map((category) => (
                        <Link key={category._id} to={`/posts?cat=${category.slug}`} className="block transform transition-transform hover:-translate-y-1">
                          <PuzzleCard 
                            pieceBg={category.color.startsWith('#') ? '' : category.color || "bg-[#375D9D] text-white"} 
                            pageBg="bg-white"
                            className={category.color.startsWith('#') ? '' : category.hoverColor || "hover:bg-[#2A4A80]"}
                            style={category.color.startsWith('#') ? { 
                              backgroundColor: category.color, 
                              color: 'white',
                              ':hover': { backgroundColor: category.hoverColor?.replace('hover:bg-[', '').replace(']', '') || category.color }
                            } : {}}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center icon-coin-flip">
                                <i className={category.icon || "fas fa-folder"}></i>
                              </div>
                              <h3 className="text-sm font-medium">{category.name}</h3>
                            </div>
                          </PuzzleCard>
                        </Link>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        No hay categorías disponibles
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="-mx-4 md:-mx-8 lg:-mx-16 xl:-mx-32 2xl:-mx-64 mt-auto">
          <Footer />
        </div>
        
        {/* Botón flotante para crear artículos */}
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
              <span className="absolute left-[50px] opacity-0 text-white text-sm font-medium transition-all duration-500 group-hover:opacity-100 whitespace-nowrap">
                Crear artículo
              </span>
            </Link>
          </div>
        )}
        
        <style jsx>{`
          .shadow-inner-bottom { box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1); }
          .shadow-top-bottom { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          
          .puzzle-piece {
            position: relative;
          }
          
          /* Animación para los iconos */
          .icon-coin-flip {
            transition: transform 0.6s;
            transform-style: preserve-3d;
          }
          
          .puzzle-piece:hover .icon-coin-flip {
            transform: rotateY(180deg);
            animation: coinFlip 1.5s infinite;
          }
          
          @keyframes coinFlip {
            0% {
              transform: rotateY(0);
            }
            50% {
              transform: rotateY(180deg);
            }
            100% {
              transform: rotateY(360deg);
            }
          }
          
          @keyframes scale-in {
            0% { transform: scale(0); }
            80% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
          
          .animate-scale-in {
            animation: scale-in 0.3s ease-out forwards;
          }
        `}</style>
      </div>
    </HelmetProvider>
  );
};

export default SinglePostPage;