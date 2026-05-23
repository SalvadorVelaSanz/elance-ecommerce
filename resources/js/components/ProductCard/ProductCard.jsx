import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import styles from './ProductCard.module.css';
import axios from 'axios';
import { AuthContext } from '../RUTAS/AuthContext';
import Swal from 'sweetalert2';

const ProductCard = ({ id, imageUrl, name, category, price, oldPrice, onSale, stock }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [stockAvailable, setStockAvailable] = useState(true);
  
  const { 
    isAuthenticated, 
    user, 
    addToCart, 
    toggleFavorite, 
    isFavorite,
    favoritesLoading
  } = useContext(AuthContext);

  // Función para obtener la primera imagen de las URLs separadas por "|"
  const getFirstImage = (imageUrlString) => {
    if (!imageUrlString) return '';
    
    // Si hay múltiples URLs separadas por "|", tomar solo la primera
    const urls = imageUrlString.split('|').map(url => url.trim());
    return urls[0] || '';
  };

  // Verificar stock disponible al cargar el componente
  useEffect(() => {
    if (stock !== null && stock <= 0) {
      setStockAvailable(false);
    }
  }, [stock]);

  // Verificar si el producto está en favoritos usando el contexto
  const isProductFavorite = isFavorite(id);

  // Manejar click en el corazón de favoritos
  const handleFavoriteClick = async (e) => {
    e.preventDefault(); // Prevenir que se active el Link
    e.stopPropagation(); // Evitar propagación del evento
    
    if (!isAuthenticated) {
      Swal.fire({
        title: '¡Atención!',
        text: 'Puedes añadir productos a favoritos sin iniciar sesión, pero se guardarán localmente. Para guardarlos permanentemente, inicia sesión.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Continuar sin sesión',
        cancelButtonText: 'Ir a login',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#28a745'
      }).then((result) => {
        if (result.isConfirmed) {
          // Continuar con la operación de favoritos
          handleToggleFavorite();
        } else {
          // Redirigir al login
          window.location.href = '/login';
        }
      });
      return;
    }

    handleToggleFavorite();
  };

  // Función auxiliar para toggle de favoritos
  const handleToggleFavorite = async () => {
    setIsLoading(true);
    
    try {
      // Crear objeto del producto para favoritos
      const productForFavorites = {
        id: id,
        nombre: name,
        precio: parseFloat(price?.replace('€', '').trim() || 0),
        precio_original: oldPrice ? parseFloat(oldPrice.replace('€', '').trim()) : null,
        en_oferta: onSale,
        imagen_url: getFirstImage(imageUrl),
        imagen_principal: getFirstImage(imageUrl),
        categoria_nombre: category,
        stock: stock,
        slug: null // Se puede añadir si tiene slug disponible
      };
      
      await toggleFavorite(productForFavorites);
      
    } catch (error) {
      console.error('Error al gestionar favoritos:', error);
      
      Swal.fire({
        title: 'Error',
        text: 'No se pudo gestionar el favorito. Inténtalo de nuevo.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar click en el botón de añadir al carrito
  const handleAddToCart = async (e) => {
    e.preventDefault(); // Prevenir que se active el Link
    e.stopPropagation(); // Evitar propagación del evento
    
    // Verificar stock antes de proceder
    if (!stockAvailable) {
      Swal.fire({
        title: 'Producto agotado',
        text: 'Este producto no tiene stock disponible',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }
    
    setAddingToCart(true);
    
    try {
      // Obtener la información completa del producto
      const response = await axios.get(`/api/producto/${id}`);
      const product = response.data.data;
      
      // Verificar stock actualizado del servidor
      if (product.stock !== null && product.stock <= 0) {
        Swal.fire({
          title: 'Producto agotado',
          text: 'Este producto se ha agotado recientemente',
          icon: 'warning',
          confirmButtonText: 'Entendido'
        });
        setStockAvailable(false);
        return;
      }
      
      // Añadir al carrito usando la función del contexto
      const success = await addToCart(product, 1);
      
      if (success) {
        // Mostrar mensaje de éxito con SweetAlert
        Swal.fire({
          title: '¡Producto añadido!',
          text: `${name} ha sido añadido a tu carrito`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Error al añadir al carrito:', error);
      
      // Mostrar mensaje de error con SweetAlert
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'No se pudo añadir el producto al carrito',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setAddingToCart(false);
    }
  };

  // Obtener la primera imagen para mostrar en la tarjeta
  const displayImage = getFirstImage(imageUrl);

  return (
    <div className={`${styles.cardProducto} ${isProductFavorite ? styles.isFavorite : ''} ${!stockAvailable ? styles.outOfStock : ''}`}>
      {/* Zona de corazón para favoritos */}
      <div 
        className={styles.favoriteIcon} 
        onClick={handleFavoriteClick}
        aria-label={isProductFavorite ? "Eliminar de favoritos" : "Añadir a favoritos"}
        role="button"
      >
        {isLoading || favoritesLoading ? '•' : null}
      </div>
      
      <Link to={`/producto/${id}`}>
        <img src={displayImage || ""} alt={name || ""} />
      </Link>
      
      <div className={styles.precioAccion}>
        <p>{name || "N_Producto"}</p>
        <button 
          onClick={handleAddToCart}
          disabled={addingToCart || !stockAvailable}
          className={`${addingToCart ? styles.loadingBtn : ''} ${!stockAvailable ? styles.disabledBtn : ''}`}
          title={!stockAvailable ? 'Producto agotado' : 'Añadir al carrito'}
        >
          {!stockAvailable ? '✕' : addingToCart ? '...' : '+'}
        </button>
      </div>
      
      <p>{category || "C_Producto"}</p>
      
      <div className={styles.priceContainer}>
        {oldPrice && <span className={styles.precioDescuento}>{oldPrice}</span>}
        <span className={styles.precio}>{price || "€_Producto"}</span>
      </div>
      
      {/* Información de stock */}
      {stock !== null && (
        <div className={styles.stockInfo}>
          {stockAvailable ? (
            <span>Stock: {stock}</span>
          ) : (
            <span>Sin stock</span>
          )}
        </div>
      )}
      
      {/* Mostrar si está en favoritos (para usuarios no autenticados) */}
      {!isAuthenticated && isProductFavorite && (
        <div className={styles.localFavoriteIndicator}>
          <span>⭐ Guardado localmente</span>
        </div>
      )}
    </div>
  );
};

export default ProductCard;