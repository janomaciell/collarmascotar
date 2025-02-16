import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Protege a tu mascota con nuestro Collar QR</h1>
        <p>La manera más segura y moderna de asegurar que tu perro regrese a casa si se pierde</p>
        <Link to="/register" className="cta-button">¡Comienza Ahora!</Link>
      </div>
      
      <div className="features-section">
        <h2>¿Por qué elegir nuestro collar QR?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Fácil de Usar</h3>
            <p>Simplemente registra los datos de tu mascota y genera un código QR único</p>
          </div>
          <div className="feature-card">
            <h3>Acceso Instantáneo</h3>
            <p>Cualquiera con un smartphone puede escanear el código y ver cómo contactarte</p>
          </div>
          <div className="feature-card">
            <h3>Seguro y Privado</h3>
            <p>Tú decides qué información compartir. Los datos sensibles están protegidos</p>
          </div>
        </div>
      </div>
      
      <div className="how-it-works">
        <h2>¿Cómo Funciona?</h2>
        <ol className="steps-list">
          <li>Regístrate en nuestra plataforma</li>
          <li>Ingresa los datos de tu mascota</li>
          <li>Genera el código QR único</li>
          <li>Colócalo en el collar de tu mascota</li>
          <li>¡Listo! Tu mascota está protegida</li>
        </ol>
      </div>
    </div>
  );
};

export default Home; 