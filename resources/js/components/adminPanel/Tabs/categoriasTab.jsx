import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { AuthContext } from '../../RUTAS/AuthContext';
import sharedStyles from '../../../../css/panelShared.module.css';
import ownStyles from '../adminPanel.module.css';
const styles = { ...sharedStyles, ...ownStyles };

function CategoriasTab() {

  const { user, isAdmin } = useContext(AuthContext);
  const userIsAdmin = isAdmin(); 
  
  const [categorias, setCategorias] = useState([]);
  const [showCategoriaForm, setShowCategoriaForm] = useState(false);
  const [editingCategoriaId, setEditingCategoriaId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissionError, setPermissionError] = useState(false);
  const [success, setSuccess] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);
  
  const [newCategoria, setNewCategoria] = useState({
    nombre: '',
    temporada: '',
    publico_objetivo: '',
    imagen_categoria: ''
  });

  // Opciones para el select de publico_objetivo
  const publicoObjetivoOptions = [
    { value: 'adulto', label: 'Adulto' },
    { value: 'niño', label: 'Niño' },
    { value: 'bebé', label: 'Bebé' },
    { value: 'unisex', label: 'Unisex' }
  ];

  // Cargar categorías al montar el componente
  useEffect(() => {
    fetchCategorias();
  }, []);

  // Función para manejar errores de las peticiones
  const handleApiError = (err) => {
    console.error('Error en la petición:', err);
    
    // Detectar errores de permisos (403 Forbidden)
    if (err.response && err.response.status === 403) {
      setPermissionError(true);
      setError('No tienes permisos para realizar esta acción. Solo los administradores pueden gestionar categorías.');
    } else {
      setError(err.response?.data?.error || 'Ha ocurrido un error. Por favor, intenta más tarde.');
    }
  };

  // Función para cargar las categorías
  const fetchCategorias = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }
      
      const response = await axios.get('/api/categorias/todas', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Verificar si la respuesta contiene 'data' y si 'data' es un array
      if (response.data && Array.isArray(response.data.data)) {
        setCategorias(response.data.data);
      } else {
        console.error('Respuesta de categorías no contiene un array:', response.data);
        setCategorias([]);
      }
    } catch (err) {
      handleApiError(err);
      setCategorias([]);
    } finally {
      setLoading(false);
    }
  };

  const handleShowForm = () => {
    // Verificar primero si el usuario es administrador
    if (!userIsAdmin) {
      setPermissionError(true);
      setError('No tienes permisos para añadir categorías. Solo los administradores pueden realizar esta acción.');
      
      // Mostrar SweetAlert para error de permisos
      Swal.fire({
        title: 'Sin permisos',
        text: 'No tienes permisos para añadir categorías. Solo los administradores pueden realizar esta acción.',
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
      return;
    }
    
    setShowCategoriaForm(true);
    setEditingCategoriaId(null);
    // Resetear el formulario
    setNewCategoria({
      nombre: '',
      temporada: '',
      publico_objetivo: '',
      imagen_categoria: ''
    });
  };

  const handleHideForm = () => {
    setShowCategoriaForm(false);
    setEditingCategoriaId(null);
    setError(null);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    
    setNewCategoria({
      ...newCategoria,
      [id]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Verificar primero si el usuario es administrador
    if (!userIsAdmin) {
      setPermissionError(true);
      setError('No tienes permisos para guardar categorías. Solo los administradores pueden realizar esta acción.');
      
      // Mostrar SweetAlert para error de permisos
      Swal.fire({
        title: 'Sin permisos',
        text: 'No tienes permisos para guardar categorías. Solo los administradores pueden realizar esta acción.',
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
      return;
    }
    
    try {
      setActionInProgress('form');
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }
      
      // Preparar datos de la categoría
      const categoriaData = {
        ...newCategoria
      };

      let response;
      
      if (editingCategoriaId) {
        // Actualizando una categoría existente
        response = await axios.put(`/api/categorias/${editingCategoriaId}`, categoriaData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        setSuccess('Categoría actualizada correctamente');
        
        // Mostrar SweetAlert de éxito para actualización
        Swal.fire({
          title: '¡Actualizada!',
          text: 'La categoría ha sido actualizada correctamente.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        // Creando una nueva categoría
        response = await axios.post('/api/categorias', categoriaData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        setSuccess('Categoría añadida correctamente');
        
        // Mostrar SweetAlert de éxito para creación
        Swal.fire({
          title: '¡Creada!',
          text: 'La categoría ha sido añadida correctamente.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
      
      // Ocultar el formulario y refrescar la lista
      setShowCategoriaForm(false);
      setEditingCategoriaId(null);
      fetchCategorias();
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (err) {
      console.error('Error al guardar la categoría:', err);
      handleApiError(err);
      
      // Mostrar SweetAlert de error
      Swal.fire({
        title: 'Error',
        text: err.response?.data?.error || 'Ha ocurrido un error al guardar la categoría. Por favor, intenta más tarde.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setActionInProgress(null);
    }
  };

  // Función para manejar edición
  const handleEdit = (id) => {
    // Verificar primero si el usuario es administrador
    if (!userIsAdmin) {
      setPermissionError(true);
      setError('No tienes permisos para editar categorías. Solo los administradores pueden realizar esta acción.');
      
      // Mostrar SweetAlert para error de permisos
      Swal.fire({
        title: 'Sin permisos',
        text: 'No tienes permisos para editar categorías. Solo los administradores pueden realizar esta acción.',
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
      return;
    }
    
    const categoriaToEdit = categorias.find(cat => cat.id === id);
    if (categoriaToEdit) {
      setNewCategoria({
        nombre: categoriaToEdit.nombre || '',
        temporada: categoriaToEdit.temporada || '',
        publico_objetivo: categoriaToEdit.publico_objetivo || '',
        imagen_categoria: categoriaToEdit.imagen_categoria || ''
      });
      setEditingCategoriaId(id);
      setShowCategoriaForm(true);
    }
  };

  const handleDelete = async (id) => {
    // Verificar primero si el usuario es administrador
    if (!userIsAdmin) {
      setPermissionError(true);
      setError('No tienes permisos para eliminar categorías. Solo los administradores pueden realizar esta acción.');
      
      // Mostrar SweetAlert para error de permisos
      Swal.fire({
        title: 'Sin permisos',
        text: 'No tienes permisos para eliminar categorías. Solo los administradores pueden realizar esta acción.',
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
      return;
    }
    
    // Obtener información sobre productos asociados
    let productosAsociados = 0;
    try {
      const response = await axios.get(`/api/productos?categoria_id=${id}&per_page=1`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      productosAsociados = response.data.pagination?.total || 0;
    } catch (err) {
      console.warn('No se pudo obtener información de productos asociados:', err);
    }
    
    // Configurar mensaje de confirmación basado en si hay productos asociados
    let confirmationConfig = {
      title: '¿Estás seguro?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    };
    
    if (productosAsociados > 0) {
      confirmationConfig.text = `Esta categoría tiene ${productosAsociados} producto(s) asociado(s). Al eliminarla, estos productos quedarán sin categoría. ¿Quieres continuar?`;
      confirmationConfig.html = `
        <p>Esta categoría tiene <strong>${productosAsociados}</strong> producto(s) asociado(s).</p>
        <p>Al eliminarla, estos productos quedarán <strong>sin categoría</strong>.</p>
        <p>¿Quieres continuar?</p>
      `;
    } else {
      confirmationConfig.text = '¿Quieres eliminar esta categoría? Esta acción no se puede deshacer.';
    }
    
    // Confirmar eliminación con SweetAlert
    const result = await Swal.fire(confirmationConfig);

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
      
      const response = await axios.delete(`/api/categorias/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Actualizar estado después de eliminar
      fetchCategorias();
      
      // Mostrar mensaje basado en la respuesta del servidor
      const mensaje = response.data.message || 'Categoría eliminada correctamente';
      setSuccess(mensaje);
      
      // Mostrar SweetAlert de éxito con información sobre productos afectados
      let successConfig = {
        title: '¡Eliminada!',
        icon: 'success',
        timer: 3000,
        showConfirmButton: false
      };
      
      if (response.data.productos_afectados > 0) {
        successConfig.html = `
          <p>La categoría ha sido eliminada correctamente.</p>
          <p><strong>${response.data.productos_afectados}</strong> producto(s) ahora están sin categoría.</p>
        `;
        successConfig.timer = 4000;
      } else {
        successConfig.text = 'La categoría ha sido eliminada correctamente.';
      }
      
      Swal.fire(successConfig);
      
      // Limpiar mensaje de éxito después de unos segundos
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
      
    } catch (err) {
      handleApiError(err);
      
      // Mostrar SweetAlert de error
      Swal.fire({
        title: 'Error',
        text: err.response?.data?.error || 'Ha ocurrido un error al eliminar la categoría. Por favor, intenta más tarde.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setActionInProgress(null);
    }
  };

  if (loading && categorias.length === 0) {
    return (
      <div className={`${styles.tabPane} ${styles.minHeight}`}>
        <h2>Gestión de categorías</h2>
        <div className={styles.loading}>Cargando categorías...</div>
      </div>
    );
  }

  return (
    <div className={`${styles.tabPane} ${styles.minHeight}`}>
      <h2>Gestión de categorías</h2>
      
      {error && (
        <div className={styles.alertError}>
          {error}
          {permissionError && (
            <p>
              <strong>Nota:</strong> Solo los usuarios con rol de administrador pueden gestionar categorías.
            </p>
          )}
        </div>
      )}
      
      {success && (
        <div className={styles.alertSuccess}>
          {success}
        </div>
      )}
      
      {/* Vista de tabla para escritorio */}
      <div className={styles.tableResponsive}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Imagen</th>
              <th>Nombre</th>
              <th>Temporada</th>
              <th>Público Objetivo</th>
              {userIsAdmin && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {categorias.map(categoria => (
              <tr key={categoria.id}>
                <td>{categoria.id}</td>
                <td>
                  {categoria.imagen_categoria ? (
                    <img 
                      src={categoria.imagen_categoria} 
                      alt={categoria.nombre} 
                      style={{width: '50px', height: '50px', objectFit: 'cover'}} 
                    />
                  ) : (
                    'Sin imagen'
                  )}
                </td>
                <td>{categoria.nombre}</td>
                <td>{categoria.temporada || 'No definida'}</td>
                <td>
                  <span className={styles.badge}>
                    {categoria.publico_objetivo}
                  </span>
                </td>
                {userIsAdmin && (
                  <td className={styles.actions}>
                    <button 
                      className={styles.btnEditar} 
                      onClick={() => handleEdit(categoria.id)}
                      disabled={actionInProgress}
                    >
                      Editar
                    </button>
                    <button 
                      className={styles.btnEliminar} 
                      onClick={() => handleDelete(categoria.id)}
                      disabled={actionInProgress === categoria.id}
                    >
                      {actionInProgress === categoria.id ? 'Eliminando...' : 'Eliminar'}
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
        {categorias.map(categoria => (
          <div key={categoria.id} className={styles.userCard}>
            <div className={styles.userCardHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div>
                  {categoria.imagen_categoria ? (
                    <img 
                      src={categoria.imagen_categoria} 
                      alt={categoria.nombre} 
                      style={{
                        width: '60px', 
                        height: '60px', 
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }} 
                    />
                  ) : (
                    <div style={{
                      width: '60px',
                      height: '60px', 
                      backgroundColor: '#f0f0f0',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      color: '#666'
                    }}>
                      Sin imagen
                    </div>
                  )}
                </div>
                <div>
                  <div className={styles.userCardTitle}>
                    {categoria.nombre}
                  </div>
                  <div className={styles.userCardEmail}>
                    {categoria.publico_objetivo}
                  </div>
                </div>
              </div>
              <div className={styles.userCardId}>
                ID: {categoria.id}
              </div>
            </div>
            
            <div className={styles.userCardDetails}>
              <div className={styles.userCardDetail}>
                <div className={styles.userCardDetailLabel}>Temporada</div>
                <div className={styles.userCardDetailValue}>
                  {categoria.temporada || 'No definida'}
                </div>
              </div>
            </div>
            
            {userIsAdmin && (
              <div className={styles.userCardActions}>
                <button 
                  className={styles.btnEditar} 
                  onClick={() => handleEdit(categoria.id)}
                  disabled={actionInProgress}
                >
                  Editar
                </button>
                
                <button 
                  className={styles.btnEliminar} 
                  onClick={() => handleDelete(categoria.id)}
                  disabled={actionInProgress === categoria.id}
                >
                  {actionInProgress === categoria.id ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {categorias.length === 0 && !loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '50px',
          color: '#777',
          border: '1px solid #e0e0e0',
          borderRadius: '4px'
        }}>
          <p>No se encontraron categorías. Añade una nueva categoría.</p>
        </div>
      )}
      
      {/* Solo mostramos el botón para añadir categorías si el usuario es administrador */}
      {userIsAdmin && !showCategoriaForm && (
        <button className={styles.btnNueva} onClick={handleShowForm}>
          Añadir nueva categoría
        </button>
      )}
      
      {/* Si el usuario no es administrador, mostramos un mensaje informativo */}
      {!userIsAdmin && !permissionError && (
        <div className={styles.infoMessage}>
          <p>Solo los administradores pueden gestionar categorías. Si necesitas realizar cambios, contacta con un administrador.</p>
        </div>
      )}
      
      {/* Formulario para nueva categoría o editar existente */}
      {showCategoriaForm && userIsAdmin && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <h3>{editingCategoriaId ? 'Editar categoría' : 'Nueva categoría'}</h3>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="nombre">Nombre de la categoría</label>
              <input 
                className={styles.input}
                type="text" 
                id="nombre" 
                placeholder="Nombre de la categoría" 
                value={newCategoria.nombre}
                onChange={handleInputChange}
                required
                maxLength={50}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="temporada">Temporada</label>
              <input 
                className={styles.input}
                type="text" 
                id="temporada" 
                placeholder="Temporada (ej: Invierno 2023)" 
                value={newCategoria.temporada}
                onChange={handleInputChange}
                maxLength={30}
              />
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="publico_objetivo">Público Objetivo</label>
              <select 
                className={styles.input}
                id="publico_objetivo" 
                value={newCategoria.publico_objetivo}
                onChange={handleInputChange}
                required
              >
                <option value="">Selecciona un público objetivo</option>
                {publicoObjetivoOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="imagen_categoria">URL de la imagen</label>
              <input 
                className={styles.input}
                type="url" 
                id="imagen_categoria" 
                placeholder="https://ejemplo.com/imagen.jpg" 
                value={newCategoria.imagen_categoria}
                onChange={handleInputChange}
                maxLength={255}
              />
            </div>
          </div>
          
          {/* Vista previa de imagen */}
          {newCategoria.imagen_categoria && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Vista previa de imagen</label>
              <div className={styles.imagePreview}>
                <img 
                  src={newCategoria.imagen_categoria} 
                  alt="Vista previa" 
                  style={{maxWidth: '200px', maxHeight: '200px'}} 
                />
              </div>
            </div>
          )}
          
          <div className={styles.formActions}>
            <button 
              type="button" 
              className={styles.btnCancelar} 
              onClick={handleHideForm}
              disabled={actionInProgress === 'form'}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className={styles.btnGuardar}
              disabled={actionInProgress === 'form'}
            >
              {actionInProgress === 'form' ? 'Guardando...' : (editingCategoriaId ? 'Actualizar categoría' : 'Guardar categoría')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default CategoriasTab;