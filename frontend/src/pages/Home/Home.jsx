import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

// Imágenes de ejemplo
const heroIllustration = 'https://images.unsplash.com/photo-1583511655826-05700d52f4d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80'; // Perro con collar
const promiseImage = 'https://images.unsplash.com/photo-1598133894008-61f7fdb8cc3a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'; // Perro feliz

const Home = () => {
  return (
    <div className="home-container">
      {/* Sección Héroe */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Tu perro, nuestra prioridad</h1>
          <p>CollarMascotaQR: Protección inteligente para tu mejor amigo</p>
          <div className="hero-buttons">
            <Link to="/about" className="secondary-button">Saber más</Link>
            <Link to="/register" className="cta-button">¡Regístrate ahora!</Link>
          </div>
        </div>
        <div className="hero-image">
          <img src={heroIllustration} alt="Perro con Collar QR" />
        </div>
      </section>

      {/* Sección Promesa */}
      <section className="promise-section">
        <div className="promise-image">
          <img src={promiseImage} alt="Perro feliz con dueño" />
        </div>
        <div className="promise-content">
          <h2>Mascotas seguras, dueños felices</h2>
          <p>Con CollarMascotaQR, tu perro lleva un QR que guarda toda su información: datos, ubicación, historial veterinario y más. Un escaneo y estará de vuelta contigo.</p>
        </div>
      </section>

      {/* Sección Servicios (Adaptada a Ventajas del QR) */}
      <section className="services-section">
        <h2>Lo mejor para tu perro</h2>
        <div className="services-grid">
          <div className="service-item">
            <span className="service-icon">📍</span>
            <p>Ubicación en tiempo real</p>
          </div>
          <div className="service-item">
            <span className="service-icon">📋</span>
            <p>Datos completos del perro</p>
          </div>
          <div className="service-item">
            <span className="service-icon">🏥</span>
            <p>Historial veterinario</p>
          </div>
          <div className="service-item">
            <span className="service-icon">🔒</span>
            <p>Seguridad garantizada</p>
          </div>
          <div className="service-item">
            <span className="service-icon">📞</span>
            <p>Contacto instantáneo</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;