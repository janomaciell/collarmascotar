import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, requestPasswordReset } from '../../services/api';
import './Login.css';

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotPasswordError('');
    setForgotPasswordSuccess(false);
    setIsLoading(true);
    
    try {
      await requestPasswordReset(forgotPasswordEmail);
      setForgotPasswordSuccess(true);
      setForgotPasswordEmail('');
    } catch (err) {
      setForgotPasswordError(
        err?.error || err?.message || 'Error al solicitar recuperación de contraseña. Por favor intente nuevamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* Hero */}
      <section className="login-hero">
        <div className="pattern-bg"></div>
        <div className="hero-content">
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
            
            <div className="forgot-password-link">
              <button
                type="button"
                className="forgot-password-button"
                onClick={() => setShowForgotPassword(true)}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            
            <button type="submit" className="login-button">
              Iniciar sesión
            </button>
          </form>
          
          <p className="register-link">
            ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
          </p>
          
          {/* Modal de recuperación de contraseña */}
          {showForgotPassword && (
            <div className="modal-overlay" onClick={() => {
              setShowForgotPassword(false);
              setForgotPasswordEmail('');
              setForgotPasswordError('');
              setForgotPasswordSuccess(false);
            }}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button
                  className="modal-close"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordEmail('');
                    setForgotPasswordError('');
                    setForgotPasswordSuccess(false);
                  }}
                >
                  ×
                </button>
                <h2>Recuperar contraseña</h2>
                {forgotPasswordSuccess ? (
                  <div className="success-message">
                    <span className="success-icon">✓</span>
                    <p>Se ha enviado un email con instrucciones para recuperar tu contraseña.</p>
                    <p className="success-note">Por favor revisa tu bandeja de entrada.</p>
                  </div>
                ) : (
                  <>
                    <p className="modal-description">
                      Ingresa tu email o nombre de usuario y te enviaremos un enlace para recuperar tu contraseña.
                    </p>
                    {forgotPasswordError && (
                      <div className="error-message">
                        <span className="error-icon">⚠️</span>
                        {forgotPasswordError}
                      </div>
                    )}
                    <form onSubmit={handleForgotPasswordSubmit} className="forgot-password-form">
                      <div className="form-group">
                        <label htmlFor="forgot-email">Email o Usuario</label>
                        <input
                          type="text"
                          id="forgot-email"
                          value={forgotPasswordEmail}
                          onChange={(e) => setForgotPasswordEmail(e.target.value)}
                          placeholder="Tu email o nombre de usuario"
                          required
                        />
                      </div>
                      <button 
                        type="submit" 
                        className="login-button"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Enviando...' : 'Enviar'}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;