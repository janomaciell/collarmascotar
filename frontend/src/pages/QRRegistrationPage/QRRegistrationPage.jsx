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
      const formData = new FormData();

      console.log('Datos recibidos en handlePetSubmission:', petData);

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

      for (let pair of formData.entries()) {
        console.log('FormData contiene:', pair[0], pair[1]);
      }

      const response = await registerPetToQR(uuid, formData);
      if (response.require_auth) {
        sessionStorage.setItem('pending_pet_data', JSON.stringify(petData));
        sessionStorage.setItem('pending_qr_uuid', uuid);
        navigate('/login', { state: { from: `/register-pet/${uuid}` } });
      } else {
        navigate('/dashboard', { state: { successMessage: 'Mascota registrada exitosamente.' } });
      }
    } catch (err) {
      console.error('Error completo:', err);
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

      const response = await completePendingRegistration(pendingData, pendingQR);
      sessionStorage.removeItem('pending_pet_data');
      sessionStorage.removeItem('pending_qr_uuid');
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
        <button onClick={() => navigate('/')} className="back-button">
          Volver al inicio
        </button>
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