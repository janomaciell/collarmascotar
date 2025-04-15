import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PetForm from '../../components/PetForm/PetForm';
import { checkQRStatus, registerPetToQR, completePendingRegistration } from '../../services/api';
import './QRRegistrationPage.css';

const QRRegistrationPage = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [qrStatus, setQRStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const verifyQR = async () => {
      try {
        setIsLoading(true);
        const response = await checkQRStatus(uuid);
        setQRStatus(response);
        if (response.is_assigned) {
          setError('Este QR ya está asignado a una mascota.');
        }
      } catch (err) {
        setError('Error al verificar el QR: ' + (err.message || 'QR no válido.'));
      } finally {
        setIsLoading(false);
      }
    };
    verifyQR();
  }, [uuid]);

  const handlePetSubmission = async (petData) => {
    try {
      setError('');
      const formData = new FormData();
      Object.entries(petData).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          formData.append(key, value);
        }
      });

      const response = await registerPetToQR(uuid, formData);
      if (response.require_auth) {
        // Guardar datos en localStorage para mantenerlos tras redirección
        localStorage.setItem('pending_pet_data', JSON.stringify(petData));
        localStorage.setItem('pending_qr_uuid', uuid);
        navigate('/login', { state: { from: `/register-pet/${uuid}` } });
      } else {
        navigate('/dashboard', { state: { successMessage: 'Mascota registrada exitosamente.' } });
      }
    } catch (err) {
      setError('Error al registrar la mascota: ' + (err.message || 'Intente nuevamente.'));
    }
  };

  const handleCompleteRegistration = async () => {
    try {
      const pendingData = JSON.parse(localStorage.getItem('pending_pet_data'));
      const pendingQR = localStorage.getItem('pending_qr_uuid');
      if (!pendingData || !pendingQR) {
        setError('No hay datos pendientes para registrar.');
        return;
      }

      const response = await completePendingRegistration(pendingData);
      localStorage.removeItem('pending_pet_data');
      localStorage.removeItem('pending_qr_uuid');
      navigate('/dashboard', { state: { successMessage: 'Registro completado exitosamente.' } });
    } catch (err) {
      setError('Error al completar el registro: ' + (err.message || 'Intente nuevamente.'));
    }
  };

  if (isLoading) return <div className="loading">Verificando QR...</div>;
  if (error || !qrStatus || qrStatus.is_assigned) {
    return (
      <div className="error-container">
        {error || 'Este QR ya está asignado o no es válido.'}
      </div>
    );
  }

  return (
    <div className="qr-registration-container">
      <header className="qr-registration-header">
        <h1>CollarMascotaQR</h1>
        <h2>Registrar Nueva Mascota</h2>
      </header>
      <main className="qr-registration-content">
        <p>Escaneaste un QR para registrar una nueva mascota. Por favor, completa los datos.</p>
        {!isAuthenticated && (
          <div className="auth-warning">
            <p>Debes iniciar sesión o registrarte para completar el proceso.</p>
            <button onClick={() => navigate('/login')} className="auth-button">
              Iniciar Sesión
            </button>
            <button onClick={() => navigate('/register')} className="auth-button">
              Registrarse
            </button>
          </div>
        )}
        <PetForm onSubmit={handlePetSubmission} />
        {error && <div className="error-message">{error}</div>}
      </main>
      <footer className="qr-registration-footer">
        <p>© 2025 CollarMascotaQR. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default QRRegistrationPage;