import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

// Imágenes de ejemplo (puedes reemplazarlas con assets locales)
const heroIllustration = 'https://images.unsplash.com/photo-1583511655826-05700d52f4d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80';
const promiseImage = 'https://images.unsplash.com/photo-1598133894008-61f7fdb8cc3a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';

// Datos dinámicos para testimonios
const testimonials = [
  { text: "Mi perro se perdió y gracias al collar QR lo recuperé en horas. ¡Increíble!", author: "Ana G." },
  { text: "El historial médico en el QR salvó a mi perrito en una emergencia.", author: "Juan P." },
];

const Home = () => {
  return (
    <main className="home-container">
      {/* Sección Héroe */}
      <section className="hero-section" aria-label="Introducción a CollarMascotaQR">
        <div className="hero-content">
          <h1>Protege a tu mejor amigo</h1>
          <p>CollarMascotaQR: La solución inteligente para mantener a tu mascota segura y siempre contigo.</p>
          <div className="hero-buttons">
            <Link to="/about" className="secondary-button">Descubre más</Link>
            <Link to="/compra" className="cta-button">¡Compra ahora!</Link>
          </div>
        </div>
        <div className="hero-image">
          <img src={heroIllustration} alt="Perro con collar QR para identificación" loading="lazy" />
        </div>
      </section>

      {/* Sección Promesa */}
      <section className="promise-section" aria-label="Promesa de valor">
        <div className="promise-image">
          <img src={promiseImage} alt="Perro feliz con su dueño" loading="lazy" />
        </div>
        <div className="promise-content">
          <h2>Tranquilidad en un escaneo</h2>
          <p>Con nuestro collar QR, cualquier persona puede escanearlo y acceder a la información vital de tu mascota: dirección, historial médico, datos del veterinario y más. ¡Tu perro volverá a casa más rápido que nunca!</p>
        </div>
      </section>

      {/* Sección Cómo Funciona */}
      <section className="how-it-works-section" aria-label="Cómo funciona">
        <h2>¿Cómo funciona CollarMascotaQR?</h2>
        <div className="how-it-works-grid">
          <article className="how-it-works-item">
            <span className="step-number">1</span>
            <p>Registra a tu mascota y personaliza su perfil con todos sus datos.</p>
          </article>
          <article className="how-it-works-item">
            <span className="step-number">2</span>
            <p>Coloca el collar con el QR único en tu perro.</p>
          </article>
          <article className="how-it-works-item">
            <span className="step-number">3</span>
            <p>Si se pierde, alguien lo escanea y te contacta al instante.</p>
          </article>
        </div>
      </section>

      {/* Sección Servicios (Ventajas del QR) */}
      <section className="services-section" aria-label="Beneficios">
        <h2>Beneficios que amarás</h2>
        <div className="services-grid">
          <article className="service-item">
            <span className="service-icon">📍</span>
            <p>Ubicación actualizada si se pierde</p>
          </article>
          <article className="service-item">
            <span className="service-icon">📋</span>
            <p>Libreta sanitaria digital</p>
          </article>
          <article className="service-item">
            <span className="service-icon">🏥</span>
            <p>Datos del veterinario siempre a mano</p>
          </article>
          <article className="service-item">
            <span className="service-icon">🔒</span>
            <p>Privacidad y seguridad garantizadas</p>
          </article>
          <article className="service-item">
            <span className="service-icon">📞</span>
            <p>Contacto directo con el dueño</p>
          </article>
          <article className="service-item">
            <span className="service-icon">🐾</span>
            <p>Fácil de usar y duradero</p>
          </article>
        </div>
      </section>

      {/* Sección Testimonios */}
      <section className="testimonials-section" aria-label="Testimonios de clientes">
        <h2>Lo que dicen nuestros clientes</h2>
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <article key={index} className="testimonial-item">
              <p>"{testimonial.text}"</p>
              <span>- {testimonial.author}</span>
            </article>
          ))}
        </div>
      </section>

      {/* Call to Action Final */}
      <section className="cta-final-section" aria-label="Llamado a la acción final">
        <h2>¡No esperes más!</h2>
        <p>Protege a tu mascota hoy con CollarMascotaQR y vive con la tranquilidad que mereces.</p>
        <Link to="/compra" className="cta-button">Pide el tuyo ahora</Link>
      </section>

      {/* Botón Flotante */}
      <Link to="/compra" className="floating-cta">¡Pide el tuyo!</Link>
    </main>
  );
};

export default Home;