import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import ProductCard from '../../components/ProductCard/ProductCard';
import MarcasCarrusel from '../../components/marcasCarrusel/marcasCarrusel';
import styles from './Home.module.css';

const Home = () => {
  const navigate = useNavigate();
  
  // Estados para almacenar los datos
  const [productosDestacados, setProductosDestacados] = useState([]);
  const [productosMasVendidos, setProductosMasVendidos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Función para obtener todos los datos necesarios
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Hacemos todas las peticiones en paralelo para optimizar
        const [destacadosRes, vendidosRes, categoriasRes] = await Promise.all([
          axios.get('/api/productos/destacados'),
          axios.get('/api/productos/mas-vendidos'),
          axios.get('/api/categorias') // Esto llama al método index() que devuelve 3 categorías aleatorias
        ]);
        
        // Actualizamos los estados con los datos recibidos
        setProductosDestacados(destacadosRes.data.data || []);
        setProductosMasVendidos(vendidosRes.data.data || []);
        setCategorias(categoriasRes.data.data || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.response?.data?.message || 'Error al cargar los datos');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Función para navegar a productos
  const handleNavigateToProducts = () => {
    navigate('/productos');
  };

  // Función para navegar a productos con filtro de categoría
  const handleNavigateToCategory = (categoriaNombre) => {
    // Navegar a la página de productos con el parámetro de categoría en la URL
    navigate(`/productos?categoria=${encodeURIComponent(categoriaNombre)}`);
  };

  // Componente de carga
  if (loading) {
    return (
      <>
        <Header />
        <div className={styles.loadingContainer}>
          <p>Cargando productos...</p>
        </div>
        <Footer />
      </>
    );
  }

  // Componente de error
  if (error) {
    return (
      <>
        <Header />
        <div className={styles.errorContainer}>
          <p>Error: {error}</p>
          <button onClick={() => window.location.reload()}>Reintentar</button>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main>
        <section className={styles.sectionBanner}>
          <div className={styles.bannerContent}>
            <div className={styles.bannerText}>
              <h1>Modernidad</h1>
              <h2>Al alcance de todos</h2>
              <button onClick={handleNavigateToProducts}>Empieza a comprar</button>
            </div>
            <div className={styles.bannerImage}>
              <img src="/images/adolescente-en-top-negro-y-camisa-de-franela-para-sesion-de-moda-de-ropa-juvenil-grunge-removebg-preview.png" alt="Modelo con ropa grunge" />
            </div>
          </div>
        </section>

        <section className={styles.sectionDestacados}>
          <h2>Destacados</h2>
          <div className={styles.containerDestacados}>
            {productosDestacados.length > 0 ? (
              productosDestacados.map(producto => (
                <ProductCard 
                  key={producto.id}
                  id={producto.id}
                  imageUrl={producto.imagen_url}
                  imageAlt={producto.imagen_alt}
                  name={producto.nombre}
                  category={producto.categoria_nombre}
                  price={`${producto.precio}€`}
                  oldPrice={producto.en_oferta ? `${producto.precio_original}€` : null}
                  onSale={producto.en_oferta}
                  stock={producto.stock}
                />
              ))
            ) : (
              <p>No hay productos destacados disponibles</p>
            )}
          </div>
        </section>

        <section className={styles.sectionCategorias}>
          <div className={styles.containerCategorias}>
            {categorias.length > 0 ? (
              categorias.map(categoria => (
                <div
                  key={categoria.id}
                  className={styles.cardCategorias}
                  onClick={() => handleNavigateToCategory(categoria.nombre)}
                >
                  {categoria.imagen_categoria ? (
                    <img 
                      src={categoria.imagen_categoria} 
                      alt={`Categoría: ${categoria.nombre}`} 
                      className={styles.categoriaImagen}
                    />
                  ) : (
                    <div className={styles.imagenPlaceholder}></div>
                  )}
                  <p>{categoria.nombre}</p>
                </div>
              ))
            ) : (
              <p>No hay categorías disponibles</p>
            )}
          </div>
        </section>

        <section className={styles.sectionOfertas}>
          <div>
            <div>
              <h2>Oferta</h2>
              <p>
                Hasta un 50% de descuento durante la proxima semana
              </p>
            </div>
            <button onClick={handleNavigateToProducts}>Ir a la tienda</button>
          </div>
        </section>

        <section className={styles.sectionMasVendidos}>
          <h2>Mas Vendidos</h2>
          <div className={styles.containerMasVendidos}>
            {productosMasVendidos.length > 0 ? (
              productosMasVendidos.map(producto => (
                <ProductCard 
                  key={producto.id}
                  id={producto.id}
                  imageUrl={producto.imagen_url}
                  imageAlt={producto.imagen_alt}
                  name={producto.nombre}
                  category={producto.categoria_nombre}
                  price={`${producto.precio}€`}
                  oldPrice={producto.en_oferta ? `${producto.precio_original}€` : null}
                  onSale={producto.en_oferta}
                  stock={producto.stock}
                />
              ))
            ) : (
              <p>No hay productos más vendidos disponibles</p>
            )}
          </div>
        </section>

        <section className={styles.marcas}>
          <MarcasCarrusel />
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Home;