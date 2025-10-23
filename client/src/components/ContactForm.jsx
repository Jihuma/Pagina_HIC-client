import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const ContactForm = ({ onClose }) => {
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
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
  
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/contact-forms`, {
        ...formData,
        postId: null // Explícitamente indicar que no hay post relacionado
      });
      setSubmitSuccess(true);
      toast.success("Formulario enviado con éxito");
      setTimeout(() => {
        onClose && onClose();
      }, 3000);
    } catch (error) {
      console.error("Error al enviar el formulario:", error);
      setSubmitError("Hubo un error al enviar el formulario. Por favor, inténtelo de nuevo.");
      toast.error("Error al enviar el formulario");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
        <div className="text-center py-8">
          <div className="w-20 h-20 rounded-full bg-green-500 text-white flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-3 text-gray-700">¡Formulario Enviado con Éxito!</h2>
          <p className="text-gray-600 mb-6">Gracias por contactarnos. Nos pondremos en contacto contigo pronto.</p>
          <button 
            onClick={onClose}
            className="mt-4 bg-purple-500 hover:bg-purple-600 text-white py-2 px-6 rounded-md transition duration-300"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-700">Formulario de Contacto Médico</h2>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {submitError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {submitError}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Datos del Padre/Madre/Tutor */}
          <div>
            <label htmlFor="parentName" className="block text-sm mb-1 text-gray-600">Nombres</label>
            <input 
              type="text" id="parentName" placeholder="Nombres del padre/madre/tutor"
              value={formData.parentName} onChange={handleInputChange}
              className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="parentSurname" className="block text-sm mb-1 text-gray-600">Apellidos</label>
            <input 
              type="text" id="parentSurname" placeholder="Apellidos del padre/madre/tutor"
              value={formData.parentSurname} onChange={handleInputChange}
              className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="childName" className="block text-sm mb-1 text-gray-600">Nombre del Niño/a</label>
            <input 
              type="text" id="childName" placeholder="Nombre completo del niño/a"
              value={formData.childName} onChange={handleInputChange}
              className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label htmlFor="childGender" className="block text-sm mb-1 text-gray-600">Género</label>
            <select 
              id="childGender" value={formData.childGender} onChange={handleInputChange}
              className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Seleccione...</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label htmlFor="childAge" className="block text-sm mb-1 text-gray-600">Número de Expediente</label>
            <input 
              type="text" id="childAge" placeholder="Ej: 74367401"
              value={formData.childAge} onChange={handleInputChange}
              className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="childBirthDate" className="block text-sm mb-1 text-gray-600">Fecha de Nacimiento</label>
            <input 
              type="date" id="childBirthDate"
              value={formData.childBirthDate} onChange={handleInputChange}
              className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="contactPhone" className="block text-sm mb-1 text-gray-600">Teléfono de Contacto</label>
            <input 
              type="tel" id="contactPhone" placeholder="Ej: (614) 123-4567"
              value={formData.contactPhone} onChange={handleInputChange}
              className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="contactEmail" className="block text-sm mb-1 text-gray-600">Correo Electrónico</label>
            <input 
              type="email" id="contactEmail" placeholder="Ej: correo@ejemplo.com"
              value={formData.contactEmail} onChange={handleInputChange}
              className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
        </div>
        
        <div className="mb-6">
          <label htmlFor="consultationReason" className="block text-sm mb-1 text-gray-600">Motivo de la Consulta</label>
          <textarea 
            id="consultationReason" rows="3" placeholder="Describa brevemente el motivo de comunicación..."
            value={formData.consultationReason} onChange={handleInputChange}
            className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            required
          ></textarea>
        </div>
        
        <div className="flex justify-end">
          <button 
            type="submit"
            disabled={isSubmitting}
            className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-6 rounded-md transition duration-300 disabled:opacity-70"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Formulario'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContactForm;