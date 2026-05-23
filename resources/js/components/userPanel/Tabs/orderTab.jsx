import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { AuthContext } from '../../RUTAS/AuthContext';
import sharedStyles from '../../../../css/panelShared.module.css';
import ownStyles from '../userPanel.module.css';
const styles = { ...sharedStyles, ...ownStyles };

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [cancelingOrder, setCancelingOrder] = useState(null);
  const { isAuthenticated, user } = useContext(AuthContext);

  // Cargar pedidos del usuario desde la API cuando el usuario está autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchOrders();
    }
  }, [isAuthenticated, user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Usando axios que ya tiene configurado el token de autorización automáticamente
      const response = await axios.get('/api/pedidos');
      
      setOrders(response.data);
    } catch (err) {
      console.error('Error al cargar pedidos:', err);
      setError(err.response?.data?.message || 'Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderDetails = (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
    }
  };

  // Función para cancelar pedido
  const cancelOrder = async (orderId) => {
    const result = await Swal.fire({
      title: '¿Cancelar pedido?',
      text: '¿Estás seguro de que quieres cancelar este pedido?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No, mantener'
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setCancelingOrder(orderId);
      setError(null);
      
      const response = await axios.put(`/api/pedidos/${orderId}/cancelar`);
      
      // Actualizar la lista de pedidos localmente para reflejar el cambio inmediatamente
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, estado: 'cancelado' }
            : order
        )
      );
      
      // Mostrar mensaje de éxito
      await Swal.fire({
        title: '¡Pedido cancelado!',
        text: 'Tu pedido ha sido cancelado exitosamente',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      
    } catch (err) {
      console.error('Error al cancelar pedido:', err);
      const errorMessage = err.response?.data?.message || 'Error al cancelar el pedido';
      setError(`Error al cancelar pedido: ${errorMessage}`);
      
      // Mostrar error con SweetAlert
      await Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
    } finally {
      setCancelingOrder(null);
    }
  };

  // Función para formatear precio con el símbolo de euro
  const formatPrice = (price) => {
    return `${parseFloat(price).toFixed(2)}€`;
  };

  // Función para formatear la fecha en formato español
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  };

  // Función para traducir el estado del pedido
  const translateStatus = (status) => {
    const statusMap = {
      'pendiente': 'Pendiente',
      'procesando': 'En proceso',
      'enviado': 'Enviado',
      'entregado': 'Entregado',
      'cancelado': 'Cancelado'
    };
    return statusMap[status] || status;
  };

  // Función para asignar una clase CSS según el estado
  const getStatusClass = (status) => {
    switch (status) {
      case 'entregado':
        return styles.badgeSuccess;
      case 'enviado':
        return styles.badgeInfo;
      case 'procesando':
        return styles.badgeWarning;
      case 'pendiente':
        return styles.badgePrimary;
      case 'cancelado':
        return styles.badgeDanger;
      default:
        return styles.badgePrimary;
    }
  };

  // Función para determinar si un pedido puede ser cancelado
  const canCancelOrder = (order) => {
    if (!order || !order.estado) {
      return false;
    }
    // Los usuarios pueden cancelar pedidos pendientes o en procesamiento
    return order.estado === 'pendiente' || order.estado === 'procesando';
  };

  if (!isAuthenticated || !user) {
    return (
      <div className={`${styles.tabPane} ${styles.minHeight}`}>
        <h2>Historial de pedidos</h2>
        <div className={styles.alertWarning}>
          <p>Debes estar autenticado para ver tus pedidos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.tabPane} ${styles.minHeight}`}>
      <h2>Historial de pedidos</h2>
      
      {error && (
        <div className={styles.alertError}>
          <p>{error}</p>
          <button className={styles.btnPrimary} onClick={fetchOrders}>
            Reintentar
          </button>
        </div>
      )}
      
      {loading ? (
        <div className={styles.loading}>Cargando pedidos...</div>
      ) : (
        <div className={styles.direccionesLista}>
          {orders.length > 0 ? (
            orders.map(order => (
              <div className={styles.direccionCard} key={order.id}>
                <div className={styles.direccionHeader}>
                  <h3>
                    {order.numero_seguimiento || `Pedido #${order.id}`}
                    <span className={getStatusClass(order.estado)}>
                      {translateStatus(order.estado)}
                    </span>
                  </h3>
                  <div className={styles.direccionActions}>
                    <button 
                      className={styles.btnEditar} 
                      onClick={() => toggleOrderDetails(order.id)}
                    >
                      {expandedOrder === order.id ? 'Ocultar detalles' : 'Ver detalles'}
                    </button>
                    {canCancelOrder(order) && (
                      <button 
                        className={styles.btnEliminar}
                        onClick={() => cancelOrder(order.id)}
                        disabled={cancelingOrder === order.id}
                      >
                        {cancelingOrder === order.id ? 'Cancelando...' : 'Cancelar'}
                      </button>
                    )}
                  </div>
                </div>
                
                <p><strong>Fecha:</strong> {formatDate(order.created_at)}</p>
                <p><strong>Total:</strong> {formatPrice(order.precio_total)}</p>
                
                {expandedOrder === order.id && (
                  <div className={styles.formDireccion}>
                    <h3>Detalles del pedido</h3>
                    
                    {order.detalles && order.detalles.length > 0 && (
                      <div className={styles.orderItemsList}>
                        <h4>Productos</h4>
                        {order.detalles.map((item, index) => (
                          <div key={index} className={styles.orderItem}>
                            <div className={styles.productInfo}>
                              <div className={styles.productHeader}>
                                <strong>
                                  {item.producto?.nombre || 'Producto sin nombre'}
                                  {item.producto?.eliminado && (
                                    <span className={styles.badgeWarning}> (Producto eliminado)</span>
                                  )}
                                </strong>
                              </div>
                              
                              {item.producto?.descripcion && (
                                <p className={styles.productDescription}>{item.producto.descripcion}</p>
                              )}
                              
                              <div className={styles.productDetails}>
                                {item.producto?.talla && (
                                  <p className={styles.productDetail}>
                                    <strong>Talla:</strong> {item.producto.talla}
                                  </p>
                                )}
                                {item.producto?.categoria?.nombre && (
                                  <p className={styles.productDetail}>
                                    <strong>Categoría:</strong> {item.producto.categoria.nombre}
                                  </p>
                                )}
                                <p className={styles.productQuantity}>
                                  <strong>Cantidad:</strong> {item.cantidad}
                                </p>
                              </div>

                              {/* Nota informativa para productos eliminados */}
                              {item.producto?.eliminado && (
                                <div className={styles.warningNote}>
                                  <p><em>Este producto ya no está disponible en la tienda, pero se conserva la información del pedido original.</em></p>
                                </div>
                              )}
                            </div>
                            
                            <div className={styles.productPrice}>
                              <p><strong>{formatPrice(item.precio_unitario)}</strong></p>
                              <p className={styles.subtotal}>
                                Subtotal: {formatPrice(item.precio_unitario * item.cantidad)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className={styles.orderAddress}>
                      <h4>Dirección de envío</h4>
                      {order.direccion ? (
                        <>
                          <div className={styles.addressHeader}>
                            <strong>
                              {order.direccion.nombre_direccion}
                              {order.direccion.eliminada && (
                                <span className={styles.badgeWarning}> (Dirección eliminada)</span>
                              )}
                            </strong>
                            {order.direccion.es_principal && !order.direccion.eliminada && (
                              <span className={styles.badgePrimary}>Principal</span>
                            )}
                          </div>
                          <div className={styles.addressDetails}>
                            <p>
                              <strong>{order.direccion.calle} {order.direccion.numero}</strong>
                              {(order.direccion.piso || order.direccion.puerta) && (
                                <>
                                  <br />
                                  {order.direccion.piso && `Piso ${order.direccion.piso}`}
                                  {order.direccion.piso && order.direccion.puerta && ', '}
                                  {order.direccion.puerta && `Puerta ${order.direccion.puerta}`}
                                </>
                              )}
                            </p>
                            <p>{order.direccion.codigo_postal} {order.direccion.ciudad}</p>
                            <p>{order.direccion.provincia}, {order.direccion.pais}</p>
                            
                            {/* Nota informativa para direcciones eliminadas */}
                            {order.direccion.eliminada && (
                              <div className={styles.warningNote}>
                                <p><em>Esta dirección fue eliminada después de realizar el pedido, pero se conserva la información del envío.</em></p>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className={styles.pickupInfo}>
                          <p><strong>Recogida en tienda</strong></p>
                          <p>Este pedido se recoge presencialmente en nuestra tienda.</p>
                        </div>
                      )}
                    </div>
                    
                    {order.numero_seguimiento && (
                      <div className={styles.orderTracking}>
                        <h4>Seguimiento</h4>
                        <p><strong>Número de seguimiento:</strong> {order.numero_seguimiento}</p>
                        {order.estado === 'enviado' && (
                          <a 
                            href={`https://tracking.correos.es/${order.numero_seguimiento}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={styles.btnPrimary}
                          >
                            Seguir envío
                          </a>
                        )}
                      </div>
                    )}
                    
                    <div className={styles.orderPayment}>
                      <h4>Información del pedido</h4>
                      <div className={styles.orderSummary}>
                        <p><strong>Método de pago:</strong> {order.metodo_pago === 'tarjeta' ? 'Pago con tarjeta (envío a domicilio)' : 'Pago presencial (recogida en tienda)'}</p>
                        <p><strong>Fecha del pedido:</strong> {formatDate(order.created_at)}</p>
                        <p><strong>Estado actual:</strong> {translateStatus(order.estado)}</p>
                        <div className={styles.totalSection}>
                          <p className={styles.finalTotal}><strong>Total pagado: {formatPrice(order.precio_total)}</strong></p>
                        </div>
                      </div>
                    </div>

                    {/* Información adicional sobre elementos eliminados */}
                    {(order.detalles.some(item => item.producto?.eliminado) || order.direccion?.eliminada) && (
                      <div className={styles.infoNote}>
                        <h4>ℹ️ Información importante</h4>
                        {order.detalles.some(item => item.producto?.eliminado) && (
                          <p>• Algunos productos de este pedido ya no están disponibles en la tienda, pero se conserva toda la información del pedido original.</p>
                        )}
                        {order.direccion?.eliminada && (
                          <p>• La dirección de envío de este pedido fue eliminada posteriormente, pero se mantiene la información del envío realizado.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <p>No hay pedidos recientes.</p>
              <a href="/" className={styles.btnNuevaDireccion}>
                Explorar productos
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default OrdersTab;