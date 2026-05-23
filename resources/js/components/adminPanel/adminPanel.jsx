import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../header/Header';
import Footer from '../../components/footer/Footer';
import UsersTab from '../../components/adminPanel/Tabs/usersTab';
import ProductsTab from '../../components/adminPanel/Tabs/productsTab';
import OrdersTab from '../../components/adminPanel/Tabs/orderTab';
import CategoriasTab from '../../components/adminPanel/Tabs/categoriasTab';
import ResenasTab from '../../components/adminPanel/Tabs/resenasTab';
import { AuthContext } from '../RUTAS/AuthContext'; 
import sharedStyles from '../../../css/panelShared.module.css';
import ownStyles from './adminPanel.module.css';
const styles = { ...sharedStyles, ...ownStyles };

function AdminPanel() {
    const [activeTab, setActiveTab] = useState('usuarios');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout, isAdmin } = useContext(AuthContext);
  
    useEffect(() => {      
      // Leer el parámetro 'tab' de la URL si existe
      const searchParams = new URLSearchParams(location.search);
      const tabParam = searchParams.get('tab');
      
      // Si hay un parámetro tab válido, establecerlo como activo
      if (tabParam && ['usuarios', 'productos', 'pedidos', 'categorias', 'reseñas'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
      
      setLoading(false);
    }, [navigate, location]);
  
    const handleTabClick = (tabId) => {
      setActiveTab(tabId);
      // Actualizar la URL sin recargar la página
      navigate(`/adminPanel?tab=${tabId}`, { replace: true });
    };
    
    const handleLogout = async () => {
      setLoading(true);
      
      try {
        // Usamos la función logout del AuthContext
        await logout();
        
        // Redirigir al login o a la página principal
        navigate('/');
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    if (loading) {
      return (
        <div className={styles.loading}>
          Cargando panel de administración...
        </div>
      );
    }
  
    return (
      <>
        <Header />
        <main className={styles.main}>
          <section className={styles.panelUsuario}>
            <h1>Panel de Administración</h1>
            
            {/* Navegación por pestañas */}
            <div className={styles.tabs}>
              <button 
                className={`${styles.tabBtn} ${activeTab === 'usuarios' ? styles.active : ''}`} 
                onClick={() => handleTabClick('usuarios')}
              >
                Usuarios
              </button>
              <button 
                className={`${styles.tabBtn} ${activeTab === 'productos' ? styles.active : ''}`}
                onClick={() => handleTabClick('productos')}
              >
                Productos
              </button>
              <button 
                className={`${styles.tabBtn} ${activeTab === 'pedidos' ? styles.active : ''}`}
                onClick={() => handleTabClick('pedidos')}
              >
                Pedidos
              </button>
              <button 
                className={`${styles.tabBtn} ${activeTab === 'categorias' ? styles.active : ''}`}
                onClick={() => handleTabClick('categorias')}
              >
                Categorías
              </button>
              <button 
                className={`${styles.tabBtn} ${activeTab === 'reseñas' ? styles.active : ''}`}
                onClick={() => handleTabClick('reseñas')}
              >
                Reseñas
              </button>
            </div>
            
            {/* Contenido de las pestañas */}
            <div className={styles.tabContent}>
              {activeTab === 'usuarios' && <UsersTab />}
              {activeTab === 'productos' && <ProductsTab />}
              {activeTab === 'pedidos' && <OrdersTab />}
              {activeTab === 'categorias' && <CategoriasTab />}
              {activeTab === 'reseñas' && <ResenasTab />}
              
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }
  
  export default AdminPanel;