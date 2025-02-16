import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>PetQR Collar</h3>
          <p>La manera más segura de proteger a tu mascota</p>
        </div>
        
        <div className="footer-section">
          <h3>Enlaces Rápidos</h3>
          <ul className="footer-links">
            <li><Link to="/">Inicio</Link></li>
            <li><Link to="/register">Registrarse</Link></li>
            <li><Link to="/login">Iniciar Sesión</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Contacto</h3>
          <p>Email: info@petqrcollar.com</p>
          <p>Teléfono: (123) 456-7890</p>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} PetQR Collar. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer; 