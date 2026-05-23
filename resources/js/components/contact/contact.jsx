import React from 'react';
import { useState } from 'react';
import { useEffect } from 'react';
import Header from '../header/Header';
import Footer from '../footer/Footer';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import styles from './contact.module.css';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Importar los iconos de Leaflet para que se muestren correctamente en el mapa (marcador)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const ContactPage = () => {
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        asunto: '',
        mensaje: ''
    });

    const [submitStatus, setSubmitStatus] = useState({
        success: false,
        message: '',
        isSubmitting: false
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setSubmitStatus({
            success: false,
            message: 'Enviando mensaje...',
            isSubmitting: true
        });

        try {
            // Modificado para usar la nueva ruta de API para el formulario de contacto
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                setSubmitStatus({
                    success: true,
                    message: data.message || '¡Mensaje enviado correctamente! Nos pondremos en contacto pronto.',
                    isSubmitting: false
                });

                // Limpiar el formulario después de enviar con éxito
                setFormData({
                    nombre: '',
                    email: '',
                    asunto: '',
                    mensaje: ''
                });
            } else {
                throw new Error(data.message || 'Error al enviar el mensaje');
            }
        } catch (error) {
            console.error('Error al enviar el formulario:', error);
            setSubmitStatus({
                success: false,
                message: error.message || 'Error al enviar el mensaje. Por favor, inténtalo de nuevo más tarde.',
                isSubmitting: false
            });
        }
    };

    // Coordenadas para Calle Toledo 110, Madrid
    const position = [40.4086, -3.7081]; 

    return (
        <>
            <Header />
            <main>
                <section className={styles.mapSection}>
                    <MapContainer 
                        center={position} 
                        zoom={16} 
                        scrollWheelZoom={false}
                        className={styles.mapContainer}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={position}>
                            <Popup>
                                Calle Toledo 110 – 28005 Madrid
                            </Popup>
                        </Marker>
                    </MapContainer>
                </section>

                <section className={styles.contactSection}>
                    <div className={styles.contactForm}>
                        <h1 className={styles.contactHeading}>Contáctanos</h1>
                        <p className={styles.subtitle}>Escríbenos un mensaje</p>

                        {submitStatus.message && (
                            <div className={`${styles.statusMessage} ${submitStatus.success ? styles.success : styles.error}`}>
                                {submitStatus.message}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <input 
                                type="text" 
                                id="nombre" 
                                name="nombre" 
                                placeholder="Nombre *" 
                                required 
                                value={formData.nombre}
                                onChange={handleInputChange}
                            />
                            <input 
                                type="email" 
                                id="email" 
                                name="email" 
                                placeholder="Correo electrónico *" 
                                required 
                                value={formData.email}
                                onChange={handleInputChange}
                            />
                            <input 
                                type="text" 
                                id="asunto" 
                                name="asunto" 
                                placeholder="Asunto *" 
                                required 
                                value={formData.asunto}
                                onChange={handleInputChange}
                            />
                            <textarea 
                                id="mensaje" 
                                name="mensaje" 
                                placeholder="Mensaje *" 
                                required
                                value={formData.mensaje}
                                onChange={handleInputChange}
                            ></textarea>
                            <input 
                                type="submit" 
                                value={submitStatus.isSubmitting ? "Enviando..." : "Enviar mensaje"} 
                                disabled={submitStatus.isSubmitting} 
                            />
                        </form>
                    </div>

                    <div className={styles.addressInfo}>
                        <h1 className={styles.contactHeading}>Nuestra dirección</h1>
                        <p className={styles.subtitle}>Dónde nos puedes encontrar</p>

                        <div className={styles.address}>
                            Calle Toledo 110<br />
                            28005 Madrid<br />
                            España
                        </div>

                        <div className={styles.contactDetails}>
                            Tel: +34 915 88 42 00<br />
                            Email: Elance@gmail.com
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
};

export default ContactPage;