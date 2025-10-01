import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../services/api';
import './Login.css';

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const mascotaImage = 'src/img/personaje2.png';

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(credentials);
      navigate('/');
    } catch (err) {
      setError('Credenciales inválidas. Por favor intente nuevamente.');
      console.error(err);
    }
  };

  return (
    <div className="login-wrapper">
      {/* Hero */}
      <section className="login-hero">
        <div className="pattern-bg"></div>
        <div className="hero-content">
          <img src={mascotaImage} alt="Mascota EncuentraME" className="hero-mascota" />
          <h1 className="hero-title">¡BIENVENIDO DE VUELTA!</h1>
          <p className="hero-subtitle">Accede a tu cuenta EncuéntraME</p>
        </div>
      </section>

      {/* Formulario */}
      <div className="login-container">
        <div className="login-form-container">
          <h2>Iniciar sesión</h2>
          
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Usuario</label>
              <input
                type="text"
                id="username"
                name="username"
                value={credentials.username}
                onChange={handleChange}
                placeholder="Tu nombre de usuario"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  placeholder="Tu contraseña"
                  required
                />
                <button 
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>
            
            <button type="submit" className="login-button">
              Iniciar sesión
            </button>
          </form>
          
          <p className="register-link">
            ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;