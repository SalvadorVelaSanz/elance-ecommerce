import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { AuthContext } from '../../RUTAS/AuthContext';
import sharedStyles from '../../../../css/panelShared.module.css';
import ownStyles from '../adminPanel.module.css';
const styles = { ...sharedStyles, ...ownStyles };

function UsersTab() {
  const { user, isAdmin } = useContext(AuthContext);
  const userIsAdmin = isAdmin(); 
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissionError, setPermissionError] = useState(false);
  const [success, setSuccess] = useState(null);

  // Estado para controlar la acción en progreso (suspender o eliminar)
  const [actionInProgress, setActionInProgress] = useState(null);
  
  
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  
  // Estados para los inputs del formulario
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedSuspended, setSelectedSuspended] = useState('');
  
  // Estados para los filtros aplicados que se usan en las peticiones
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [appliedRole, setAppliedRole] = useState('');
  const [appliedSuspended, setAppliedSuspended] = useState('');
  
  const [expandedUser, setExpandedUser] = useState(null);

  // Roles disponibles (Administrador y Usuario)
  const availableRoles = [
    { value: '0', label: 'Usuario' },
    { value: '1', label: 'Administrador' }
  ];

  // Estados de suspensión
  const suspensionStatuses = [
    { value: '0', label: 'Activo' },
    { value: '1', label: 'Suspendido' }
  ];

  // Cargar usuarios al montar el componente
  useEffect(() => {
    if (userIsAdmin) {
      fetchUsers();
    }
  }, [userIsAdmin, currentPage, appliedSearchTerm, appliedRole, appliedSuspended]);

  // Función para manejar errores de las peticiones
  const handleApiError = (err) => {
    console.error('Error en la petición:', err);
    
    // Detectar errores de permisos (403 Forbidden)
    if (err.response && err.response.status === 403) {
      setPermissionError(true);
      setError('No tienes permisos para realizar esta acción. Solo los administradores pueden gestionar usuarios.');
    } else {
      setError(err.response?.data?.error || err.response?.data?.message || 'Ha ocurrido un error. Por favor, intenta más tarde.');
    }
  };

  // Función para cargar los usuarios (solo para administradores)
  const fetchUsers = async () => {
    if (!userIsAdmin) {
      setPermissionError(true);
      setError('No tienes permisos para ver esta sección. Solo los administradores pueden gestionar usuarios.');
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
      
      // Construir los parámetros de consulta usando los filtros aplicados
      let params = {
        page: currentPage
      };
      
      if (appliedSearchTerm) {
        params.search = appliedSearchTerm;
      }
      
      if (appliedRole !== '') {
        params.is_admin = appliedRole; 
      }
      
      if (appliedSuspended !== '') {
        params.suspended = appliedSuspended;
      }
      
      // Usar la ruta admin para obtener todos los usuarios
      const response = await axios.get('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: params
      });
      
      if (response.data && Array.isArray(response.data.data)) {
        setUsers(response.data.data);
        if (response.data.pagination) {
          setLastPage(response.data.pagination.last_page);
        }
      } else {
        console.error('Respuesta de usuarios no contiene un array:', response.data);
        setUsers([]);
      }
    } catch (err) {
      handleApiError(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para suspender/reactivar usuario
  const toggleUserSuspension = async (userId) => {
    if (!userIsAdmin) {
      setPermissionError(true);
      setError('No tienes permisos para suspender usuarios. Solo los administradores pueden realizar esta acción.');
      return;
    }

    try {
      setActionInProgress(`suspend-${userId}`);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }
      
      const response = await axios.put(`/api/admin/users/${userId}/toggle-suspension`, 
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setSuccess(response.data.message);
      fetchUsers(); // Recargar la lista
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (err) {
      console.error('Error actualizando suspensión:', err);
      handleApiError(err);
    } finally {
      setActionInProgress(null);
    }
  };

  // Función para eliminar usuario
const deleteUser = async (userId) => {
  if (!userIsAdmin) {
    setPermissionError(true);
    setError('No tienes permisos para eliminar usuarios. Solo los administradores pueden realizar esta acción.');
    return;
  }

  // Buscar el usuario para mostrar su nombre en la confirmación
  const usuario = users.find(u => u.id === userId);
  const nombreUsuario = usuario ? `${usuario.name} ${usuario.apellidos}` : 'el usuario';

  // Confirmación con SweetAlert
  const result = await Swal.fire({
    title: '¿Eliminar usuario?',
    html: `¿Estás seguro de que quieres eliminar a <strong>${nombreUsuario}</strong>?<br><br>Esta acción no se puede deshacer.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
    focusCancel: true
  });

  if (!result.isConfirmed) {
    return;
  }

  try {
    setActionInProgress(`delete-${userId}`);
    setError(null);
    
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No hay token de autenticación');
    }
    
    const response = await axios.delete(`/api/admin/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    // Mostrar mensaje de éxito con SweetAlert
    await Swal.fire({
      title: '¡Eliminado!',
      text: `${nombreUsuario} ha sido eliminado correctamente`,
      icon: 'success',
      timer: 3000,
      showConfirmButton: false
      
    });
    
    setSuccess('Usuario eliminado correctamente');
    fetchUsers(); // Recargar la lista
    
    // Limpiar mensaje de éxito después de 3 segundos
    setTimeout(() => {
      setSuccess(null);
    }, 3000);
    
  } catch (err) {
    console.error('Error eliminando usuario:', err);
    
    // Mostrar error con SweetAlert
    await Swal.fire({
      title: 'Error',
      text: 'Ha ocurrido un error al eliminar el usuario',
      icon: 'error',
      confirmButtonColor: '#d33'
    });
    
    handleApiError(err);
  } finally {
    setActionInProgress(null);
  }
};

  // Aplicar filtros cuando se presiona el botón buscar
  const handleSearch = (e) => {
    e.preventDefault();
    setAppliedSearchTerm(searchTerm);
    setAppliedRole(selectedRole);
    setAppliedSuspended(selectedSuspended);
    setCurrentPage(1); // Volver a la primera página con nuevos resultados
  };

  // Limpiar todos los filtros
  const handleResetFilters = () => {
    // Limpiar los inputs del formulario
    setSearchTerm('');
    setSelectedRole('');
    setSelectedSuspended('');
    
    // Limpiar los filtros aplicados
    setAppliedSearchTerm('');
    setAppliedRole('');
    setAppliedSuspended('');
    
    setCurrentPage(1);
  };

  const changePage = (page) => {
    setCurrentPage(page);
  };

  const toggleUserDetails = (userId) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
    } else {
      setExpandedUser(userId);
    }
  };

  // Función para formatear la fecha
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

  // Función para traducir el rol 
  const translateRole = (isAdmin) => {
    return isAdmin === 1 || isAdmin === true ? 'Administrador' : 'Usuario';
  };

  // Función para asignar una clase CSS según el rol 
  const getRoleClass = (isAdmin) => {
    return isAdmin === 1 || isAdmin === true ? styles.badgeWarning : styles.badgePrimary;
  };

  // Función para asignar una clase CSS según el estado de suspensión
  const getSuspensionClass = (isSuspended) => {
    return isSuspended ? styles.badgeDanger : styles.badgeSuccess;
  };

  if (loading && users.length === 0) {
    return (
      <div className={`${styles.tabPane} ${styles.minHeight}`}>
        <h2>Gestión de usuarios</h2>
        <div className={styles.loading}>Cargando usuarios...</div>
      </div>
    );
  }

  // Si el usuario no es administrador, mostrar mensaje
  if (!userIsAdmin) {
    return (
      <div className={`${styles.tabPane} ${styles.minHeight}`}>
        <h2>Gestión de usuarios</h2>
        <div className={styles.alertError}>
          No tienes permisos para acceder a esta sección. Solo los administradores pueden gestionar usuarios.
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.tabPane} ${styles.minHeight}`}>
      <h2>Gestión de usuarios</h2>
      
      {error && (
        <div className={styles.alertError}>
          {error}
          {permissionError && (
            <p>
              <strong>Nota:</strong> Solo los usuarios con rol de administrador pueden gestionar usuarios.
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
          {/* Input de búsqueda */}
          <input 
            type="text" 
            className={styles.searchInput} 
            placeholder="Buscar por nombre, apellidos o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, minWidth: '200px' }}
          />
          
          {/* Filtro por rol */}
          <select 
            className={styles.filterSelect} 
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            style={{ minWidth: '150px' }}
          >
            <option value="">Todos los roles</option>
            {availableRoles.map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
          
          {/* Filtro por estado de suspensión */}
          <select 
            className={styles.filterSelect} 
            value={selectedSuspended}
            onChange={(e) => setSelectedSuspended(e.target.value)}
            style={{ minWidth: '150px' }}
          >
            <option value="">Todos los estados</option>
            {suspensionStatuses.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
          
          <button type="submit" className={styles.btnGuardar}>
            Buscar
          </button>
          
          <button type="button" className={styles.btnCancelar} onClick={handleResetFilters}>
            Limpiar filtros
          </button>
        </form>
      </div>
      
      {/* Mostrar filtros aplicados si existen */}
      {(appliedSearchTerm || appliedRole !== '' || appliedSuspended !== '') && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#f0f8ff', 
          borderRadius: '4px', 
          marginBottom: '15px',
          fontSize: '14px',
          color: '#333'
        }}>
          <strong>Filtros aplicados:</strong>
          {appliedSearchTerm && <span style={{ marginLeft: '10px' }}>Búsqueda: "{appliedSearchTerm}"</span>}
          {appliedRole !== '' && <span style={{ marginLeft: '10px' }}>Rol: {availableRoles.find(r => r.value === appliedRole)?.label}</span>}
          {appliedSuspended !== '' && <span style={{ marginLeft: '10px' }}>Estado: {suspensionStatuses.find(s => s.value === appliedSuspended)?.label}</span>}
        </div>
      )}
      
      {/* Vista de tabla para escritorio */}
      <div className={styles.tableResponsive}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Verificado</th>
              <th>Fecha registro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(userItem => (
              <React.Fragment key={userItem.id}>
                <tr>
                  <td>{userItem.id}</td>
                  <td>
                    {userItem.name} {userItem.apellidos}
                    {userItem.telefono && (
                      <>
                        <br />
                        <small style={{ color: '#777' }}>{userItem.telefono}</small>
                      </>
                    )}
                  </td>
                  <td>{userItem.email}</td>
                  <td>
                    <span className={getRoleClass(userItem.is_admin)}>
                      {translateRole(userItem.is_admin)}
                    </span>
                  </td>
                  <td>
                    <span className={getSuspensionClass(userItem.is_suspended)}>
                      {userItem.is_suspended ? 'Suspendido' : 'Activo'}
                    </span>
                  </td>
                  <td>
                    <span className={userItem.email_verified_at ? styles.badgeSuccess : styles.badgeDanger}>
                      {userItem.email_verified_at ? 'Verificado' : 'Sin verificar'}
                    </span>
                  </td>
                  <td>{formatDate(userItem.created_at)}</td>
                  <td className={styles.actions}>
                    <button 
                      className={styles.btnEditar} 
                      onClick={() => toggleUserDetails(userItem.id)}
                    >
                      {expandedUser === userItem.id ? 'Ocultar' : 'Ver'} detalles
                    </button>
                    
                    {/* No permitir acciones en administradores */}
                    {!(userItem.is_admin === 1 || userItem.is_admin === true) && (
                      <>
                        <button 
                          className={userItem.is_suspended ? styles.btnGuardar : styles.btnCancelar}
                          onClick={() => toggleUserSuspension(userItem.id)}
                          disabled={actionInProgress === `suspend-${userItem.id}`}
                        >
                          {userItem.is_suspended ? 'REACTIVAR' : 'SUSPENDER'}
                        </button>
                        
                        <button 
                          className={styles.btnEliminar}
                          onClick={() => deleteUser(userItem.id)}
                          disabled={actionInProgress === `delete-${userItem.id}`}
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
                
                {/* Fila expandida con detalles del usuario */}
                {expandedUser === userItem.id && (
                  <tr style={{ backgroundColor: '#f9f9f9' }}>
                    <td colSpan="8">
                      <div className={styles.modal} style={{ margin: '10px 0' }}>
                        <h3>Detalles del usuario {userItem.name} {userItem.apellidos}</h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                          {/* Información personal */}
                          <div>
                            <h4 style={{ marginBottom: '10px', color: '#333' }}>Información personal</h4>
                            <div style={{ 
                              padding: '10px', 
                              border: '1px solid #e0e0e0', 
                              borderRadius: '4px'
                            }}>
                              <p style={{ margin: '5px 0' }}><strong>Nombre completo:</strong> {userItem.name} {userItem.apellidos}</p>
                              <p style={{ margin: '5px 0' }}><strong>Email:</strong> {userItem.email}</p>
                              <p style={{ margin: '5px 0' }}><strong>Teléfono:</strong> {userItem.telefono || 'No proporcionado'}</p>
                              <p style={{ margin: '5px 0' }}>
                                <strong>Email verificado:</strong> 
                                <span className={userItem.email_verified_at ? styles.badgeSuccess : styles.badgeDanger}>
                                  {userItem.email_verified_at ? 'Sí' : 'No'}
                                </span>
                              </p>
                              {userItem.email_verified_at && (
                                <p style={{ margin: '5px 0', fontSize: '14px', color: '#777' }}>
                                  Verificado el: {formatDate(userItem.email_verified_at)}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Estado de la cuenta */}
                          <div>
                            <h4 style={{ marginBottom: '10px', color: '#333' }}>Estado de la cuenta</h4>
                            <div style={{ 
                              padding: '10px', 
                              border: '1px solid #e0e0e0', 
                              borderRadius: '4px'
                            }}>
                              <p style={{ margin: '5px 0' }}>
                                <strong>Rol:</strong> 
                                <span className={getRoleClass(userItem.is_admin)}>
                                  {translateRole(userItem.is_admin)}
                                </span>
                              </p>
                              <p style={{ margin: '5px 0' }}>
                                <strong>Estado:</strong> 
                                <span className={getSuspensionClass(userItem.is_suspended)}>
                                  {userItem.is_suspended ? 'Suspendido' : 'Activo'}
                                </span>
                              </p>
                              <p style={{ margin: '5px 0' }}><strong>Fecha de registro:</strong> {formatDate(userItem.created_at)}</p>
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
        {users.map(userItem => (
          <div key={userItem.id} className={styles.userCard}>
            <div className={styles.userCardHeader}>
              <div>
                <div className={styles.userCardTitle}>
                  {userItem.name} {userItem.apellidos}
                </div>
                <div className={styles.userCardEmail}>
                  {userItem.email}
                </div>
                {userItem.telefono && (
                  <div style={{ fontSize: '13px', color: '#999', marginTop: '2px' }}>
                    {userItem.telefono}
                  </div>
                )}
              </div>
              <div className={styles.userCardId}>
                ID: {userItem.id}
              </div>
            </div>
            
            <div className={styles.userCardDetails}>
              <div className={styles.userCardDetail}>
                <div className={styles.userCardDetailLabel}>Rol</div>
                <div className={styles.userCardDetailValue}>
                  <span className={getRoleClass(userItem.is_admin)}>
                    {translateRole(userItem.is_admin)}
                  </span>
                </div>
              </div>
              
              <div className={styles.userCardDetail}>
                <div className={styles.userCardDetailLabel}>Estado</div>
                <div className={styles.userCardDetailValue}>
                  <span className={getSuspensionClass(userItem.is_suspended)}>
                    {userItem.is_suspended ? 'Suspendido' : 'Activo'}
                  </span>
                </div>
              </div>
              
              <div className={styles.userCardDetail}>
                <div className={styles.userCardDetailLabel}>Verificado</div>
                <div className={styles.userCardDetailValue}>
                  <span className={userItem.email_verified_at ? styles.badgeSuccess : styles.badgeDanger}>
                    {userItem.email_verified_at ? 'Verificado' : 'No verificado'}
                  </span>
                </div>
              </div>
              
              <div className={styles.userCardDetail}>
                <div className={styles.userCardDetailLabel}>Registro</div>
                <div className={styles.userCardDetailValue}>
                  {formatDate(userItem.created_at)}
                </div>
              </div>
            </div>
            
            <div className={styles.userCardActions}>
              <button 
                className={styles.btnEditar} 
                onClick={() => toggleUserDetails(userItem.id)}
              >
                {expandedUser === userItem.id ? 'Ocultar' : 'Ver'} detalles
              </button>
              
              {/* No permitir acciones en administradores */}
              {!(userItem.is_admin === 1 || userItem.is_admin === true) && (
                <>
                  <button 
                    className={userItem.is_suspended ? styles.btnGuardar : styles.btnCancelar}
                    onClick={() => toggleUserSuspension(userItem.id)}
                    disabled={actionInProgress === `suspend-${userItem.id}`}
                  >
                    {userItem.is_suspended ? 'REACTIVAR' : 'SUSPENDER'}
                  </button>
                  
                  <button 
                    className={styles.btnEliminar}
                    onClick={() => deleteUser(userItem.id)}
                    disabled={actionInProgress === `delete-${userItem.id}`}
                  >
                    Eliminar
                  </button>
                </>
              )}
            </div>
            
            {/* Detalles expandidos para vista móvil */}
            {expandedUser === userItem.id && (
              <div className={styles.expandedDetails}>
                <h4 style={{ fontSize: '16px', marginBottom: '10px', color: '#333' }}>
                  Detalles del usuario
                </h4>
                <div style={{ padding: '10px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>
                    <strong>Nombre completo:</strong> {userItem.name} {userItem.apellidos}
                  </p>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>
                    <strong>Email:</strong> {userItem.email}
                  </p>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>
                    <strong>Teléfono:</strong> {userItem.telefono || 'No proporcionado'}
                  </p>
                  {userItem.email_verified_at && (
                    <p style={{ margin: '5px 0', fontSize: '14px', color: '#777' }}>
                      <strong>Verificado el:</strong> {formatDate(userItem.email_verified_at)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {users.length === 0 && !loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '50px',
          color: '#777',
          border: '1px solid #e0e0e0',
          borderRadius: '4px'
        }}>
          <p>No se encontraron usuarios. Intenta cambiar los filtros.</p>
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

export default UsersTab;