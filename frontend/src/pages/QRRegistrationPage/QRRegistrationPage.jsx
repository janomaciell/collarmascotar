import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PetForm from '../../components/PetForm/PetForm';
import { checkQRStatus, registerPetToQR, completePendingRegistration, validateToken } from '../../services/api';
import './QRRegistrationPage.css';

const QRRegistrationPage = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [qrStatus, setQRStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  // Actualizar isAuthenticated dinámicamente
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      console.log('Verificando autenticación, token:', token);
      if (token) {
        try {
          await validateToken();
          setIsAuthenticated(true);
        } catch (err) {
          console.log('Token inválido, limpiando sesión');
          localStorage.removeItem('token');
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  useEffect(() => {
    const verifyQR = async () => {
      try {
        setIsLoading(true);
        const response = await checkQRStatus(uuid);
        console.log('Estado del QR:', response);
        setQRStatus(response);
        if (response.is_assigned) {
          setError('Este QR ya está asignado a una mascota.');
        }

        // Completar registro pendiente después de login
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
      console.log('Datos recibidos en handlePetSubmission:', petData);

      // Verificar autenticación y validez del token
      if (!isAuthenticated) {
        console.log('Usuario no autenticado, redirigiendo a login');
        sessionStorage.setItem('pending_pet_data', JSON.stringify(petData));
        sessionStorage.setItem('pending_qr_uuid', uuid);
        navigate('/login', { state: { from: `/register-pet/${uuid}` } });
        return;
      }

      // Validar token antes de enviar la solicitud
      try {
        await validateToken();
      } catch (err) {
        console.log('Token inválido, redirigiendo a login');
        sessionStorage.setItem('pending_pet_data', JSON.stringify(petData));
        sessionStorage.setItem('pending_qr_uuid', uuid);
        navigate('/login', { 
          state: { 
            from: `/register-pet/${uuid}`,
            message: 'Su sesión no es válida. Por favor, inicie sesión nuevamente.'
          } 
        });
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

      for (let pair of formData.entries()) {
        console.log('FormData contiene:', pair[0], pair[1]);
      }

      const response = await registerPetToQR(uuid, formData);
      console.log('Respuesta de registerPetToQR:', response);

      navigate('/dashboard', { 
        state: { successMessage: 'Mascota registrada exitosamente.' } 
      });
    } catch (err) {
      console.error('Error completo:', err);
      if (err.message.includes('Authentication required') || err.response?.status === 401) {
        console.log('Error 401 detectado, validando token');
        try {
          await validateToken();
        } catch (tokenErr) {
          console.log('Token inválido, redirigiendo a login');
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          sessionStorage.setItem('pending_pet_data', JSON.stringify(petData));
          sessionStorage.setItem('pending_qr_uuid', uuid);
          navigate('/login', { 
            state: { 
              from: `/register-pet/${uuid}`,
              message: 'Su sesión ha expirado o no es válida. Por favor, inicie sesión nuevamente.'
            } 
          });
          return;
        }
      }
      setError('Error al registrar la mascota: ' + (err.message || 'Intente nuevamente.'));
    }
  };

  const handleCompleteRegistration = async () => {
    try {
      const pendingData = JSON.parse(sessionStorage.getItem('pending_pet_data'));
      const pendingQR = sessionStorage.getItem('pending_qr_uuid');
      console.log('Completando registro pendiente:', { pendingData, pendingQR });
      if (!pendingData || !pendingQR) {
        setError('No hay datos pendientes para registrar.');
        return;
      }

      const formData = new FormData();
      Object.entries(pendingData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          formData.append(key, value);
        }
      });

      const response = await completePendingRegistration(formData, pendingQR);
      console.log('Respuesta de completePendingRegistration:', response);
      sessionStorage.removeItem('pending_pet_data');
      sessionStorage.removeItem('pending_qr_uuid');
      navigate('/dashboard', { state: { successMessage: 'Registro completado exitosamente.' } });
    } catch (err) {
      console.error('Error al completar registro:', err);
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