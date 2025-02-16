import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../../services/api';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <Link to="/">PetQR Collar</Link>
        </div>
        <nav className="nav">
          <ul className="nav-list">
            <li className="nav-item">
              <Link to="/" className="nav-link">Inicio</Link>
            </li>
            {isLoggedIn ? (
              <>
                <li className="nav-item">
                  <Link to="/dashboard" className="nav-link">Mi Panel</Link>
                </li>
                <li className="nav-item">
                  <Link to="/pets" className="nav-link">Gestionar Mascotas</Link>
                </li>
                <li className="nav-item">
                  <button onClick={handleLogout} className="logout-button">
                    Cerrar Sesión
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link to="/login" className="nav-link">Iniciar Sesión</Link>
                </li>
                <li className="nav-item">
                  <Link to="/register" className="nav-link register-button">
                    Registrarse
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header; 