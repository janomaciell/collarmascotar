import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../services/api';
import axios from 'axios';
import './Support.css';

const Support = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mascotaImage = 'src/img/personaje2.png';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitted(false);
    setIsSubmitting(true);

    const { name, email, message } = formData;

    try {
      const response = await axios.post(`${API_URL}/support/send-email/`, {
        name,
        email,
        message,
      });
      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar el mensaje');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNavigateHome = () => {
    navigate('/');
  };

  return (
    <div className="support-wrapper">
      {/* Hero */}
      <section className="support-hero">
        <div className="pattern-bg"></div>
        <div className="hero-content">
          <img src={mascotaImage} alt="Mascota EncuentraME" className="hero-mascota" />
          <h1 className="hero-title">SOPORTE</h1>
          <p className="hero-subtitle">Estamos aquí para ayudarte</p>
        </div>
      </section>

      {/* Content */}
      <div className="support-container">
        <div className="support-content">
          <h2>¿En qué podemos ayudarte?</h2>
          <p className="intro-text">
            Nuestro equipo está disponible para resolver tus dudas, ayudarte con problemas técnicos o recibir tus sugerencias.
          </p>

          {/* Contact Form */}
          <div className="contact-form-section">
            <div className="form-header">
              <h3>Envíanos un mensaje</h3>
              <span className="form-icon">📧</span>
            </div>
            
            <form className="support-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Nombre</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Tu nombre completo"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="tu@email.com"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="message">Mensaje</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  placeholder="Cuéntanos tu consulta o problema..."
                  rows="6"
                />
              </div>
              
              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="btn-spinner"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">📤</span>
                    Enviar mensaje
                  </>
                )}
              </button>
              
              {submitted && (
                <div className="success-message">
                  <span className="success-icon">✅</span>
                  <p>¡Mensaje enviado exitosamente! Te responderemos pronto.</p>
                </div>
              )}
              
              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  <p>{error}</p>
                </div>
              )}
            </form>
          </div>

          {/* Social Section */}
          <div className="social-section">
            <div className="social-header">
              <h3>Síguenos en redes</h3>
              <span className="social-icon">📱</span>
            </div>
            
            <div className="social-content">
              <p>Conecta con nuestra comunidad y mantente al día con novedades, consejos y historias de reencuentro.</p>
              
              <div className="social-buttons">
                <a 
                
                  href="https://www.instagram.com/encuentrameqr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn instagram"
                >
                  <span className="social-btn-icon">📸</span>
                  @encuentrameQR
                </a>
                
                <a 
                  href="https://www.facebook.com/encuentrameqr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn facebook"
                >
                  <span className="social-btn-icon">👥</span>
                  EncuéntraME
                </a>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="faq-section">
            <div className="faq-header">
              <h3>Preguntas frecuentes</h3>
              <span className="faq-icon">❓</span>
            </div>
            
            <div className="faq-grid">
              <div className="faq-item">
                <h4>¿Cómo funciona el collar QR?</h4>
                <p>Cada collar tiene un código QR único. Al escanearlo, las personas pueden ver la información de tu mascota y contactarte inmediatamente.</p>
              </div>
              
              <div className="faq-item">
                <h4>¿Qué pasa si pierdo el collar?</h4>
                <p>Puedes reportar la pérdida en tu perfil y generar un nuevo código QR. También puedes comprar un collar de reemplazo.</p>
              </div>
              
              <div className="faq-item">
                <h4>¿Es resistente al agua?</h4>
                <p>Sí, nuestros collares están diseñados para resistir lluvia y actividades diarias. Son duraderos y seguros para tu mascota.</p>
              </div>
              
              <div className="faq-item">
                <h4>¿Cómo actualizo la información?</h4>
                <p>Ingresa a tu perfil desde nuestra web y actualiza los datos cuando quieras. Los cambios se reflejan inmediatamente en el QR.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Final */}
      <section className="support-cta">
        <div className="cta-content">
          <img src={mascotaImage} alt="Mascota EncuentraME" className="cta-mascota" />
          <h2>¿Todo listo?</h2>
          <p>Vuelve al inicio y protege a tu mejor amigo</p>
          <button onClick={handleNavigateHome} className="cta-btn">
            <span className="btn-icon">🏠</span>
            Ir al inicio
          </button>
        </div>
      </section>
    </div>
  );
};

export default Support;