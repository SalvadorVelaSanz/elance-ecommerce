import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../ProductCard/ProductCard';
import styles from './detalleProducto.module.css';
import Header from '../header/Header';
import Footer from '../footer/Footer'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faHeart, faPlus, faEdit, faTrash, faShoppingCart, faCheck } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular, faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';
import { AuthContext } from '../RUTAS/AuthContext';
import Swal from 'sweetalert2';

const ProductDetail = () => {
  const { id } = useParams(); // Obtener el ID del producto de la URL
  // Estado para almacenar los datos del producto y otros estados
  const [producto, setProducto] = useState(null); 
  // Estado para almacenar productos relacionados
  const [relatedProducts, setRelatedProducts] = useState([]);
  // Estado para controlar la carga de datos
  const [loading, setLoading] = useState(true);
  // Estado para manejar la cantidad de producto a añadir al carrito
  const [quantity, setQuantity] = useState(1);
  // Estado para verificar disponibilidad de stock
  const [stockAvailable, setStockAvailable] = useState(true);
  // Estado para manejar la puntuación y el texto de la reseña
  const [selectedRating, setSelectedRating] = useState(0);
  // Estado para manejar el texto de la reseña
  const [reviewText, setReviewText] = useState('');
  // Estado para manejar la imagen activa
  const [activeImage, setActiveImage] = useState('');
  // Estado para manejar la reseña del usuario
  const [reviews, setReviews] = useState([]);
  // Estado para manejar la reseña del usuario
  const [userReview, setUserReview] = useState(null);
  // Estado para manejar la edición de reseñas
  const [isEditing, setIsEditing] = useState(false);
  // Estado para manejar errores en el formulario
  const [formError, setFormError] = useState('');
  // Estado para manejar el envío del formulario
  const [submitting, setSubmitting] = useState(false);
  // Estado para manejar la eliminación de reseñas
  const [deleting, setDeleting] = useState(false);
  
  // Usar el contexto de autenticación y favoritos
  const { 
    isAuthenticated, 
    user, 
    addToCart, 
    cartLoading,
    toggleFavorite,
    isFavorite,
    favoritesLoading
  } = useContext(AuthContext);
  const navigate = useNavigate();
  

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const response = await axios.get(`/api/producto/${id}`);
        const data = response.data; 
        
        setProducto(data.data);
        setRelatedProducts(data.relacionados);
        
        // Verificar stock disponible
        if (data.data.stock !== null && data.data.stock <= 0) {
          setStockAvailable(false);
        }
        
        // Si el producto tiene imágenes, establecer la primera como activa
        if (data.data.imagen_url) {
          const imagenes = data.data.imagen_url.split('|').map(url => url.trim());
          setActiveImage(imagenes[0]); // Primera imagen como principal
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching product data:', error);
        setLoading(false);
      }
    };
    
    fetchProductData();
    fetchReviews();
    
    // Si el usuario está autenticado, verificar si ya tiene una reseña
    if (isAuthenticated) {
      checkUserReview();
    }
  }, [id, isAuthenticated]);

  // Obtener reseñas del producto
  const fetchReviews = async () => {
    try {
      const response = await axios.get(`/api/resenas/producto/${id}`);
      setReviews(response.data.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  // Verificar si el usuario ya tiene una reseña para este producto
  const checkUserReview = async () => {
    try {
      const response = await axios.get(`/api/resenas/check/${id}`);
      if (response.data.hasReview) {
        setUserReview(response.data.data);
        setSelectedRating(response.data.data.puntuacion);
        setReviewText(response.data.data.comentario);
      }
    } catch (error) {
      console.error('Error checking user review:', error);
    }
  };

  // Manejar añadir/eliminar de favoritos usando el contexto
  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      // Mostrar alerta preguntando al usuario
      const result = await Swal.fire({
        title: '¡Atención!',
        text: 'Puedes añadir productos a favoritos sin iniciar sesión, pero se guardarán localmente. Para guardarlos permanentemente, inicia sesión.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Continuar sin sesión',
        cancelButtonText: 'Ir a login',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#28a745'
      });
      
      if (result.isDismissed || result.isDenied) {
        // Si cancela, redirigir al login
        navigate('/login', { state: { returnUrl: `/producto/${id}` } });
        return;
      }
      // Si confirma, continuar con la operación
    }
    
    if (!producto) return;
    
    try {
      // Crear objeto del producto para favoritos
      const productForFavorites = {
        id: parseInt(id),
        nombre: producto.nombre,
        precio: producto.precio,
        precio_original: producto.precio_original,
        en_oferta: producto.en_oferta,
        imagen_url: activeImage || producto.imagen_url,
        imagen_principal: activeImage || producto.imagen_url,
        categoria_nombre: producto.categoria_nombre,
        stock: producto.stock,
        slug: producto.slug || null
      };
      
      const result = await toggleFavorite(productForFavorites);
      
      // Mostrar mensaje de confirmación
      if (result) {
        Swal.fire({
          title: '¡Añadido a favoritos!',
          text: `${producto.nombre} ha sido añadido a tus favoritos`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          title: '¡Eliminado de favoritos!',
          text: `${producto.nombre} ha sido eliminado de tus favoritos`,
          icon: 'info',
          timer: 2000,
          showConfirmButton: false
        });
      }
      
    } catch (error) {
      console.error('Error toggling favorite:', error);
      
      Swal.fire({
        title: 'Error',
        text: 'Ha ocurrido un error al procesar tu solicitud de favoritos',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  // Handlers
  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncreaseQuantity = () => {
    if (producto.stock !== null) {
      if (quantity < producto.stock) {
        setQuantity(quantity + 1);
      }
    } else {
      setQuantity(quantity + 1);
    }
  };

  // Función para añadir al carrito
  const handleAddToCart = async () => {
    if (producto) {
      // Verificar stock antes de añadir
      if (producto.stock !== null && producto.stock < quantity) {
        Swal.fire({
          title: 'Stock insuficiente',
          text: `Solo hay ${producto.stock} unidades disponibles`,
          icon: 'warning',
          confirmButtonText: 'Entendido'
        });
        return;
      }

      const result = await addToCart(producto, quantity);
      
      if (result) {
        // Mostrar notificación con SweetAlert
        Swal.fire({
          title: '¡Producto añadido!',
          text: `${quantity} unidad(es) de ${producto.nombre} añadida(s) al carrito`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    }
  };

  const handleRatingClick = (rating) => {
    setSelectedRating(rating);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    
    // Validación básica
    if (selectedRating === 0) {
      setFormError('Por favor, selecciona una puntuación');
      setSubmitting(false);
      return;
    }
    
    if (!reviewText.trim()) {
      setFormError('Por favor, escribe un comentario');
      setSubmitting(false);
      return;
    }
    
    try {
      const reviewData = {
        producto_id: id,
        puntuacion: selectedRating,
        comentario: reviewText
      };
      
      let response;
      
      if (isEditing && userReview) {
        // Actualizar reseña existente
        response = await axios.put(`/api/resenas/${userReview.id}`, reviewData);
      } else {
        // Crear nueva reseña
        response = await axios.post('/api/resenas', reviewData);
      }
      
      if (response.data.success) {
        // Actualizar la lista de reseñas
        fetchReviews();
        
        if (!isEditing) {
          // Si es una nueva reseña, actualizar el estado del usuario
          setUserReview(response.data.data);
        }
        
        // Resetear el formulario si es una nueva reseña
        if (!isEditing) {
          setSelectedRating(0);
          setReviewText('');
        }
        
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setFormError(error.response.data.message);
      } else {
        setFormError('Ha ocurrido un error al enviar la reseña');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Manejar el botón de editar reseña
  const handleEditReview = () => {
    setIsEditing(true);
    setSelectedRating(userReview.puntuacion);
    setReviewText(userReview.comentario);
  };
  
  // Manejar el botón de cancelar edición
  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedRating(userReview.puntuacion);
    setReviewText(userReview.comentario);
  };
  
  // Manejar la eliminación de reseñas
  const handleDeleteReview = async () => {
    if (!userReview) return;
    
    // Confirmar antes de eliminar con SweetAlert
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas eliminar esta reseña? Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) {
      return;
    }
    
    setDeleting(true);
    
    try {
      const response = await axios.delete(`/api/resenas/${userReview.id}`);
      
      if (response.data.success) {
        // Actualizar la lista de reseñas
        fetchReviews();
        
        // Resetear el estado del usuario
        setUserReview(null);
        setSelectedRating(0);
        setReviewText('');
        setIsEditing(false);

        // Mostrar mensaje de éxito
        Swal.fire({
          title: '¡Eliminada!',
          text: 'Tu reseña ha sido eliminada correctamente.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      
      Swal.fire({
        title: 'Error',
        text: 'Ha ocurrido un error al eliminar la reseña',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setDeleting(false);
    }
  };
  
  // Manejar redirección al login
  const handleLoginRedirect = () => {
    navigate('/login', { state: { returnUrl: `/producto/${id}` } });
  };

  //  Función para renderizar estrellas para la puntuación
  const renderStars = (rating, interactive = false) => {
    return Array(5).fill(0).map((_, index) => (
      <span 
        key={index}
        className={`${styles.estrella} ${index >= rating ? styles.estrellaVacia : ''}`}
        onClick={interactive ? () => handleRatingClick(index + 1) : undefined}
        style={interactive ? { cursor: 'pointer' } : {}}
      >
        <FontAwesomeIcon icon={index < rating ? faStar : faStarRegular} />
      </span>
    ));
  };

  // Formatear la fecha para mostrar en las reseñas
  const formatReviewDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options); 
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <div className={styles.loading}>Cargando...</div>
        </main>
        <Footer />
      </>
    );
  }

  if (!producto) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <div className={styles.error}>Producto no encontrado</div>
        </main>
        <Footer />
      </>
    );
  }

  // Procesar las URLs de imágenes separadas por pipe |
  const thumbnails = producto.imagen_url 
    ? producto.imagen_url.split('|').map(url => url.trim())
    : ['/api/placeholder/'];

  // Calcular la puntuación promedio
  const averageRating = reviews.length 
    ? reviews.reduce((sum, review) => sum + review.puntuacion, 0) / reviews.length 
    : 0;

  // Verificar si el producto está en favoritos usando el contexto
  const isProductFavorite = isFavorite(parseInt(id));

  return (
    <>
      <Header />
      <main className={styles.main}>
        <section className={styles.productSection}>
          <div className={styles.productoImagenes}>
            {/* Thumbnails */}
            <div className={styles.miniaturas}>
              {thumbnails.map((thumbnail, index) => (
                <div 
                  key={index} 
                  className={styles.miniatura}
                  onClick={() => setActiveImage(thumbnail)}
                >
                  <img src={thumbnail} alt={`Miniatura ${index + 1}`} />
                </div>
              ))}
            </div>

            {/* Imagen principal */}
            <div className={styles.imagenPrincipal}>
              <img src={activeImage || '/api/placeholder/500/500'} alt={producto.imagen_alt || "Imagen principal del producto"} />
            </div>
          </div>

          <div className={styles.productoInfo}>
            {/* Datos de producto */}
            <h1 className={styles.productoTitulo}>{producto.nombre}</h1>
            <div className={styles.productoCategoria}>{producto.categoria_nombre}</div>

            <div className={styles.valoracion}>
              {renderStars(averageRating)}
              <span className={styles.numReviews}>({reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'})</span>
            </div>

            <p className={styles.productoDescripcion}>
              {producto.descripcion || 'No hay descripción disponible para este producto.'}
            </p>

            {/* Información de stock */}
            {producto.stock !== null && (
              <div className={styles.stockInfo}>
                {stockAvailable ? (
                  <p className={styles.stockAvailable}>
                     Stock disponible: {producto.stock} unidades
                  </p>
                ) : (
                  <p className={styles.stockUnavailable}>
                     Producto agotado
                  </p>
                )}
              </div>
            )}

            <p className={styles.productoPrecio}>
              {producto.en_oferta && producto.precio_original && (
                <span className={styles.precioOriginal}>{producto.precio_original}€</span>
              )}
              {producto.precio} €
            </p>

            <div className={styles.productoAcciones}>
              <div className={styles.cantidadSelector}>
                <button className={styles.btnCantidad} onClick={handleDecreaseQuantity}>-</button>
                <div className={styles.cantidadValor}>{quantity}</div>
                <button 
                  className={styles.btnCantidad} 
                  onClick={handleIncreaseQuantity}
                  disabled={producto.stock !== null && quantity >= producto.stock}
                >+</button>
              </div>

              <button 
                className={styles.btnAgregarCarrito}
                onClick={handleAddToCart}
                disabled={cartLoading || !stockAvailable || (producto.stock !== null && quantity > producto.stock)}
              >
                <FontAwesomeIcon icon={cartLoading ? faShoppingCart : faPlus} spin={cartLoading} /> 
                {!stockAvailable ? 'Sin stock' : 
                 cartLoading ? 'Añadiendo...' : 
                 'Añadir al carrito'}
              </button>
            </div>

            <button 
              className={`${styles.btnWishlist} ${isProductFavorite ? styles.btnWishlistActive : ''}`} 
              onClick={handleToggleFavorite}
              disabled={favoritesLoading}
            >
              <FontAwesomeIcon 
                icon={isProductFavorite ? faHeart : faHeartRegular} 
                spin={favoritesLoading}
              /> 
              {favoritesLoading ? 'Procesando...' :
               isProductFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            </button>

            {!isAuthenticated && (
              <div className={styles.cartLoginInfo}>
                <p>Puedes añadir productos al carrito y favoritos sin iniciar sesión.</p>
                <p>Para completar la compra y guardar permanentemente tus favoritos, necesitarás <a href="/login">iniciar sesión</a>.</p>
                {(isProductFavorite) && (
                  <p className={styles.localStorageInfo}>⭐ Este producto está guardado localmente en favoritos</p>
                )}
              </div>
            )}

            <div className={styles.productoMeta}>
              <div className={styles.productoCategoria}>CATEGORÍA: {producto.categoria_nombre}</div>
            </div>
          </div>
        </section>

        <section className={styles.reseñas}>
          <h2>{reviews.length} {reviews.length === 1 ? 'Reseña' : 'Reseñas'} Para {producto.nombre}</h2>
          
          {/* Lista de reseñas */}
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className={styles.reseñaItem}>
                <div className={styles.reseñaInfo}>
                  <p className={styles.reseñaAutor}>{review.user ? review.user.name : 'Usuario anónimo'}</p>
                  <p className={styles.reseñaFecha}>{formatReviewDate(review.fecha_resena)}</p>
                  <p className={styles.reseñaComentario}>{review.comentario}</p>
                </div>

                <div className={styles.reseñaValoracion}>
                  {renderStars(review.puntuacion)}
                </div>
              </div>
            ))
          ) : (
            <div className={styles.noReseñas}>No hay reseñas para este producto todavía. ¡Sé el primero en opinar!</div>
          )}

          {/* Formulario de reseña o botón de inicio de sesión */}
          {isAuthenticated ? (
            userReview && !isEditing ? (
              <div className={styles.userReviewMessage}>
                <p>Ya has publicado una reseña para este producto.</p>
                <div className={styles.reviewActionButtons}>
                  <button 
                    className={`${styles.btnEnviar} ${styles.btnEdit}`} 
                    onClick={handleEditReview}
                  >
                    <FontAwesomeIcon icon={faEdit} /> EDITAR TU RESEÑA
                  </button>
                  <button 
                    className={`${styles.btnEnviar} ${styles.btnDelete}`} 
                    onClick={handleDeleteReview}
                    disabled={deleting}
                  >
                    <FontAwesomeIcon icon={faTrash} /> ELIMINAR RESEÑA
                  </button>
                </div>
              </div>
            ) : (
              <form className={styles.reseñaForm} onSubmit={handleReviewSubmit}>
                <h3>{isEditing ? 'Editar tu reseña' : 'Escribe una reseña'}</h3>
                
                {formError && <div className={styles.formError}>{formError}</div>}
                
                <label>Selecciona tu puntuación</label>
                <div className={styles.formEstrellas}>
                  {renderStars(selectedRating, true)}
                </div>

                <label htmlFor="reseña">Escribe tu reseña</label>
                <textarea 
                  name="reseña" 
                  id="reseña" 
                  cols="30" 
                  rows="10"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  disabled={submitting}
                ></textarea>

                <div className={styles.formButtons}>
                  <input 
                    type="submit" 
                    value={isEditing ? "Actualizar reseña" : "Enviar reseña"} 
                    className={styles.btnEnviar} 
                    disabled={submitting}
                  />
                  
                  {isEditing && (
                    <button 
                      type="button" 
                      className={styles.btnCancelar} 
                      onClick={handleCancelEdit}
                      disabled={submitting}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            )
          ) : (
            <div className={styles.loginPrompt}>
              <p>Necesitas iniciar sesión para dejar una reseña.</p>
              <button className={styles.btnLogin} onClick={handleLoginRedirect}>
                Iniciar sesión
              </button>
            </div>
          )}
        </section>

        <section className={styles.sectionRelacionados}>
          <h2>Productos relacionados</h2>
          {relatedProducts && relatedProducts.length > 0 ? (
            <div className={styles.containerRelacionados}>
              {relatedProducts.map((product) => (
                <ProductCard 
                  key={product.id}
                  id={product.id}
                  imageUrl={product.imagen_url || '/api/placeholder/220/220'}
                  name={product.nombre}
                  category={product.categoria_nombre}
                  price={`€${product.precio}`}
                  oldPrice={product.precio_original ? `${product.precio_original}€` : null}
                  onSale={product.en_oferta}
                  stock={product.stock}
                />
              ))}
            </div>
          ) : (
            <div className={styles.noRelacionados}>No hay productos relacionados disponibles</div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
};

export default ProductDetail;