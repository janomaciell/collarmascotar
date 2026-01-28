import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../../services/api';
import './Register.css';
import { FaExclamationTriangle, FaEye, FaEyeSlash } from 'react-icons/fa';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const mascotaImage = 'src/img/personaje2.png';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = "El nombre es requerido";
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = "El apellido es requerido";
    }
    
    if (!formData.username.trim()) {
      newErrors.username = "El nombre de usuario es requerido";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "El correo electrónico es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Ingrese un correo electrónico válido";
    }
    
    if (!formData.password) {
      newErrors.password = "La contraseña es requerida";
    } else if (!/^(?=.*\d).{8,}$/.test(formData.password)) {
      newErrors.password = "La contraseña debe tener al menos 8 caracteres y 1 número";
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    setErrors({});
    setSubmitting(true);
    
    try {
      await register(formData);
      setTimeout(() => navigate('/login'), 1000);
    } catch (err) {
      console.error(err);
      setErrors({ general: "Error al registrarse. Por favor, intenta nuevamente." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-wrapper">
      {/* Hero */}
      <section className="register-hero">
        <div className="pattern-bg"></div>
        <div className="hero-content">
          <h1 className="hero-title">ÚNETE A ENCUÉNTRAME</h1>
          <p className="hero-subtitle">Crea tu cuenta y protege a tu mejor amigo</p>
        </div>
      </section>

      {/* Formulario */}
      <div className="register-container">
        <div className="register-form-container">
          <h2>Crear cuenta</h2>
          
          {errors.general && (
            <div className="error-message">
              <span className="error-icon"><FaExclamationTriangle /></span>
              {errors.general}
            </div>
          )}
          
          <form className="register-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="first_name">Nombre</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className={errors.first_name ? "error" : ""}
                  placeholder="Tu nombre"
                />
                {errors.first_name && <span className="error-text">{errors.first_name}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="last_name">Apellido</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className={errors.last_name ? "error" : ""}
                  placeholder="Tu apellido"
                />
                {errors.last_name && <span className="error-text">{errors.last_name}</span>}
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="username">Nombre de usuario</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={errors.username ? "error" : ""}
                placeholder="Elige un nombre único"
              />
              {errors.username && <span className="error-text">{errors.username}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Correo electrónico</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? "error" : ""}
                placeholder="tu@email.com"
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? "error" : ""}
                  placeholder="Mínimo 8 caracteres"
                />
                <button 
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && <span className="error-text">{errors.password}</span>}
              <small>Debe tener al menos 8 caracteres y 1 número</small>
            </div>
            
            <button 
              type="submit" 
              className="register-button"
              disabled={submitting}
            >
              {submitting ? 'Creando cuenta...' : 'Crear mi cuenta'}
            </button>
          </form>
          
          <p className="login-link">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;