import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para el carrito
  const [cart, setCart] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState(null);
  const [cartNotification, setCartNotification] = useState(null);

  // Estados para favoritos
  const [favorites, setFavorites] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [favoritesError, setFavoritesError] = useState(null);
  const [favoritesNotification, setFavoritesNotification] = useState(null);

  // Función auxiliar para determinar si un valor representa "true" para is_admin
  const isAdminValue = (value) => {
    return value === true || 
           value === 1 || 
           value === '1' || 
           value === 'true' || 
           value === 'admin';
  };

  // CONFIGURAR INTERCEPTORES DE AXIOS
  useEffect(() => {
    // Interceptor para requests - añadir token automáticamente
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para responses - manejar errores de autenticación
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expirado o inválido
          logout();
        }
        return Promise.reject(error);
      }
    );

    // Cleanup function para remover interceptores cuando el componente se desmonte
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Función para guardar el carrito en localStorage
  const saveCartToLocalStorage = (cartItems) => {
    localStorage.setItem('guestCart', JSON.stringify(cartItems));
  };

  // Función para cargar el carrito desde localStorage
  const loadCartFromLocalStorage = () => {
    const savedCart = localStorage.getItem('guestCart');
    return savedCart ? JSON.parse(savedCart) : [];
  };

  // Función para guardar favoritos en localStorage
  const saveFavoritesToLocalStorage = (favoriteItems) => {
    localStorage.setItem('guestFavorites', JSON.stringify(favoriteItems));
  };

  // Función para cargar favoritos desde localStorage
  const loadFavoritesFromLocalStorage = () => {
    const savedFavorites = localStorage.getItem('guestFavorites');
    return savedFavorites ? JSON.parse(savedFavorites) : [];
  };

  // Verificar si hay un token al cargar la aplicación
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // NO configurar aquí el header de axios ya que el interceptor lo hace automáticamente
          
          // Obtener los datos del usuario
          const response = await axios.get('/api/user');
          
          // Normalizar datos del usuario para que funcione correctamente
          const userData = {
            ...response.data,
            role: response.data.role || (isAdminValue(response.data.is_admin) ? 'admin' : 'user')
          };
          
          setUser(userData);
          setIsAuthenticated(true);
          
          // Cargar el carrito y favoritos si el usuario está autenticado
          fetchCart();
          fetchFavorites();
        } catch (error) {
          console.error('Error al verificar autenticación:', error);
          localStorage.removeItem('token');
          
          // Cargar carrito y favoritos desde localStorage para usuarios no autenticados
          const localCart = loadCartFromLocalStorage();
          const localFavorites = loadFavoritesFromLocalStorage();
          setCart(localCart);
          setFavorites(localFavorites);
        }
      } else {
        // Si no hay token, cargar carrito y favoritos desde localStorage
        const localCart = loadCartFromLocalStorage();
        const localFavorites = loadFavoritesFromLocalStorage();
        setCart(localCart);
        setFavorites(localFavorites);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Función de login
  const login = async (credentials) => {
    try {
      const response = await axios.post('/api/login', credentials);
      const { token } = response.data;
      
      localStorage.setItem('token', token);
      // NO configurar el header aquí ya que el interceptor lo hace automáticamente
      
      // Obtener los datos del usuario después de login
      const userResponse = await axios.get('/api/user');
      
      // Normalizar datos del usuario
      const userData = {
        ...userResponse.data,
        role: userResponse.data.role || (isAdminValue(userResponse.data.is_admin) ? 'admin' : 'user')
      };
      
      setUser(userData);
      setIsAuthenticated(true);
      
      // Obtener el carrito y favoritos del localStorage
      const localCart = loadCartFromLocalStorage();
      const localFavorites = loadFavoritesFromLocalStorage();
      
      // Sincronizar carrito
      if (localCart.length > 0) {
        await syncLocalCartWithServer(localCart);
        localStorage.removeItem('guestCart');
      } else {
        fetchCart();
      }
      
      // Sincronizar favoritos
      if (localFavorites.length > 0) {
        await syncLocalFavoritesWithServer(localFavorites);
        localStorage.removeItem('guestFavorites');
      } else {
        fetchFavorites();
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  // Función para sincronizar carrito local con el servidor
  const syncLocalCartWithServer = async (localCart) => {
    setCartLoading(true);
    try {
      // Para cada producto en el carrito local
      for (const item of localCart) {
        try {
          // Añadir al carrito del servidor
          await axios.post('/api/carrito', {
            producto_id: item.producto_id,
            cantidad: item.cantidad
          });
        } catch (error) {
          console.error(`Error al sincronizar producto ${item.producto_id}:`, error);
        }
      }
      
      // Una vez sincronizados todos, obtener el carrito actualizado del servidor
      await fetchCart();
      
      setCartNotification({
        message: 'Carrito sincronizado correctamente',
        type: 'success'
      });
      
      setTimeout(() => setCartNotification(null), 3000);
    } catch (error) {
      console.error('Error al sincronizar carrito:', error);
      setCartError('Error al sincronizar el carrito con el servidor');
    } finally {
      setCartLoading(false);
    }
  };

  // Función para sincronizar favoritos locales con el servidor
  const syncLocalFavoritesWithServer = async (localFavorites) => {
    setFavoritesLoading(true);
    try {
      // Para cada producto en favoritos locales
      for (const item of localFavorites) {
        try {
          // Añadir a favoritos del servidor
          await axios.post('/api/favorites', {
            producto_id: item.producto_id
          });
        } catch (error) {
          // Si el error es porque ya existe el favorito, se ignora
          if (error.response?.status !== 409 && error.response?.status !== 400) {
            console.error(`Error al sincronizar favorito ${item.producto_id}:`, error);
          }
        }
      }
      
      // Una vez sincronizados todos, obtener los favoritos actualizados del servidor
      await fetchFavorites();
      
      setFavoritesNotification({
        message: 'Favoritos sincronizados correctamente',
        type: 'success'
      });
      
      setTimeout(() => setFavoritesNotification(null), 3000);
    } catch (error) {
      console.error('Error al sincronizar favoritos:', error);
      setFavoritesError('Error al sincronizar los favoritos con el servidor');
    } finally {
      setFavoritesLoading(false);
    }
  };

  // Función de logout
  const logout = async () => {
    try {
      await axios.post('/api/logout');
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    
      // Limpiar el carrito y favoritos
      setCart([]);
      setFavorites([]);
      
      localStorage.removeItem('guestCart');
      localStorage.removeItem('guestFavorites');
    }
  };

  const refreshAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token && isAuthenticated) {
        // Obtener los datos actualizados del usuario
        const response = await axios.get('/api/user');
        
        // Normalizar datos del usuario
        const userData = {
          ...response.data,
          role: response.data.role || (isAdminValue(response.data.is_admin) ? 'admin' : 'user')
        };
        
        setUser(userData);

        // Refrescar también el carrito y favoritos
        fetchCart();
        fetchFavorites();
      }
    } catch (error) {
      console.error('Error al actualizar datos del usuario:', error);
      // Si hay error, podría ser que el token expiró
      logout();
    }
  };

  // Función para verificar si el usuario es admin
  const isAdmin = () => {
    // Si el usuario no está cargado, no es admin
    if (!user) return false;
    
    // Verificar primero si existe role y es admin
    if (user.role === 'admin') return true;
    
    // Si no hay role o no es admin, verificar is_admin
    return isAdminValue(user.is_admin);
  };

  // Función de registro para nuevos usuarios
  const register = async (userData) => {
    try {
      const response = await axios.post('/api/register', userData);
      return { 
        success: true, 
        data: response.data 
      };
    } catch (error) {
      console.error('Error en registro:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al registrar usuario'
      };
    }
  };

  // Función para actualizar información del usuario
  const updateProfile = async (userData) => {
    try {
      const response = await axios.put('/api/user', userData);
      
      // Actualizar el estado del usuario
      const updatedUserData = {
        ...response.data,
        role: response.data.role || (isAdminValue(response.data.is_admin) ? 'admin' : 'user')
      };
      
      setUser(updatedUserData);
      
      return { 
        success: true, 
        data: updatedUserData 
      };
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al actualizar perfil'
      };
    }
  };

  // ============ FUNCIONES DEL CARRITO ============

  // Función para obtener el carrito del usuario
  const fetchCart = async () => {
    if (!isAuthenticated) {
      // Si no está autenticado, usar el carrito de localStorage
      const localCart = loadCartFromLocalStorage();
      setCart(localCart);
      return;
    }

    try {
      setCartLoading(true);
      setCartError(null); // Limpiar errores anteriores
      
      const response = await axios.get('/api/carrito');
      
      // Verificar la estructura de la respuesta y manejarla adecuadamente
      if (Array.isArray(response.data)) {
        setCart(response.data);
      } else if (response.data && Array.isArray(response.data.data)) {
        // En caso de que la respuesta tenga un formato {data: [...]}
        setCart(response.data.data);
      } else {
        // Si no hay datos o la respuesta está vacía, establecer un array vacío
        setCart([]);
      }
      
    } catch (error) {
      console.error('Error al obtener el carrito:', error);
      
      // Proporcionar un mensaje de error más específico
      if (error.response) {
        setCartError(`Error ${error.response.status}: ${error.response.data?.error || 'Error al cargar el carrito'}`);
      } else if (error.request) {
        setCartError('No se pudo conectar con el servidor');
      } else {
        setCartError('Error al procesar la solicitud');
      }
      
      // Si hay un error, establecer el carrito como vacío
      setCart([]);
      
    } finally {
      setCartLoading(false);
    }
  };

  // Función para añadir productos al carrito
  const addToCart = async (product, quantity = 1) => {
    if (!isAuthenticated) {
      // Para usuarios no autenticados, guardar en localStorage
      try {
        // Obtener el carrito actual
        const currentCart = loadCartFromLocalStorage();
        
        // Verificar si el producto ya está en el carrito
        const existingItemIndex = currentCart.findIndex(item => 
          item.producto_id === product.id
        );
        
        if (existingItemIndex !== -1) {
          // Si ya existe, aumentar la cantidad
          currentCart[existingItemIndex].cantidad += quantity;
          // Actualizar subtotal
          currentCart[existingItemIndex].subtotal = (
            parseFloat(currentCart[existingItemIndex].precio) * 
            currentCart[existingItemIndex].cantidad
          ).toFixed(2);
        } else {
          // Si no existe, añadir nuevo item
          currentCart.push({
            producto_id: product.id,
            producto_nombre: product.nombre,
            cantidad: quantity,
            precio: product.precio,
            precio_original: product.precio_original,
            en_oferta: product.en_oferta,
            imagen_url: product.imagen_url || product.imagen || null,
            categoria_nombre: product.categoria_nombre || 'Sin categoría',
            subtotal: (parseFloat(product.precio) * quantity).toFixed(2)
          });
        }
        
        // Guardar el carrito actualizado
        saveCartToLocalStorage(currentCart);
        
        // Actualizar el estado
        setCart(currentCart);
        
        setCartNotification({
          message: `${quantity} unidad(es) de ${product.nombre} añadida(s) al carrito`,
          type: 'success'
        });
        
        setTimeout(() => setCartNotification(null), 3000);
        return true;
      } catch (error) {
        console.error('Error al añadir al carrito local:', error);
        
        setCartNotification({
          message: 'Error al añadir el producto al carrito',
          type: 'error'
        });
        
        setTimeout(() => setCartNotification(null), 3000);
        return false;
      }
    }

    // Para usuarios autenticados, usar la API
    try {
      setCartLoading(true);
      setCartError(null); // Limpiar errores anteriores
      
      const response = await axios.post('/api/carrito', {
        producto_id: product.id,
        cantidad: quantity
      });
      
      if (response.data.success) {
        // Actualizar el carrito
        await fetchCart();
        
        setCartNotification({
          message: `${quantity} unidad(es) de ${product.nombre} añadida(s) al carrito`,
          type: 'success'
        });
        
        setTimeout(() => setCartNotification(null), 3000);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error al añadir producto al carrito:', error);
      
      // Proporcionar un mensaje de error más específico
      if (error.response) {
        setCartError(`Error ${error.response.status}: ${error.response.data?.error || 'Error al añadir al carrito'}`);
      } else if (error.request) {
        setCartError('No se pudo conectar con el servidor');
      } else {
        setCartError('Error al procesar la solicitud');
      }
      
      setCartNotification({
        message: 'Error al añadir el producto al carrito',
        type: 'error'
      });
      
      setTimeout(() => setCartNotification(null), 3000);
      return false;
    } finally {
      setCartLoading(false);
    }
  };

  // Función para actualizar la cantidad de un producto en el carrito
  const updateCartQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;

    if (!isAuthenticated) {
      // Para usuarios no autenticados, actualizar en localStorage
      try {
        const currentCart = loadCartFromLocalStorage();
        const itemIndex = currentCart.findIndex(item => 
          item.producto_id === productId
        );
        
        if (itemIndex !== -1) {
          currentCart[itemIndex].cantidad = newQuantity;
          currentCart[itemIndex].subtotal = (parseFloat(currentCart[itemIndex].precio) * newQuantity).toFixed(2);
          
          saveCartToLocalStorage(currentCart);
          setCart([...currentCart]);
        }
        
        return;
      } catch (error) {
        console.error('Error al actualizar cantidad en carrito local:', error);
        return;
      }
    }

    // Para usuarios autenticados
    try {
      setCartLoading(true);
      setCartError(null);
      
      await axios.put(`/api/carrito/${productId}`, {
        cantidad: newQuantity
      });
      
      await fetchCart();
      
    } catch (error) {
      console.error('Error al actualizar cantidad:', error);
      
      if (error.response) {
        setCartError(`Error ${error.response.status}: ${error.response.data?.error || 'Error al actualizar cantidad'}`);
      } else if (error.request) {
        setCartError('No se pudo conectar con el servidor');
      } else {
        setCartError('Error al procesar la solicitud');
      }
      
    } finally {
      setCartLoading(false);
    }
  };

  // Función para eliminar un producto del carrito
  const removeFromCart = async (productId) => {
    if (!isAuthenticated) {
      // Para usuarios no autenticados, eliminar de localStorage
      try {
        const currentCart = loadCartFromLocalStorage();
        const updatedCart = currentCart.filter(item => item.producto_id !== productId);
        
        saveCartToLocalStorage(updatedCart);
        setCart(updatedCart);
        
        setCartNotification({
          message: 'Producto eliminado del carrito',
          type: 'success'
        });
        
        setTimeout(() => setCartNotification(null), 3000);
        
        return;
      } catch (error) {
        console.error('Error al eliminar producto del carrito local:', error);
        return;
      }
    }

    // Para usuarios autenticados
    try {
      setCartLoading(true);
      setCartError(null);
      
      await axios.delete(`/api/carrito/${productId}`);
      
      await fetchCart();
      
      setCartNotification({
        message: 'Producto eliminado del carrito',
        type: 'success'
      });
      
      setTimeout(() => setCartNotification(null), 3000);
      
    } catch (error) {
      console.error('Error al eliminar producto del carrito:', error);
      
      if (error.response) {
        setCartError(`Error ${error.response.status}: ${error.response.data?.error || 'Error al eliminar producto'}`);
      } else if (error.request) {
        setCartError('No se pudo conectar con el servidor');
      } else {
        setCartError('Error al procesar la solicitud');
      }
      
    } finally {
      setCartLoading(false);
    }
  };

  // Función para vaciar todo el carrito
  const clearCart = async () => {
    if (!isAuthenticated) {
      // Para usuarios no autenticados, vaciar localStorage
      try {
        localStorage.removeItem('guestCart');
        setCart([]);
        
        setCartNotification({
          message: 'Carrito vaciado correctamente',
          type: 'success'
        });
        
        setTimeout(() => setCartNotification(null), 3000);
        
        return;
      } catch (error) {
        console.error('Error al vaciar carrito local:', error);
        return;
      }
    }

    // Para usuarios autenticados
    try {
      setCartLoading(true);
      setCartError(null);
      
      await axios.delete('/api/carrito/all');
      
      setCart([]);
      
      setCartNotification({
        message: 'Carrito vaciado correctamente',
        type: 'success'
      });
      
      setTimeout(() => setCartNotification(null), 3000);
      
    } catch (error) {
      console.error('Error al vaciar el carrito:', error);
      
      if (error.response) {
        setCartError(`Error ${error.response.status}: ${error.response.data?.error || 'Error al vaciar el carrito'}`);
      } else if (error.request) {
        setCartError('No se pudo conectar con el servidor');
      } else {
        setCartError('Error al procesar la solicitud');
      }
      
    } finally {
      setCartLoading(false);
    }
  };

  // ============ FUNCIONES DE FAVORITOS ============

  // Función para obtener favoritos del usuario
  const fetchFavorites = async () => {
    if (!isAuthenticated) {
      // Si no está autenticado, usar favoritos de localStorage
      const localFavorites = loadFavoritesFromLocalStorage();
      setFavorites(localFavorites);
      return;
    }

    try {
      setFavoritesLoading(true);
      setFavoritesError(null);
      
      const response = await axios.get('/api/favorites');
      
      if (Array.isArray(response.data)) {
        setFavorites(response.data);
      } else if (response.data && Array.isArray(response.data.data)) {
        setFavorites(response.data.data);
      } else {
        setFavorites([]);
      }
      
    } catch (error) {
      console.error('Error al obtener favoritos:', error);
      
      if (error.response) {
        setFavoritesError(`Error ${error.response.status}: ${error.response.data?.error || 'Error al cargar favoritos'}`);
      } else if (error.request) {
        setFavoritesError('No se pudo conectar con el servidor');
      } else {
        setFavoritesError('Error al procesar la solicitud');
      }
      
      setFavorites([]);
      
    } finally {
      setFavoritesLoading(false);
    }
  };

  // Función para añadir/eliminar favoritos
  const toggleFavorite = async (product) => {
    if (!isAuthenticated) {
      // Para usuarios no autenticados, manejar en localStorage
      try {
        const currentFavorites = loadFavoritesFromLocalStorage();
        const existingIndex = currentFavorites.findIndex(item => 
          item.producto_id === product.id
        );
        
        if (existingIndex !== -1) {
          // Si ya está en favoritos, eliminarlo
          currentFavorites.splice(existingIndex, 1);
          setFavoritesNotification({
            message: `${product.nombre} eliminado de favoritos`,
            type: 'success'
          });
        } else {
          // Si no está, añadirlo
          currentFavorites.push({
            producto_id: product.id,
            name: product.nombre,
            price: `${parseFloat(product.precio).toFixed(2)} €`,
            raw_price: product.precio,
            image: product.imagen_url || product.imagen_principal || null,
            category: product.categoria_nombre || 'Sin categoría',
            stock: product.stock || 0,
            slug: product.slug || null
          });
          setFavoritesNotification({
            message: `${product.nombre} añadido a favoritos`,
            type: 'success'
          });
        }
        
        saveFavoritesToLocalStorage(currentFavorites);
        setFavorites([...currentFavorites]);
        
        setTimeout(() => setFavoritesNotification(null), 3000);
        
        return existingIndex === -1; // Retorna true si se añadió, false si se eliminó
      } catch (error) {
        console.error('Error al manejar favorito local:', error);
        setFavoritesNotification({
          message: 'Error al gestionar el favorito',
          type: 'error'
        });
        setTimeout(() => setFavoritesNotification(null), 3000);
        return false;
      }
    }

    // Para usuarios autenticados
    try {
      setFavoritesLoading(true);
      setFavoritesError(null);
      
      // Verificar si ya está en favoritos
      const existingFavorite = favorites.find(fav => fav.producto_id === product.id);
      
      if (existingFavorite) {
        // Eliminar de favoritos
        await axios.delete(`/api/favorites/${existingFavorite.id}`);
        setFavoritesNotification({
          message: `${product.nombre} eliminado de favoritos`,
          type: 'success'
        });
      } else {
        // Añadir a favoritos
        await axios.post('/api/favorites', {
          producto_id: product.id
        });
        setFavoritesNotification({
          message: `${product.nombre} añadido a favoritos`,
          type: 'success'
        });
      }
      
      // Actualizar la lista de favoritos
      await fetchFavorites();
      
      setTimeout(() => setFavoritesNotification(null), 3000);
      
      return !existingFavorite; // Retorna true si se añadió, false si se eliminó
      
    } catch (error) {
      console.error('Error al gestionar favorito:', error);
      
      if (error.response) {
        setFavoritesError(`Error ${error.response.status}: ${error.response.data?.error || 'Error al gestionar favorito'}`);
      } else if (error.request) {
        setFavoritesError('No se pudo conectar con el servidor');
      } else {
        setFavoritesError('Error al procesar la solicitud');
      }
      
      setFavoritesNotification({
        message: 'Error al gestionar el favorito',
        type: 'error'
      });
      
      setTimeout(() => setFavoritesNotification(null), 3000);
      return false;
    } finally {
      setFavoritesLoading(false);
    }
  };

  // Función para verificar si un producto está en favoritos
  const isFavorite = (productId) => {
    return favorites.some(fav => fav.producto_id === productId);
  };

  // Función para eliminar un favorito específico (para la página de favoritos)
  const removeFavorite = async (favoriteId, productId) => {
    if (!isAuthenticated) {
      // Para usuarios no autenticados, eliminar de localStorage
      try {
        const currentFavorites = loadFavoritesFromLocalStorage();
        const updatedFavorites = currentFavorites.filter(item => item.producto_id !== productId);
        
        saveFavoritesToLocalStorage(updatedFavorites);
        setFavorites(updatedFavorites);
        
        setFavoritesNotification({
          message: 'Producto eliminado de favoritos',
          type: 'success'
        });
        
        setTimeout(() => setFavoritesNotification(null), 3000);
        return true;
      } catch (error) {
        console.error('Error al eliminar favorito local:', error);
        return false;
      }
    }

    // Para usuarios autenticados
    try {
      setFavoritesLoading(true);
      setFavoritesError(null);
      
      await axios.delete(`/api/favorites/${favoriteId}`);
      
      // Actualizar la lista de favoritos
      await fetchFavorites();
      
      setFavoritesNotification({
        message: 'Producto eliminado de favoritos',
        type: 'success'
      });
      
      setTimeout(() => setFavoritesNotification(null), 3000);
      return true;
      
    } catch (error) {
      console.error('Error al eliminar favorito:', error);
      
      if (error.response) {
        setFavoritesError(`Error ${error.response.status}: ${error.response.data?.error || 'Error al eliminar favorito'}`);
      } else if (error.request) {
        setFavoritesError('No se pudo conectar con el servidor');
      } else {
        setFavoritesError('Error al procesar la solicitud');
      }
      
      return false;
    } finally {
      setFavoritesLoading(false);
    }
  };

  // Cálculos del carrito
  const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.precio) * item.cantidad), 0);
  const shipping = cart.length > 0 ? 2.00 : 0;
  const vat = subtotal * 0.21; // IVA (21%)
  const total = subtotal + shipping + vat;
  
  // Contar el número total de productos en el carrito
  const cartItemCount = cart.reduce((count, item) => count + item.cantidad, 0);

  // Contar el número total de favoritos
  const favoritesCount = favorites.length;

  return (
    <AuthContext.Provider
      value={{
        // Estados y funciones de autenticación
        isAuthenticated,
        user,
        loading,
        login,
        logout,
        register,
        refreshAuth,
        updateProfile,
        isAdmin,

        // Estados y funciones del carrito
        cart,
        cartLoading,
        cartError,
        cartNotification,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        fetchCart,
        subtotal,
        shipping,
        vat,
        total,
        cartItemCount,
        
        // Estados y funciones de favoritos
        favorites,
        favoritesLoading,
        favoritesError,
        favoritesNotification,
        toggleFavorite,
        isFavorite,
        removeFavorite,
        fetchFavorites,
        favoritesCount
      }}
    >
      {children}
      {cartNotification && (
        <div className={`notification ${cartNotification.type}`}>
          {cartNotification.message}
        </div>
      )}
      {favoritesNotification && (
        <div className={`notification ${favoritesNotification.type}`}>
          {favoritesNotification.message}
        </div>
      )}
    </AuthContext.Provider>
  );
};

export default AuthProvider;