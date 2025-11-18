import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { resetPassword } from '../../services/api';
import './ResetPassword.css';

const ResetPassword = () => {
  const { uid, token } = useParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!uid || !token) {
      setError('El enlace no es válido. Solicita uno nuevo.');
      return;
    }

    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(uid, token, newPassword);
      setSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const apiError = err?.error || err?.detail || err?.message || 'No se pudo restablecer la contraseña.';
      setError(typeof apiError === 'string' ? apiError : 'No se pudo restablecer la contraseña.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-card">
        <h1>Restablecer contraseña</h1>
        <p className="reset-description">
          Ingresa una nueva contraseña para tu cuenta de EncuéntraME. 
        </p>

        {!success ? (
          <>
            {error && <div className="reset-error">{error}</div>}
            <form onSubmit={handleSubmit} className="reset-form">
              <div className="form-group">
                <label htmlFor="newPassword">Nueva contraseña</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ingresa una contraseña segura"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmar contraseña</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  required
                />
              </div>
              <button type="submit" className="reset-button" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Restablecer contraseña'}
              </button>
            </form>
            <p className="reset-help">
              ¿El enlace no funciona? <Link to="/login">Solicita uno nuevo</Link>
            </p>
          </>
        ) : (
          <div className="reset-success">
            <h2>¡Contraseña actualizada!</h2>
            <p>Ahora puedes iniciar sesión con tu nueva contraseña.</p>
            <Link to="/login" className="reset-button secondary">
              Ir al inicio de sesión
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;


