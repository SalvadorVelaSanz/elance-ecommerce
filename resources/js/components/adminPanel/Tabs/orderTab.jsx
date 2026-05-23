import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../RUTAS/AuthContext';
import sharedStyles from '../../../../css/panelShared.module.css';
import ownStyles from '../adminPanel.module.css';
const styles = { ...sharedStyles, ...ownStyles };

function OrderTab() {
  // Obtenemos el contexto de autenticación y usamos la función isAdmin() en lugar de comprobar directamente
  const { user, isAdmin } = useContext(AuthContext);
  // Usamos la función isAdmin en lugar de verificar user.role
  const userIsAdmin = isAdmin(); // Llamamos a la función que verifica con los criterios correctos
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissionError, setPermissionError] = useState(false);
  const [success, setSuccess] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('id'); // Nuevo estado para el tipo de búsqueda
  const [selectedStatus, setSelectedStatus] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);

  // Los estados válidos para los pedidos
  const validStatuses = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'procesando', label: 'Procesando' },
    { value: 'enviado', label: 'Enviado' },
    { value: 'entregado', label: 'Entregado' },
    { value: 'cancelado', label: 'Cancelado' }
  ];

  // Las opciones de búsqueda
  const searchOptions = [
    { value: 'id', label: 'ID del pedido' },
    { value: 'tracking', label: 'Número de seguimiento' }
  ];

  // Cargar pedidos al montar el componente
  useEffect(() => {
    if (userIsAdmin) {
      fetchOrders();
    }
  }, [userIsAdmin, currentPage, searchTerm, searchType, selectedStatus]);

  // Función para manejar errores de las peticiones
  const handleApiError = (err) => {
    console.error('Error en la petición:', err);
    
    // Detectar errores de permisos (403 Forbidden)
    if (err.response && err.response.status === 403) {
      setPermissionError(true);
      setError('No tienes permisos para realizar esta acción. Solo los administradores pueden gestionar pedidos.');
    } else {
      setError(err.response?.data?.error || err.response?.data?.message || 'Ha ocurrido un error. Por favor, intenta más tarde.');
    }
  };

  // Función para cargar los pedidos (solo para administradores)
  const fetchOrders = async () => {
    if (!userIsAdmin) {
      setPermissionError(true);
      setError('No tienes permisos para ver esta sección. Solo los administradores pueden gestionar pedidos.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }
      
      // Construir los parámetros de consulta
      let params = {
        page: currentPage
      };
      
      // Determinar qué tipo de búsqueda usar
      if (searchTerm) {
        if (searchType === 'id') {
          params.id = searchTerm; // Buscar por ID del pedido
        } else if (searchType === 'tracking') {
          params.numero_seguimiento = searchTerm; // Buscar por número de seguimiento
        }
      }
      
      if (selectedStatus) {
        params.estado = selectedStatus;
      }
      
      // Usar la ruta admin para obtener todos los pedidos
      const response = await axios.get('/api/admin/pedidos', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: params
      });
      
      if (response.data && Array.isArray(response.data.data)) {
        setOrders(response.data.data);
        if (response.data.pagination) {
          setLastPage(response.data.pagination.last_page);
        }
      } else {
        console.error('Respuesta de pedidos no contiene un array:', response.data);
        setOrders([]);
      }
    } catch (err) {
      handleApiError(err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar el estado de un pedido
  const updateOrderStatus = async (orderId, newStatus) => {
    if (!userIsAdmin) {
      setPermissionError(true);
      setError('No tienes permisos para actualizar pedidos. Solo los administradores pueden realizar esta acción.');
      return;
    }

    try {
      setActionInProgress(orderId);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }
      
      const response = await axios.put(`/api/admin/pedidos/${orderId}/estado`, 
        { estado: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setSuccess('Estado del pedido actualizado correctamente');
      fetchOrders(); // Recargar la lista
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (err) {
      console.error('Error actualizando estado:', err);
      handleApiError(err);
    } finally {
      setActionInProgress(null);
    }
  };

  // Función para actualizar número de seguimiento
  const updateTracking = async (orderId, trackingNumber) => {
    if (!userIsAdmin) {
      setPermissionError(true);
      setError('No tienes permisos para actualizar pedidos. Solo los administradores pueden realizar esta acción.');
      return;
    }

    try {
      setActionInProgress(`tracking-${orderId}`);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }
      
      const response = await axios.put(`/api/admin/pedidos/${orderId}/seguimiento`, 
        { numero_seguimiento: trackingNumber },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setSuccess('Número de seguimiento actualizado correctamente');
      fetchOrders(); // Recargar la lista
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (err) {
      console.error('Error actualizando seguimiento:', err);
      handleApiError(err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Volver a la primera página con nuevos resultados
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSearchType('id');
    setSelectedStatus('');
    setCurrentPage(1);
  };

  const changePage = (page) => {
    setCurrentPage(page);
  };

  const toggleOrderDetails = (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
    }
  };

  // Función para formatear precio con el símbolo de euro
  const formatPrice = (price) => {
    return `${parseFloat(price).toFixed(2)}€`;
  };

  // Función para formatear la fecha en formato español
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para traducir el estado del pedido
  const translateStatus = (status) => {
    const statusMap = {
      'pendiente': 'Pendiente',
      'procesando': 'Procesando',
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

  if (loading && orders.length === 0) {
    return (
      <div className={`${styles.tabPane} ${styles.minHeight}`}>
        <h2>Gestión de pedidos</h2>
        <div className={styles.loading}>Cargando pedidos...</div>
      </div>
    );
  }

  // Si el usuario no es administrador, mostrar mensaje
  if (!userIsAdmin) {
    return (
      <div className={`${styles.tabPane} ${styles.minHeight}`}>
        <h2>Gestión de pedidos</h2>
        <div className={styles.alertError}>
          No tienes permisos para acceder a esta sección. Solo los administradores pueden gestionar pedidos.
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.tabPane} ${styles.minHeight}`}>
      <h2>Gestión de pedidos</h2>
      
      {error && (
        <div className={styles.alertError}>
          {error}
          {permissionError && (
            <p>
              <strong>Nota:</strong> Solo los usuarios con rol de administrador pueden gestionar pedidos.
            </p>
          )}
        </div>
      )}
      
      {success && (
        <div className={styles.alertSuccess}>
          {success}
        </div>
      )}
      
      {/* Barra de búsqueda y filtros */}
      <div className={styles.filterBar}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* Selector del tipo de búsqueda */}
          <select 
            className={styles.filterSelect} 
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            style={{ minWidth: '150px' }}
          >
            {searchOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          
          {/* Input de búsqueda */}
          <input 
            type="text" 
            className={styles.searchInput} 
            placeholder={`Buscar por ${searchType === 'id' ? 'ID del pedido' : 'número de seguimiento'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, minWidth: '200px' }}
          />
          
          {/* Filtro por estado */}
          <select 
            className={styles.filterSelect} 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ minWidth: '150px' }}
          >
            <option value="">Todos los estados</option>
            {validStatuses.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
          
          <button type="submit" className={styles.btnGuardar}>
            Buscar
          </button>

          <button className={styles.btnCancelar} onClick={handleResetFilters}>
            Limpiar filtros
          </button>
        </form>
        
      </div>
      
      {/* Vista de tabla para escritorio */}
      <div className={styles.tableResponsive}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Seguimiento</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <React.Fragment key={order.id}>
                <tr>
                  <td>{order.id}</td>
                  <td>
                    {order.user ? (
                      <>
                        {order.user.name}<br />
                        <small style={{ color: '#777' }}>{order.user.email}</small>
                      </>
                    ) : (
                      'Usuario eliminado'
                    )}
                  </td>
                  <td>{formatDate(order.created_at)}</td>
                  <td>{formatPrice(order.precio_total)}</td>
                  <td>
                    <select 
                      className={styles.filterSelect}
                      value={order.estado}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      disabled={actionInProgress === order.id}
                      style={{ 
                        backgroundColor: 'transparent',
                        padding: '5px 8px',
                        fontSize: '13px'
                      }}
                    >
                      {validStatuses.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                    <span className={getStatusClass(order.estado)}>
                      {translateStatus(order.estado)}
                    </span>
                  </td>
                  <td>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Número de seguimiento"
                      defaultValue={order.numero_seguimiento || ''}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (e.target.value !== (order.numero_seguimiento || '')) {
                            updateTracking(order.id, e.target.value);
                          }
                        }
                      }}
                      onBlur={(e) => {
                        if (e.target.value !== (order.numero_seguimiento || '')) {
                          updateTracking(order.id, e.target.value);
                        }
                      }}
                      disabled={actionInProgress === `tracking-${order.id}`}
                      style={{ 
                        fontSize: '13px',
                        padding: '5px 8px'
                      }}
                    />
                  </td>
                  <td className={styles.actions}>
                    <button 
                      className={styles.btnEditar} 
                      onClick={() => toggleOrderDetails(order.id)}
                    >
                      {expandedOrder === order.id ? 'Ocultar' : 'Ver'} detalles
                    </button>
                  </td>
                </tr>
                
                {/* Fila expandida con detalles del pedido */}
                {expandedOrder === order.id && (
                  <tr style={{ backgroundColor: '#f9f9f9' }}>
                    <td colSpan="7">
                      <div className={styles.modal} style={{ margin: '10px 0' }}>
                        <h3>Detalles del pedido #{order.id}</h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                          {/* Productos del pedido */}
                          <div>
                            <h4 style={{ marginBottom: '10px', color: '#333' }}>Productos</h4>
                            <div>
                              {order.detalles && order.detalles.map((item, index) => (
                                <div key={index} style={{ 
                                  padding: '10px', 
                                  border: '1px solid #e0e0e0', 
                                  marginBottom: '10px',
                                  borderRadius: '4px'
                                }}>
                                  <div>
                                    <strong>{item.producto ? item.producto.nombre : 'Producto eliminado'}</strong>
                                    <p style={{ margin: '5px 0', fontSize: '14px' }}>Cantidad: {item.cantidad}</p>
                                    <p style={{ margin: '5px 0', fontSize: '14px' }}>Precio unitario: {formatPrice(item.precio_unitario)}</p>
                                    <p style={{ margin: '5px 0', fontSize: '14px', fontWeight: 'bold' }}>
                                      Subtotal: {formatPrice(item.cantidad * item.precio_unitario)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Dirección de envío */}
                          <div>
                            <h4 style={{ marginBottom: '10px', color: '#333' }}>Dirección de envío</h4>
                            {order.direccion ? (
                              <div style={{ 
                                padding: '10px', 
                                border: '1px solid #e0e0e0', 
                                borderRadius: '4px'
                              }}>
                                <p style={{ margin: '5px 0' }}><strong>{order.direccion.nombre_direccion}</strong></p>
                                <p style={{ margin: '5px 0' }}>{order.direccion.calle} {order.direccion.numero}
                                {order.direccion.piso ? `, ${order.direccion.piso}` : ''}
                                {order.direccion.puerta ? ` ${order.direccion.puerta}` : ''}</p>
                                <p style={{ margin: '5px 0' }}>{order.direccion.codigo_postal} {order.direccion.ciudad}</p>
                                <p style={{ margin: '5px 0' }}>{order.direccion.provincia}, {order.direccion.pais}</p>
                              </div>
                            ) : (
                              <p style={{ fontStyle: 'italic', color: '#777' }}>No hay información de dirección disponible</p>
                            )}
                          </div>
                          
                          {/* Información de pago */}
                          <div>
                            <h4 style={{ marginBottom: '10px', color: '#333' }}>Información de pago</h4>
                            <div style={{ 
                              padding: '10px', 
                              border: '1px solid #e0e0e0', 
                              borderRadius: '4px'
                            }}>
                              <p style={{ margin: '5px 0' }}><strong>Método:</strong> {order.metodo_pago}</p>
                              <p style={{ margin: '5px 0' }}><strong>Total:</strong> {formatPrice(order.precio_total)}</p>
                              {order.numero_seguimiento && (
                                <p style={{ margin: '5px 0' }}>
                                  <strong>Seguimiento:</strong> {order.numero_seguimiento}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista de tarjetas para móviles */}
      <div className={styles.mobileCards}>
        {orders.map(order => (
          <div key={order.id} className={styles.userCard}>
            <div className={styles.userCardHeader}>
              <div>
                <div className={styles.userCardTitle}>
                  Pedido #{order.id}
                </div>
                <div className={styles.userCardEmail}>
                  {order.user ? order.user.email : 'Usuario eliminado'}
                </div>
              </div>
              <div className={styles.userCardId}>
                {formatPrice(order.precio_total)}
              </div>
            </div>
            
            <div className={styles.userCardDetails}>
              <div className={styles.userCardDetail}>
                <div className={styles.userCardDetailLabel}>Usuario</div>
                <div className={styles.userCardDetailValue}>
                  {order.user ? order.user.name : 'Usuario eliminado'}
                </div>
              </div>
              
              <div className={styles.userCardDetail}>
                <div className={styles.userCardDetailLabel}>Fecha</div>
                <div className={styles.userCardDetailValue}>
                  {formatDate(order.created_at)}
                </div>
              </div>
              
              <div className={styles.userCardDetail}>
                <div className={styles.userCardDetailLabel}>Estado</div>
                <div className={styles.userCardDetailValue}>
                  <span className={getStatusClass(order.estado)}>
                    {translateStatus(order.estado)}
                  </span>
                </div>
              </div>
              
              <div className={styles.userCardDetail}>
                <div className={styles.userCardDetailLabel}>Seguimiento</div>
                <div className={styles.userCardDetailValue}>
                  {order.numero_seguimiento || 'Sin seguimiento'}
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
              {/* Cambiar estado */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                  Cambiar estado:
                </label>
                <select 
                  className={styles.filterSelect}
                  value={order.estado}
                  onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                  disabled={actionInProgress === order.id}
                  style={{ width: '100%', fontSize: '14px' }}
                >
                  {validStatuses.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Número de seguimiento */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                  Número de seguimiento:
                </label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Número de seguimiento"
                  defaultValue={order.numero_seguimiento || ''}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (e.target.value !== (order.numero_seguimiento || '')) {
                        updateTracking(order.id, e.target.value);
                      }
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value !== (order.numero_seguimiento || '')) {
                      updateTracking(order.id, e.target.value);
                    }
                  }}
                  disabled={actionInProgress === `tracking-${order.id}`}
                  style={{ width: '100%', fontSize: '14px' }}
                />
              </div>
            </div>
            
            <div className={styles.userCardActions}>
              <button 
                className={styles.btnEditar} 
                onClick={() => toggleOrderDetails(order.id)}
              >
                {expandedOrder === order.id ? 'Ocultar' : 'Ver'} detalles
              </button>
            </div>
            
            {/* Detalles expandidos para vista móvil */}
            {expandedOrder === order.id && (
              <div className={styles.expandedDetails}>
                <h4 style={{ fontSize: '16px', marginBottom: '10px', color: '#333' }}>
                  Detalles del pedido #{order.id}
                </h4>
                
                {/* Productos */}
                <div style={{ marginBottom: '15px' }}>
                  <h5 style={{ fontSize: '14px', marginBottom: '8px', fontWeight: 'bold' }}>Productos:</h5>
                  {order.detalles && order.detalles.map((item, index) => (
                    <div key={index} style={{ 
                      backgroundColor: '#f9f9f9',
                      padding: '10px', 
                      border: '1px solid #e0e0e0', 
                      marginBottom: '8px',
                      borderRadius: '4px'
                    }}>
                      <p style={{ margin: '2px 0', fontSize: '13px', fontWeight: 'bold' }}>
                        {item.producto ? item.producto.nombre : 'Producto eliminado'}
                      </p>
                      <p style={{ margin: '2px 0', fontSize: '12px' }}>
                        {item.cantidad} × {formatPrice(item.precio_unitario)} = {formatPrice(item.cantidad * item.precio_unitario)}
                      </p>
                    </div>
                  ))}
                </div>
                
                {/* Dirección de envío */}
                {order.direccion && (
                  <div style={{ marginBottom: '15px' }}>
                    <h5 style={{ fontSize: '14px', marginBottom: '8px', fontWeight: 'bold' }}>Dirección de envío:</h5>
                    <div style={{ backgroundColor: '#f9f9f9', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                      <p style={{ margin: '2px 0', fontSize: '13px' }}>
                        <strong>{order.direccion.nombre_direccion}</strong>
                      </p>
                      <p style={{ margin: '2px 0', fontSize: '12px' }}>
                        {order.direccion.calle} {order.direccion.numero}
                        {order.direccion.piso && `, ${order.direccion.piso}`}
                        {order.direccion.puerta && ` ${order.direccion.puerta}`}
                      </p>
                      <p style={{ margin: '2px 0', fontSize: '12px' }}>
                        {order.direccion.codigo_postal} {order.direccion.ciudad}
                      </p>
                      <p style={{ margin: '2px 0', fontSize: '12px' }}>
                        {order.direccion.provincia}, {order.direccion.pais}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Información de pago */}
                <div>
                  <h5 style={{ fontSize: '14px', marginBottom: '8px', fontWeight: 'bold' }}>Información de pago:</h5>
                  <div style={{ backgroundColor: '#f9f9f9', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                    <p style={{ margin: '2px 0', fontSize: '12px' }}>
                      <strong>Método:</strong> {order.metodo_pago}
                    </p>
                    <p style={{ margin: '2px 0', fontSize: '12px' }}>
                      <strong>Total:</strong> {formatPrice(order.precio_total)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {orders.length === 0 && !loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '50px',
          color: '#777',
          border: '1px solid #e0e0e0',
          borderRadius: '4px'
        }}>
          <p>No se encontraron pedidos. Intenta cambiar los filtros.</p>
        </div>
      )}
      
      {/* Paginación */}
      {lastPage > 1 && (
        <div className={styles.pagination}>
          <button 
            className={styles.pageBtn} 
            onClick={() => changePage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            &laquo; Anterior
          </button>
          
          {Array.from({ length: lastPage }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              className={`${styles.pageBtn} ${currentPage === page ? styles.pageBtnActive : ''}`}
              onClick={() => changePage(page)}
            >
              {page}
            </button>
          ))}
          
          <button 
            className={styles.pageBtn} 
            onClick={() => changePage(Math.min(lastPage, currentPage + 1))}
            disabled={currentPage === lastPage}
          >
            Siguiente &raquo;
          </button>
        </div>
      )}
    </div>
  );
}

export default OrderTab;