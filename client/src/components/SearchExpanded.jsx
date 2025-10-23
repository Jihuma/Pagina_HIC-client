import { useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const SearchExpanded = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentSearch = searchParams.get("search");

  // Manejar cambios en el input
  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/posts?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // Manejar reinicio de búsqueda
  const handleReset = () => {
    setSearchTerm('');
    navigate('/posts');
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div 
          ref={searchContainerRef}
          className="bg-gray-100 p-2 rounded-full flex items-center gap-2 w-full transition-all duration-300 ease-in-out"
        >
          <button type="submit" className="focus:outline-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="gray"
              className="min-w-5"
            >
              <circle cx="10.5" cy="10.5" r="7.5" />
              <line x1="16.5" y1="16.5" x2="22" y2="22"/>
            </svg>
          </button>
          <input 
            type="text" 
            placeholder="search a post..." 
            className="bg-transparent outline-none w-full"
            ref={inputRef}
            value={searchTerm}
            onChange={handleInputChange}
          />
        </div>
      </form>
      
      {/* Botón de reinicio - solo visible cuando hay una búsqueda activa */}
      {currentSearch && (
        <div className="mt-2 text-center">
          <button 
            onClick={handleReset}
            className="text-sm text-blue-800 hover:text-blue-900 transition-colors flex items-center justify-center mx-auto"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="mr-1"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            Reiniciar búsqueda
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchExpanded;