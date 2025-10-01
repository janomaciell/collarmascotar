import React from 'react';
import { Link } from 'react-router-dom';
import './HowItWorks.css';

const HowItWorks = () => {
  return (
    <div className="howitworks-page">
      <section className="hiw-hero">
        <div className="hiw-container">
          <div className="hiw-hero-content">
            <h1 className="hiw-title">¿Cómo funciona?</h1>
            <p className="hiw-subtitle">Tecnología simple, resultados extraordinarios</p>
            <p className="hiw-description">Nuestros collares con código QR conectan a quien encuentre a tu mascota directamente contigo. Sin apps, sin registros complicados.</p>
            <div className="hiw-cta">
              <Link to="/compra" className="btn-primary btn-green">Comprar ahora</Link>
              <Link to="/register" className="btn-secondary btn-blue">Crear cuenta</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="hiw-steps">
        <div className="hiw-container">
          <h2 className="section-title">Pasos sencillos</h2>
          <div className="hiw-steps-grid">
            <div className="hiw-step">
              <div className="hiw-step-number">1</div>
              <div className="hiw-step-icon">📱</div>
              <h3>Escanea</h3>
              <p>Quien encuentre a tu mascota escanea el código QR del collar.</p>
            </div>
            <div className="hiw-step">
              <div className="hiw-step-number">2</div>
              <div className="hiw-step-icon">👀</div>
              <h3>Ve tus datos</h3>
              <p>Accede de inmediato a tu teléfono y datos de contacto.</p>
            </div>
            <div className="hiw-step">
              <div className="hiw-step-number">3</div>
              <div className="hiw-step-icon">🏠</div>
              <h3>Reencuentro</h3>
              <p>Se contactan contigo y tu mascota vuelve a casa segura.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="hiw-features">
        <div className="hiw-container">
          <h2 className="section-title-dark">Qué incluye</h2>
          <div className="hiw-features-grid">
            <div className="hiw-feature-card">
              <div className="hiw-feature-icon">🔒</div>
              <h3>Privacidad</h3>
              <p>Tus datos visibles solo cuando alguien escanea tu QR.</p>
            </div>
            <div className="hiw-feature-card">
              <div className="hiw-feature-icon">📍</div>
              <h3>Ubicación</h3>
              <p>Guarda el punto del escaneo para facilitar el reencuentro.</p>
            </div>
            <div className="hiw-feature-card">
              <div className="hiw-feature-icon">📋</div>
              <h3>Salud</h3>
              <p>Libreta sanitaria digital y datos del veterinario.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="hiw-final-cta">
        <div className="hiw-container hiw-final-cta-inner">
          <div className="hiw-final-text">
            <h2 className="final-subtitle">Protegé a tu mascota hoy</h2>
            <p className="final-text">Miles de familias ya confían en EncuéntraME.</p>
          </div>
          <div className="hiw-final-actions">
            <Link to="/compra" className="btn-cta-final">Comprar collar</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HowItWorks;


