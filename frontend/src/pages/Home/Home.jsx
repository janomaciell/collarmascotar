import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

// Imágenes de tu marca
import perroygato from '../../img/perroygato.png';
import perrocorriendo from '../../img/perrocorriendo.png';

//const mascotaImage = perroygato;
const mascotaImage = 'src/img/personaje2.png';
const Home = () => {
  return (
    <div className="home-wrapper">
      
      {/* Hero Principal - Minimalista y Moderno */}
      <section className="hero-main">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title-home">
              ENCUÉNTRAME
            </h1>
            <p className="hero-subtitle-home">
              Mascotas seguras, familias tranquilas
            </p>
            <div className="hero-description">
              <p>Collares con código QR que conectan a tu mascota contigo al instante. Tecnología simple, resultados extraordinarios.</p>
            </div>
            <div className="hero-cta">
              <Link to="/compra" className="btn-primary btn-green">
                Compra tu collar ahora
              </Link>
              <Link to="/como-funciona" className="btn-secondary btn-blue">
                Cómo funciona
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <img 
              src={mascotaImage} 
              alt="Mascota EncuentraME - branding perroygato" 
              className="mascota-image flipped white-bg" 
            />
          </div>
        </div>
        <div className="decorative-circles">
          <div className="circle circle-1"></div>
          <div className="circle circle-2"></div>
          <div className="circle circle-3"></div>
        </div>
      </section>

      {/* Cómo Funciona - Simplificado */}
      <section className="how-works-section" id="como-funciona">
        <div className="pattern-bg-home"></div>
        <div className="how-works-container">
          <h2 className="section-title">¿Cómo funciona?</h2>
          <div className="steps-grid-horizontal">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-icon">📱</div>
              <h3>Escanea</h3>
              <p>Cualquier persona escanea el código QR del collar</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-icon">📋</div>
              <h3>Accede</h3>
              <p>Ve inmediatamente la información de contacto</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-icon">🏠</div>
              <h3>Reencuentra</h3>
              <p>Tu mascota regresa segura a casa</p>
            </div>
          </div>
        </div>
      </section>

      {/* Productos */}
      <section className="products-section">
        <div className="products-container">
          <h2 className="section-title-dark">Nuestros productos</h2>
          <div className="products-grid">
            <div className="product-card">
              <div className="product-image">
                <div className="placeholder-product black-collar">
                  <div className="collar-icon">🐕</div>
                </div>
              </div>
              <h3>Collar Básico</h3>
              <p>Collar resistente con QR permanente</p>
              <Link to="/compra" className="btn-product">Ver producto</Link>
            </div>
            
            <div className="product-card featured">
              <div className="featured-badge">Más popular</div>
              <div className="product-image">
                <div className="placeholder-product green-collar">
                  <div className="collar-icon">💚</div>
                </div>
              </div>
              <h3>Collar Completo</h3>
              <p>Incluye placa de identificación y QR</p>
              <Link to="/compra" className="btn-product btn-featured">Ver producto</Link>
            </div>
            
            <div className="product-card">
              <div className="product-image">
                <div className="placeholder-product pink-collar">
                  <div className="collar-icon">❤️</div>
                </div>
              </div>
              <h3>Collar Completo</h3>
              <p>Incluye placa de identificación y QR</p>
              <Link to="/compra" className="btn-product">Ver producto</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios que amarás */}
      <section className="benefits-section">
        <div className="benefits-container">
          <h2 className="section-title">BENEFICIOS QUE AMARÁS</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">📍</div>
              <h3>Ubicación</h3>
              <p>Ubicación actualizada si se pierde</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">📋</div>
              <h3>Salud</h3>
              <p>Libreta sanitaria digital</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🏥</div>
              <h3>Placa QR</h3>
              <p>Datos del veterinario siempre a mano</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🔒</div>
              <h3>Privacidad</h3>
              <p>Privacidad y seguridad garantizadas</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">📞</div>
              <h3>Contacto</h3>
              <p>Comunicación directa con el dueño</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🐾</div>
              <h3>Fácil de usar</h3>
              <p>Fácil de usar y duradero</p>
            </div>
          </div>
        </div>
        <div className="decorative-circles benefits-circles">
          <div className="circle circle-pink"></div>
          <div className="circle circle-green"></div>
        </div>
      </section>

      {/* CTA Final con Testimonios */}
      <section className="final-cta">
        <div className="final-cta-container">
          <div className="final-left">
            <img src={perrocorriendo} alt="Mascota corriendo - branding" className="cta-mascota-sleep white-bg" />
            <div className="sleep-zzz">
              <span>z</span>
              <span>z</span>
              <span>z</span>
            </div>
          </div>
          
          <div className="final-center">
            <h3 className="final-subtitle">Únete a nuestra comunidad</h3>
            <p className="final-text">Estamos construyendo una red de seguridad para todas las mascotas</p>
            <Link to="/compra" className="btn-cta-final">
              Comenzar ahora
            </Link>
          </div>
          
          <div className="final-right">
            <div className="testimonial-bubble">
              <div className="testimonial-header">
                <div className="testimonial-avatar woman">
                  <span>👩</span>
                </div>
                <div className="testimonial-content">
                  <p>"Funciona perfectamente. En 15 minutos recuperamos a Max."</p>
                  <div className="testimonial-author">- María, Belgrano</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;