import React from 'react';
import { Link } from 'react-router-dom';
import './About.css';
import { FaHeart, FaBullseye, FaStar, FaLightbulb, FaShieldAlt, FaShoppingCart, FaGlobe, FaHandshake, FaBolt, FaUsers } from 'react-icons/fa';

const About = () => {
  const mascotaImage = 'src/img/personaje2.png';

  return (
    <div className="about-wrapper">
      {/* Hero */}
      <section className="about-hero">
        <div className="pattern-bg"></div>
        <div className="hero-content">
          <img src={mascotaImage} alt="Mascota EncuentraME" className="hero-mascota" />
          <h1 className="hero-title">NUESTRA HISTORIA</h1>
          <p className="hero-subtitle">Porque cada minuto cuenta cuando tu mejor amigo se pierde</p>
        </div>
      </section>

      <div className="about-container">
        {/* Historia Personal */}
        <section className="story-section">
          <div className="section-card">
            <div className="card-header">
              <h2>Mi Historia</h2>
              <span className="card-icon"><FaHeart /></span>
            </div>
            
            <div className="card-content">
              <div className="founder-intro">
                <h3>Jano Maciel</h3>
                <p className="founder-title">Fundador de EncuéntraME</p>
              </div>
              
              <p>
                Soy programador, emprendedor y, sobre todo, amante de los animales. 
                La idea de EncuéntraME nació de una experiencia personal que me marcó profundamente: 
                <strong> la angustia de perder a mi mascota</strong>.
              </p>
              
              <p>
                Sentir la incertidumbre y la desesperación de no saber dónde estaba mi compañero de cuatro patas 
                fue un momento que cambió mi perspectiva. Esa vivencia me llevó a buscar una solución real y accesible 
                para que ninguna familia tenga que atravesar lo mismo.
              </p>
              
              <div className="highlight-box">
                <p>
                  <strong>Así nació EncuéntraME:</strong> un collar con código QR que conecta a tu mascota contigo 
                  en segundos y activa una red de ayuda comunitaria.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Misión */}
        <section className="mission-section">
          <div className="section-card mission-card">
            <div className="card-header">
              <h2>Nuestra Misión</h2>
              <span className="card-icon"><FaBullseye /></span>
            </div>
            
            <div className="card-content">
              <div className="mission-statement">
                <h3>Hacer que cada mascota siempre encuentre el camino a casa</h3>
              </div>
              
              <p>
                Queremos que la tecnología sea una aliada en la protección de quienes más amamos. 
                EncuéntraME busca reducir la cantidad de mascotas perdidas, generar reencuentros rápidos 
                y transmitir tranquilidad a las familias.
              </p>
              
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-number">∞</span>
                  <span className="stat-label">mascotas por proteger</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">100%</span>
                  <span className="stat-label">compromiso con tu tranquilidad</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">24/7</span>
                  <span className="stat-label">innovación en marcha</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Visión */}
        <section className="vision-section">
          <div className="section-card vision-card">
            <div className="card-header">
              <h2>Nuestra Visión</h2>
              <span className="card-icon"><FaStar /></span>
            </div>
            
            <div className="card-content">
              <p>
                Soñamos con un mundo donde <strong>ninguna mascota se pierda para siempre</strong>. 
                Aspiramos a construir una comunidad global de personas que creen en la unión entre 
                innovación, empatía y amor por los animales.
              </p>
              
              <div className="vision-goals">
                <div className="goal-item">
                  <span className="goal-icon"><FaGlobe /></span>
                  <span>Comunidad global</span>
                </div>
                <div className="goal-item">
                  <span className="goal-icon"><FaLightbulb /></span>
                  <span>Innovación constante</span>
                </div>
                <div className="goal-item">
                  <span className="goal-icon"><FaHandshake /></span>
                  <span>Apoyo mutuo</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Beneficios */}
        <section className="benefits-section">
          <div className="benefits-header">
            <h2>¿Por qué elegir EncuéntraME?</h2>
            <p>La solución más completa para proteger a tu mascota</p>
          </div>
          
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon"><FaBolt /></div>
              <h3>Reencuentros instantáneos</h3>
              <p>
                Un simple escaneo del QR conecta al instante a quien encuentra 
                a tu mascota contigo. Sin apps, sin complicaciones.
              </p>
            </div>
            
            <div className="benefit-card">
              <div className="benefit-icon"><FaUsers /></div>
              <h3>Comunidad activa</h3>
              <p>
                Cuando tu mascota se marca como perdida, se notifica automáticamente 
                a usuarios en tu zona para maximizar las chances de reencuentro.
              </p>
            </div>
            
            <div className="benefit-card">
              <div className="benefit-icon"><FaShieldAlt /></div>
              <h3>Tranquilidad total</h3>
              <p>
                Tu mascota lleva su identidad digital, historial de salud y datos 
                de contacto siempre disponibles. Control total donde sea que estés.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* CTA Final */}
      <section className="about-cta">
        <div className="cta-content">
          <img src={mascotaImage} alt="Mascota EncuentraME" className="cta-mascota" />
          <h2>No esperes a vivir lo que yo viví</h2>
          <p>
            La angustia de perder a tu mascota es algo que nadie debería pasar. 
            Por el valor de una salida a cenar, podés darle a tu familia la seguridad 
            de que tu mejor amigo siempre encontrará el camino de regreso.
          </p>
          <Link to="/compra" className="cta-button">
            <span className="btn-icon"><FaShoppingCart /></span>
            Proteger a mi mascota
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;