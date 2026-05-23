import React, { useState } from 'react';
import styles from './ShoppingCart.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faSpinner, faImage } from '@fortawesome/free-solid-svg-icons';

function CartItem({ item, updateQuantity, removeItem }) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleIncrement = async () => {
    if (updating) return; // Prevenir múltiples clicks
    
    try {
      setUpdating(true);
      await updateQuantity(item.producto_id, item.cantidad + 1);
    } catch (error) {
      console.error("Error incrementando cantidad:", error);
    } finally {
      setUpdating(false);
    }
  };
  
  const handleDecrement = async () => {
    if (updating || item.cantidad <= 1) return; // Prevenir múltiples clicks o decrementar por debajo de 1
    
    try {
      setUpdating(true);
      await updateQuantity(item.producto_id, item.cantidad - 1);
    } catch (error) {
      console.error("Error decrementando cantidad:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (removing) return; // Prevenir múltiples clicks
    
    try {
      setRemoving(true);
      await removeItem(item.producto_id);
      
    } catch (error) {
      console.error("Error eliminando producto:", error);
      setRemoving(false); // Solo setear a false si hay error, para que el usuario pueda intentar de nuevo
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  // Calcular el subtotal con validación
  const calculateSubtotal = () => {
    const precio = parseFloat(item.precio) || 0;
    const cantidad = parseInt(item.cantidad) || 0;
    return precio * cantidad;
  };

  const subtotal = calculateSubtotal();

  // URL de imagen por defecto para usar en caso de error o mientras se carga
  const defaultImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' fill='%23999' text-anchor='middle' dy='.3em'%3ENo image%3C/text%3E%3C/svg%3E";

  // Determinar la URL de la imagen (con un placeholder por defecto si no hay imagen)
  const imageUrl = item.imagen_url || item.image || defaultImage;

  // Nombre del producto 
  const productName = item.producto_nombre || item.name || 'Producto sin nombre';

  // Formatear precio con validación
  const formatPrice = (price) => {
    const numPrice = parseFloat(price) || 0;
    return numPrice.toFixed(2);
  };

  return (
    <tr className={styles.productRow}>
      <td>
        <div className={styles.productDetails}>
          <div className={styles.productImage}>
            {imageLoading && (
              <div className={styles.imageLoader}>
                <div className={styles.spinner}></div>
              </div>
            )}
            
            {imageError ? (
              <div className={styles.imagePlaceholder}>
                <FontAwesomeIcon icon={faImage} />
              </div>
            ) : (
              <img 
                src={imageUrl}
                alt={item.alt || productName}
                style={{ display: imageLoading ? 'none' : 'block' }}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            )}
          </div>
          <div className={styles.productInfo}>
            <div className={styles.productName}>{productName}</div>
            <div className={styles.productPrice}>
              {item.en_oferta && item.precio_original && (
                <span className={styles.precioOriginal}>
                  {formatPrice(item.precio_original)} €
                </span>
              )}
              {formatPrice(item.precio)} €
            </div>
            <button
              className={styles.buttonDelete} 
              onClick={handleRemove}
              disabled={removing || updating}
              title="Eliminar producto del carrito"
            >
              {removing ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                <>
                  <FontAwesomeIcon icon={faTrash} /> Eliminar
                </>
              )}
            </button>
          </div>
        </div>
      </td>
      <td>
        <div className={styles.quantitySelector}>
          <button 
            className={styles.quantityBtn} 
            onClick={handleDecrement}
            disabled={updating || removing || item.cantidad <= 1}
            title="Disminuir cantidad"
          >
            -
          </button>
          <div className={styles.quantityValue}>
            {updating ? (
              <div className={styles.miniSpinner}>
                <FontAwesomeIcon icon={faSpinner} spin />
              </div>
            ) : (
              item.cantidad || 0
            )}
          </div>
          <button 
            className={styles.quantityBtn} 
            onClick={handleIncrement}
            disabled={updating || removing}
            title="Aumentar cantidad"
          >
            +
          </button>
        </div>
      </td>
      <td className={styles.productSubtotal}>
        {subtotal.toFixed(2)} €
      </td>
    </tr>
  );
}

export default CartItem;