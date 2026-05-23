import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import styles from './registrerPage.module.css';
import Header from '../header/Header'; 
import Footer from '../footer/Footer';

const RegisterPage = () => {
   const [formData, setFormData] = useState({
     name: '',
     apellidos: '',
     email: '',
     telefono: '',
     password: '',
     password_confirmation: ''
   });
   
   const [errors, setErrors] = useState({
     name: '',
     apellidos: '',
     email: '',
     telefono: '',
     password: '',
     password_confirmation: ''
   });
   
   const [loading, setLoading] = useState(false);
   const [serverError, setServerError] = useState('');
   const [registrationSuccess, setRegistrationSuccess] = useState(false);
   const [emailVerified, setEmailVerified] = useState(false);
   
   // Usar una ref para tracking de intervalos
   const checkIntervalRef = useRef(null);
   const redirectingRef = useRef(false); // Ref para evitar múltiples procesamientos
   
   // Verificar inmediatamente al montar si hay verificación guardada
   useEffect(() => {
     // Al iniciar el componente, verificar storages
     checkVerificationStatus();
     
     // Limpiar intervalos y listeners al desmontar
     return () => cleanupListeners();
   }, []);
 
   // Configurar escucha de eventos y verificación periódica cuando se registra
   useEffect(() => {
     // Solo iniciar verificación periódica si el registro fue exitoso
     if (registrationSuccess && !emailVerified) {
       // Configurar escucha de mensajes entre ventanas
       window.addEventListener('storage', handleStorageChange);
       window.addEventListener('message', handleVerificationMessage);
       
       // Configurar escucha de BroadcastChannel si está disponible
       setupBroadcastChannel();
       
       // Iniciar verificación periódica
       startPeriodicCheck();
     }
     
     return () => {
       if (registrationSuccess) {
         cleanupListeners();
       }
     };
   }, [registrationSuccess, emailVerified]);
   
   // Configurar BroadcastChannel
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
       console.error('Error al configurar BroadcastChannel:', err);
     }
   };
   
   // Función para iniciar verificación periódica
   const startPeriodicCheck = () => {
     // Limpiar intervalo existente si hay alguno
     if (checkIntervalRef.current) {
       clearInterval(checkIntervalRef.current);
     }
     
     // Verificar inmediatamente antes de iniciar el intervalo
     checkVerificationStatus();
     
     // Crear nuevo intervalo de verificación  
     checkIntervalRef.current = setInterval(() => {
       checkVerificationStatus();
    
     }, 500); // Verificar cada 500ms
   };
   
   // Función para verificar si el correo ha sido verificado
   const checkVerificationStatus = () => {
     // Si ya estamos en proceso de verificación, no seguir verificando
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
   
   // Manejar cambios en el localStorage/sessionStorage
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
   
   // Limpiar listeners e intervalos
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
     
     // Limpiar el estado de storages
     try {
       localStorage.removeItem('emailVerified');
       localStorage.removeItem('emailVerifiedTime');
       sessionStorage.removeItem('emailVerified');
       sessionStorage.removeItem('emailVerifiedTime');
     } catch (e) {
       console.error('Error al limpiar storage:', e);
     }
   };

   const handleChange = (e) => {
     const { name, value } = e.target;
     setFormData({
       ...formData,
       [name]: value
     });
     
     // Limpiar errores al escribir
     if (errors[name]) {
       setErrors({
         ...errors,
         [name]: ''
       });
     }
   };
 
   const validateForm = () => {
     let valid = true;
     const newErrors = { ...errors };
     
     // Validar nombre
     if (!formData.name.trim()) {
       newErrors.name = 'El nombre es obligatorio';
       valid = false;
     }
     
     // Validar apellidos
     if (!formData.apellidos.trim()) {
       newErrors.apellidos = 'Los apellidos son obligatorios';
       valid = false;
     }
     
     // Validar email
     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
     if (!formData.email.trim()) {
       newErrors.email = 'El correo electrónico es obligatorio';
       valid = false;
     } else if (!emailRegex.test(formData.email)) {
       newErrors.email = 'Ingrese un correo electrónico válido';
       valid = false;
     }
     
     // Validar teléfono (opcional)
     if (formData.telefono.trim() && !/^\d{9,}$/.test(formData.telefono)) {
       newErrors.telefono = 'Ingrese un número de teléfono válido';
       valid = false;
     }
     
     // Validar contraseña
     if (!formData.password) {
       newErrors.password = 'La contraseña es obligatoria';
       valid = false;
     } else if (formData.password.length < 8) {
       newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
       valid = false;
     }
     
     // Validar confirmación de contraseña
     if (formData.password !== formData.password_confirmation) {
       newErrors.password_confirmation = 'Las contraseñas no coinciden';
       valid = false;
     }
     
     setErrors(newErrors);
     return valid;
   };
 
   const handleSubmit = async (e) => {
     e.preventDefault();
     
     if (validateForm()) {
       setLoading(true);
       setServerError('');
       
       try {
         const response = await axios.post('/api/register', formData);

         // Mostrar mensaje de éxito y necesidad de verificar correo
         setRegistrationSuccess(true);
         
         // Limpiar cualquier verificación previa
         localStorage.removeItem('emailVerified');
         sessionStorage.removeItem('emailVerified');
         localStorage.removeItem('emailVerifiedTime');
         sessionStorage.removeItem('emailVerifiedTime');
         
       } catch (error) {
         console.error('Error al registrar:', error);
         
         if (error.response && error.response.data && error.response.data.errors) {
           // Mapear errores del servidor al state de errores
           const serverErrors = error.response.data.errors;
           const newErrors = { ...errors };
           
           Object.keys(serverErrors).forEach(field => {
             newErrors[field] = serverErrors[field][0];
           });
           
           setErrors(newErrors);
         } else {
           setServerError('Ha ocurrido un error al registrar tu cuenta. Por favor, intenta de nuevo más tarde.');
         }
       } finally {
         setLoading(false);
       }
     }
   };

   const handleResendVerification = async () => {
     setLoading(true);
     setServerError('');
     
     try {
       await axios.post('/api/email/verification-notification', {
         email: formData.email 
       });
       
       // Mostrar SweetAlert de éxito
       Swal.fire({
         icon: 'success',
         title: '¡Correo enviado!',
         text: 'Se ha enviado un nuevo enlace de verificación a tu correo electrónico.',
         confirmButtonText: 'Entendido',
         confirmButtonColor: '#10b981'
       });
       
     } catch (error) {
       console.error('Error al reenviar correo de verificación:', error);
       
       // Mostrar SweetAlert de error
       Swal.fire({
         icon: 'error',
         title: 'Error al enviar',
         text: 'No se pudo reenviar el correo de verificación. Por favor, inténtalo más tarde.',
         confirmButtonText: 'Cerrar',
         confirmButtonColor: '#ef4444'
       });
       
       setServerError('No se pudo reenviar el correo de verificación. Por favor, intentalo más tarde.');
     } finally {
       setLoading(false);
     }
   };
 
   return (
     <div className={styles.pageContainer}>
       <Header />
       <div className={styles.contentWrapper}>
         <main className={styles.main}>
           <h1 className={styles.h1}>Registrate</h1>
           
           {serverError && (
             <div className={styles.serverError}>
               {serverError}
             </div>
           )}
           
           {emailVerified ? (
             <div className={styles.successContainer}>
               <h2 className={styles.successTitle}>¡Tu cuenta ha sido verificada!</h2>
               <p className={styles.successMessage}>
                 Tu correo ha sido verificado correctamente. Ya puedes iniciar sesión en tu cuenta.
               </p>
               <Link to="/login" className={styles.loginButton}>
                 Ir a Iniciar Sesión
               </Link>
             </div>
           ) : registrationSuccess ? (
             <div className={styles.successContainer}>
               <h2 className={styles.successTitle}>¡Registro completado con éxito!</h2>
               <p className={styles.successMessage}>
                 Hemos enviado un correo de verificación a <strong>{formData.email}</strong>.
                 Por favor, revisa tu bandeja de entrada y sigue las instrucciones para activar tu cuenta.
               </p>
               <p className={styles.successNote}>
                 Si no encuentras el correo, revisa tu carpeta de spam.
               </p>
               <button 
                 className={styles.resendButton} 
                 onClick={handleResendVerification}
                 disabled={loading}
               >
                 {loading ? 'Enviando...' : 'Reenviar correo de verificación'}
               </button>
               <p className={styles.loginLink}>
                 Una vez que hayas verificado tu correo, podrás iniciar sesión en tu cuenta.
               </p>
             </div>
           ) : (
             <form className={styles.form} onSubmit={handleSubmit}>
               <div className={styles.formRow}>
                 <div className={styles.formGroup}>
                   <label className={styles.label} htmlFor="name">Nombre</label>
                   <input 
                     className={styles.input} 
                     type="text" 
                     id="name" 
                     name="name" 
                     value={formData.name}
                     onChange={handleChange}
                     required 
                   />
                   {errors.name && <span className={styles.error}>{errors.name}</span>}
                 </div>
                 
                 <div className={styles.formGroup}>
                   <label className={styles.label} htmlFor="apellidos">Apellidos</label>
                   <input 
                     className={styles.input} 
                     type="text" 
                     id="apellidos" 
                     name="apellidos" 
                     value={formData.apellidos}
                     onChange={handleChange}
                     required 
                   />
                   {errors.apellidos && <span className={styles.error}>{errors.apellidos}</span>}
                 </div>
               </div>
               
               <div className={styles.formGroup}>
                 <label className={styles.label} htmlFor="email">Correo electrónico</label>
                 <input 
                   className={styles.input} 
                   type="email" 
                   id="email" 
                   name="email" 
                   value={formData.email}
                   onChange={handleChange}
                   required 
                 />
                 {errors.email && <span className={styles.error}>{errors.email}</span>}
               </div>
               
               <div className={styles.formGroup}>
                 <label className={styles.label} htmlFor="telefono">Teléfono</label>
                 <input 
                   className={styles.input} 
                   type="tel" 
                   id="telefono" 
                   name="telefono" 
                   value={formData.telefono}
                   onChange={handleChange}
                 />
                 {errors.telefono && <span className={styles.error}>{errors.telefono}</span>}
               </div>
               
               <div className={styles.formGroup}>
                 <label className={styles.label} htmlFor="password">Contraseña</label>
                 <input 
                   className={styles.input} 
                   type="password" 
                   id="password" 
                   name="password" 
                   value={formData.password}
                   onChange={handleChange}
                   required 
                 />
                 {errors.password && <span className={styles.error}>{errors.password}</span>}
               </div>
               
               <div className={styles.formGroup}>
                 <label className={styles.label} htmlFor="password_confirmation">Confirmar contraseña</label>
                 <input 
                   className={styles.input} 
                   type="password" 
                   id="password_confirmation" 
                   name="password_confirmation" 
                   value={formData.password_confirmation}
                   onChange={handleChange}
                   required 
                 />
                 {errors.password_confirmation && <span className={styles.error}>{errors.password_confirmation}</span>}
               </div>
               
               <button 
                 className={styles.button} 
                 type="submit" 
                 disabled={loading}
               >
                 {loading ? 'Procesando...' : 'Registrarse'}
               </button>
               
               <div className={styles.notice}>
                 <p>¿Ya tienes cuenta? <Link className={styles.link} to="/login">Inicia sesión</Link></p>
               </div>
             </form>
           )}
         </main>
       </div>
       <Footer />
     </div>
   );
 };
 
 export default RegisterPage;