import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import ProductCard from '../../components/ProductCard/ProductCard';
import styles from './listadoProductos.module.css';

const ListadoProductos = () => {
  const location = useLocation();
  
  // Estados para almacenar datos
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  
  // Estados para la búsqueda y filtrado
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(8);
  const [pagination, setPagination] = useState({
    total: 0,
    per_page: 9,
    current_page: 1,
    last_page: 1
  });

  // Función para obtener parámetros de la URL
  const getURLParams = () => {
    const searchParams = new URLSearchParams(location.search);
    return {
      categoria: searchParams.get('categoria') || ''
    };
  };

  // Cargar categorías y sus conteos al inicio
  useEffect(() => {
    const fetchCategoriesAndCounts = async () => {
      try {
        // Cargar categorías
        const categoriasRes = await axios.get('/api/categorias/todas');
        const categoriasData = categoriasRes.data.data || [];
        setCategories(categoriasData);
        
        // Cargar todos los productos para contar por categoría
        const todosProductosRes = await axios.get('/api/productos', { 
          params: { per_page: 1000 } // Un número alto para obtener todos los productos
        });
        const todosProductos = todosProductosRes.data.data || [];
        
        // Calcular conteos por categoría
        const counts = {};
        todosProductos.forEach(product => {
          const category = product.categoria_nombre;
          counts[category] = (counts[category] || 0) + 1;
        });
        
        setCategoryCounts(counts);
        setCategoriesLoaded(true);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setCategoriesLoaded(true); // Marcamos como cargado incluso si falla
      }
    };
    
    fetchCategoriesAndCounts();
  }, []);

  // Efecto para establecer filtro inicial basado en parámetros URL
  useEffect(() => {
    if (categoriesLoaded) {
      const urlParams = getURLParams();
      if (urlParams.categoria) {
        // Verificar que la categoría existe en nuestra lista o si es "Sin categoría"
        const categoriaExiste = categories.find(cat => cat.nombre === urlParams.categoria) || 
                               urlParams.categoria === 'Sin categoría';
        if (categoriaExiste) {
          setSelectedCategory(urlParams.categoria);
        }
      }
    }
  }, [location.search, categoriesLoaded, categories]);

  // Cargar productos con filtros y paginación
  useEffect(() => {
    // Solo cargar productos si las categorías ya se han cargado o si no hay filtro de categoría
    const urlParams = getURLParams();
    const shouldWaitForCategories = urlParams.categoria && urlParams.categoria !== 'Sin categoría' && !categoriesLoaded;
    
    if (shouldWaitForCategories) {
      return; // Esperar a que se carguen las categorías
    }

    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Construir parámetros de consulta para la API
        const params = {
          per_page: productsPerPage,
          page: currentPage
        };
        
        // Añadir filtros si existen
        if (appliedSearchTerm) {
          params.nombre = appliedSearchTerm;
        }
        
        if (selectedCategory) {
          if (selectedCategory === 'Sin categoría') {
            // Usar el filtro especial para productos sin categoría
            params.categoria_id = 'sin_categoria';
          } else {
            // Encontrar el ID de la categoría basado en el nombre
            const categoriaSeleccionada = categories.find(cat => cat.nombre === selectedCategory);
            if (categoriaSeleccionada) {
              params.categoria_id = categoriaSeleccionada.id;
            }
          }
        }
        
        // Realizar la petición con los parámetros
        const productosRes = await axios.get('/api/productos', { params });
        
        const productosData = productosRes.data.data || [];
        setProducts(productosData);
        
        // Actualizar información de paginación
        setPagination(productosRes.data.pagination);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.response?.data?.message || 'Error al cargar los datos');
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage, appliedSearchTerm, selectedCategory, productsPerPage, categories, categoriesLoaded]);

  // Manejadores de eventos
  const handleSearch = (e) => {
    e.preventDefault();
    setAppliedSearchTerm(searchTerm);
    setCurrentPage(1); // Regresar a la primera página al buscar
  };

  const handleCategoryClick = (categoryName) => {
    const newCategory = categoryName === selectedCategory ? '' : categoryName;
    setSelectedCategory(newCategory);
    setCurrentPage(1); // Regresar a la primera página al cambiar categoría
    
    // Actualizar la URL sin recargar la página
    const newUrl = newCategory ? 
      `${window.location.pathname}?categoria=${encodeURIComponent(newCategory)}` :
      window.location.pathname;
    window.history.pushState({}, '', newUrl);
  };

  // Función para resetear todos los filtros
  const handleResetFilters = () => {
    setSearchTerm('');
    setAppliedSearchTerm('');
    setSelectedCategory('');
    setCurrentPage(1);
    
    // Limpiar parámetros de la URL
    window.history.pushState({}, '', window.location.pathname);
  };

  // Cambiar de página
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Componente de paginación
  const Pagination = () => {
    const pageNumbers = [];
    const totalPages = pagination.last_page;
    
    // Para simplificar la UI en caso de muchas páginas
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    
    // Ajustar si estamos cerca del inicio o fin
    if (currentPage <= 3) {
      endPage = Math.min(5, totalPages);
    }
    if (currentPage >= totalPages - 2) {
      startPage = Math.max(1, totalPages - 4);
    }
    
    // Siempre incluir la primera y última página
    if (startPage > 1) {
      pageNumbers.push(1);
      if (startPage > 2) {
        pageNumbers.push('...');
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }
      pageNumbers.push(totalPages);
    }

    if (totalPages <= 1) return null;

    return (
      <div className={styles.pagination}>
        <button 
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className={styles.pageButton}
        >
          &laquo;
        </button>
        
        {pageNumbers.map((number, index) => (
          number === '...' ? 
          <span key={`ellipsis-${index}`} className={styles.ellipsis}>...</span> :
          <button
            key={number}
            onClick={() => paginate(number)}
            className={`${styles.pageButton} ${currentPage === number ? styles.activePage : ''}`}
          >
            {number}
          </button>
        ))}
        
        <button 
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={styles.pageButton}
        >
          &raquo;
        </button>
      </div>
    );
  };

  // Renderizado del componente de error global
  if (error) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <div className={styles.errorContainer}>
            <p>Error: {error}</p>
            <button onClick={() => window.location.reload()}>Reintentar</button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.shopHeader}>
          <h1>Tienda</h1>
          <p>
            MOSTRANDO {pagination.current_page === pagination.last_page && pagination.total < pagination.per_page ?
              `1-${pagination.total}` :
              `${(pagination.current_page - 1) * pagination.per_page + 1}-${Math.min(pagination.current_page * pagination.per_page, pagination.total)}`}
              DE {pagination.total} RESULTADOS
            {selectedCategory && <span> EN {selectedCategory.toUpperCase()}</span>}
            {appliedSearchTerm && <span> QUE COINCIDEN CON "{appliedSearchTerm.toUpperCase()}"</span>}
          </p>
        </div>
        
        <section className={styles.shopSection}>
          <aside className={styles.sidebar}>
            <div className={styles.filterSection}>
              <h2 className={styles.filterHeading}>Filtrar</h2>
              <form className={styles.searchForm} onSubmit={handleSearch}>
                <input 
                  type="text" 
                  placeholder="Buscar productos..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit" className={styles.searchButton}>Buscar</button>
              </form>
              <button 
                className={styles.searchButton} 
                onClick={handleResetFilters}
              >
                Reiniciar filtros              
              </button>
            </div>
            
            <div className={styles.filterSection}>
              <h2 className={styles.filterHeading}>Categorías</h2>
              <ul className={styles.categoriesList}>
                {/* Categorías normales */}
                {categories.map((category, index) => (
                  <li key={index} onClick={() => handleCategoryClick(category.nombre)}>
                    <a 
                      href="#" 
                      className={selectedCategory === category.nombre ? styles.activeCategory : ''}
                      onClick={(e) => e.preventDefault()}
                    >
                      {category.nombre}
                    </a>
                    <span className={styles.categoryCount}>
                      ({categoryCounts[category.nombre] || 0})
                    </span>
                  </li>
                ))}
                
                {/* Opción para productos sin categoría */}
                {categoryCounts['Sin categoría'] > 0 && (
                  <li onClick={() => handleCategoryClick('Sin categoría')} style={{ borderTop: '1px solid #eee', paddingTop: '8px', marginTop: '8px' }}>
                    <a 
                      href="#" 
                      className={selectedCategory === 'Sin categoría' ? styles.activeCategory : ''}
                      onClick={(e) => e.preventDefault()}
                      style={{ fontStyle: 'italic', color: '#888' }}
                    >
                      Sin categoría
                    </a>
                    <span className={styles.categoryCount}>
                      ({categoryCounts['Sin categoría'] || 0})
                    </span>
                  </li>
                )}
              </ul>
            </div>
          </aside>
          
          <div className={styles.productsContainer}>
            {loading ? (
              <div className={styles.productsLoading}>
                <p>Cargando productos...</p>
              </div>
            ) : products.length > 0 ? (
              <div className={styles.gridProductos}>
                {products.map(product => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    imageUrl={product.imagen_url || "/api/placeholder/220/220"}
                    imageAlt={product.imagen_alt || product.nombre}
                    name={product.nombre}
                    category={product.categoria_nombre}
                    price={`${product.precio}€`}
                    oldPrice={product.en_oferta ? `${product.precio_original}€` : null}
                    onSale={product.en_oferta}
                    stock={product.stock}
                  />
                ))}
              </div>
            ) : (
              <div>
                <p>No se encontraron productos que coincidan con tu búsqueda.</p>
                {selectedCategory && (
                  <p>Categoría seleccionada: <strong>{selectedCategory}</strong></p>
                )}
                {appliedSearchTerm && (
                  <p>Término de búsqueda: <strong>{appliedSearchTerm}</strong></p>
                )}
              </div>
            )}
            
            {!loading && <Pagination />}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default ListadoProductos;