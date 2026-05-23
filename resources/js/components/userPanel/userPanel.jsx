import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../header/Header';
import Footer from '../../components/footer/Footer';
import ProfileTab from '../../components/userPanel/Tabs/profileTab';
import AddressesTab from '../../components/userPanel/Tabs/addressTab';
import OrdersTab from '../../components/userPanel/Tabs/orderTab';
import SecurityTab from '../../components/userPanel/Tabs/securityTab';
import Favoritos from '../../components/userPanel/Tabs/favorites';
import { AuthContext } from '../RUTAS/AuthContext'; 
import sharedStyles from '../../../css/panelShared.module.css';
import ownStyles from './userPanel.module.css';
const styles = { ...sharedStyles, ...ownStyles };

function UserPanel() {
    const [activeTab, setActiveTab] = useState('perfil');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useContext(AuthContext);  
  
    useEffect(() => {
      // Verificar si el usuario está autenticado
      const token = localStorage.getItem('token');
      
      if (!token) {
        // Si no hay token, redirigir al login
        navigate('/login');
        return;
      }
      
      // Configurar axios con el token
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Leer el parámetro 'tab' de la URL si existe
      const searchParams = new URLSearchParams(location.search);
      const tabParam = searchParams.get('tab');
      
      // Si hay un parámetro tab válido, establecerlo como activo
      if (tabParam && ['perfil', 'direcciones', 'pedidos', 'favoritos', 'seguridad', 'cerrarSesion'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }, [navigate, location]);
  
    const handleTabClick = (tabId) => {
      setActiveTab(tabId);
      // Actualizar la URL sin recargar la página
      navigate(`/userPanel?tab=${tabId}`, { replace: true });
    };
    
    const handleLogout = async () => {
      setLoading(true);
      
      try {
        // Se usa la función logout del AuthContext
        await logout();
        
        // Redirigir al login o a la página principal
        navigate('/');
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
        
        // Si hay error, intentar cerrar sesión localmente de todos modos
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <>
        <Header />
        <main className={styles.main}>
          <section className={styles.panelUsuario}>
            <h1>Mi cuenta</h1>
            
            {/* Navegación por pestañas */}
            <div className={styles.tabs}>
              <button 
                className={`${styles.tabBtn} ${activeTab === 'perfil' ? styles.active : ''}`} 
                onClick={() => handleTabClick('perfil')}
              >
                Mi perfil
              </button>
              <button 
                className={`${styles.tabBtn} ${activeTab === 'direcciones' ? styles.active : ''}`}
                onClick={() => handleTabClick('direcciones')}
              >
                Mis direcciones
              </button>
              <button 
                className={`${styles.tabBtn} ${activeTab === 'pedidos' ? styles.active : ''}`}
                onClick={() => handleTabClick('pedidos')}
              >
                Mis pedidos
              </button>
              <button 
                className={`${styles.tabBtn} ${activeTab === 'favoritos' ? styles.active : ''}`}
                onClick={() => handleTabClick('favoritos')}
              >
                Favoritos
              </button>
              <button 
                className={`${styles.tabBtn} ${activeTab === 'seguridad' ? styles.active : ''}`}
                onClick={() => handleTabClick('seguridad')}
              >
                Cambiar contraseña
              </button>
              <button 
                className={`${styles.tabBtn} ${activeTab === 'cerrarSesion' ? styles.active : ''}`}
                onClick={() => handleTabClick('cerrarSesion')}
              >
                Cerrar sesión
              </button>
            </div>
            
            {/* Contenido de las pestañas */}
            <div className={styles.tabContent}>
              {activeTab === 'perfil' && <ProfileTab />}
              {activeTab === 'direcciones' && <AddressesTab />}
              {activeTab === 'pedidos' && <OrdersTab />}
              {activeTab === 'seguridad' && <SecurityTab />}
              {activeTab === 'favoritos' && <Favoritos />}
              {activeTab === 'cerrarSesion' && (
                <div className={`${styles.tabPane} ${styles.minHeight}`}>
                  <h2>Cerrar sesión</h2>
                  <p>¿Estás seguro de que deseas cerrar la sesión?</p>
                  <div className={styles.formActions}>
                    <button 
                      className={styles.btnEliminar} 
                      onClick={handleLogout}
                      disabled={loading}
                    >
                      {loading ? 'Cerrando sesión...' : 'Cerrar sesión'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }
  
  export default UserPanel;