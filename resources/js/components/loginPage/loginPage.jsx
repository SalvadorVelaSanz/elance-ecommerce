import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './loginPage.module.css';
import Header from '../header/Header';
import Footer from '../footer/Footer';
import { AuthContext } from '../RUTAS/AuthContext';

const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);
    
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [errors, setErrors] = useState({
        email: false,
        password: false
    });
    
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState('');
    const [isSuspended, setIsSuspended] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value
        }));


        if (errors[name]) {
            setErrors((prevErrors) => ({
                ...prevErrors,
                [name]: false
            }));
        }
    };

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {
            email: !validateEmail(formData.email),
            password: formData.password.trim() === ''
        };

        setErrors(newErrors);

        // Submit only if there are no errors
        if (!newErrors.email && !newErrors.password) {
            setLoading(true);
            setServerError('');
            setIsSuspended(false);
            
            try {
                await login(formData);
                
                setTimeout(() => {
                    navigate('/userPanel', { replace: true });
                }, 100);
                
            } catch (error) {
                console.error('Error al iniciar sesión:', error);
                
                if (error.response && error.response.data) {
                    const response = error.response.data;
                    
                    // Verificar si la cuenta está suspendida
                    if (response.suspended) {
                        setIsSuspended(true);
                        setServerError(response.message);
                    } else if (response.message) {
                        setServerError(response.message);
                    } else {
                        setServerError('Ha ocurrido un error al iniciar sesión. Por favor, intenta de nuevo más tarde.');
                    }
                } else {
                    setServerError('Ha ocurrido un error al iniciar sesión. Por favor, intenta de nuevo más tarde.');
                }
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className={styles.pageContainer}>
            <Header />
            <div className={styles.contentWrapper}>
                <main className={styles.main}>
                    <h1 className={styles.h1}>Mi Cuenta</h1>
                    <h2 className={styles.h2}>Gestiona tu cuenta y revisa tus pedidos</h2>

                    <div className={styles.loginSection}>
                        <div className={styles.loginTitle}>Iniciar Sesión</div>
                        
                        {serverError && (
                            <div className={`${styles.serverError} ${isSuspended ? styles.suspendedMessage : ''}`}>
                                {serverError}
                                {isSuspended && (
                                    <div className={styles.suspendedNote}>
                                        <br />
                                        <strong>Tu cuenta está actualmente suspendida.</strong>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <form className={styles.form} onSubmit={handleSubmit}>
                            <div className={`${styles.inputGroup} ${errors.email ? styles.hasError : ''}`}>
                                <input
                                    type="text"
                                    name="email"
                                    id="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Usuario o correo electrónico *"
                                    required
                                    className={styles.input}
                                    disabled={isSuspended}
                                />
                                {errors.email && (
                                    <span className={styles.errorMessage}>
                                        Por favor, introduce un correo electrónico válido
                                    </span>
                                )}
                            </div>

                            <div className={`${styles.inputGroup} ${errors.password ? styles.hasError : ''}`}>
                                <input
                                    type="password"
                                    name="password"
                                    id="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Contraseña *"
                                    required
                                    className={styles.input}
                                    disabled={isSuspended}
                                />
                                {errors.password && (
                                    <span className={styles.errorMessage}>
                                        Por favor, introduce tu contraseña
                                    </span>
                                )}
                            </div>

                            <div className={styles.formActions}>
                                <button 
                                    type="submit" 
                                    className={styles.button}
                                    disabled={loading || isSuspended}
                                >
                                    {loading ? 'Procesando...' : 'Iniciar sesión'}
                                </button>
                            </div>

                            <div className={styles.formFooter}>
                                <Link to="/forgot-password" className={styles.link}>
                                    ¿Olvidaste tu contraseña?
                                </Link>
                                <Link to="/registro" className={styles.link}>
                                    ¿No tienes cuenta? Regístrate
                                </Link>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
            <Footer />
        </div>
    );
};

export default LoginPage;