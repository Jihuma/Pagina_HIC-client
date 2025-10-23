import React, { useState, useEffect } from 'react'
import { SignIn } from "@clerk/clerk-react"

// Array de imágenes PNG disponibles
const PNG_IMAGES = [
  '/amarillo.png',
  '/rojo.png',
  '/azul.png',
  '/verde.png'
];

const getShuffledImages = (count) => {
  const result = [];
  let lastImage = null;
  
  for (let i = 0; i < count; i++) {
    let availableImages = PNG_IMAGES.filter(img => img !== lastImage);
    if (availableImages.length === 0) {
      availableImages = PNG_IMAGES;
    }
    
    const randomImage = availableImages[Math.floor(Math.random() * availableImages.length)];
    result.push(randomImage);
    lastImage = randomImage;
  }
  
  return result;
};

const ScrollingImagesBackground = () => {
  const [images, setImages] = useState([]);
  const imagesPerRow = 25;
  const imageSize = "2.5rem";
  const animationDuration = '680s'; // Velocidad más lenta

  useEffect(() => {
    setImages(getShuffledImages(imagesPerRow));
  }, []);

  const displayedImages = [...images, ...images, ...images];

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      {Array.from({ length: 12 }).map((_, rowIndex) => {
        // Generar una secuencia diferente para cada fila
        const rowImages = getShuffledImages(imagesPerRow);
        const rowDisplayedImages = [...rowImages, ...rowImages, ...rowImages];
        
        return (
          <div
            key={rowIndex}
            className="flex whitespace-nowrap absolute"
            style={{
              top: `${rowIndex * 8}%`,
              left: rowIndex % 2 === 0 ? '0%' : '-10%',
              width: '120%',
              height: '8%',
              alignItems: 'center'
            }}
          >
            <div
              className="flex animate-scroll-horizontal"
              style={{
                animationDuration: `${parseInt(animationDuration) + (rowIndex % 3) * 10}s`, // Más variación en velocidad
                animationDelay: `${(rowIndex % 4) * -15}s`,
                animationDirection: rowIndex % 2 === 0 ? 'normal' : 'reverse'
              }}
            >
              {rowDisplayedImages.map((imageSrc, index) => (
                <div 
                  key={`${rowIndex}-${index}`} 
                  className="flex-shrink-0 flex items-center justify-center"
                  style={{
                    width: '6rem',
                    height: '6rem',
                    marginRight: '2rem'
                  }}
                >
                  <img 
                    src={imageSrc}
                    alt="Decorative icon"
                    style={{ 
                      width: imageSize,
                      height: imageSize,
                      opacity: 0.4,
                      objectFit: 'contain',
                      filter: 'brightness(1.2)'
                    }} 
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const StyleInjector = () => {
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = `
      @keyframes scroll-horizontal {
        0% {
          transform: translateX(0%);
        }
        100% {
          transform: translateX(-${100 / 3}%);
        }
      }
      .animate-scroll-horizontal {
        animation: scroll-horizontal linear infinite;
      }
    `;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);
  return null;
};

const LoginPage = () => {
  return (
    <>
      <StyleInjector />
      <div className="relative w-full h-[calc(100vh-80px)] flex items-center justify-center">
        {/* Fondo con animación que cubre toda la sección */}
        <div 
          className="absolute inset-0 z-0" 
          style={{
            backgroundColor: "#522c45",
            width: "100vw",
            left: "50%",
            right: "50%",
            marginLeft: "-50vw",
            marginRight: "-50vw",
            position: "absolute",
            top: "-80px",
            height: "calc(100% + 80px)"
          }}
        >
          <ScrollingImagesBackground />
        </div>
        
        <div className="relative z-10 bg-white p-6 rounded-lg shadow-lg bg-opacity-90">
          <SignIn signUpUrl="/register"/>
        </div>
      </div>
    </>
  )
}

export default LoginPage