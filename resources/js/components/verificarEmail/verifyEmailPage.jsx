import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import styles from './verifyEmail.module.css';
import Header from '../header/Header';
import Footer from '../footer/Footer';

const VerifyEmailPage = () => {
    const [verifying, setVerifying] = useState(true);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const location = useLocation();
    
    useEffect(() => {
        const verifyEmail = async () => {
            // Obtener los parámetros de la URL
            const queryParams = new URLSearchParams(location.search);
            const id = queryParams.get('id');
            const hash = queryParams.get('hash');
            const expires = queryParams.get('expires');
            const signature = queryParams.get('signature');
            
            if (!id || !hash || !expires || !signature) {
                setError('Enlace de verificación inválido o incompleto.');
                setVerifying(false);
                return;
            }
            
            try {
                // Se hace la petición al backend con los parámetros recibidos
                const response = await axios.get(
                    `/api/email/verify/${id}/${hash}?expires=${expires}&signature=${signature}`
                );
                
                setSuccess(true);
                
        
                const timestamp = new Date().getTime();
                
                //Uso de localStorage y sessionStorage para redirijir
                try {
                    localStorage.setItem('emailVerified', 'true');
                    localStorage.setItem('emailVerifiedTime', timestamp.toString());
                    
                    sessionStorage.setItem('emailVerified', 'true');
                    sessionStorage.setItem('emailVerifiedTime', timestamp.toString());
                    
                    // Intentar forzar evento storage
                    const storageEvent = document.createEvent('StorageEvent');
                    storageEvent.initStorageEvent('storage', false, false, 'emailVerified', null, 'true', null, null, null);
                    window.dispatchEvent(storageEvent);
                    
                    // Alternativa para navegadores modernos - nuevo objeto StorageEvent
                    try {
                        const modernStorageEvent = new StorageEvent('storage', {
                            key: 'emailVerified',
                            newValue: 'true',
                            oldValue: null,
                            storageArea: localStorage
                        });
                        window.dispatchEvent(modernStorageEvent);
                    } catch (e) {
                        console.error('Error con StorageEvent moderno:', e);
                    }
                } catch (err) {
                    console.error('Error al usar storage APIs:', err);
                }
                
                // Uso de postMessage para comunicación si hay ventana padre
                try {
                    if (window.opener) {
                        // Enviar mensaje varias veces con intervalos para asegurar recepción
                        const messageInterval = setInterval(() => {
                            window.opener.postMessage({
                                type: 'EMAIL_VERIFIED',
                                success: true,
                                timestamp: timestamp
                            }, '*');
                        }, 200);
                        
                        // Detener después de 5 segundos
                        setTimeout(() => {
                            clearInterval(messageInterval);
                        }, 5000);
                    }
                } catch (err) {
                    console.error('Error al enviar mensaje vía postMessage:', err);
                }
                
                // BroadcastChannel API
                try {
                    if (typeof BroadcastChannel !== 'undefined') {
                        const bc = new BroadcastChannel('email_verification_channel');
                        
                        // Enviar mensaje varias veces con intervalos para asegurar recepción
                        const broadcastInterval = setInterval(() => {
                            bc.postMessage({
                                type: 'EMAIL_VERIFIED',
                                success: true,
                                timestamp: timestamp
                            });
                        }, 200);
                        
                        // Detener después de unos segundos y cerrar el canal
                        setTimeout(() => {
                            clearInterval(broadcastInterval);
                            bc.close();
                        }, 5000);
                    }
                } catch (err) {
                    console.error('Error al usar BroadcastChannel:', err);
                }
                
            } catch (error) {
                console.error('Error verificando correo:', error);
                
                if (error.response) {
                    if (error.response.status === 403) {
                        setError('El enlace de verificación ha expirado o ya ha sido utilizado.');
                    } else {
                        setError(error.response.data.message || 'Ha ocurrido un error al verificar tu correo electrónico.');
                    }
                } else if (error.request) {
                    setError('No se recibió respuesta del servidor. Verifica tu conexión.');
                } else {
                    setError('Ha ocurrido un error al verificar tu correo electrónico. Por favor, intenta de nuevo más tarde.');
                }
            } finally {
                setVerifying(false);
            }
        };
        
        verifyEmail();
    }, [location]);
    
    const handleCloseWindow = () => {
        // cerrar la ventana actual
        try {
            window.close();
        } catch (e) {
            // el navegador puede bloquear window.close() si no fue abierto por script
        }
    };
    
    return (
        <>
            <Header />
            <main className={styles.main}>
                <div className={styles.container}>
                    <h1 className={styles.title}>Verificación de Correo Electrónico</h1>
                    
                    {verifying ? (
                        <div className={styles.loadingContainer}>
                            <div className={styles.spinner}></div>
                            <p className={styles.loadingText}>Verificando tu correo electrónico...</p>
                        </div>
                    ) : success ? (
                        <div className={styles.successContainer}>
                            <svg className={styles.successIcon} viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="11" className={styles.circle} />
                                <path d="M7 13l3 3 7-7" className={styles.check} />
                            </svg>
                            <h2 className={styles.successTitle}>¡Verificación Exitosa!</h2>
                            <p className={styles.successMessage}>
                                Tu dirección de correo electrónico ha sido verificada correctamente.
                            </p>
                            <p className={styles.instructionMessage}>
                                Puedes cerrar esta ventana. La página de registro te redirigirá automáticamente al inicio de sesión.
                            </p>
                            <div className={styles.buttonContainer}>
                                <button 
                                    className={styles.closeButton}
                                    onClick={handleCloseWindow}
                                >
                                    Cerrar Ventana
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.errorContainer}>
                            <svg className={styles.errorIcon} viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="11" className={styles.errorCircle} />
                                <path d="M15 9l-6 6M9 9l6 6" className={styles.errorX} />
                            </svg>
                            <h2 className={styles.errorTitle}>Verificación Fallida</h2>
                            <p className={styles.errorMessage}>{error}</p>
                            <p className={styles.helpText}>
                                Por favor, revisa tu correo electrónico para un nuevo enlace o solicita uno nuevo desde la página de inicio de sesión.
                            </p>
                            <div className={styles.buttonContainer}>
                                <button 
                                    className={styles.closeButton}
                                    onClick={handleCloseWindow}
                                >
                                    Cerrar Ventana
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
};

export default VerifyEmailPage;