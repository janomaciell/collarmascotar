import React from 'react';
import { Link } from 'react-router-dom';
import './About.css';

const About = () => {
  return (
    <div className="about-container">
      {/* Sección Hero */}
      <section className="about-hero">
        <h1>CollarMascotaQR</h1>
        <p>Tu aliado en el cuidado y la seguridad de tus mascotas</p>
      </section>

      {/* Sección Misión */}
      <section className="mission-section">
        <div className="mission-content">
          <h2>Nuestra Misión</h2>
          <p>
            En CollarMascotaQR, nuestra misión es simple pero poderosa: proteger a cada mascota como si fuera parte de nuestra propia familia. Somos un emprendimiento nuevo, apasionado por los animales, y estamos aquí para ofrecer una solución innovadora que combine tecnología y amor por las mascotas. Queremos que cada collar QR sea una promesa de seguridad y tranquilidad para ti y tu compañero peludo.
          </p>
        </div>
        <div className="mission-stats">
          <div className="stat-item">
            <span className="stat-number">100%</span>
            <p>Compromiso con los animales</p>
          </div>
          <div className="stat-item">
            <span className="stat-number">24/7</span>
            <p>Conexión con tu mascota</p>
          </div>
          <div className="stat-item">
            <span className="stat-number">∞</span>
            <p>Amor por lo que hacemos</p>
          </div>
        </div>
      </section>

      {/* Sección Cultura */}
      <section className="culture-section">
        <h2>Nuestra Cultura</h2>
        <p>
          Somos más que una empresa; somos una comunidad de amantes de los animales. Nuestra cultura se basa en el respeto, el cuidado y la dedicación hacia cada mascota. Creemos que los animales merecen lo mejor, y por eso cada decisión que tomamos está guiada por su bienestar. Desde el diseño de nuestros collares hasta el soporte que ofrecemos, todo lo hacemos con el corazón puesto en ayudar a que las mascotas perdidas regresen a casa.
        </p>
      </section>

      {/* Sección Beneficios */}
      <section className="benefits-section">
        <h2>Beneficios de CollarMascotaQR</h2>
        <div className="benefits-grid">
          <div className="benefit-item">
            <h3>Localización Instantánea</h3>
            <p>Un escaneo del QR y sabrás dónde está tu mascota en tiempo real.</p>
          </div>
          <div className="benefit-item">
            <h3>Comunidad Solidaria</h3>
            <p>Notificaciones a vecinos cercanos para encontrar a tu mascota más rápido.</p>
          </div>
          <div className="benefit-item">
            <h3>Tranquilidad Garantizada</h3>
            <p>Información vital accesible con un solo toque, incluso sin conexión.</p>
          </div>
        </div>
      </section>

      {/* Sección Historia */}
      <section className="story-section">
        <h2>Nuestra Historia</h2>
        <p>
          CollarMascotaQR nació en 2025 como un emprendimiento fresco y lleno de ilusión. No tenemos miles de clientes aún, pero estamos trabajando duro para ganarnos la confianza de cada persona que ama a sus mascotas tanto como nosotros. Todo comenzó con una idea simple: usar la tecnología para evitar el dolor de perder a un compañero de cuatro patas. Hoy, estamos dando nuestros primeros pasos, buscando ser el apoyo que los dueños de mascotas necesitan.
        </p>
      </section>

      {/* Sección Equipo */}
      <section className="team-section">
        <h2>Nuestro Equipo</h2>
        <div className="team-grid">
          <div className="team-member">
            <div className="member-photo">🐾</div>
            <h3>Ana García</h3>
            <p>Fundadora & Amante de los Animales</p>
          </div>
          <div className="team-member">
            <div className="member-photo">🐾</div>
            <h3>Carlos Ruiz</h3>
            <p>Tecnólogo & Cuidador de Mascotas</p>
          </div>
          <div className="team-member">
            <div className="member-photo">🐾</div>
            <h3>Laura Torres</h3>
            <p>Veterinaria & Defensora Animal</p>
          </div>
        </div>
      </section>

      {/* Sección CTA */}
      <section className="about-cta">
        <h2>Confía en Nosotros</h2>
        <p>
          Somos nuevos, pero nuestro compromiso es enorme. Únete a CollarMascotaQR y juntos construyamos una comunidad donde ninguna mascota se pierda para siempre.
        </p>
        <Link to="/register" className="cta-button">Prueba CollarMascotaQR</Link>
      </section>
    </div>
  );
};

export default About;