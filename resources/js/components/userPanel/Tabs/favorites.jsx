import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../RUTAS/AuthContext';
import sharedStyles from '../../../../css/panelShared.module.css';
import ownStyles from '../userPanel.module.css';
const styles = { ...sharedStyles, ...ownStyles };

function Favoritos() {
  const [actionInProgress, setActionInProgress] = useState(null);
  
  // Obtener las funciones y estados de favoritos del contexto
  const { 
    isAuthenticated,
    favorites, 
    favoritesLoading, 
    favoritesError, 
    favoritesNotification,
    addToCart, 
    removeFavorite,
    fetchFavorites 
  } = useContext(AuthContext);

  // Cargar favoritos al montar el componente
  useEffect(() => {
    fetchFavorites();
  }, [isAuthenticated]);

  // Función para eliminar un favorito
  const handleRemove = async (favoriteId, productId) => {
    try {
      setActionInProgress(favoriteId);
      
      const success = await removeFavorite(favoriteId, productId);
      
      if (!success) {
        // El error ya se maneja en el contexto con las notificaciones
        console.error('No se pudo eliminar el favorito');
      }
      
    } catch (err) {
      console.error('Error al eliminar favorito:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  // Función para añadir producto al carrito
  const handleAddToCart = async (product) => {
    try {
      setActionInProgress(`cart-${product.producto_id || product.id}`);
      
      // Verificar si hay stock disponible
      if (product.stock <= 0) {
        alert('Este producto no tiene stock disponible');
        return;
      }
      
      // Crear objeto del producto con la estructura que espera addToCart
      const productForCart = {
        id: product.producto_id || product.id,
        nombre: product.name,
        precio: parseFloat(product.raw_price || product.price?.replace('€', '').trim() || 0),
        precio_original: product.precio_original,
        en_oferta: product.en_oferta,
        imagen_url: product.image,
        categoria_nombre: product.category,
        stock: product.stock
      };
      
      // Llamar a la función addToCart del contexto
      const success = await addToCart(productForCart, 1);
      
      if (!success) {
        console.error('No se pudo añadir el producto al carrito');
      }
      
    } catch (err) {
      console.error('Error al añadir al carrito:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  // Función para ir a la tienda
  const handleGoToShop = () => {
    // Navegar a la página de productos
    window.location.href = '/productos';
  };

  if (favoritesLoading && favorites.length === 0) {
    return (
      <div className={`${styles.tabPane} ${styles.minHeight}`}>
        <h2>Mis favoritos</h2>
        <div className={styles.loading}>Cargando favoritos...</div>
      </div>
    );
  }

  return (
    <div className={`${styles.tabPane} ${styles.minHeight}`}>
      <h2>Mis favoritos</h2>
      
      {/* Mostrar advertencia si no está autenticado pero tiene favoritos */}
      {!isAuthenticated && favorites.length > 0 && (
        <div className={styles.alertInfo}>
          <p>Tus favoritos se están guardando localmente. Para guardarlos permanentemente, inicia sesión.</p>
          <Link to="/login" className={styles.btnLogin}>
            Iniciar sesión
          </Link>
        </div>
      )}
      
      {favoritesError && (
        <div className={styles.alertError}>
          {favoritesError}
        </div>
      )}
      
      {favoritesNotification && (
        <div className={`${styles.alert} ${favoritesNotification.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
          {favoritesNotification.message}
        </div>
      )}
      
      {/* Lista de productos favoritos */}
      <div className={styles.direccionesLista}>
        {favorites.map(product => (
          <div className={styles.direccionCard} key={product.id || product.producto_id}>
            <div className={styles.productoInfo}>
              {product.image && (
                <div className={styles.productoImagen}>
                  <img src={product.image} alt={product.name} />
                </div>
              )}
              
              <div className={styles.productoDetalles}>
                <div className={styles.direccionHeader}>
                  <h3>
                    <Link 
                      to={`/producto/${product.producto_id || product.id}`} 
                      className={styles.productoLink}
                    >
                      {product.name}
                    </Link>
                  </h3>
                  <div className={styles.direccionActions}>
                    <button 
                      className={styles.btnEditar} 
                      onClick={() => handleAddToCart(product)}
                      disabled={
                        actionInProgress === `cart-${product.producto_id || product.id}` || 
                        product.stock <= 0
                      }
                    >
                      {actionInProgress === `cart-${product.producto_id || product.id}` ? 
                        'Añadiendo...' : 
                        product.stock <= 0 ? 'Sin stock' : 'Añadir al carrito'
                      }
                    </button>
                    <button 
                      className={styles.btnEliminar} 
                      onClick={() => handleRemove(
                        product.id, 
                        product.producto_id || product.id
                      )}
                      disabled={actionInProgress === product.id}
                    >
                      {actionInProgress === product.id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                </div>
                <p><strong>Precio:</strong> {product.price}</p>
                <p><strong>Categoría:</strong> {product.category}</p>
                {product.stock <= 0 && (
                  <p className={styles.outOfStock}>Sin stock disponible</p>
                )}
                {product.stock > 0 && (
                  <p className={styles.stockAvailable}>Stock: {product.stock}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {favorites.length === 0 && (
        <div className={styles.emptyState}>
          <p>
            {isAuthenticated ? 
              'No tienes productos favoritos guardados.' : 
              'No tienes productos favoritos. Explora nuestra tienda y guarda tus productos favoritos.'
            }
          </p>
          <button className={styles.btnNuevaDireccion} onClick={handleGoToShop}>
            Explorar productos
          </button>
        </div>
      )}
      
      {favoritesLoading && favorites.length > 0 && (
        <div className={styles.loadingOverlay}>
          Actualizando favoritos...
        </div>
      )}
    </div>
  );
}

export default Favoritos;