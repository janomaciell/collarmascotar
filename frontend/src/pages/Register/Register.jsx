import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../../services/api';
import './Register.css';

const questions = [
  { question: "¿Cuál es tu nombre?", field: "first_name" },
  { question: "¿Cuál es tu apellido?", field: "last_name" },
  { question: "¿Cuál es tu correo electrónico?", field: "email", pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  { question: "Crea tu contraseña", field: "password", type: "password", pattern: /^(?=.*\d).{8,}$/ },
  { question: "Elige tu nombre de usuario", field: "username" },
];

const Register = () => {
  const [position, setPosition] = useState(0);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
  });
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [isWrong, setIsWrong] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (position < questions.length) {
      setInputValue(formData[questions[position].field] || '');
      document.getElementById('inputContainer').classList.add('active');
    }
  }, [position]);

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  const validate = async () => {
    const currentQuestion = questions[position];
    const value = inputValue.trim();

    // Validar el campo actual
    if (!value.match(currentQuestion.pattern || /.+/)) {
      setIsWrong(true);
      setError(
        currentQuestion.field === 'password'
          ? 'La contraseña debe tener al menos 8 caracteres y 1 número'
          : 'Por favor, completa este campo correctamente'
      );
      setTimeout(() => {
        setIsWrong(false);
        setError('');
      }, 700); // Duración de la animación "wrong"
      return;
    }

    // Actualizar formData con el valor validado
    setFormData((prev) => ({ ...prev, [currentQuestion.field]: value }));

    // Avanzar al siguiente paso o registrar
    if (position + 1 < questions.length) {
      setPosition(position + 1);
    } else {
      try {
        await register(formData);
        setIsDone(true);
        setTimeout(() => navigate('/login'), 1000); // Redirige después de la animación
      } catch (err) {
        setError('Error al registrarse. Por favor, intenta nuevamente.');
        console.error(err);
      }
    }
  };

  const handleKeyUp = (e) => {
    if (e.keyCode === 13) validate(); // Enter para validar
  };

  return (
    <div className="register-page">
      <h1 className="register-title">Regístrate en CollarMascotaQR</h1>
      <h2 className="register-subtitle">Completa cada paso para registrarte</h2>
      <div id="progress" style={{ width: `${(position * 100) / questions.length}vw` }}></div>
      <div className="center">
        <div id="register" className={`${isWrong ? 'wrong' : ''} ${isDone ? 'close' : ''}`}>
          {!isDone && position < questions.length && (
            <>
              <i className="ion-android-arrow-forward next" onClick={validate}></i>
              <div id="inputContainer" className="active">
                <input
                  id="inputField"
                  type={questions[position].type || 'text'}
                  value={inputValue}
                  onChange={handleChange}
                  onKeyUp={handleKeyUp}
                  required
                  autoFocus
                />
                <label id="inputLabel">{questions[position].question}</label>
                <div id="inputProgress"></div>
              </div>
            </>
          )}
        </div>
        {isDone && (
          <h1 className="welcome-text visible">
            ¡Bienvenido/a {formData.first_name}!
          </h1>
        )}
      </div>
      {error && <p className="error-message">{error}</p>}
      <p className="login-link">
        ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión aquí</Link>
      </p>
    </div>
  );
};

export default Register;