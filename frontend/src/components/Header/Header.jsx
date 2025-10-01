import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../../services/api';
import './Header.css';
import logoUrl from '../../img/logo.png';

const Header = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');
  const [menuActive, setMenuActive] = useState(false);


  const handleLogout = () => {
    setMenuActive(false);
    logout();
    navigate('/');
  };

  const toggleMenu = () => {
    setMenuActive(!menuActive);
  };

  const handleNavClick = () => {
    setMenuActive(false);
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <Link to="/" onClick={handleNavClick}>
            <img src={logoUrl} alt="Logo" />
          </Link>
        </div>
        <div className="hamburger" onClick={toggleMenu}>☰</div>
        <nav className={`nav ${menuActive ? 'active' : ''}`}>
          <ul className="nav-list">
            <li className="nav-item"><Link to="/support" className="nav-link" onClick={handleNavClick}>Soporte</Link></li>
            <li className="nav-item"><Link to="/about" className="nav-link" onClick={handleNavClick}>Nosotros</Link></li>
            <li className="nav-item desktop-only"><Link to="/compra" className="buy-button" onClick={handleNavClick}>Comprar</Link></li>
            {isLoggedIn ? (
              <>
                <li className="nav-item"><Link to="/pets" className="nav-link" onClick={handleNavClick}>Mis Mascotas</Link></li>
                <li className="nav-item"><Link to="/profile" className="nav-link" onClick={handleNavClick}>Mi Perfil</Link></li>
                <li className="nav-item">
                  <button onClick={handleLogout} className="logout-button">Cerrar Sesión</button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item"><Link to="/login" className="nav-link" onClick={handleNavClick}>Iniciar Sesión</Link></li>
                <li className="nav-item"><Link to="/register" className="nav-link register-button" onClick={handleNavClick}>Registrarse</Link></li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;