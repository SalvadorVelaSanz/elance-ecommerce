import React, { useContext, useEffect, useState } from 'react';
import CartItem from './CartItem.jsx';
import styles from './ShoppingCart.module.css';
import Header from '../header/Header';
import Footer from '../footer/Footer';
import { AuthContext } from '../RUTAS/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faSpinner, faExclamationTriangle, faTrash, faSync, faSignInAlt } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';

function ShoppingCart() {
    const { 
        isAuthenticated,
        cart, 
        cartLoading, 
        cartError, 
        updateCartQuantity, 
        removeFromCart,
        clearCart,
        subtotal,
        shipping,
        vat,
        total,
        fetchCart
    } = useContext(AuthContext);
    
    const navigate = useNavigate();
    const [clearingCart, setClearingCart] = useState(false);
    const [processingCheckout, setProcessingCheckout] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Cargar el carrito al montar el componente
    useEffect(() => {
        fetchCart();
    }, [isAuthenticated]);

    // Función para refrescar manualmente el carrito
    const handleRefreshCart = async () => {
        setRefreshing(true);
        try {
            await fetchCart();
        } catch (error) {
            console.error("Error refreshing cart:", error);
        } finally {
            setRefreshing(false);
        }
    };

    // Función para procesar el pago
    const handleCheckout = () => {
        // Verificar si hay productos en el carrito
        if (!cart || cart.length === 0) {
            Swal.fire({
                title: 'Carrito vacío',
                text: 'No tienes productos en tu carrito para procesar el pago',
                icon: 'info',
                confirmButtonText: 'Continuar comprando'
            });
            return;
        }

        // Verificar que el subtotal sea válido
        if (subtotal <= 0) {
            Swal.fire({
                title: 'Error en el carrito',
                text: 'El total de tu carrito no es válido',
                icon: 'error',
                confirmButtonText: 'Revisar carrito'
            });
            return;
        }

        // Si el usuario no está autenticado, redirigir al login
        if (!isAuthenticated) {
            Swal.fire({
                title: 'Inicio de sesión requerido',
                text: 'Debes iniciar sesión para completar la compra',
                icon: 'info',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Ir a iniciar sesión',
                cancelButtonText: 'Cancelar',
                allowOutsideClick: false
            }).then((result) => {
                if (result.isConfirmed) {
                    // Guardar la intención de ir al checkout después del login
                    localStorage.setItem('redirectAfterLogin', '/checkout');
                    navigate('/login');
                }
            });
            return;
        }
        
        // Si está autenticado y tiene productos, proceder al checkout
        setProcessingCheckout(true);
        
        // Pequeña pausa para mostrar el loading
        setTimeout(() => {
            setProcessingCheckout(false);
            navigate('/checkout');
        }, 500);
    };

    // Función para vaciar el carrito
    const handleClearCart = async () => {
        Swal.fire({
            title: '¿Estás seguro?',
            text: '¿Deseas vaciar el carrito? Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, vaciar carrito',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                setClearingCart(true);
                try {
                    await clearCart();
                    Swal.fire({
                        title: '¡Carrito vaciado!',
                        text: 'Tu carrito ha sido vaciado correctamente',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });
                } catch (error) {
                    console.error("Error clearing cart:", error);
                    Swal.fire({
                        title: 'Error',
                        text: 'No se pudo vaciar el carrito',
                        icon: 'error'
                    });
                } finally {
                    setClearingCart(false);
                }
            }
        });
    };

    if (cartLoading && cart.length === 0) {
        return (
            <>
                <Header />
                <div className={styles.cartContainer}>
                    <div className={styles.cartHeader}>
                        <h1 className={styles.cartTitle}>CARRITO</h1>
                    </div>
                    <div className={styles.loadingContainer}>
                        <FontAwesomeIcon icon={faSpinner} spin size="3x" />
                        <p>Cargando tu carrito...</p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (cartError && cart.length === 0) {
        return (
            <>
                <Header />
                <div className={styles.cartContainer}>
                    <div className={styles.cartHeader}>
                        <h1 className={styles.cartTitle}>CARRITO</h1>
                    </div>
                    <div className={styles.errorContainer}>
                        <FontAwesomeIcon icon={faExclamationTriangle} size="3x" className={styles.errorIcon} />
                        <p>Ha ocurrido un error al cargar tu carrito: {cartError}</p>
                        <button 
                            onClick={handleRefreshCart} 
                            className={styles.refreshButton}
                            disabled={refreshing}
                        >
                            {refreshing ? (
                                <FontAwesomeIcon icon={faSpinner} spin />
                            ) : (
                                <FontAwesomeIcon icon={faSync} />
                            )} 
                            Intentar nuevamente
                        </button>
                        <Link to="/" className={styles.continueShopping}>Continuar comprando</Link>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <div className={styles.cartContainer}>
                {/* Header del carrito */}
                <div className={styles.cartHeader}>
                    <h1 className={styles.cartTitle}>CARRITO</h1>
                    <div className={styles.cartCount}>
                        TIENES {cart.length} {cart.length === 1 ? 'ARTÍCULO' : 'ARTÍCULOS'} EN EL CARRITO
                    </div>
                    {cartLoading && (
                        <div className={styles.loadingIndicator}>
                            <FontAwesomeIcon icon={faSpinner} spin size="sm" /> Actualizando...
                        </div>
                    )}
                </div>

                {/* Mostrar advertencia de inicio de sesión si no está autenticado pero tiene productos */}
                {!isAuthenticated && cart.length > 0 && (
                    <div className={styles.loginWarning}>
                        <FontAwesomeIcon icon={faSignInAlt} className={styles.loginIcon} />
                        <p>Tu carrito se está guardando localmente. Para guardar tu carrito permanentemente y completar la compra, inicia sesión.</p>
                        <Link to="/login" className={styles.btnLogin}>
                            Iniciar sesión
                        </Link>
                    </div>
                )}

                {/* Mostrar error si existe pero hay elementos en el carrito */}
                {cartError && cart.length > 0 && (
                    <div className={styles.miniErrorAlert}>
                        <FontAwesomeIcon icon={faExclamationTriangle} /> {cartError}
                        <button onClick={handleRefreshCart} className={styles.refreshButtonSmall}>
                            <FontAwesomeIcon icon={faSync} spin={refreshing} />
                        </button>
                    </div>
                )}

                {/* Tabla de productos */}
                {cart.length > 0 ? (
                    <>
                        <div className={styles.cartActions}>
                            <button
                                className={styles.clearCartBtn}
                                onClick={handleClearCart}
                                disabled={clearingCart || cartLoading}
                            >
                                {clearingCart ? (
                                    <FontAwesomeIcon icon={faSpinner} spin />
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faTrash} /> Vaciar carrito
                                    </>
                                )}
                            </button>
                        </div>

                        <table className={styles.cartTable}>
                            <thead>
                                <tr>
                                    <th style={{ width: '50%' }}>PRODUCTO</th>
                                    <th>CANTIDAD</th>
                                    <th className={styles.textRight}>SUBTOTAL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cart.map(item => (
                                    <CartItem 
                                        key={item.id || item.producto_id}
                                        item={item}
                                        updateQuantity={updateCartQuantity}
                                        removeItem={removeFromCart}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </>
                ) : (
                    <div className={styles.emptyCart}>
                        <FontAwesomeIcon icon={faShoppingCart} size="4x" className={styles.cartIcon} />
                        <p>Tu carrito está vacío.</p>
                        <Link to="/" className={styles.continueShopping}>Continuar comprando</Link>
                    </div>
                )}

                {/* Sección de totales */}
                {cart.length > 0 && (
                    <div className={styles.cartTotals}>
                        <h2 className={styles.cartTotalsTitle}>TOTAL DEL CARRITO</h2>
                        
                        <div className={styles.cartTotalsRow}>
                            <div className={styles.cartTotalsLabel}>SUBTOTAL</div>
                            <div className={styles.cartTotalsValue}>{subtotal.toFixed(2)} €</div>
                        </div>
                        
                        <div className={styles.cartTotalsRow}>
                            <div className={styles.cartTotalsLabel}>ENVÍO</div>
                            <div className={styles.cartTotalsValue}>
                                {isAuthenticated ? (
                                    'Se calculará en el checkout'
                                ) : (
                                    `TARIFA FIJA: ${shipping.toFixed(2)} €`
                                )}
                            </div>
                        </div>
                        <div className={styles.shippingNote}>
                            {isAuthenticated ? (
                                'Las opciones de envío se mostrarán según tu dirección.'
                            ) : (
                                'Las opciones de envío se actualizarán durante el pago.'
                            )}
                        </div>
                        
                        <div className={styles.cartTotalsRow}>
                            <div className={styles.cartTotalsLabel}>IVA (21%)</div>
                            <div className={styles.cartTotalsValue}>{vat.toFixed(2)} €</div>
                        </div>
                        
                        <div className={`${styles.cartTotalsRow} ${styles.totalRow}`}>
                            <div className={styles.cartTotalsLabel}>TOTAL</div>
                            <div className={styles.cartTotalsValue}>
                                {isAuthenticated ? (
                                    'Se calculará en el checkout'
                                ) : (
                                    `${total.toFixed(2)} €`
                                )}
                            </div>
                        </div>
                        
                        <button 
                            className={styles.checkoutBtn}
                            onClick={handleCheckout}
                            disabled={processingCheckout || cartLoading || cart.length === 0}
                        >
                            {processingCheckout ? (
                                <>
                                    <FontAwesomeIcon icon={faSpinner} spin /> Procesando...
                                </>
                            ) : (
                                isAuthenticated ? 'Procesar Pago' : 'Iniciar Sesión y Procesar Pago'
                            )}
                        </button>
                        
                        {!isAuthenticated && (
                            <div className={styles.checkoutWarning}>
                                Necesitarás iniciar sesión para completar la compra
                            </div>
                        )}
                        
                        <Link to="/" className={styles.continueShopping}>Continuar comprando</Link>
                    </div>
                )}
            </div>
            <Footer />
        </>
    );
}

export default ShoppingCart;