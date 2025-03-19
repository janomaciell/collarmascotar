import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import heroImage from '../../img/pet-collar-QR.jpg'; // Asegúrate de agregar una imagen de fondo atractiva

const Home = () => {
  return (
    <div className="home-container">
      {/* Sección Héroe */}
      <section className="hero-section">
        <div className="hero-overlay">
          <h1>Encuentra a tu mascota con nuestro Collar QR</h1>
          <p>Protección moderna y segura para que tu mejor amigo siempre regrese a casa.</p>
          <br />
      <div>

        <Link to="/register" className="cta-button">¡Regístrate Ya!</Link>

      </div>
        </div>
        
      </section>


      {/* Sección de Características */}
      <section className="features-section">
        <h2>¿Por qué nuestro Collar QR es único?</h2>
        <div className="features-grid">
          <div className="feature-card" data-aos="fade-up">
            <svg className="feature-icon" viewBox="0 0 24 24" fill="#8b5a2b">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.22-1.79L9 14v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V6h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
            <h3>Fácil de Usar</h3>
            <p>Registra a tu mascota y obtén un QR único en minutos.</p>
          </div>
          <div className="feature-card" data-aos="fade-up" data-aos-delay="200">
            <svg className="feature-icon" viewBox="0 0 24 24" fill="#8b5a2b">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            <h3>Acceso Rápido</h3>
            <p>Escanea el QR y contacta al dueño al instante.</p>
          </div>
          <div className="feature-card" data-aos="fade-up" data-aos-delay="400">
            <svg className="feature-icon" viewBox="0 0 24 24" fill="#8b5a2b">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93V18c-2.21 0-4-1.79-4-4s1.79-4 4-4h2c2.21 0 4 1.79 4 4s-1.79 4-4 4v1.93c3.06-.49 5.47-2.9 5.96-5.93H5.04c.49 3.03 2.9 5.44 5.96 5.93z" />
            </svg>
            <h3>Seguridad Garantizada</h3>
            <p>Tus datos están protegidos, tú controlas qué compartir.</p>
          </div>
        </div>
      </section>

      {/* Sección Cómo Funciona */}
      <section className="how-it-works">
        <h2>¿Cómo proteger a tu mascota?</h2>
        <div className="steps-container">
          <div className="step" data-aos="fade-right">
            <span className="step-number">1</span>
            <p>Regístrate en pocos pasos</p>
          </div>
          <div className="step" data-aos="fade-right" data-aos-delay="200">
            <span className="step-number">2</span>
            <p>Ingresa los datos de tu mascota</p>
          </div>
          <div className="step" data-aos="fade-right" data-aos-delay="400">
            <span className="step-number">3</span>
            <p>Obtén un QR personalizado</p>
          </div>
          <div className="step" data-aos="fade-right" data-aos-delay="600">
            <span className="step-number">4</span>
            <p>Colócalo en su collar</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;