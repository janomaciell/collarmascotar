import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../../services/api';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');
  const [menuActive, setMenuActive] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleMenu = () => {
    setMenuActive(!menuActive);
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <Link to="/">CollarMascotaQR</Link>
        </div>
        <div className="hamburger" onClick={toggleMenu}>☰</div>
        <nav className={`nav ${menuActive ? 'active' : ''}`}>
          <ul className="nav-list">
            <li className="nav-item"><Link to="/blog" className="nav-link">Blog</Link></li>
            <li className="nav-item"><Link to="/support" className="nav-link">Soporte</Link></li>
            <li className="nav-item"><Link to="/about" className="nav-link">Nosotros</Link></li>
            {isLoggedIn ? (
              <>
                <li className="nav-item"><Link to="/pets" className="nav-link">Mis Mascotas</Link></li>
                <li className="nav-item"><Link to="/profile" className="nav-link">Mi Perfil</Link></li>
                <li className="nav-item">
                  <button onClick={handleLogout} className="logout-button">Cerrar Sesión</button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item"><Link to="/login" className="nav-link">Iniciar Sesión</Link></li>
                <li className="nav-item"><Link to="/register" className="nav-link register-button">Registrarse</Link></li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;