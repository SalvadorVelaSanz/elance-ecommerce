import React, { useEffect, useRef } from 'react';
import styles from './marcasCarrusel.module.css';

const MarcasCarrusel = () => {
  // Referencias para los contenedores del carrusel
  const carruselRef = useRef(null);
  
  
  const marcas = [
    { id: 1, name: "Marca 1", imageUrl: "/images/Burberry-Logo.png", alt: "Logo Marca 1" },
    { id: 2, name: "Marca 2", imageUrl: "/images/CK_Calvin_Klein_logo.png", alt: "Logo Marca 2" },
    { id: 3, name: "Marca 3", imageUrl: "/images/nike-logo-1995.png", alt: "Logo Marca 3" },
    { id: 4, name: "Marca 4", imageUrl: "/images/ZARA-logo.png", alt: "Logo Marca 4" },
    { id: 5, name: "Marca 5", imageUrl: "/images/adidas-logo.png", alt: "Logo Marca 5" },
  ];

  // Para crear un efecto de carrusel infinito, se duplican los elementos TRES VECES
  const allMarcas = [...marcas, ...marcas, ...marcas];

  return (
    <div className={styles.carruselContainer}>
      <div className={styles.carrusel} ref={carruselRef}>
        {allMarcas.map((marca, index) => (
          <div key={`${marca.id}-${index}`} className={styles.marcaItem}>
            <img src={marca.imageUrl} alt={marca.alt} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarcasCarrusel;