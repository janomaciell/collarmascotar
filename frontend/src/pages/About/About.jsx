import React from 'react';
import { Link } from 'react-router-dom';
import './About.css';
import { FaPaw, FaBell, FaHeart } from 'react-icons/fa';

const About = () => {
  return (
    <div className="about-container">
      {/* Sección Hero con fondo de huellas */}
      <section className="about-hero">
        <div className="hero-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
        </div>
        <h1>CollarMascotaQR</h1>
        <p>Porque cada minuto cuenta cuando tu mejor amigo se pierde</p>
      </section>

      {/* Sección Historia Personal - Más emotiva */}
      <section className="story-section">
        <h2>Mi Historia</h2>
        <div className="story-card">
          <p>
            Soy <strong>Jano Maciel</strong>, programador y fundador de CollarMascotaQR. Como amante de los animales, sufrí en carne propia la angustia de perder a una mascota. 
            La incertidumbre, la desesperación y la impotencia fueron emociones que nunca quiero que nadie más experimente.
          </p>
          <p>
          Fue entonces cuando decidí crear 
          una solución real, accesible y efectiva: un collar con un código QR que pueda reunir de lo antes posible a una mascota perdida con su familia.
          </p>
        </div>
      </section>

      {/* Sección Misión - Más impactante */}
      <section className="mission-section">
        <div className="mission-shape"></div>
        <div className="mission-content">
          <h2>Una misión que nace del corazón</h2>
          <p>
            <strong>CollarMascotaQR nace de una necesidad real: </strong>reducir la cantidad de mascotas perdidas y ayudar a sus dueños a reencontrarse con ellas en tiempo récord. 
            La tecnología nos permite estar conectados, y ahora también puede ser el puente que traiga de vuelta a nuestros compañeros peludos.
          </p>
        </div>
      </section>

      {/* Sección Beneficios - Con iconos y más visual */}
      <section className="benefits-section">
        <h2>¿Por qué las familias eligen CollarMascotaQR?</h2>
        <div className="benefits-grid">
          <div className="benefit-item">
            <div className="benefit-icon"><FaPaw /></div>
            <h3>Reencuentros rápidos y simples</h3>
            <p>Un escaneo del QR conecta directamente a quien encuentra a tu mascota contigo, sin complicaciones.</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon"><FaBell /></div>
            <h3>Apoyo de una comunidad cercana</h3>
            <p>Al escanear el collar, se notifica a personas dispuestas a ayudar en tu área, aumentando las chances de traer a tu mascota de vuelta.</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon"><FaHeart /></div>
            <h3>Tranquilidad en cada aventura</h3>
            <p>Siente la seguridad de saber que tu mejor amigo lleva consigo una solución para volver a casa, estés donde estés.</p>
          </div>
        </div>
      </section>

      {/* Sección CTA - Más urgente y emocional */}
      <section className="about-cta">
        <h2>No esperes a vivir lo que yo viví</h2>
        <p>
          El miedo, la angustia y la desesperación de perder a tu mascota son emociones que no le deseo a nadie. Por solo el precio de una cena, puedes darle a tu familia la tranquilidad de saber que tu mascota siempre encontrará el camino a casa.
        </p>
        <Link to="/register" className="cta-button">Protege a tu mascota ahora</Link>
      </section>
    </div>
  );
};

export default About;