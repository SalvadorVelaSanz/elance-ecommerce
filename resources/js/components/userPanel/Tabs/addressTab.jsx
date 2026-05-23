import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import sharedStyles from '../../../../css/panelShared.module.css';
import ownStyles from '../userPanel.module.css';
const styles = { ...sharedStyles, ...ownStyles };

function AddressesTab() {
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);
  
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

  // Cargar direcciones al montar el componente
  useEffect(() => {
    fetchAddresses();
  }, []);

  // Función para cargar las direcciones
  const fetchAddresses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }
      
      const response = await axios.get('/api/direcciones', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setAddresses(response.data);
    } catch (err) {
      console.error('Error al cargar direcciones:', err);
      setError('No se pudieron cargar tus direcciones. Por favor, intenta más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleShowForm = () => {
    setShowAddressForm(true);
    setEditingAddressId(null);
    // Resetear el formulario
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
  };

  const handleHideForm = () => {
    setShowAddressForm(false);
    setEditingAddressId(null);
    setError(null);
  };

  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    setNewAddress({
      ...newAddress,
      [id]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setActionInProgress('form');
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      let response;
      
      if (editingAddressId) {
        // Actualizando una dirección existente
        response = await axios.put(`/api/direcciones/${editingAddressId}`, newAddress, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Mostrar mensaje de éxito con SweetAlert
        await Swal.fire({
          title: '¡Dirección actualizada!',
          text: 'La dirección ha sido actualizada correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        
        // Actualizar la dirección en el estado local
        setAddresses(addresses.map(addr => 
          addr.id === editingAddressId ? response.data : 
          newAddress.es_principal ? {...addr, es_principal: false} : addr
        ));
      } else {
        // Creando una nueva dirección
        response = await axios.post('/api/direcciones', newAddress, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Mostrar mensaje de éxito con SweetAlert
        await Swal.fire({
          title: '¡Dirección añadida!',
          text: 'La nueva dirección ha sido guardada correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        
        // Si la nueva dirección es principal, actualizar todas las demás
        if (newAddress.es_principal) {
          setAddresses([
            ...addresses.map(addr => ({ ...addr, es_principal: false })),
            response.data
          ]);
        } else {
          // Si no es principal, simplemente añadirla
          setAddresses([...addresses, response.data]);
        }
      }
      
      // Ocultar el formulario y resetear
      setShowAddressForm(false);
      setEditingAddressId(null);
      
    } catch (err) {
      console.error('Error al guardar la dirección:', err);
      let errorMessage = 'No se pudo guardar la dirección. Por favor, verifica los datos e intenta nuevamente.';
      
      if (err.response?.data?.errors) {
        // Mostrar errores de validación específicos
        const errors = err.response.data.errors;
        const errorMessages = Object.values(errors).flat().join(', ');
        errorMessage = `Error de validación: ${errorMessages}`;
      }
      
      // Mostrar error con SweetAlert
      await Swal.fire({
        title: 'Error al guardar',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
      
      setError(errorMessage);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleEdit = (id) => {
    const addressToEdit = addresses.find(addr => addr.id === id);
    if (addressToEdit) {
      setNewAddress({
        nombre_direccion: addressToEdit.nombre_direccion,
        calle: addressToEdit.calle,
        numero: addressToEdit.numero,
        piso: addressToEdit.piso || '',
        puerta: addressToEdit.puerta || '',
        codigo_postal: addressToEdit.codigo_postal,
        ciudad: addressToEdit.ciudad,
        provincia: addressToEdit.provincia,
        pais: addressToEdit.pais || 'España',
        es_principal: addressToEdit.es_principal
      });
      setEditingAddressId(id);
      setShowAddressForm(true);
    }
  };

  const handleDelete = async (id) => {
    // Confirmar eliminación con SweetAlert
    const result = await Swal.fire({
      title: '¿Eliminar dirección?',
      text: '¿Estás seguro de que quieres eliminar esta dirección? Esta acción no se puede deshacer.',
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
      
      const response = await axios.delete(`/api/direcciones/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Refrescar direcciones para actualizar correctamente los estados
      await fetchAddresses();
      
      // Preparar mensaje de éxito
      const data = response.data;
      let successMessage = data.message || 'Dirección eliminada correctamente';
      
      if (data.pedidos_afectados && data.pedidos_afectados > 0) {
        successMessage += `\n\n${data.pedidos_afectados} pedidos mantendrán la información de envío.`;
      }
      
      // Mostrar mensaje de éxito con SweetAlert
      await Swal.fire({
        title: '¡Dirección eliminada!',
        text: successMessage,
        icon: 'success',
        timer: 3000,
        showConfirmButton: false
      });
      
    } catch (err) {
      console.error('Error al eliminar dirección:', err);
      
      let errorMessage = 'No se pudo eliminar la dirección. Por favor, intenta más tarde.';
      
      if (err.response?.status === 409) {
        // Error de constraint - aunque no debería pasar
        errorMessage = err.response.data.message || 'No se puede eliminar la dirección porque está asociada a pedidos existentes.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      // Mostrar error con SweetAlert
      await Swal.fire({
        title: 'Error al eliminar',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
      
      setError(errorMessage);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleSetPrimary = async (id) => {
    try {
      setActionInProgress(`primary-${id}`);
      setError(null);
      setSuccess(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }
      
      await axios.put(`/api/direcciones/${id}/set-principal`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Actualizar el estado local: esta dirección es principal, las demás no
      setAddresses(addresses.map(addr => ({
        ...addr,
        es_principal: addr.id === id
      })));
      
      // Mostrar mensaje de éxito con SweetAlert
      await Swal.fire({
        title: '¡Dirección principal actualizada!',
        text: 'La dirección ha sido establecida como principal',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      
    } catch (err) {
      console.error('Error al establecer dirección como principal:', err);
      const errorMessage = 'No se pudo establecer la dirección como principal. Por favor, intenta más tarde.';
      
      // Mostrar error con SweetAlert
      await Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
      
      setError(errorMessage);
    } finally {
      setActionInProgress(null);
    }
  };

  if (loading) {
    return (
      <div className={`${styles.tabPane} ${styles.minHeight}`}>
        <h2>Mis direcciones</h2>
        <div className={styles.loading}>Cargando direcciones...</div>
      </div>
    );
  }

  return (
    <div className={`${styles.tabPane} ${styles.minHeight}`}>
      <h2>Mis direcciones</h2>
      
      {error && (
        <div className={styles.alertError}>
          {error}
        </div>
      )}
      
      {success && (
        <div className={styles.alertSuccess}>
          {success}
        </div>
      )}
      
      {/* Lista de direcciones guardadas */}
      <div className={styles.direccionesLista}>
        {addresses.map(address => (
          <div 
            className={`${styles.direccionCard} ${address.es_principal ? styles.direccionPrincipal : ''}`} 
            key={address.id}
          >
            {address.es_principal && (
              <div className={styles.principalIndicator}>
                <span className={styles.principalIcon}>★</span>
                <span className={styles.principalText}>DIRECCIÓN PRINCIPAL</span>
              </div>
            )}
            <div className={styles.direccionHeader}>
              <div className={styles.direccionTitleContainer}>
                <h3>{address.nombre_direccion}</h3>
                {address.es_principal && (
                  <span className={styles.badgePrincipal}>Principal</span>
                )}
              </div>
              <div className={styles.direccionActions}>
                {!address.es_principal && (
                  <button 
                    className={styles.btnSetPrimary || styles.btnEditar}
                    onClick={() => handleSetPrimary(address.id)}
                    disabled={actionInProgress === `primary-${address.id}`}
                    title="Establecer como dirección principal"
                  >
                    {actionInProgress === `primary-${address.id}` ? 'Estableciendo...' : 'Hacer principal'}
                  </button>
                )}
                <button 
                  className={styles.btnEditar} 
                  onClick={() => handleEdit(address.id)}
                  disabled={actionInProgress}
                  title="Editar dirección"
                >
                  Editar
                </button>
                <button 
                  className={styles.btnEliminar} 
                  onClick={() => handleDelete(address.id)}
                  disabled={actionInProgress === address.id}
                  title="Eliminar dirección (los pedidos existentes mantendrán la información)"
                >
                  {actionInProgress === address.id ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
            <div className={styles.direccionContent}>
              <p><strong>{address.calle}, {address.numero}</strong></p>
              {(address.piso || address.puerta) && (
                <p>
                  {address.piso && `Piso ${address.piso}`}
                  {address.piso && address.puerta && ', '}
                  {address.puerta && `Puerta ${address.puerta}`}
                </p>
              )}
              <p>{address.codigo_postal} {address.ciudad}</p>
              <p>{address.provincia}, {address.pais}</p>
            </div>
          </div>
        ))}
      </div>
      
      {addresses.length === 0 && (
        <div className={styles.emptyState}>
          <p>No tienes direcciones guardadas. Añade una nueva dirección para tus envíos.</p>
        </div>
      )}
      
      {!showAddressForm && (
        <button className={styles.btnNuevaDireccion} onClick={handleShowForm}>
          + Añadir nueva dirección
        </button>
      )}
      
      {/* Formulario para nueva dirección o editar existente */}
      {showAddressForm && (
        <div className={styles.formContainer}>
          <form className={styles.formDireccion} onSubmit={handleSubmit}>
            <h3>{editingAddressId ? 'Editar dirección' : 'Nueva dirección'}</h3>
            
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="nombre_direccion">
                Nombre de esta dirección *
              </label>
              <input 
                className={styles.input}
                type="text" 
                id="nombre_direccion" 
                placeholder="Ej: Casa, Trabajo, Casa de mis padres..." 
                value={newAddress.nombre_direccion}
                onChange={handleInputChange}
                required
                maxLength="100"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="calle">Calle *</label>
              <input 
                className={styles.input}
                type="text" 
                id="calle" 
                placeholder="Nombre de la calle"
                required 
                value={newAddress.calle}
                onChange={handleInputChange}
                maxLength="255"
              />
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="numero">Número *</label>
                <input 
                  className={styles.input}
                  type="text" 
                  id="numero" 
                  placeholder="123"
                  required 
                  value={newAddress.numero}
                  onChange={handleInputChange}
                  maxLength="20"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="piso">Piso</label>
                <input 
                  className={styles.input}
                  type="text" 
                  id="piso" 
                  placeholder="1º, 2º..."
                  value={newAddress.piso}
                  onChange={handleInputChange}
                  maxLength="20"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="puerta">Puerta</label>
                <input 
                  className={styles.input}
                  type="text" 
                  id="puerta" 
                  placeholder="A, B, 1..."
                  value={newAddress.puerta}
                  onChange={handleInputChange}
                  maxLength="20"
                />
              </div>
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="codigo_postal">Código postal *</label>
                <input 
                  className={styles.input}
                  type="text" 
                  id="codigo_postal" 
                  placeholder="28001"
                  required 
                  value={newAddress.codigo_postal}
                  onChange={handleInputChange}
                  maxLength="10"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="ciudad">Ciudad *</label>
                <input 
                  className={styles.input}
                  type="text" 
                  id="ciudad" 
                  placeholder="Madrid"
                  required 
                  value={newAddress.ciudad}
                  onChange={handleInputChange}
                  maxLength="100"
                />
              </div>
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="provincia">Provincia *</label>
                <input 
                  className={styles.input}
                  type="text" 
                  id="provincia" 
                  placeholder="Madrid"
                  required 
                  value={newAddress.provincia}
                  onChange={handleInputChange}
                  maxLength="100"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="pais">País *</label>
                <input 
                  className={styles.input}
                  type="text" 
                  id="pais" 
                  required 
                  value={newAddress.pais}
                  onChange={handleInputChange}
                  maxLength="100"
                />
              </div>
            </div>
            
            <div className={`${styles.formCheck} ${styles.formGroup}`}>
              <input 
                type="checkbox" 
                id="es_principal" 
                checked={newAddress.es_principal}
                onChange={handleInputChange}
              />
              <label htmlFor="es_principal">
                Establecer como dirección principal
                {addresses.length === 0 && <span className={styles.note}> (será principal automáticamente por ser la primera)</span>}
              </label>
            </div>
            
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
                {actionInProgress === 'form' ? (
                  editingAddressId ? 'Actualizando...' : 'Guardando...'
                ) : (
                  editingAddressId ? 'Actualizar dirección' : 'Guardar dirección'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default AddressesTab;