import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import styles from '../loginPage/loginPage.module.css';
import Header from '../header/Header';
import Footer from '../footer/Footer';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [serverError, setServerError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [emailError, setEmailError] = useState('');
    const [lastEmailUsed, setLastEmailUsed] = useState('');

    const handleChange = (e) => {
        setEmail(e.target.value);
        setEmailError('');
    };

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validar email
        if (!validateEmail(email)) {
            setEmailError('Por favor, introduce un correo electrónico válido');
            return;
        }
        
        setLoading(true);
        setServerError('');
        setSuccessMessage('');
        
        try {
            const response = await axios.post('/api/forgot-password', { email });
            setSuccessMessage(response.data.message || 'Se ha enviado un correo con tu nueva contraseña temporal.');
            setLastEmailUsed(email); // Guardar el email para posible reenvío
        } catch (error) {
            console.error('Error al solicitar nueva contraseña:', error);
            
            if (error.response && error.response.data && error.response.data.message) {
                setServerError(error.response.data.message);
            } else {
                setServerError('Ha ocurrido un error al procesar tu solicitud. Por favor, intenta de nuevo más tarde.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!lastEmailUsed || !validateEmail(lastEmailUsed)) {
            setServerError('No se puede reenviar el correo. Por favor, inténtalo de nuevo desde el principio.');
            setSuccessMessage('');
            return;
        }
        
        setResendLoading(true);
        setServerError('');
        
        try {
            const response = await axios.post('/api/forgot-password', { email: lastEmailUsed });
            setSuccessMessage('Se ha reenviado el correo con tu nueva contraseña temporal.');
        } catch (error) {
            console.error('Error al reenviar contraseña:', error);
            
            if (error.response && error.response.data && error.response.data.message) {
                setServerError(error.response.data.message);
                setSuccessMessage('');
            } else {
                setServerError('Ha ocurrido un error al reenviar el correo. Por favor, intenta de nuevo más tarde.');
                setSuccessMessage('');
            }
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className={styles.pageContainer}>
            <Header />
            <div className={styles.contentWrapper}>
                <main className={styles.main}>
                    <h1 className={styles.h1}>Recuperar Contraseña</h1>
                    <h2 className={styles.h2}>Introduce tu correo electrónico para recibir una contraseña temporal</h2>

                    <div className={styles.loginSection}>
                        <div className={styles.loginTitle}>¿Has olvidado tu contraseña?</div>
                        
                        {serverError && (
                            <div className={styles.serverError}>
                                {serverError}
                            </div>
                        )}
                        
                        {successMessage && (
                            <div className={styles.successMessage}>
                                <div className={styles.successIcon}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                    </svg>
                                </div>
                                <p className={styles.successText}>{successMessage}</p>
                                
                                <div className={styles.actionsContainer}>
                                    <button 
                                        className={styles.primaryAction} 
                                        onClick={() => window.location.href = '/login'}
                                    >
                                        Ir a iniciar sesión
                                    </button>
                                    
                                    <button 
                                        className={styles.secondaryAction} 
                                        onClick={handleResend}
                                        disabled={resendLoading}
                                    >
                                        {resendLoading ? (
                                            <>
                                                <span className={styles.loadingSpinner}></span>
                                                Reenviando...
                                            </>
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.refreshIcon}>
                                                    <polyline points="23 4 23 10 17 10"></polyline>
                                                    <polyline points="1 20 1 14 7 14"></polyline>
                                                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                                                </svg>
                                                Reenviar correo
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {!successMessage && (
                            <form className={styles.form} onSubmit={handleSubmit}>
                                <div className={`${styles.inputGroup} ${emailError ? styles.hasError : ''}`}>
                                    <input
                                        type="email"
                                        name="email"
                                        id="email"
                                        value={email}
                                        onChange={handleChange}
                                        placeholder="Correo electrónico *"
                                        required
                                        className={styles.input}
                                    />
                                    {emailError && (
                                        <span className={styles.errorMessage}>
                                            {emailError}
                                        </span>
                                    )}
                                </div>

                                <div className={styles.formActions}>
                                    <button 
                                        type="submit" 
                                        className={styles.button}
                                        disabled={loading}
                                    >
                                        {loading ? 'Procesando...' : 'Enviar contraseña temporal'}
                                    </button>
                                </div>

                                <div className={styles.formFooter}>
                                    <Link to="/login" className={styles.link}>
                                        Volver al inicio de sesión
                                    </Link>
                                </div>
                            </form>
                        )}
                    </div>
                </main>
            </div>
            <Footer />
        </div>
    );
};

export default ForgotPasswordPage;