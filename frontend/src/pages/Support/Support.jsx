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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitted(false);

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
    }
  };

  const handleNavigateHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="support-container">
      {/* Sección Hero */}
      <section className="support-hero">
        <div className="hero-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
        </div>
        <h1>Soporte</h1>
        <p>Estamos aquí para ayudarte en cualquier momento</p>
      </section>

      {/* Sección Contacto */}
      <section className="contact-section">
        <div className="contact-content">
          <h2>Contáctanos</h2>
          <p>
            ¿Tienes preguntas, necesitas ayuda o quieres reportar un problema? Envíanos un mensaje o síguenos en Instagram para mantenerte al tanto de nuestras novedades.
          </p>

          {/* Formulario de Correo */}
          <div className="support-card">
            <form className="support-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Nombre</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Tu nombre"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Correo Electrónico</label>
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
              <div className="form-group">
                <label htmlFor="message">Mensaje</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  placeholder="¿En qué podemos ayudarte?"
                  rows="5"
                />
              </div>
              <button type="submit" className="submit-button">
                Enviar Mensaje
              </button>
              {submitted && (
                <p className="success-message">
                  ¡Gracias por contactarnos! Tu mensaje ha sido enviado con éxito.
                </p>
              )}
              {error && <p className="errorWELL-message">{error}</p>}
            </form>
          </div>

          {/* Enlace a Instagram */}
          <div className="support-card social-contact">
            <h3>Síguenos en Instagram</h3>
            <p>Conéctate con nosotros y únete a nuestra comunidad de amantes de las mascotas.</p>
            <a
              href="https://www.instagram.com/encuentrameqr"
              target="_blank"
              rel="noopener noreferrer"
              className="instagram-button"
            >
              @encuentrameQR
            </a>
          </div>
        </div>
      </section>

      {/* Sección CTA */}
      <section className="support-cta">
        <div className="cta-shapes">
          <div className="shape cta-shape"></div>
        </div>
        <h2>¿Necesitas Más Ayuda?</h2>
        <p>Estamos disponibles 24/7 para asegurarnos de que tú y tu mascota estén bien.</p>
        <button 
          onClick={handleNavigateHome}
          className="cta-button"
        >
          Volver al Inicio
        </button>
      </section>
    </div>
  );
};

export default Support;