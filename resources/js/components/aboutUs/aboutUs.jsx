// AboutUs.jsx
import React from 'react';
import styles from './aboutUs.module.css';
import Header from '../header/Header';
import Footer from '../footer/Footer';

const AboutUs = () => {
  return (
    <>
      <Header />
      <main>
        <div className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>CONÓCENOS</h1>
          </div>
        </div>

        <section className={styles.section}>
          <div className={styles.contentWrapper}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionSubtitle}>NUESTRA HISTORIA</div>
              <h2 className={styles.sectionTitle}>COMPROMETIDOS CON LA MODA URBANA CONTEMPORÁNEA</h2>
            </div>

            <div className={styles.sectionContent}>
              <p>
                Desde su fundación en 2020, nuestra marca ha tenido un objetivo claro: ofrecer una propuesta de moda urbana que combine autenticidad, calidad e innovación. Inspirados en el dinamismo y la diversidad de las grandes ciudades, creamos prendas que reflejan el estilo de vida moderno y libre de quienes buscan destacar con personalidad y criterio propio.
              </p>
              <p>
                Nuestro compromiso es diseñar piezas que no solo respondan a tendencias, sino que propongan una visión única del streetwear. Cada colección es fruto de una búsqueda constante por equilibrar funcionalidad, diseño y expresión individual.
              </p>
            </div>

            <div className={styles.values}>
              <div className={styles.valueItem}>
                <div className={styles.valueTitle}>AUTENTICIDAD</div>
                <div className={styles.valueDescription}>
                  Creamos moda que permite a cada persona reflejar quién es, sin concesiones ni artificios.
                </div>
              </div>

              <div className={styles.valueItem}>
                <div className={styles.valueTitle}>CALIDAD</div>
                <div className={styles.valueDescription}>
                  Seleccionamos materiales resistentes y trabajamos con procesos de confección exigentes para garantizar durabilidad y confort.
                </div>
              </div>

              <div className={styles.valueItem}>
                <div className={styles.valueTitle}>INNOVACIÓN</div>
                <div className={styles.valueDescription}>
                  Exploramos continuamente nuevas formas de interpretar la estética urbana, incorporando elementos contemporáneos en cada diseño.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.contentWrapper}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionSubtitle}>NUESTRO EQUIPO</div>
              <h2 className={styles.sectionTitle}>LAS MENTES CREATIVAS</h2>
            </div>

            <div className={styles.team}>
              <div className={styles.teamMember}>
                <div className={styles.teamPhoto}>
                  <img
                    src="/images/images22.jpg"
                    alt="Director Creativo"
                    onError={(e) => {
                      e.target.src =
                        "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'%3E%3Crect width='100%' height='100%' fill='%23f2f2f2'/%3E%3C/svg%3E";
                    }}
                  />
                </div>
                <div className={styles.teamName}>ALEX REYNOLDS</div>
                <div className={styles.teamPosition}>DIRECTOR CREATIVO</div>
              </div>

              <div className={styles.teamMember}>
                <div className={styles.teamPhoto}>
                  <img
                    src="/images/descarga 44.jpg"
                    alt="Diseñadora Principal"
                    onError={(e) => {
                      e.target.src =
                        "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'%3E%3Crect width='100%' height='100%' fill='%23f2f2f2'/%3E%3C/svg%3E";
                    }}
                  />
                </div>
                <div className={styles.teamName}>SOFIA CHEN</div>
                <div className={styles.teamPosition}>DISEÑADORA PRINCIPAL</div>
              </div>

              <div className={styles.teamMember}>
                <div className={styles.teamPhoto}>
                  <img
                    src="/images/descarga 22.jpg"
                    alt="Director de Marca"
                    onError={(e) => {
                      e.target.src =
                        "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'%3E%3Crect width='100%' height='100%' fill='%23f2f2f2'/%3E%3C/svg%3E";
                    }}
                  />
                </div>
                <div className={styles.teamName}>MARCUS WILLIAMS</div>
                <div className={styles.teamPosition}>DIRECTOR DE MARCA</div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default AboutUs;
