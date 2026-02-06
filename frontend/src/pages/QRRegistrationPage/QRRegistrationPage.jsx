import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PetForm from '../../components/PetForm/PetForm';
import { checkQRStatus, registerPetToQR, completePendingRegistration } from '../../services/api';
import './QRRegistrationPage.css';
import logo from '../../img/logo.png';
const QRRegistrationPage = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [qrStatus, setQRStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    const verifyQR = async () => {
      try {
        setIsLoading(true);
        const response = await checkQRStatus(uuid);
        setQRStatus(response);
        if (response.is_assigned) {
          setError('Este QR ya está asignado a una mascota.');
        }

        // Check for pending registration after login
        const pendingData = sessionStorage.getItem('pending_pet_data');
        const pendingQR = sessionStorage.getItem('pending_qr_uuid');
        if (pendingData && pendingQR && isAuthenticated) {
          await handleCompleteRegistration();
        }
      } catch (err) {
        setError('Error al verificar el QR: ' + (err.message || 'QR no válido.'));
      } finally {
        setIsLoading(false);
      }
    };
    verifyQR();
  }, [uuid, isAuthenticated]);

  const handlePetSubmission = async (petData) => {
    try {
      setError('');
      if (!isAuthenticated) {
        sessionStorage.setItem('pending_pet_data', JSON.stringify(petData));
        sessionStorage.setItem('pending_qr_uuid', uuid);
        navigate('/login', { state: { from: `/register-pet/${uuid}` } });
        return;
      }

      const formData = new FormData();
      const requiredFields = ['name', 'age', 'address', 'phone'];
      for (const field of requiredFields) {
        if (!petData[field]) {
          throw new Error(`El campo ${field} es obligatorio.`);
        }
        formData.append(field, petData[field]);
      }

      const optionalFields = [
        'breed', 'email', 'notes', 'photo', 'allergies', 'medical_conditions',
        'blood_type', 'weight', 'microchip_id', 'birth_date', 'gender',
        'is_sterilized', 'sterilization_date', 'vet_name', 'vet_phone', 'vet_address'
      ];
      optionalFields.forEach((key) => {
        if (petData[key] !== null && petData[key] !== undefined && petData[key] !== '') {
          formData.append(key, petData[key]);
        }
      });

      await registerPetToQR(uuid, formData);
      navigate('/pets', { state: { successMessage: 'Mascota registrada exitosamente.' } });
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        sessionStorage.setItem('pending_pet_data', JSON.stringify(petData));
        sessionStorage.setItem('pending_qr_uuid', uuid);
        navigate('/login', { 
          state: { 
            from: `/register-pet/${uuid}`,
            message: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.'
          } 
        });
        return;
      }
      setError('Error al registrar la mascota: ' + (err.message || 'Intente nuevamente.'));
    }
  };

  const handleCompleteRegistration = async () => {
    try {
      const pendingData = JSON.parse(sessionStorage.getItem('pending_pet_data'));
      const pendingQR = sessionStorage.getItem('pending_qr_uuid');
      if (!pendingData || !pendingQR) {
        setError('No hay datos pendientes para registrar.');
        return;
      }
      await completePendingRegistration(pendingData, pendingQR);
      sessionStorage.removeItem('pending_pet_data');
      sessionStorage.removeItem('pending_qr_uuid');
      navigate('/pets', { state: { successMessage: 'Registro completado exitosamente.' } });
    } catch (err) {
      setError('Error al completar el registro: ' + (err.message || 'Intente nuevamente.'));
    }
  };

  if (isLoading) return <div className="loading">Verificando QR...</div>;
  if (error || !qrStatus || qrStatus.is_assigned) {
    return (
      <div className="error-container">
        {error || 'Este QR ya está asignado o no es válido.'}
        <button onClick={() => navigate('/')} className="back-button">
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="qr-registration-container">
      <header className="qr-registration-header">
        <img src={logo} alt="Logo Encuentrame" className="qr-logo" />
        <h1 className="qr-title">ENCUENTRAME</h1>
        <h2 className="qr-subtitle">Registro de Mascota</h2>
        <div className="qr-steps">
          <span className="qr-step">1. Datos de tu mascota</span>
          <span className="qr-step">2. Confirma y guarda</span>
          <span className="qr-step">3. ¡Listo!</span>
        </div>
      </header>
      <main className="qr-registration-content">
        <div className="qr-instructions">
          <strong>Bienvenido</strong>
          <p>
            Completa los datos principales de tu mascota.<br />
            <span style={{ color: '#05408F', fontWeight: 500 }}>
              Si tienes dudas, puedes pedir ayuda en <a href="/support">Soporte</a>.
            </span>
          </p>
        </div>
        <PetForm onSubmit={handlePetSubmission} />
        {error && <div className="error-message">{error}</div>}
      </main>
      <div className="security-tips">
  <h4>Tips de seguridad</h4>
  <ul>
    <li>Mantén actualizada la información de contacto</li>
    <li>Agrega una foto clara de tu mascota</li>
    <li>Incluye datos médicos importantes</li>
    <li>Verifica que el collar esté bien ajustado</li>
  </ul>
</div>

    <div className="help-card">
      <h4>¿Necesitas ayuda?</h4>
      <p>Nuestro equipo está disponible para ayudarte en cada paso</p>
      <button className="help-button" onClick={() => navigate('/soporte')}>
        Contactar soporte
      </button>
    </div>

    </div>
  );
};

export default QRRegistrationPage;