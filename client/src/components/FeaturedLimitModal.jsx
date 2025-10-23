import React from "react";

const FeaturedLimitModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-700">Límite de Posts Destacados</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-yellow-500 text-white flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-3 text-gray-700">Ya hay 3 posts destacados</h3>
          <p className="text-gray-600 mb-6">Para destacar este post, primero debes quitar el destacado a uno de los posts actuales.</p>
          <button 
            onClick={onClose}
            className="mt-4 bg-purple-500 hover:bg-purple-600 text-white py-2 px-6 rounded-md transition duration-300"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedLimitModal;