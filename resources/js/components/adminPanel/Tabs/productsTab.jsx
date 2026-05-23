import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../RUTAS/AuthContext';
import sharedStyles from '../../../../css/panelShared.module.css';
import ownStyles from '../adminPanel.module.css';
const styles = { ...sharedStyles, ...ownStyles };

function ProductTab() {
  const { user, isAdmin } = useContext(AuthContext);
  const userIsAdmin = isAdmin(); 
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissionError, setPermissionError] = useState(false);
  const [success, setSuccess] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [availableImages, setAvailableImages] = useState([]);
  
  // Estados para gestión de imágenes
  const [imageMode, setImageMode] = useState('existing'); // 'existing' o 'new'
  const [newImageUrls, setNewImageUrls] = useState('');
  const [newImageDescription, setNewImageDescription] = useState('');
  const [imageCreationInProgress, setImageCreationInProgress] = useState(false);
  
  const [newProduct, setNewProduct] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    precio_original: '',
    porcentaje_descuento: '',
    talla: '',
    stock: '',
    categoria_id: '',
    imagen_id: '',
    fecha_inicio_descuento: '',
    fecha_fin_descuento: '',
  });

  // Función helper para obtener la URL principal de una imagen
  const getPrimaryImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    const urls = imageUrl.split('|').map(url => url.trim()).filter(url => url);
    return urls.length > 0 ? urls[0] : null;
  };

  // Función helper para obtener todas las URLs de una imagen
  const getAllImageUrls = (imageUrl) => {
    if (!imageUrl) return [];
    return imageUrl.split('|').map(url => url.trim()).filter(url => url);
  };

  // Cargar categorías e imágenes solo al montar el componente
  useEffect(() => {
    fetchCategories();
    fetchAvailableImages();
  }, []);

  // Cargar productos solo cuando cambia la página
  useEffect(() => {
    fetchProducts();
  }, [currentPage]);

  // Función para manejar errores de las peticiones
  const handleApiError = (err) => {
    console.error('Error en la petición:', err);
    
    // Detectar errores de permisos (403 Forbidden)
    if (err.response && err.response.status === 403) {
      setPermissionError(true);
      setError('No tienes permisos para realizar esta acción. Solo los administradores pueden gestionar productos.');
    } else {
      setError(err.response?.data?.error || 'Ha ocurrido un error. Por favor, intenta más tarde.');
    }
  };

  // Función para cargar las categorías
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }
      
      const response = await axios.get('/api/categorias/todas', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Verificar si la respuesta contiene 'data' y si 'data' es un array
      if (response.data && Array.isArray(response.data.data)) {
        setCategories(response.data.data);
      } else {
        console.error('Respuesta de categorías no contiene un array:', response.data);
        setCategories([]);
      }
    } catch (err) {
      handleApiError(err);
      setCategories([]);
    }
  };

  // Función para cargar imágenes disponibles usando el nuevo controlador
  const fetchAvailableImages = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }
      
      // Usamos la ruta para obtener todas las imágenes
      const response = await axios.get('/api/imagenes', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && Array.isArray(response.data.data)) {
        setAvailableImages(response.data.data);
      } else {
        console.error('Respuesta de imágenes no contiene un array:', response.data);
        setAvailableImages([]);
      }
    } catch (err) {
      console.error('Error al cargar imágenes:', err);
      setAvailableImages([]);
    }
  };

  // Función para crear nuevas imágenes 
  const createNewImages = async () => {
    try {
      setImageCreationInProgress(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      if (!newImageUrls.trim()) {
        throw new Error('Debes proporcionar al menos una URL');
      }

      const response = await axios.post('/api/imagenes', {
        urls: newImageUrls, // Enviar las URLs con pipes 
        descripcion_base: newImageDescription || 'Imagen de producto'
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Actualizar la lista de imágenes disponibles
      await fetchAvailableImages();

      // Establecer automáticamente la imagen creada como seleccionada
      if (response.data.principal_id) {
        setNewProduct(prev => ({
          ...prev,
          imagen_id: response.data.principal_id
        }));
      }

      // Cambiar a modo de imagen existente y limpiar campos
      setImageMode('existing');
      setNewImageUrls('');
      setNewImageDescription('');

      setSuccess(response.data.message);
      setTimeout(() => setSuccess(null), 3000);

      return response.data.principal_id;

    } catch (err) {
      console.error('Error al crear imágenes:', err);
      setError(err.response?.data?.error || 'Error al crear las imágenes');
      throw err;
    } finally {
      setImageCreationInProgress(false);
    }
  };

  // Función para cargar los productos
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }
      
      // Construir los parámetros de consulta
      let params = {
        page: currentPage
      };
      
      if (searchTerm) {
        params.nombre = searchTerm;
      }
      
      if (selectedCategory) {
        // Manejar el caso especial de "sin_categoria"
        if (selectedCategory === 'sin_categoria') {
          params.categoria_id = 'sin_categoria';
        } else {
          params.categoria_id = selectedCategory;
        }
      }
      
      const response = await axios.get('/api/productos', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: params
      });
      
      if (response.data && Array.isArray(response.data.data)) {
        setProducts(response.data.data);
        if (response.data.pagination) {
          setLastPage(response.data.pagination.last_page);
        }
      } else {
        console.error('Respuesta de productos no contiene un array:', response.data);
        setProducts([]);
      }
    } catch (err) {
      handleApiError(err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleShowForm = () => {
    // Verificar primero si el usuario es administrador
    if (!userIsAdmin) {
      setPermissionError(true);
      setError('No tienes permisos para añadir productos. Solo los administradores pueden realizar esta acción.');
      return;
    }
    
    setShowProductForm(true);
    setEditingProductId(null);
    setImageMode('existing');
    setNewImageUrls('');
    setNewImageDescription('');
    // Resetear el formulario
    setNewProduct({
      nombre: '',
      descripcion: '',
      precio: '',
      precio_original: '',
      porcentaje_descuento: '',
      talla: '',
      stock: '',
      categoria_id: '',
      imagen_id: '',
      fecha_inicio_descuento: '',
      fecha_fin_descuento: '',
    });
  };

  const handleHideForm = () => {
    setShowProductForm(false);
    setEditingProductId(null);
    setError(null);
    setImageMode('existing');
    setNewImageUrls('');
    setNewImageDescription('');
  };

  const handleInputChange = (e) => {
    const { id, value, type } = e.target;
    
    // Convertir valores numéricos
    let processedValue = value;
    if (type === 'number') {
      processedValue = value === '' ? '' : Number(value);
    }
    
    setNewProduct({
      ...newProduct,
      [id]: processedValue
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Verificar primero si el usuario es administrador
    if (!userIsAdmin) {
      setPermissionError(true);
      setError('No tienes permisos para guardar productos. Solo los administradores pueden realizar esta acción.');
      return;
    }
    
    try {
      setActionInProgress('form');
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      // Si estamos en modo de nueva imagen, crear las imágenes primero
      let imagenId = newProduct.imagen_id;
      
      if (imageMode === 'new' && newImageUrls.trim()) {
        imagenId = await createNewImages();
      }
      
      // Preparar datos del producto
      const productData = {
        ...newProduct,
        imagen_id: imagenId ? parseInt(imagenId, 10) : null,
        // Manejar categoria_id: si es vacío o "sin_categoria", enviar null
        categoria_id: (!newProduct.categoria_id || newProduct.categoria_id === 'sin_categoria') 
          ? null 
          : parseInt(newProduct.categoria_id, 10),
        // Asegurarse de que los valores numéricos sean adecuados
        precio: parseFloat(newProduct.precio),
        precio_original: newProduct.precio_original ? parseFloat(newProduct.precio_original) : null,
        porcentaje_descuento: newProduct.porcentaje_descuento ? parseFloat(newProduct.porcentaje_descuento) : 0,
        stock: parseInt(newProduct.stock, 10),
      };

      let response;
      
      if (editingProductId) {
        // Actualizando un producto existente
        response = await axios.put(`/api/productos/${editingProductId}`, productData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        setSuccess('Producto actualizado correctamente');
      } else {
        // Creando un nuevo producto
        response = await axios.post('/api/productos', productData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        setSuccess('Producto añadido correctamente');
      }
      
      // Ocultar el formulario y refrescar la lista
      setShowProductForm(false);
      setEditingProductId(null);
      fetchProducts();
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (err) {
      console.error('Error al guardar el producto:', err);
      handleApiError(err);
    } finally {
      setActionInProgress(null);
    }
  };

  // Función corregida para manejar edición
  const handleEdit = (id) => {
    // Verificar primero si el usuario es administrador
    if (!userIsAdmin) {
      setPermissionError(true);
      setError('No tienes permisos para editar productos. Solo los administradores pueden realizar esta acción.');
      return;
    }
    
    const productToEdit = products.find(prod => prod.id === id);
    if (productToEdit) {
      // Función auxiliar para convertir valores de forma segura a string
      const safeToString = (value) => value != null ? String(value) : '';
      
      setNewProduct({
        nombre: productToEdit.nombre || '',
        descripcion: productToEdit.descripcion || '',
        precio: safeToString(productToEdit.precio),
        precio_original: safeToString(productToEdit.precio_original),
        porcentaje_descuento: safeToString(productToEdit.porcentaje_descuento),
        talla: productToEdit.talla || '',
        stock: safeToString(productToEdit.stock),
        // Manejar categoria_id: si es null, usar 'sin_categoria'
        categoria_id: productToEdit.categoria_id || 'sin_categoria',
        imagen_id: productToEdit.imagen_id || '',
        fecha_inicio_descuento: productToEdit.fecha_inicio_descuento || '',
        fecha_fin_descuento: productToEdit.fecha_fin_descuento || '',
      });
      setEditingProductId(id);
      setImageMode('existing');
      setNewImageUrls('');
      setNewImageDescription('');
      setShowProductForm(true);
    }
  };

  const handleDelete = async (id) => {
    // Verificar primero si el usuario es administrador
    if (!userIsAdmin) {
      setPermissionError(true);
      setError('No tienes permisos para eliminar productos. Solo los administradores pueden realizar esta acción.');
      return;
    }
    
    try {
      setActionInProgress(id);
      setError(null);
      setSuccess(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }
      
      await axios.delete(`/api/productos/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Actualizar estado después de eliminar
      fetchProducts();
      
      setSuccess('Producto eliminado correctamente');
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Volver a la primera página con nuevos resultados
    fetchProducts(); // Ejecutar la búsqueda
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setCurrentPage(1);
    fetchProducts(); // Ejecutar búsqueda con filtros vacíos
  };

  const changePage = (page) => {
    setCurrentPage(page);
  };

  if (loading && products.length === 0) {
    return (
      <div className={`${styles.tabPane} ${styles.minHeight}`}>
        <h2>Catálogo de productos</h2>
        <div className={styles.loading}>Cargando productos...</div>
      </div>
    );
  }

  return (
    <div className={`${styles.tabPane} ${styles.minHeight}`}>
      <h2>Catálogo de productos</h2>
      
      {error && (
        <div className={styles.alertError}>
          {error}
          {permissionError && (
            <p>
              <strong>Nota:</strong> Solo los usuarios con rol de administrador pueden gestionar productos.
            </p>
          )}
        </div>
      )}
      
      {success && (
        <div className={styles.alertSuccess}>
          {success}
        </div>
      )}
      
      {/* Barra de búsqueda y filtros */}
      <div className={styles.filterBar}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            className={styles.searchInput} 
            placeholder="Buscar por nombre..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className={styles.filterSelect} 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            <option value="sin_categoria">Sin categoría</option>
            {Array.isArray(categories) && categories.map(category => (
              <option key={category.id} value={category.id}>{category.nombre}</option>
            ))}
          </select>
          <button type="submit" className={styles.btnGuardar}>
            Buscar
          </button>
          
          <button type="button" className={styles.btnCancelar} onClick={handleResetFilters}>
            Limpiar filtros
          </button>
        </form>
      </div>
      
      {/* Vista de tabla para escritorio */}
      <div className={styles.tableResponsive}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Imagen</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Oferta</th>
              {userIsAdmin && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>
                  {(() => {
                    const primaryUrl = getPrimaryImageUrl(product.imagen_url);
                    return primaryUrl ? (
                      <img 
                        src={primaryUrl} 
                        alt={product.nombre} 
                        style={{width: '50px', height: '50px', objectFit: 'cover'}} 
                      />
                    ) : (
                      'Sin imagen'
                    );
                  })()}
                </td>
                <td>{product.nombre}</td>
                <td>
                  <span className={!product.categoria_nombre || product.categoria_nombre === 'Sin categoría' 
                    ? styles.badgeWarning 
                    : ''}>
                    {product.categoria_nombre || 'Sin categoría'}
                  </span>
                </td>
                <td>
                  {product.en_oferta ? (
                    <>
                      <span style={{textDecoration: 'line-through', color: '#999'}}>
                        {product.precio_original}€
                      </span>
                      {' '}
                      <strong>{product.precio}€</strong>
                    </>
                  ) : (
                    <strong>{product.precio}€</strong>
                  )}
                </td>
                <td>{product.stock || 'N/A'}</td>
                <td>
                  {product.en_oferta && (
                    <span className={styles.badgeSuccess}>
                      {product.porcentaje_descuento}% dto.
                    </span>
                  )}
                </td>
                {userIsAdmin && (
                  <td className={styles.actions}>
                    <button 
                      className={styles.btnEditar} 
                      onClick={() => handleEdit(product.id)}
                      disabled={actionInProgress}
                    >
                      Editar
                    </button>
                    <button 
                      className={styles.btnEliminar} 
                      onClick={() => handleDelete(product.id)}
                      disabled={actionInProgress === product.id}
                    >
                      {actionInProgress === product.id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista de tarjetas para móviles */}
      <div className={styles.mobileCards}>
        {products.map(product => (
          <div key={product.id} className={styles.userCard}>
            <div className={styles.userCardHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div>
                  {(() => {
                    const primaryUrl = getPrimaryImageUrl(product.imagen_url);
                    return primaryUrl ? (
                      <img 
                        src={primaryUrl} 
                        alt={product.nombre} 
                        style={{
                          width: '60px', 
                          height: '60px', 
                          objectFit: 'cover',
                          borderRadius: '8px'
                        }} 
                      />
                    ) : (
                      <div style={{
                        width: '60px',
                        height: '60px', 
                        backgroundColor: '#f0f0f0',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: '#666'
                      }}>
                        Sin imagen
                      </div>
                    );
                  })()}
                </div>
                <div>
                  <div className={styles.userCardTitle}>
                    {product.nombre}
                  </div>
                  <div className={styles.userCardEmail}>
                    <span className={!product.categoria_nombre || product.categoria_nombre === 'Sin categoría' 
                      ? styles.badgeWarning 
                      : ''}>
                      {product.categoria_nombre || 'Sin categoría'}
                    </span>
                  </div>
                </div>
              </div>
              <div className={styles.userCardId}>
                ID: {product.id}
              </div>
            </div>
            
            <div className={styles.userCardDetails}>
              <div className={styles.userCardDetail}>
                <div className={styles.userCardDetailLabel}>Precio</div>
                <div className={styles.userCardDetailValue}>
                  {product.en_oferta ? (
                    <div>
                      <span style={{textDecoration: 'line-through', color: '#999', fontSize: '14px'}}>
                        {product.precio_original}€
                      </span>
                      <br />
                      <strong style={{color: '#e74c3c'}}>{product.precio}€</strong>
                    </div>
                  ) : (
                    <strong>{product.precio}€</strong>
                  )}
                </div>
              </div>
              
              <div className={styles.userCardDetail}>
                <div className={styles.userCardDetailLabel}>Stock</div>
                <div className={styles.userCardDetailValue}>
                  <span className={product.stock > 0 ? styles.badgeSuccess : styles.badgeDanger}>
                    {product.stock > 0 ? `${product.stock} unidades` : 'Sin stock'}
                  </span>
                </div>
              </div>
              
              {product.talla && (
                <div className={styles.userCardDetail}>
                  <div className={styles.userCardDetailLabel}>Talla</div>
                  <div className={styles.userCardDetailValue}>
                    {product.talla}
                  </div>
                </div>
              )}
              
              {product.en_oferta && (
                <div className={styles.userCardDetail}>
                  <div className={styles.userCardDetailLabel}>Oferta</div>
                  <div className={styles.userCardDetailValue}>
                    <span className={styles.badgeSuccess}>
                      {product.porcentaje_descuento}% descuento
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            {userIsAdmin && (
              <div className={styles.userCardActions}>
                <button 
                  className={styles.btnEditar} 
                  onClick={() => handleEdit(product.id)}
                  disabled={actionInProgress}
                >
                  Editar
                </button>
                
                <button 
                  className={styles.btnEliminar} 
                  onClick={() => handleDelete(product.id)}
                  disabled={actionInProgress === product.id}
                >
                  {actionInProgress === product.id ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {products.length === 0 && !loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '50px',
          color: '#777',
          border: '1px solid #e0e0e0',
          borderRadius: '4px'
        }}>
          <p>No se encontraron productos. Intenta cambiar los filtros o añade un nuevo producto.</p>
        </div>
      )}
      
      {/* Paginación */}
      {lastPage > 1 && (
        <div className={styles.pagination}>
          <button 
            className={styles.pageBtn} 
            onClick={() => changePage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            &laquo; Anterior
          </button>
          
          {Array.from({ length: lastPage }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              className={`${styles.pageBtn} ${currentPage === page ? styles.pageBtnActive : ''}`}
              onClick={() => changePage(page)}
            >
              {page}
            </button>
          ))}
          
          <button 
            className={styles.pageBtn} 
            onClick={() => changePage(Math.min(lastPage, currentPage + 1))}
            disabled={currentPage === lastPage}
          >
            Siguiente &raquo;
          </button>
        </div>
      )}
      
      {/* Solo se muestra el botón para añadir productos si el usuario es administrador */}
      {userIsAdmin && !showProductForm && (
        <button className={styles.btnNueva} onClick={handleShowForm}>
          Añadir nuevo producto
        </button>
      )}
      
      {/* Si el usuario no es administrador, se muestra un mensaje */}
      {!userIsAdmin && !permissionError && (
        <div className={styles.infoMessage}>
          <p>Solo los administradores pueden gestionar productos. Si necesitas realizar cambios, contacta con un administrador.</p>
        </div>
      )}
      
      {/* Formulario para nuevo producto o editar existente */}
      {showProductForm && userIsAdmin && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <h3>{editingProductId ? 'Editar producto' : 'Nuevo producto'}</h3>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="nombre">Nombre del producto</label>
              <input 
                className={styles.input}
                type="text" 
                id="nombre" 
                placeholder="Nombre del producto" 
                value={newProduct.nombre}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="categoria_id">Categoría</label>
              <select 
                className={styles.input}
                id="categoria_id" 
                value={newProduct.categoria_id}
                onChange={handleInputChange}
              >
                <option value="sin_categoria">Sin categoría</option>
                {Array.isArray(categories) && categories.map(category => (
                  <option key={category.id} value={category.id}>{category.nombre}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="descripcion">Descripción</label>
            <textarea 
              className={styles.input}
              id="descripcion" 
              rows="4"
              placeholder="Descripción detallada del producto" 
              value={newProduct.descripcion}
              onChange={handleInputChange}
            />
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="precio">Precio (€)</label>
              <input 
                className={styles.input}
                type="number" 
                id="precio" 
                step="0.01" 
                min="0"
                placeholder="0.00" 
                value={newProduct.precio}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="precio_original">Precio original (€) <small>(si está en oferta)</small></label>
              <input 
                className={styles.input}
                type="number" 
                id="precio_original" 
                step="0.01" 
                min="0"
                placeholder="0.00" 
                value={newProduct.precio_original}
                onChange={handleInputChange}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="porcentaje_descuento">Descuento (%)</label>
              <input 
                className={styles.input}
                type="number" 
                id="porcentaje_descuento" 
                step="0.01" 
                min="0" 
                max="100"
                placeholder="0" 
                value={newProduct.porcentaje_descuento}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="talla">Talla</label>
              <input 
                className={styles.input}
                type="text" 
                id="talla" 
                placeholder="S, M, L, XL, etc." 
                value={newProduct.talla}
                onChange={handleInputChange}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="stock">Stock</label>
              <input 
                className={styles.input}
                type="number" 
                id="stock" 
                min="0" 
                placeholder="0" 
                value={newProduct.stock}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          {/* Sección de gestión de imágenes */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Gestión de imágenes</label>
            
            {/* Selector de modo de imagen */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input
                    type="radio"
                    value="existing"
                    checked={imageMode === 'existing'}
                    onChange={(e) => setImageMode(e.target.value)}
                  />
                  Usar imagen existente
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input
                    type="radio"
                    value="new"
                    checked={imageMode === 'new'}
                    onChange={(e) => setImageMode(e.target.value)}
                  />
                  Añadir nueva imagen
                </label>
              </div>
            </div>

            {/* Modo imagen existente */}
            {imageMode === 'existing' && (
              <div>
                <select
                  className={styles.input}
                  id="imagen_id"
                  value={newProduct.imagen_id}
                  onChange={handleInputChange}
                >
                  <option value="">Sin imagen</option>
                  {Array.isArray(availableImages) && availableImages.map(img => (
                    <option key={img.id} value={img.id}>
                      {img.descripcion}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Modo nueva imagen */}
            {imageMode === 'new' && (
              <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>URLs de imágenes</label>
                  <textarea
                    className={styles.input}
                    value={newImageUrls}
                    onChange={(e) => setNewImageUrls(e.target.value)}
                    placeholder="Ingresa una o más URLs separadas por | (pipe)&#10;Ejemplo: https://ejemplo.com/imagen1.jpg | https://ejemplo.com/imagen2.jpg"
                    rows="3"
                  />
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    Puedes añadir múltiples URLs separándolas con "|". Todas las URLs se guardarán en un solo registro.
                  </small>
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>Descripción</label>
                  <input
                    className={styles.input}
                    type="text"
                    value={newImageDescription}
                    onChange={(e) => setNewImageDescription(e.target.value)}
                    placeholder="Descripción para las imágenes"
                  />
                </div>

                <button
                  type="button"
                  className={styles.btnGuardar}
                  onClick={createNewImages}
                  disabled={!newImageUrls.trim() || imageCreationInProgress}
                  style={{ marginTop: '10px' }}
                >
                  {imageCreationInProgress ? 'Creando imagen...' : 'Crear y usar imagen'}
                </button>
              </div>
            )}
          </div>
          
          {/* Fechas de oferta */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="fecha_inicio_descuento">Inicio oferta</label>
              <input 
                className={styles.input}
                type="date" 
                id="fecha_inicio_descuento" 
                value={newProduct.fecha_inicio_descuento}
                onChange={handleInputChange}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="fecha_fin_descuento">Fin oferta</label>
              <input 
                className={styles.input}
                type="date" 
                id="fecha_fin_descuento" 
                value={newProduct.fecha_fin_descuento}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          {/* Vista previa de imagen si está disponible*/}
          {newProduct.imagen_id && availableImages.length > 0 && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Vista previa de imagen(es)</label>
              <div className={styles.imagePreview}>
                {(() => {
                  const selectedImage = availableImages.find(img => img.id == newProduct.imagen_id);
                  if (!selectedImage) {
                    return <p>No hay vista previa disponible</p>;
                  }

                  const allUrls = getAllImageUrls(selectedImage.url);
                  
                  if (allUrls.length === 0) {
                    return <p>No hay URLs válidas</p>;
                  }

                  return (
                    <div>
                      {/* Mostrar información sobre las imágenes */}
                      <p style={{fontSize: '12px', color: '#666', marginBottom: '10px'}}>
                        {allUrls.length === 1 
                          ? 'Imagen única:' 
                          : `${allUrls.length} imágenes encontradas:`
                        }
                      </p>
                      
                      {/* Contenedor de imágenes con scroll horizontal si hay muchas */}
                      <div style={{
                        display: 'flex', 
                        gap: '10px', 
                        overflowX: 'auto',
                        padding: '10px 0',
                        maxWidth: '100%'
                      }}>
                        {allUrls.map((url, index) => (
                          <div key={index} style={{ flexShrink: 0 }}>
                            <img 
                              src={url} 
                              alt={`Vista previa ${index + 1}`}
                              style={{
                                width: '150px', 
                                height: '150px', 
                                objectFit: 'cover',
                                border: '1px solid #ddd', 
                                borderRadius: '4px'
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div style={{
                              width: '150px',
                              height: '150px',
                              backgroundColor: '#f0f0f0',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              display: 'none',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              color: '#666',
                              textAlign: 'center',
                              flexDirection: 'column'
                            }}>
                              <span>Error al cargar</span>
                              <span>imagen {index + 1}</span>
                            </div>
                            {allUrls.length > 1 && (
                              <p style={{
                                fontSize: '10px', 
                                color: '#999', 
                                textAlign: 'center', 
                                marginTop: '5px',
                                width: '150px'
                              }}>
                                {index === 0 ? 'Principal' : `Imagen ${index + 1}`}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* Información adicional */}
                      {allUrls.length > 1 && (
                        <p style={{fontSize: '11px', color: '#888', marginTop: '10px', fontStyle: 'italic'}}>
                          💡 La primera imagen se usará como imagen principal en los listados
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
          
          <div className={styles.formActions}>
            <button 
              type="button" 
              className={styles.btnCancelar} 
              onClick={handleHideForm}
              disabled={actionInProgress === 'form' || imageCreationInProgress}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className={styles.btnGuardar}
              disabled={actionInProgress === 'form' || imageCreationInProgress}
            >
              {actionInProgress === 'form' ? 'Guardando...' : (editingProductId ? 'Actualizar producto' : 'Guardar producto')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default ProductTab;