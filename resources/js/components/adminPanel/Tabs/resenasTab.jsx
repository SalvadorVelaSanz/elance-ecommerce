import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { AuthContext } from '../../RUTAS/AuthContext';
import sharedStyles from '../../../../css/panelShared.module.css';
import ownStyles from '../adminPanel.module.css';
const styles = { ...sharedStyles, ...ownStyles };

function ResenasTab() {
  const { user, isAdmin } = useContext(AuthContext);
  const userIsAdmin = isAdmin(); 
  
  const [resenas, setResenas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissionError, setPermissionError] = useState(false);
  const [success, setSuccess] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [selectedProducto, setSelectedProducto] = useState('');
  const [selectedPuntuacion, setSelectedPuntuacion] = useState('');
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedComment, setSelectedComment] = useState(null);

  // Cargar productos y reseñas al montar el componente
  useEffect(() => {
    fetchProductos();
    fetchResenas();
  }, []);

  // Cargar reseñas cuando cambie la página
  useEffect(() => {
    fetchResenas();
  }, [currentPage]);

  // Función para manejar errores de las peticiones
  const handleApiError = (err) => {
    console.error('Error en la petición:', err);
    
    // Detectar errores de permisos (403 Forbidden)
    if (err.response && err.response.status === 403) {
      setPermissionError(true);
      setError('No tienes permisos para realizar esta acción. Solo los administradores pueden gestionar reseñas.');
    } else {
      setError(err.response?.data?.error || 'Ha ocurrido un error. Por favor, intenta más tarde.');
    }
  };

  // Función para cargar productos para filtros
  const fetchProductos = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }
      
      const response = await axios.get('/api/productos', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && Array.isArray(response.data.data)) {
        setProductos(response.data.data);
      }
    } catch (err) {
      console.error('Error al cargar productos:', err);
    }
  };

  // Función para cargar las reseñas
  const fetchResenas = async () => {
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
      
      if (selectedProducto) {
        params.producto_id = selectedProducto;
      }
      
      if (selectedPuntuacion) {
        params.puntuacion = selectedPuntuacion;
      }
      
      const response = await axios.get('/api/admin/resenas', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: params
      });
      
      if (response.data && response.data.success) {
        setResenas(response.data.data);
        if (response.data.pagination) {
          setLastPage(response.data.pagination.last_page);
        }
      } else {
        console.error('Respuesta de reseñas no contiene datos válidos:', response.data);
        setResenas([]);
      }
    } catch (err) {
      handleApiError(err);
      setResenas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    // Verificar primero si el usuario es administrador
    if (!userIsAdmin) {
      setPermissionError(true);
      setError('No tienes permisos para eliminar reseñas. Solo los administradores pueden realizar esta acción.');
      
      // Mostrar SweetAlert para error de permisos
      Swal.fire({
        title: 'Sin permisos',
        text: 'No tienes permisos para eliminar reseñas. Solo los administradores pueden realizar esta acción.',
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
      return;
    }
    
    // Confirmar eliminación con SweetAlert
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Quieres eliminar esta reseña? Esta acción no se puede deshacer.',
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
    
    try {
      setActionInProgress(id);
      setError(null);
      setSuccess(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }
      
      await axios.delete(`/api/admin/resenas/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Actualizar estado después de eliminar
      fetchResenas();
      
      setSuccess('Reseña eliminada correctamente');
      
      // Mostrar SweetAlert de éxito
      Swal.fire({
        title: '¡Eliminada!',
        text: 'La reseña ha sido eliminada correctamente.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (err) {
      handleApiError(err);
      
      // Mostrar SweetAlert de error
      Swal.fire({
        title: 'Error',
        text: err.response?.data?.error || 'Ha ocurrido un error al eliminar la reseña. Por favor, intenta más tarde.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Volver a la primera página con nuevos resultados
    fetchResenas(); // Ejecutar la búsqueda
  };

  const handleResetFilters = () => {
    setSelectedProducto('');
    setSelectedPuntuacion('');
    setCurrentPage(1);
    fetchResenas(); // Ejecutar búsqueda con filtros vacíos
  };

  const changePage = (page) => {
    setCurrentPage(page);
  };

  // Función  para toggle del modal
  const toggleCommentModal = (resena) => {
    if (showCommentModal && selectedComment && selectedComment.id === resena.id) {
      // Si el modal está abierto con la misma reseña, cerrarlo
      setShowCommentModal(false);
      setSelectedComment(null);
    } else {
      // Si el modal está cerrado o con otra reseña, abrir con la nueva reseña
      setSelectedComment(resena);
      setShowCommentModal(true);
    }
  };

  const closeCommentModal = () => {
    setShowCommentModal(false);
    setSelectedComment(null);
  };

  // Función para eliminar desde el modal con confirmación SweetAlert
  const handleDeleteFromModal = async (id) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Quieres eliminar esta reseña? Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      closeCommentModal();
      handleDelete(id);
    }
  };

  const renderStars = (puntuacion) => {
    return '★'.repeat(puntuacion) + '☆'.repeat(5 - puntuacion);
  };

  const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading && resenas.length === 0) {
    return (
      <div className={`${styles.tabPane} ${styles.minHeight}`}>
        <h2>Gestión de reseñas</h2>
        <div className={styles.loading}>Cargando reseñas...</div>
      </div>
    );
  }

  return (
    <div className={`${styles.tabPane} ${styles.minHeight}`}>
      <h2>Gestión de reseñas</h2>
      
      {error && (
        <div className={styles.alertError}>
          {error}
          {permissionError && (
            <p>
              <strong>Nota:</strong> Solo los usuarios con rol de administrador pueden gestionar reseñas.
            </p>
          )}
        </div>
      )}
      
      {success && (
        <div className={styles.alertSuccess}>
          {success}
        </div>
      )}
      
      {/* Barra de filtros */}
      <div className={styles.filterBar}>
        <form onSubmit={handleFilter} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select 
            className={styles.filterSelect} 
            value={selectedProducto}
            onChange={(e) => setSelectedProducto(e.target.value)}
          >
            <option value="">Todos los productos</option>
            {productos.map(producto => (
              <option key={producto.id} value={producto.id}>{producto.nombre}</option>
            ))}
          </select>
          
          <select 
            className={styles.filterSelect} 
            value={selectedPuntuacion}
            onChange={(e) => setSelectedPuntuacion(e.target.value)}
          >
            <option value="">Todas las puntuaciones</option>
            <option value="5">5 estrellas</option>
            <option value="4">4 estrellas</option>
            <option value="3">3 estrellas</option>
            <option value="2">2 estrellas</option>
            <option value="1">1 estrella</option>
          </select>
          
          <button type="submit" className={styles.btnGuardar}>
            Filtrar
          </button>
          
          <button type="button" className={styles.btnCancelar} onClick={handleResetFilters}>
            Limpiar filtros
          </button>
        </form>
      </div>
      
      {/* Vista de tabla para escritorio */}
      <div className={styles.tableResponsive}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID Usuario</th>
              <th>Usuario</th>
              <th>Producto</th>
              <th>Puntuación</th>
              <th>Fecha</th>
              <th>Comentario</th>
              {userIsAdmin && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {resenas.map(resena => (
              <tr key={resena.id}>
                <td>{resena.id}</td>
                <td>
                  <div>
                    <strong>{resena.user?.name} {resena.user?.apellidos}</strong>
                    <br />
                    <small>ID: {resena.user_id}</small>
                  </div>
                </td>
                <td>{resena.producto?.nombre}</td>
                <td>
                  <div style={{ fontSize: '18px', color: '#FFD700' }}>
                    {renderStars(resena.puntuacion)}
                  </div>
                  <small>{resena.puntuacion}/5</small>
                </td>
                <td>{new Date(resena.fecha_resena).toLocaleDateString()}</td>
                <td>
                  <div 
                    style={{ 
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title={resena.comentario}
                  >
                    {resena.comentario}
                  </div>
                </td>
                {userIsAdmin && (
                  <td className={styles.actions}>
                    <button 
                      className={styles.btnEditar} 
                      onClick={() => toggleCommentModal(resena)}
                      style={{ marginRight: '8px' }}
                    >
                      {showCommentModal && selectedComment && selectedComment.id === resena.id ? 'Ocultar contenido' : 'Ver contenido'}
                    </button>
                    <button 
                      className={styles.btnEliminar} 
                      onClick={() => handleDelete(resena.id)}
                      disabled={actionInProgress === resena.id}
                    >
                      {actionInProgress === resena.id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista de tarjetas para móviles */}
      <div className={styles.mobileCards}>
        {resenas.map(resena => (
          <div key={resena.id} className={styles.userCard}>
            <div className={styles.userCardHeader}>
              <div>
                <div className={styles.userCardTitle}>
                  {resena.user?.name} {resena.user?.apellidos}
                </div>
                <div className={styles.userCardEmail}>
                  ID Usuario: {resena.user_id}
                </div>
              </div>
              <div className={styles.userCardId}>
                ID Reseña: {resena.id}
              </div>
            </div>
            
            <div className={styles.userCardDetails}>
              <div className={styles.userCardDetail}>
                <div className={styles.userCardDetailLabel}>Producto</div>
                <div className={styles.userCardDetailValue}>
                  {resena.producto?.nombre}
                </div>
              </div>
              
              <div className={styles.userCardDetail}>
                <div className={styles.userCardDetailLabel}>Puntuación</div>
                <div className={styles.userCardDetailValue}>
                  <div style={{ fontSize: '18px', color: '#FFD700' }}>
                    {renderStars(resena.puntuacion)}
                  </div>
                  <small>{resena.puntuacion}/5</small>
                </div>
              </div>
              
              <div className={styles.userCardDetail}>
                <div className={styles.userCardDetailLabel}>Fecha</div>
                <div className={styles.userCardDetailValue}>
                  {new Date(resena.fecha_resena).toLocaleDateString()}
                </div>
              </div>
              
              <div className={styles.userCardDetail} style={{ overflow: 'hidden' }}>
                <div className={styles.userCardDetailLabel}>Comentario</div>
                <div className={styles.userCardDetailValue} style={{ overflow: 'hidden', width: '100%', minWidth: 0 }}>
                  <div 
                    style={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      width: '100%',
                      minWidth: 0,
                      boxSizing: 'border-box',
                      maxWidth: '280px' 
                    }}
                    title={resena.comentario}
                  >
                    {resena.comentario}
                  </div>
                </div>
              </div>
            </div>
            
            {userIsAdmin && (
              <div className={styles.userCardActions}>
                <button 
                  className={styles.btnEditar} 
                  onClick={() => toggleCommentModal(resena)}
                  style={{ marginRight: '8px' }}
                >
                  {showCommentModal && selectedComment && selectedComment.id === resena.id ? 'Ocultar contenido' : 'Ver contenido'}
                </button>
                <button 
                  className={styles.btnEliminar} 
                  onClick={() => handleDelete(resena.id)}
                  disabled={actionInProgress === resena.id}
                >
                  {actionInProgress === resena.id ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {resenas.length === 0 && !loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '50px',
          color: '#777',
          border: '1px solid #e0e0e0',
          borderRadius: '4px'
        }}>
          <p>No se encontraron reseñas con los filtros seleccionados.</p>
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
      
      {/* Si el usuario no es administrador, se muestra un mensaje informativo */}
      {!userIsAdmin && !permissionError && (
        <div className={styles.infoMessage}>
          <p>Solo los administradores pueden gestionar reseñas. Si necesitas realizar cambios, contacta con un administrador.</p>
        </div>
      )}

      {/* Modal para mostrar comentario completo */}
      {showCommentModal && selectedComment && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Comentario completo</h3>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.modalInfo}>
                <p><strong>Usuario:</strong> {selectedComment.user?.name} {selectedComment.user?.apellidos}</p>
                <p><strong>Producto:</strong> {selectedComment.producto?.nombre}</p>
                <p><strong>Puntuación:</strong> {renderStars(selectedComment.puntuacion)} ({selectedComment.puntuacion}/5)</p>
                <p><strong>Fecha:</strong> {new Date(selectedComment.fecha_resena).toLocaleDateString()}</p>
              </div>
              
              <div className={styles.modalComment}>
                <h4>Comentario:</h4>
                <div 
                  className={styles.commentBox}
                  style={{
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    padding: '12px',
                    minHeight: '80px',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    wordBreak: 'break-word',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    lineHeight: 1.5
                  }}
                >
                  {selectedComment.comentario}
                </div>
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              {userIsAdmin && (
                <button 
                  className={styles.btnEliminar} 
                  onClick={() => handleDeleteFromModal(selectedComment.id)}
                  disabled={actionInProgress === selectedComment.id}
                >
                  Eliminar reseña
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Overlay del modal */}
      {showCommentModal && (
        <div 
          className={styles.modalOverlay}
          onClick={closeCommentModal}
        ></div>
      )}
    </div>
  );
}

export default ResenasTab;