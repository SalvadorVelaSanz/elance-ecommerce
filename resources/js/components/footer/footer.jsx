import React from 'react';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div>
        <div>
          <h3>Élance</h3>
          <p>Calle Toledo 110, 28005 Madrid, España</p>
          <p>+34 915 88 42 00</p>
          <p>Elance@gmail.com</p>
        </div>

        <div>
          <h3>Atención al Cliente</h3>
          <a href="/contact">Contactanos</a>
        </div>
        
        <div>
          <h3>Información</h3>
          <a href="#">Política de Privacidad</a>        
          <a href="/aboutUs">Sobre Nosotros</a>

        </div>

        <div>
          <h3>Redes Sociales</h3>
          <a href="#"><span>Facebook</span></a>
          <a href="#"><span>Instagram</span></a>
          <a href="#"><span>Twitter</span></a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;