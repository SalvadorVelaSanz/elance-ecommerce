import React, { useState, useContext } from 'react';
import { AuthContext } from '../../RUTAS/AuthContext';
import axios from 'axios';
import Swal from 'sweetalert2';
import sharedStyles from '../../../../css/panelShared.module.css';
import ownStyles from '../userPanel.module.css';
const styles = { ...sharedStyles, ...ownStyles };

function SecurityTab() {
  const { user } = useContext(AuthContext);
  
  const [passwords, setPasswords] = useState({
    current_password: '',
    password: '',
    password_confirmation: ''
  });
  
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Validación básica en el cliente
    if (passwords.password !== passwords.password_confirmation) {
      Swal.fire({
        title: 'Error',
        text: 'Las contraseñas no coinciden',
        icon: 'error',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido'
      });
      setLoading(false);
      return;
    }
    
    try {
      // Enviar solicitud al servidor para cambiar la contraseña
      const response = await axios.post('/api/change-password', passwords);
      
      // Mostrar mensaje de éxito
      Swal.fire({
        title: '¡Éxito!',
        text: response.data.message || 'Contraseña actualizada exitosamente',
        icon: 'success',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Aceptar'
      });
      
      // Limpiar el formulario
      setPasswords({
        current_password: '',
        password: '',
        password_confirmation: ''
      });
      
    } catch (error) {
      // Manejar diferentes tipos de errores
      let errorMessage = 'Error al procesar la solicitud.';
      
      if (error.response) {
        // El servidor respondió con un código de estado que no está en el rango 2xx
        if (error.response.data.errors) {
          //Validación de errores de Laravel
          const firstError = Object.values(error.response.data.errors)[0][0];
          errorMessage = firstError;
        } else if (error.response.data.message) {
          // Mensaje de error simple
          errorMessage = error.response.data.message;
        } else {
          errorMessage = `Error (${error.response.status}): Intente nuevamente`;
        }
      } else if (error.request) {
        // No se recibió respuesta
        errorMessage = 'No se pudo conectar con el servidor. Verifique su conexión.';
      }
      
      Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido'
      });
      
      console.error('Error al cambiar contraseña:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.tabPane}>
      <h2 className={styles.title}>Cambiar la contraseña</h2>
      
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="current_password">Contraseña actual</label>
          <input 
            className={styles.input}
            type="password" 
            name="current_password" 
            id="current_password"
            value={passwords.current_password}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="password">Nueva contraseña</label>
          <input 
            className={styles.input}
            type="password" 
            name="password" 
            id="password"
            value={passwords.password}
            onChange={handleChange}
            required
            minLength={8}
          />
          <small className={styles.helpText}>Debe tener al menos 8 caracteres</small>
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="password_confirmation">Confirmar contraseña</label>
          <input 
            className={styles.input}
            type="password" 
            name="password_confirmation" 
            id="password_confirmation"
            value={passwords.password_confirmation}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className={styles.formActions}>
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Procesando...' : 'Confirmar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SecurityTab;