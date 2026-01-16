import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const mascotaImage = new URL('../../img/personaje2.png', import.meta.url).href;
  const logoUrl = new URL('../../img/logo.png', import.meta.url).href;

  return (
    <footer className="footer">
      {/* Footer principal */}
      <div className="footer-main">
        <div className="pattern-bg"></div>
        <div className="footer-container">
          
          {/* Sección de marca */}
          <div className="footer-brand">
            <div className="brand-header">
              <img src={logoUrl} alt="ENCUÉNTRAME Logo" className="footer-logo" />
              <h3 className="brand-name">ENCUENTRAME</h3>
            </div>
            <p className="brand-slogan">Mascotas seguras, familias tranquilas</p>
            <p className="brand-description">
              Tecnología QR que salva vidas. Cada collar es una promesa de reencuentro.
            </p>
            
            {/* Redes sociales */}
            <div className="social-links">
              <a 
                href="https://www.instagram.com/encuentrameqr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-link instagram"
                aria-label="Síguenos en Instagram"
              >
                <span className="social-icon">📸</span>
              </a>
              <a 
                href="https://www.facebook.com/encuentrameqr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-link facebook"
                aria-label="Síguenos en Facebook"
              >
                <span className="social-icon">👥</span>
              </a>
            </div>
          </div>

          {/* Enlaces rápidos */}
          <div className="footer-section">
            <h4>Navegación</h4>
            <ul className="footer-links">
              <li><Link to="/">Inicio</Link></li>
              <li><Link to="/about">Nosotros</Link></li>
              <li><Link to="/compra">Productos</Link></li>
              <li><Link to="/support">Soporte</Link></li>
            </ul>
          </div>

          {/* Servicios */}
          <div className="footer-section">
            <h4>Servicios</h4>
            <ul className="footer-links">
              <li><Link to="/register">Crear cuenta</Link></li>
              <li><Link to="/pets">Mis mascotas</Link></li>
              <li><Link to="/profile">Mi perfil</Link></li>
              <li><Link to="/login">Iniciar sesión</Link></li>
            </ul>
          </div>

         
        </div>
      </div>



      {/* Footer bottom */}
      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p className="copyright">
            © {new Date().getFullYear()} EncuéntraME. Todos los derechos reservados.
          </p>
          <div className="footer-bottom-links">
            <Link to="/privacy">Privacidad</Link>
            <Link to="/terms">Términos</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;