import React, { useState, useContext, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faShoppingCart, faBars, faTimes, faSignOutAlt, faLock } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../RUTAS/AuthContext';

const Header = () => {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    user,
    logout,
    isAdmin,
    cart,
  } = useContext(AuthContext);
  
  // Estado para controlar si el menú móvil está abierto o cerrado
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Estado para el menú desplegable del usuario
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  // Estado local para la cantidad del carrito
  const [cartItemCount, setCartItemCount] = useState(0);

  // Actualizar el contador del carrito solo cuando cambie el array cart
  useEffect(() => {
    if (cart && Array.isArray(cart)) {
      const totalItems = cart.reduce((total, item) => total + (parseInt(item.cantidad) || 0), 0);
      setCartItemCount(totalItems);
    } else {
      setCartItemCount(0);
    }
  }, [cart]); // Solo se ejecuta cuando cambia el array cart

  // Función para alternar el estado del menú móvil
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Función para cerrar el menú móvil después de hacer clic en un enlace
  const closeMenu = () => {
    setMobileMenuOpen(false);
  };

  // Función para alternar el menú del usuario
  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  // Cerrar el menú de usuario al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuOpen && !event.target.closest(`.${styles.userIconContainer}`)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen, styles.userIconContainer]);

  // Función para manejar el cierre de sesión
  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  return (
    <header className={styles.header}>
      {/* Logo */}
      <div className={styles.logoContainer}>
        <Link to="/">
          <img src="/images/logo-elance.png" alt="Elance" />
        </Link>
      </div>

      {/* Botón de hamburguesa para móvil */}
      <button 
        className={styles.mobileMenuButton} 
        onClick={toggleMobileMenu}
        aria-label="Menú"
      >
        <FontAwesomeIcon icon={mobileMenuOpen ? faTimes : faBars} />
      </button>

      {/* Nav - visible en desktop o cuando está abierto en móvil */}
      <nav className={`${styles.nav} ${mobileMenuOpen ? styles.navActive : ''}`}>
        <ul>
          <li>
            <NavLink 
              to="/productos" 
              className={({ isActive }) => isActive ? styles.activeLink : ''} 
              onClick={closeMenu}
            >
              Productos
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/contact" 
              className={({ isActive }) => isActive ? styles.activeLink : ''} 
              onClick={closeMenu}
            >
              Contacto
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/aboutUs" 
              className={({ isActive }) => isActive ? styles.activeLink : ''} 
              onClick={closeMenu}
            >
              Sobre Nosotros
            </NavLink>
          </li>
        
          {/* Opción de Admin Panel solo visible para administradores */}
          {isAuthenticated && isAdmin() && (
            <li>
              <NavLink 
                to="/adminPanel" 
                className={({ isActive }) => isActive ? `${styles.activeLink} ${styles.adminLink}` : styles.adminLink} 
                onClick={closeMenu}
              >
                <FontAwesomeIcon icon={faLock} className={styles.adminIcon} /> Admin
              </NavLink>
            </li>
          )}
        </ul>
      </nav>

      {/* Iconos de usuario y carrito */}
      <div className={styles.icons}>
        <div className={styles.userIconContainer}>
          <button 
            className={`${styles.userIconBtn} ${isAuthenticated ? styles.userLoggedIn : ''}`}
            onClick={toggleUserMenu}
            aria-label="Usuario"
          >
            <FontAwesomeIcon icon={faUser} />
            {isAuthenticated && <span className={styles.authIndicator}></span>}
          </button>
          
          {/* Nombre de usuario en desktop - AHORA ES CLICKEABLE */}
          {isAuthenticated && (
            <button 
              className={styles.desktopUsername}
              onClick={toggleUserMenu}
            >
              {user?.name || 'Usuario'}
            </button>
          )}
          
          {/* Menú desplegable del usuario */}
          {userMenuOpen && (
            <div className={styles.userDropdown}>
              {isAuthenticated ? (
                <>
                  <div className={styles.userInfo}>
                    <p>Hola, {user?.name || 'Usuario'}</p>
                    {user?.email && <p className={styles.userEmail}>{user.email}</p>}
                    {isAdmin() && <p className={styles.adminBadge}>Administrador</p>}
                  </div>
                  <Link to="/userPanel?tab=perfil" className={styles.dropdownLink} onClick={() => setUserMenuOpen(false)}>
                    Mi Cuenta
                  </Link>
                  <Link to="/userPanel?tab=pedidos" className={styles.dropdownLink} onClick={() => setUserMenuOpen(false)}>
                    Mis Pedidos
                  </Link>
                  <button onClick={handleLogout} className={styles.logoutButton}>
                    <FontAwesomeIcon icon={faSignOutAlt} /> Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <div className={styles.notLoggedMessage}>No has iniciado sesión</div>
                  <Link to="/login" className={styles.dropdownLink} onClick={() => setUserMenuOpen(false)}>
                    Iniciar Sesión
                  </Link>
                  <Link to="/registro" className={styles.dropdownLink} onClick={() => setUserMenuOpen(false)}>
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Ícono del carrito con indicador de cantidad */}
        <div className={styles.cartIconContainer}>
          <Link to="/shoppingCart" className={styles.iconLink}>
            <FontAwesomeIcon icon={faShoppingCart} />
            {cartItemCount > 0 && (
              <span className={styles.cartBadge}>
                {cartItemCount > 99 ? '99+' : cartItemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;