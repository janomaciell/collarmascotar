import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQRRedirectInfo } from '../../services/api';
import './QRRedirectPage.css';

const QRRedirectPage = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkQRAndRedirect = async () => {
      try {
        setIsLoading(true);
        const response = await getQRRedirectInfo(uuid);
        console.log('Respuesta de getQRRedirectInfo:', response); // Debug

        if (response.redirect_to) {
          if (response.pet_data) {
            sessionStorage.setItem('petData', JSON.stringify(response.pet_data));
          }
          navigate(response.redirect_to, { replace: true }); // Use replace to avoid back-button issues
        } else {
          setError('No se pudo determinar a dónde redirigir.');
        }
      } catch (err) {
        console.error('Error en redirección:', err);
        setError('Error al verificar el QR: ' + (err.message || 'QR no válido.'));
      } finally {
        setIsLoading(false);
      }
    };

    checkQRAndRedirect();
  }, [uuid, navigate]);

  if (isLoading) {
    return (
      <div className="qr-redirect-loading">
        <div className="spinner"></div>
        <p>Verificando QR...</p>
      </div>
    );
  }

  return (
    <div className="qr-redirect-container">
      {error && (
        <div className="qr-redirect-error">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
          <button
            onClick={() => navigate('/')}
            className="qr-redirect-button"
          >
            Volver al inicio
          </button>
        </div>
      )}
    </div>
  );
};

export default QRRedirectPage;