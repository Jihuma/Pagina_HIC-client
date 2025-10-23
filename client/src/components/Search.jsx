import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Search = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const navigate = useNavigate();

  // Función para expandir el campo de búsqueda
  const handleMouseEnter = () => {
    setIsExpanded(true);
  };

  // Función para contraer el campo de búsqueda si no tiene foco
  const handleMouseLeave = () => {
    if (document.activeElement !== inputRef.current) {
      setIsExpanded(false);
    }
  };

  // Función para contraer el campo cuando se pierde el foco
  const handleBlur = () => {
    // Solo contraer si el campo está vacío
    if (!searchTerm.trim()) {
      setIsExpanded(false);
    }
  };

  // Función para enfocar el input cuando se expande
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Función para manejar clics fuera del componente
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        // Solo contraer si el campo está vacío
        if (!searchTerm.trim()) {
          setIsExpanded(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchTerm]);

  // Manejar cambios en el input
  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/posts?search=${encodeURIComponent(searchTerm.trim())}`);
      // Opcional: contraer después de enviar
      setIsExpanded(false);
      setSearchTerm('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div 
        ref={searchContainerRef}
        className={`bg-gray-100 p-2 rounded-full flex items-center gap-2 transition-all duration-300 ease-in-out ${isExpanded ? 'w-64' : 'w-10 hover:bg-gray-200 cursor-pointer'}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button 
          type="submit" 
          className="focus:outline-none"
          onClick={() => {
            if (!isExpanded) {
              setIsExpanded(true);
              return;
            }
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="gray"
            className={`min-w-5 ${isExpanded ? '' : 'mx-auto'}`}
          >
            <circle cx="10.5" cy="10.5" r="7.5" />
            <line x1="16.5" y1="16.5" x2="22" y2="22"/>
          </svg>
        </button>
        <input 
          type="text" 
          placeholder="search a post..." 
          className={`bg-transparent outline-none transition-all duration-300 ${isExpanded ? 'w-full opacity-100' : 'w-0 opacity-0 absolute'}`}
          ref={inputRef}
          value={searchTerm}
          onChange={handleInputChange}
          onBlur={handleBlur}
        />
      </div>
    </form>
  );
};

export default Search;