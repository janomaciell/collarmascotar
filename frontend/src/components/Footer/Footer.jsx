import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>EncuentraME <span className="paw-icon">🐾</span></h3>
          <p>Protección inteligente para tu mejor amigo.</p>
        </div>
        <div className="footer-section">
          <h3>Enlaces Rápidos</h3>
          <ul className="footer-links">
            <li><Link to="/">Inicio</Link></li>
            <li><Link to="/about">Nosotros</Link></li>
            <li><Link to="/blog">Blog</Link></li>
            <li><Link to="/support">Soporte</Link></li>
          </ul>
        </div>
        <div className="footer-section">
          <h3>Contacto</h3>
          <p>Email: janomaciel1@gmail.com</p>
          <p>Teléfono: 2267-405599</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} EncuentraME. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;