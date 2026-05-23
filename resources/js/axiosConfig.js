import axios from 'axios';

// Configurar la URL base para todas las peticiones
// Usar variable de entorno o la URL actual
axios.defaults.baseURL = import.meta.env.VITE_API_URL || window.location.origin + '/';

// Configurar los headers por defecto
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

// Añadir el token de autenticación si existe
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Interceptor para manejar errores comunes
axios.interceptors.response.use(
  response => response,
  error => {
    // Si el error es 401 (no autorizado), redirigir al login
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axios;