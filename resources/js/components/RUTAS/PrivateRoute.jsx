import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user, loading } = useContext(AuthContext);

  if (loading) {
    // Muestra un indicador de carga mientras se verifica la autenticación
    return <div>Cargando...</div>;
  }

  // Si requiere ser administrador, verificar autenticación Y rol de administrador
  if (adminOnly) {
    if (!isAuthenticated || (user && !user.is_admin)) {
      // Redirecciona al inicio si no está autenticado o no es administrador
      return <Navigate to="/" />;
    }
  } else {
    // Comportamiento normal para rutas privadas no-admin
    if (!isAuthenticated) {
      // Redirecciona al login si no está autenticado
      return <Navigate to="/login" />;
    }
  }

  // Renderiza la ruta protegida si cumple las condiciones necesarias
  return children;
};

export default PrivateRoute;