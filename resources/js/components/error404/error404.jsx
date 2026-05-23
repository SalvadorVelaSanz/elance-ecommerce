import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Error404.module.css';
import Header from '../header/Header';
import Footer from '../footer/Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faShoppingBag } from '@fortawesome/free-solid-svg-icons';

const Error404 = () => {
  return (
    <>
      <Header />

      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.errorCode}>404</h1>
          <div className={styles.divider}></div>
          <h2 className={styles.errorMessage}>PÁGINA NO ENCONTRADA</h2>
          <p className={styles.errorDescription}>
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
          </p>

          <div className={styles.illustration}>
            <div className={styles.errorShape}></div>
            <div className={styles.shadowShape}></div>
          </div>

          <div className={styles.actions}>
            <Link to="/" className={styles.primaryButton}>
              <FontAwesomeIcon icon={faHome} className={styles.buttonIcon} />
              INICIO
            </Link>
            <Link to="/productos" className={styles.secondaryButton}>
              <FontAwesomeIcon icon={faShoppingBag} className={styles.buttonIcon} />
              PRODUCTOS
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Error404;
