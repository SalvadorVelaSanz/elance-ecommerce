import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../RUTAS/AuthContext';
import Header from '../header/header';
import Footer from '../footer/Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faSpinner, 
    faPlus, 
    faCreditCard, 
    faTruck, 
    faHome,
    faMapMarkerAlt,
    faEdit,
    faCheck,
    faExclamationTriangle,
    faArrowLeft,
    faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import styles from './Checkout.module.css';

function Checkout() {
    const { 
        isAuthenticated,
        cart, 
        subtotal,
        fetchCart,
        clearCart
    } = useContext(AuthContext);
    
    const navigate = useNavigate();
    
    // Estados principales
    const [loading, setLoading] = useState(false);
    const [direcciones, setDirecciones] = useState([]);
    const [loadingDirecciones, setLoadingDirecciones] = useState(true);
    const [processingOrder, setProcessingOrder] = useState(false);
    const [initialCartCheck, setInitialCartCheck] = useState(false);
    
    // Estados del formulario
    const [selectedDireccion, setSelectedDireccion] = useState(null);
    const [metodoPago, setMetodoPago] = useState('tarjeta');
    const [showNewAddressForm, setShowNewAddressForm] = useState(false);
    
    // Estados para cálculos de envío
    const [totales, setTotales] = useState({
        subtotal: 0,
        shipping: 0,
        vat: 0,
        total: 0,
        zona_envio: null
    });
    const [loadingTotales, setLoadingTotales] = useState(false);
    
    // Estados para nueva dirección
    const [newAddress, setNewAddress] = useState({
        nombre_direccion: '',
        calle: '',
        numero: '',
        piso: '',
        puerta: '',
        codigo_postal: '',
        ciudad: '',
        provincia: '',
        pais: 'España',
        es_principal: false
    });

    // Función para verificar si hay productos en el carrito desde la BD
    const checkCartFromDatabase = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/carrito/check', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.hasItems || false;
            }
            return false;
        } catch (error) {
            console.error('Error al verificar carrito:', error);
            return false;
        }
    };
    
    // Verificar autenticación y carrito al cargar
    useEffect(() => {
        const initializeCheckout = async () => {
            if (!isAuthenticated) {
                Swal.fire({
                    title: 'Acceso denegado',
                    text: 'Debes iniciar sesión para acceder al checkout',
                    icon: 'warning',
                    confirmButtonText: 'Ir al login'
                }).then(() => {
                    navigate('/login');
                });
                return;
            }
            
            // Verificar carrito desde base de datos
            const hasCartItems = await checkCartFromDatabase();
            
            if (!hasCartItems) {
                Swal.fire({
                    title: 'Carrito vacío',
                    text: 'No tienes productos en tu carrito',
                    icon: 'info',
                    confirmButtonText: 'Ir a comprar'
                }).then(() => {
                    navigate('/');
                });
                return;
            }
            
            setInitialCartCheck(true);
            await Promise.all([
                fetchDirecciones(),
                fetchCart()
            ]);
        };

        initializeCheckout();
    }, [isAuthenticated]);

    // Calcular totales cuando cambie la dirección o método de pago
    useEffect(() => {
        if (isAuthenticated && initialCartCheck) {
            calcularTotales();
        }
    }, [selectedDireccion, metodoPago, initialCartCheck]);

    // Obtener direcciones del usuario
    const fetchDirecciones = async () => {
        try {
            setLoadingDirecciones(true);
            const token = localStorage.getItem('token');
            const response = await fetch('/api/direcciones', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setDirecciones(data);
                // Seleccionar automáticamente la dirección principal
                const principal = data.find(dir => dir.es_principal);
                if (principal) {
                    setSelectedDireccion(principal.id);
                }
            } else {
                throw new Error('Error al cargar direcciones');
            }
        } catch (error) {
            console.error('Error al cargar direcciones:', error);
            Swal.fire({
                title: 'Error',
                text: 'No se pudieron cargar las direcciones',
                icon: 'error'
            });
        } finally {
            setLoadingDirecciones(false);
        }
    };

    // Calcular totales usando el endpoint del controlador
    const calcularTotales = async () => {
        try {
            setLoadingTotales(true);
            
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                metodo_pago: metodoPago
            });
            
            if (selectedDireccion && metodoPago === 'tarjeta') {
                params.append('direccion_id', selectedDireccion);
            }
            
            const response = await fetch(`/api/checkout/totales?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setTotales(data);
            } else {
                throw new Error('Error al calcular totales');
            }
        } catch (error) {
            console.error('Error al calcular totales:', error);
            // Fallback a cálculos locales
            setTotales({
                subtotal: subtotal || 0,
                shipping: metodoPago === 'presencial' ? 0 : 2.00,
                vat: (subtotal || 0) * 0.21,
                total: (subtotal || 0) + (metodoPago === 'presencial' ? 0 : 2.00) + ((subtotal || 0) * 0.21),
                zona_envio: null
            });
        } finally {
            setLoadingTotales(false);
        }
    };

    // Manejar cambios en el formulario de nueva dirección
    const handleAddressChange = (field, value) => {
        setNewAddress(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Crear nueva dirección
    const handleCreateAddress = async (e) => {
        e.preventDefault();
        
        // Validación básica
        if (!newAddress.nombre_direccion || !newAddress.calle || !newAddress.numero || 
            !newAddress.codigo_postal || !newAddress.ciudad || !newAddress.provincia) {
            Swal.fire({
                title: 'Campos requeridos',
                text: 'Por favor completa todos los campos obligatorios',
                icon: 'warning'
            });
            return;
        }
        
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('/api/direcciones', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newAddress)
            });
            
            if (response.ok) {
                const nuevaDireccion = await response.json();
                setDirecciones(prev => [...prev, nuevaDireccion]);
                setSelectedDireccion(nuevaDireccion.id);
                setShowNewAddressForm(false);
                setNewAddress({
                    nombre_direccion: '',
                    calle: '',
                    numero: '',
                    piso: '',
                    puerta: '',
                    codigo_postal: '',
                    ciudad: '',
                    provincia: '',
                    pais: 'España',
                    es_principal: false
                });
                
                Swal.fire({
                    title: '¡Dirección creada!',
                    text: 'Tu nueva dirección ha sido guardada',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al crear la dirección');
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                title: 'Error',
                text: error.message || 'No se pudo crear la dirección',
                icon: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // Procesar pedido usando el endpoint del controlador
    const handlePlaceOrder = async () => {
        // Validaciones
        if (metodoPago === 'tarjeta' && !selectedDireccion) {
            Swal.fire({
                title: 'Dirección requerida',
                text: 'Por favor selecciona una dirección de envío',
                icon: 'warning'
            });
            return;
        }

        if (!cart || cart.length === 0) {
            Swal.fire({
                title: 'Carrito vacío',
                text: 'No tienes productos en tu carrito',
                icon: 'warning'
            });
            return;
        }

        try {
            setProcessingOrder(true);
            
            // Preparar datos del pedido según lo que espera el controlador
            const orderData = {
                direccion_id: metodoPago === 'presencial' ? null : selectedDireccion,
                metodo_pago: metodoPago,
                precio_total: parseFloat(totales.total.toFixed(2)),
                costo_envio: parseFloat(totales.shipping.toFixed(2)),
                productos: cart.map(item => ({
                    producto_id: item.producto_id || item.id,
                    cantidad: parseInt(item.cantidad),
                    precio_unitario: parseFloat(item.precio)
                }))
            };

            const token = localStorage.getItem('token');
            const response = await fetch('/api/checkout/pedido', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            const responseData = await response.json();

            if (response.ok) {
                // Limpiar carrito
                await clearCart();
                
                Swal.fire({
                    title: '¡Pedido realizado!',
                    text: `Tu pedido ${responseData.pedido.numero_seguimiento || responseData.pedido.id} ha sido procesado correctamente`,
                    icon: 'success',
                    confirmButtonText: 'Ver mis pedidos'
                }).then(() => {
                    navigate('/userPanel?tab=pedidos');
                });
            } else {
                throw new Error(responseData.message || 'Error al procesar el pedido');
            }
        } catch (error) {
            console.error('Error al procesar pedido:', error);
            Swal.fire({
                title: 'Error',
                text: error.message || 'No se pudo procesar tu pedido. Por favor intenta de nuevo.',
                icon: 'error'
            });
        } finally {
            setProcessingOrder(false);
        }
    };

    // Mostrar loading mientras se verifica el carrito inicial
    if (!isAuthenticated || !initialCartCheck) {
        return (
            <>
                <Header />
                <div className={styles.checkoutContainer}>
                    <div className={styles.loading}>
                        <FontAwesomeIcon icon={faSpinner} spin /> Cargando...
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <div className={styles.checkoutContainer}>
                <div className={styles.checkoutHeader}>
                    <Link to="/shoppingCart" className={styles.backButton}>
                        <FontAwesomeIcon icon={faArrowLeft} /> Volver al carrito
                    </Link>
                    <h1 className={styles.checkoutTitle}>Finalizar Compra</h1>
                </div>

                <div className={styles.checkoutContent}>
                    {/* Columna izquierda - Formularios */}
                    <div className={styles.checkoutForms}>
                        {/* Sección de Método de Pago/Entrega */}
                        <div className={styles.checkoutSection}>
                            <h2 className={styles.sectionTitle}>
                                <FontAwesomeIcon icon={faTruck} /> Método de Entrega
                            </h2>
                            
                            <div className={styles.paymentMethods}>
                                <label className={`${styles.paymentMethod} ${metodoPago === 'tarjeta' ? styles.selected : ''}`}>
                                    <input
                                        type="radio"
                                        name="metodoPago"
                                        value="tarjeta"
                                        checked={metodoPago === 'tarjeta'}
                                        onChange={(e) => setMetodoPago(e.target.value)}
                                    />
                                    <div className={styles.methodInfo}>
                                        <FontAwesomeIcon icon={faCreditCard} />
                                        <div>
                                            <strong>Envío a domicilio</strong>
                                            <p>Pago con tarjeta</p>
                                            {loadingTotales && metodoPago === 'tarjeta' ? (
                                                <p><FontAwesomeIcon icon={faSpinner} spin /> Calculando envío...</p>
                                            ) : (
                                                <p>Envío: {totales.shipping === 0 ? 'GRATIS' : `${totales.shipping.toFixed(2)} €`}</p>
                                            )}
                                        </div>
                                    </div>
                                </label>
                                
                                <label className={`${styles.paymentMethod} ${metodoPago === 'presencial' ? styles.selected : ''}`}>
                                    <input
                                        type="radio"
                                        name="metodoPago"
                                        value="presencial"
                                        checked={metodoPago === 'presencial'}
                                        onChange={(e) => setMetodoPago(e.target.value)}
                                    />
                                    <div className={styles.methodInfo}>
                                        <FontAwesomeIcon icon={faHome} />
                                        <div>
                                            <strong>Recogida en tienda</strong>
                                            <p>Pago presencial - Sin coste de envío</p>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Sección de Direcciones (solo si no es presencial) */}
                        {metodoPago !== 'presencial' && (
                            <div className={styles.checkoutSection}>
                                <h2 className={styles.sectionTitle}>
                                    <FontAwesomeIcon icon={faMapMarkerAlt} /> Dirección de Envío
                                </h2>
                                
                                {/* Información de zona de envío */}
                                {totales.zona_envio && (
                                    <div className={styles.shippingInfo}>
                                        <FontAwesomeIcon icon={faInfoCircle} />
                                        <div>
                                            <strong>Zona de envío: {totales.zona_envio.nombre}</strong>
                                            {totales.zona_envio.pedido_minimo_envio_gratis && totales.shipping > 0 && (
                                                <p>Envío gratis en pedidos superiores a {totales.zona_envio.pedido_minimo_envio_gratis} €</p>
                                            )}
                                            {totales.shipping === 0 && totales.zona_envio.pedido_minimo_envio_gratis && (
                                                <p className={styles.freeShipping}>¡Has conseguido envío gratis!</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                {loadingDirecciones ? (
                                    <div className={styles.loading}>
                                        <FontAwesomeIcon icon={faSpinner} spin /> Cargando direcciones...
                                    </div>
                                ) : (
                                    <>
                                        {direcciones.length > 0 && (
                                            <div className={styles.addressList}>
                                                {direcciones.map(direccion => (
                                                    <label key={direccion.id} className={`${styles.addressOption} ${selectedDireccion === direccion.id ? styles.selected : ''}`}>
                                                        <input
                                                            type="radio"
                                                            name="direccion"
                                                            value={direccion.id}
                                                            checked={selectedDireccion === direccion.id}
                                                            onChange={(e) => setSelectedDireccion(parseInt(e.target.value))}
                                                        />
                                                        <div className={styles.addressInfo}>
                                                            <strong>{direccion.nombre_direccion}</strong>
                                                            {direccion.es_principal && <span className={styles.principalBadge}>Principal</span>}
                                                            <p>{direccion.calle} {direccion.numero}</p>
                                                            {direccion.piso && <p>Piso: {direccion.piso} {direccion.puerta && `Puerta: ${direccion.puerta}`}</p>}
                                                            <p>{direccion.codigo_postal} {direccion.ciudad}, {direccion.provincia}</p>
                                                            <p>{direccion.pais}</p>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                        
                                        <button
                                            type="button"
                                            className={styles.addAddressBtn}
                                            onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                                        >
                                            <FontAwesomeIcon icon={faPlus} /> Nueva Dirección
                                        </button>
                                        
                                        {showNewAddressForm && (
                                            <form onSubmit={handleCreateAddress} className={styles.newAddressForm}>
                                                <div className={styles.formRow}>
                                                    <div className={styles.formGroup}>
                                                        <label>Nombre de la dirección *</label>
                                                        <input
                                                            type="text"
                                                            value={newAddress.nombre_direccion}
                                                            onChange={(e) => handleAddressChange('nombre_direccion', e.target.value)}
                                                            placeholder="Casa, Trabajo, etc."
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div className={styles.formRow}>
                                                    <div className={styles.formGroup}>
                                                        <label>Calle *</label>
                                                        <input
                                                            type="text"
                                                            value={newAddress.calle}
                                                            onChange={(e) => handleAddressChange('calle', e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    <div className={styles.formGroup}>
                                                        <label>Número *</label>
                                                        <input
                                                            type="text"
                                                            value={newAddress.numero}
                                                            onChange={(e) => handleAddressChange('numero', e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div className={styles.formRow}>
                                                    <div className={styles.formGroup}>
                                                        <label>Piso</label>
                                                        <input
                                                            type="text"
                                                            value={newAddress.piso}
                                                            onChange={(e) => handleAddressChange('piso', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className={styles.formGroup}>
                                                        <label>Puerta</label>
                                                        <input
                                                            type="text"
                                                            value={newAddress.puerta}
                                                            onChange={(e) => handleAddressChange('puerta', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div className={styles.formRow}>
                                                    <div className={styles.formGroup}>
                                                        <label>Código Postal *</label>
                                                        <input
                                                            type="text"
                                                            value={newAddress.codigo_postal}
                                                            onChange={(e) => handleAddressChange('codigo_postal', e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    <div className={styles.formGroup}>
                                                        <label>Ciudad *</label>
                                                        <input
                                                            type="text"
                                                            value={newAddress.ciudad}
                                                            onChange={(e) => handleAddressChange('ciudad', e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div className={styles.formRow}>
                                                    <div className={styles.formGroup}>
                                                        <label>Provincia *</label>
                                                        <input
                                                            type="text"
                                                            value={newAddress.provincia}
                                                            onChange={(e) => handleAddressChange('provincia', e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    <div className={styles.formGroup}>
                                                        <label>País *</label>
                                                        <input
                                                            type="text"
                                                            value={newAddress.pais}
                                                            onChange={(e) => handleAddressChange('pais', e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div className={styles.formActions}>
                                                    <button type="submit" disabled={loading} className={styles.saveBtn}>
                                                        {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faCheck} />}
                                                        Guardar Dirección
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setShowNewAddressForm(false)}
                                                        className={styles.cancelBtn}
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Columna derecha - Resumen del pedido */}
                    <div className={styles.orderSummary}>
                        <h2 className={styles.summaryTitle}>Resumen del Pedido</h2>
                        
                        {/* Productos */}
                        <div className={styles.summaryProducts}>
                            {cart && cart.map(item => (
                                <div key={item.producto_id || item.id} className={styles.summaryProduct}>
                                    <div className={styles.productInfo}>
                                        <span className={styles.productName}>
                                            {item.producto_nombre || item.name || item.nombre}
                                        </span>
                                        <span className={styles.productQuantity}>x{item.cantidad}</span>
                                    </div>
                                    <span className={styles.productPrice}>
                                        {(parseFloat(item.precio) * item.cantidad).toFixed(2)} €
                                    </span>
                                </div>
                            ))}
                        </div>
                        
                        {/* Totales */}
                        <div className={styles.summaryTotals}>
                            <div className={styles.summaryRow}>
                                <span>Subtotal:</span>
                                <span>{totales.subtotal.toFixed(2)} €</span>
                            </div>
                            
                            <div className={styles.summaryRow}>
                                <span>Envío:</span>
                                <span>
                                    {loadingTotales ? (
                                        <FontAwesomeIcon icon={faSpinner} spin />
                                    ) : (
                                        totales.shipping === 0 ? 'GRATIS' : `${totales.shipping.toFixed(2)} €`
                                    )}
                                </span>
                            </div>
                            
                            <div className={styles.summaryRow}>
                                <span>IVA (21%):</span>
                                <span>{totales.vat.toFixed(2)} €</span>
                            </div>
                            
                            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                                <span>Total:</span>
                                <span>{totales.total.toFixed(2)} €</span>
                            </div>
                        </div>
                        
                        {/* Información adicional */}
                        {metodoPago === 'presencial' && (
                            <div className={styles.pickupInfo}>
                                <FontAwesomeIcon icon={faExclamationTriangle} />
                                <p>Recogerás tu pedido en nuestra tienda. Te contactaremos cuando esté listo.</p>
                            </div>
                        )}
                        
                        {/* Botón de confirmar pedido */}
                        <button
                            className={styles.placeOrderBtn}
                            onClick={handlePlaceOrder}
                            disabled={
                                processingOrder || 
                                (metodoPago === 'tarjeta' && !selectedDireccion) || 
                                loadingTotales ||
                                !cart ||
                                cart.length === 0
                            }
                        >
                            {processingOrder ? (
                                <>
                                    <FontAwesomeIcon icon={faSpinner} spin /> Procesando...
                                </>
                            ) : (
                                'Confirmar Pedido'
                            )}
                        </button>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}

export default Checkout;