import { IKImage } from 'imagekitio-react';

const Image = ({src, className, w, h, alt}) => {
  // Verificar si src es una URL completa o una ruta relativa
  const isFullUrl = src && (src.startsWith('http://') || src.startsWith('https://'));
  
  // Si es una URL completa de ImageKit, extraer la ruta
  let path = src;
  if (isFullUrl && src.includes(import.meta.env.VITE_Ik_URL_ENDPOINT)) {
    // Extraer la ruta de la URL completa
    const urlEndpoint = import.meta.env.VITE_Ik_URL_ENDPOINT;
    path = src.substring(src.indexOf(urlEndpoint) + urlEndpoint.length);
  }
  
  return (
    <IKImage 
      urlEndpoint={import.meta.env.VITE_Ik_URL_ENDPOINT}
      path={path} 
      className={className} 
      loading='lazy'
      lqip={{ active: true, quality: 20 }}
      alt={alt}
      width={w}
      height={h}
      transformation={[
        {
          width: w,
          height: h,
        },
      ]}
    />
  );
};

export default Image;