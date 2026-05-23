import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../../RUTAS/AuthContext';
import sharedStyles from '../../../../css/panelShared.module.css';
import ownStyles from '../userPanel.module.css';
const styles = { ...sharedStyles, ...ownStyles };

function ProfileTab() {
  const { refreshAuth } = useContext(AuthContext);
  const [userData, setUserData] = useState({
    name: '',
    apellidos: '',
    email: '',
    telefono: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [emailChanged, setEmailChanged] = useState(false);
  const [emailVerified, setEmailVerified] = useState(true);
  const [resendingEmail, setResendingEmail] = useState(false);
  
  // Referencias para control de verificación
  const checkIntervalRef = useRef(null);
  const checkingEmailRef = useRef(false);
  const redirectingRef = useRef(false);

  // Cargar datos del usuario al montar el componente
  useEffect(() => {
    fetchUserProfile();
    
    // Iniciar verificación periódica del estado del email
    startVerificationCheck();

    // Configurar listeners para detección de verificación
    setupVerificationListeners();
    
    // Verificar inmediatamente si hay verificación guardada
    checkVerificationStatus();
    
    // Limpiar intervalo y listeners al desmontar
    return () => {
      cleanupListeners();
    };
  }, []);

  // Iniciar verificación periódica del estado del email cuando cambia
  useEffect(() => {
    if (emailChanged && !emailVerified) {
      startVerificationCheck();
      setupVerificationListeners();
    }
  }, [emailChanged, emailVerified]);
  
  // Configurar los liseners de eventos para la verificación
  const setupVerificationListeners = () => {
    // Configurar escucha de mensajes entre ventanas
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('message', handleVerificationMessage);
    
    // Configurar escucha de BroadcastChannel si está disponible
    setupBroadcastChannel();
  };
  
  // Limpiar todos los listeners e intervalos
  const cleanupListeners = () => {
    window.removeEventListener('message', handleVerificationMessage);
    window.removeEventListener('storage', handleStorageChange);
    
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
    
    // Cerrar BroadcastChannel si existe
    if (window.emailVerificationChannel) {
      try {
        window.emailVerificationChannel.close();
        window.emailVerificationChannel = null;
      } catch (e) {
        console.error('Error al cerrar BroadcastChannel:', e);
      }
    }
  };
  
  // Configurar BroadcastChannel para comunicación entre pestañas
  const setupBroadcastChannel = () => {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('email_verification_channel');
        bc.onmessage = (event) => {
          if (event.data && event.data.type === 'EMAIL_VERIFIED' && event.data.success) {
            handleEmailVerification();
          }
        };
        
        // Guardar la referencia para limpiarla después
        window.emailVerificationChannel = bc;
      }
    } catch (err) {
      console.error('Error al configurar BroadcastChannel en ProfileTab:', err);
    }
  };
  
  // Función para manejar cambios en localStorage/sessionStorage
  const handleStorageChange = (event) => {
    if (event.key === 'emailVerified' && event.newValue === 'true') {
      checkVerificationStatus();
    }
  };
  
  // Manejar mensajes recibidos de la ventana de verificación
  const handleVerificationMessage = (event) => {
    if (event.data && event.data.type === 'EMAIL_VERIFIED' && event.data.success) {
      handleEmailVerification();
    }
  };
  
  // Verificar si el correo ha sido verificado
  const checkVerificationStatus = () => {
    // Si ya está en proceso de verificación, no seguir verificando
    if (redirectingRef.current) {
      return;
    }
  
    // Verificar en localStorage y sessionStorage
    const localVerification = localStorage.getItem('emailVerified');
    const sessionVerification = sessionStorage.getItem('emailVerified');
    
    if (localVerification === 'true' || sessionVerification === 'true') {
      // Verificar timestamp para asegurar que es reciente
      const timestamp = parseInt(localStorage.getItem('emailVerifiedTime') || 
                              sessionStorage.getItem('emailVerifiedTime') || '0');
      
      // Asegurar que el timestamp es reciente (menos de 10 minutos)
      const now = new Date().getTime();
      if (now - timestamp < 10 * 60 * 1000) { 
        handleEmailVerification();
      } else {
        // Limpiar datos obsoletos (timestamp expirado)
        localStorage.removeItem('emailVerified');
        localStorage.removeItem('emailVerifiedTime');
        sessionStorage.removeItem('emailVerified');
        sessionStorage.removeItem('emailVerifiedTime');
      }
    }
  };

  const startVerificationCheck = () => {
    // Limpiar intervalo existente si lo hay
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }
    
    // Verificar inmediatamente antes de iniciar el intervalo
    checkEmailVerificationStatus();
    
    // Configurar nuevo intervalo para verificar cada 5 segundos
    checkIntervalRef.current = setInterval(() => {
      checkEmailVerificationStatus();
    }, 500);
  };

  const checkEmailVerificationStatus = async () => {
    // Evitar múltiples verificaciones simultáneas
    if (checkingEmailRef.current || !userData.email) {
      return;
    }

    try {
      checkingEmailRef.current = true;
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }
      
      const response = await axios.get('/api/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Si el email está verificado ahora pero antes no lo estaba
      if (response.data.email_verified && !emailVerified) {
        handleEmailVerification();
      }
    } catch (err) {
      console.error('Error al verificar estado del email en ProfileTab:', err);
    } finally {
      checkingEmailRef.current = false;
    }
  };
  
  // Función para manejar la verificación exitosa del correo
  const handleEmailVerification = () => {
    // Evitar múltiples ejecuciones
    if (redirectingRef.current || emailVerified) {
      return;
    }
    
    // Marcar que estamos procesando la verificación
    redirectingRef.current = true;

    // Detener verificaciones adicionales
    cleanupListeners();
    
    // Actualizar estado
    setEmailVerified(true);
    setEmailChanged(false);
    setSuccess('Tu dirección de correo electrónico ha sido verificada correctamente.');
    
    // Limpiar el estado de storages
    try {
      localStorage.removeItem('emailVerified');
      localStorage.removeItem('emailVerifiedTime');
      sessionStorage.removeItem('emailVerified');
      sessionStorage.removeItem('emailVerifiedTime');
    } catch (e) {
      console.error('Error al limpiar storage en ProfileTab:', e);
    }
    
    // Actualizar la información del usuario en el contexto
    refreshAuth();
    
    // Refrescar datos del perfil
    fetchUserProfile();
  };

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }
      
      const response = await axios.get('/api/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setUserData(response.data);
      setEmailVerified(response.data.email_verified);
    } catch (err) {
      console.error('Error al cargar los datos del perfil:', err);
      setError('No se pudieron cargar tus datos. Por favor, intenta más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    // Si cambiamos cualquier campo, limpiamos los mensajes
    setSuccess(null);
    setError(null);
    
    // Si estamos cambiando el email, reseteamos la bandera de email cambiado
    if (name === 'email') {
      setEmailChanged(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }
      
      const response = await axios.put('/api/profile', userData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Actualizar el estado con la respuesta del servidor
      setUserData(response.data.user);
      setSuccess(response.data.message || 'Tus datos han sido actualizados correctamente');
      
      // Si el email fue cambiado, mostrar mensaje adicional
      if (response.data.email_changed) {
        setEmailChanged(true);
        setEmailVerified(false);
        redirectingRef.current = false; // Resetear el estado para permitir futuras verificaciones
        
        // Iniciar la verificación periódica
        startVerificationCheck();
        setupVerificationListeners();
      } else {
        setEmailVerified(response.data.email_verified);
      }
      
      // Actualizar la información del usuario en el AuthContext
      refreshAuth();
      
    } catch (err) {
      console.error('Error al actualizar el perfil:', err);
      
      // Manejar errores de validación del servidor
      if (err.response && err.response.data && err.response.data.errors) {
        const errorMessages = Object.values(err.response.data.errors).flat();
        setError(errorMessages.join('. '));
      } else {
        setError('No se pudieron guardar los cambios. Por favor, intenta más tarde.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setResendingEmail(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }
      
      const response = await axios.post('/api/email/verification-notification', 
        { email: userData.email },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setSuccess('Se ha enviado un nuevo correo de verificación a tu dirección de email.');
      
    } catch (err) {
      console.error('Error al reenviar el correo de verificación:', err);
      setError('No se pudo reenviar el correo de verificación. Por favor, intenta más tarde.');
    } finally {
      setResendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.tabPane}>
        <h2>Datos personales</h2>
        <div className={styles.loading}>Cargando datos...</div>
      </div>
    );
  }

  return (
    <div className={styles.tabPane}>
      <h2>Datos personales</h2>
      
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
      
      {emailChanged && !emailVerified && (
        <div className={styles.alertWarning}>
          <p>Has cambiado tu correo electrónico. Por favor, verifica tu nueva dirección de correo revisando tu bandeja de entrada.</p>
          <button 
            className={styles.btnResend} 
            onClick={handleResendVerification}
            disabled={resendingEmail}
            type="button"
          >
            {resendingEmail ? 'Enviando...' : 'Reenviar correo de verificación'}
          </button>
        </div>
      )}
      
      {!emailVerified && !emailChanged && (
        <div className={styles.alertInfo}>
          <p>Tu correo electrónico aún no ha sido verificado. Por favor, verifica tu dirección de correo.</p>
          <button 
            className={styles.btnResend} 
            onClick={handleResendVerification}
            disabled={resendingEmail}
            type="button"
          >
            {resendingEmail ? 'Enviando...' : 'Reenviar correo de verificación'}
          </button>
        </div>
      )}
      
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="name">Nombre</label>
            <input 
              className={styles.input}
              type="text" 
              id="name" 
              name="name" 
              value={userData.name || ''} 
              onChange={handleChange}
              required 
              disabled={saving}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="apellidos">Apellidos</label>
            <input 
              className={styles.input}
              type="text" 
              id="apellidos" 
              name="apellidos" 
              value={userData.apellidos || ''} 
              onChange={handleChange}
              required 
              disabled={saving}
            />
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="email">Correo electrónico</label>
          <div className={styles.emailContainer}>
            <input 
              className={styles.input}
              type="email" 
              id="email" 
              name="email" 
              value={userData.email || ''} 
              onChange={handleChange}
              required 
              disabled={saving}
            />
            {!emailVerified ? (
              <span className={styles.verificationStatus}>No verificado</span>
            ) : (
              <span className={`${styles.verificationStatus} ${styles.statusVerificado}`}>Verificado</span>
            )}
          </div>
          <p className={styles.formHelp}>Si cambias tu correo electrónico, deberás verificarlo nuevamente.</p>
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="telefono">Teléfono</label>
          <input 
            className={styles.input}
            type="tel" 
            id="telefono" 
            name="telefono" 
            value={userData.telefono || ''} 
            onChange={handleChange}
            disabled={saving}
          />
        </div>
        
        <div className={styles.formActions}>
          <button 
            type="submit" 
            className={styles.btnGuardar}
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProfileTab;