import React, { useState, useEffect } from 'react';
import { getPets } from '../../services/api';
import './Compra.css';

const Compra = () => {
  const [pets, setPets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [userPhone, setUserPhone] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [purchaseReason, setPurchaseReason] = useState('');
  const [lostPet, setLostPet] = useState(null); // Nuevo estado

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      setIsLoading(true);
      const data = await getPets();
      setPets(data);
      setError('');
    } catch (err) {
      setError('No pudimos cargar las mascotas. Intenta de nuevo.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const purchaseOptions = [
    { id: 'chapita', name: 'Solo Chapita QR', price: 20000, available: true },
    { id: 'collar-simple', name: 'Collar Básico + QR', price: 0, available: false },
    { id: 'collar-premium', name: 'Collar Premium + QR', price: 0, available: false },
  ];

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Solo números
    if (value.length <= 10) {
      setUserPhone(value);
    }
  };

  const validatePhone = () => {
    // Números de teléfono argentinos: 10 dígitos en total (código de área + número, sin "15")
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(userPhone);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedOption || !validatePhone()) {
      setError('Por favor completa todos los campos requeridos.');
      return;
    }

    if (lostPet === true && !selectedPetId) {
      setError('Por favor selecciona una mascota.');
      return;
    }

    try {
      const selectedPet = selectedPetId ? pets.find((pet) => pet.id === selectedPetId) : null;
      const option = purchaseOptions.find((opt) => opt.id === selectedOption);
      const message = encodeURIComponent(
        `¡Hola! Quiero comprar un *${option.name}*${selectedPet ? ` para mi mascota *${selectedPet.name}*` : ''}.\n` +
        (selectedPet ? `Raza: ${selectedPet.breed || 'No especificada'}\n` : '') +
        (selectedPet ? `Edad: ${selectedPet.age} años\n` : '') +
        `Detalles: ${additionalInfo || 'Sin detalles adicionales'}\n` +
        `¡Espero tu respuesta para coordinar!`
      );

      const formattedPhone = userPhone;
      
      setTimeout(() => {
        const whatsappUrl = `https://wa.me/54${formattedPhone}?text=${message}`;
        const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        
        if (newWindow) {
          newWindow.opener = null;
        }
        
        setSuccessMessage('¡Redirigiéndote a WhatsApp para coordinar tu pedido!');
        
        setTimeout(() => {
          setSelectedPetId(null);
          setSelectedOption(null);
          setUserPhone('');
          setAdditionalInfo('');
          setSuccessMessage('');
          setPurchaseReason('');
          setLostPet(null); // Reinicia el estado de mascota perdida
        }, 3000);
      }, 100);

    } catch (err) {
      console.error('Error al procesar la solicitud:', err);
      setError('Hubo un error al procesar tu solicitud. Por favor intenta de nuevo.');
    }
  };

  return (
    <div className="compra-container">
      <h1>¡Consigue tu Collar QR con Encuéntrame!</h1>
      <h2>Elige y Personaliza</h2>

      {isLoading ? (
        <div className="loading-message">Cargando...</div>
      ) : (
        <form onSubmit={handleSubmit} className="compra-form">
          {/* Pregunta sobre mascota perdida */}
          <div className="form-group">
            <h3 className="lost-pet-question">¿Perdiste a tu mascota?</h3>
            <div className="yes-no-buttons">
              <button
                type="button"
                className={`choice-button ${lostPet === true ? 'selected' : ''}`}
                onClick={() => setLostPet(true)}
              >
                Sí
              </button>
              <button
                type="button"
                className={`choice-button ${lostPet === false ? 'selected' : ''}`}
                onClick={() => setLostPet(false)}
              >
                No
              </button>
            </div>
          </div>

          {/* Selección de Mascota (solo si perdió a su mascota) */}
          {lostPet === true && (
            <div className="form-group">
              <label>¿Cuál de tus mascotas perdió el collar?</label>
              {pets.length === 0 ? (
                <p>
                  No tienes mascotas registradas.{' '}
                </p>
              ) : (
                <div className="pet-selection">
                  {pets.map((pet) => (
                    <div
                      key={pet.id}
                      className={`pet-option ${selectedPetId === pet.id ? 'selected' : ''}`}
                      onClick={() => setSelectedPetId(pet.id)}
                    >
                      <img src={pet.photo} alt={pet.name} className="pet-thumbnail" />
                      <div className="pet-details">
                        <h4>{pet.name}</h4>
                        <p>{pet.breed || 'Sin raza'}, {pet.age} años</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Selección de Opción de Compra */}
          <div className="form-group">
            <label>Elige tu opción</label>
            <div className="options-grid">
              {purchaseOptions.map((option) => (
                <div
                  key={option.id}
                  className={`option-card ${selectedOption === option.id ? 'selected' : ''} ${!option.available ? 'unavailable' : ''}`}
                  onClick={() => option.available && setSelectedOption(option.id)}
                >
                  <h4>{option.name}</h4>
                  <p className="price">${option.price.toLocaleString('es-AR')} ARS</p>
                  {!option.available && <p className="unavailable-text">Próximamente</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Teléfono */}
          <div className="form-group">
            <label>Tu WhatsApp</label>
            <input
              type="tel"
              value={userPhone}
              onChange={handlePhoneChange}
              placeholder="Ej: 1123456789"
              required
            />
            <small>Ingresa tu número con código de área, sin el 15 (ejemplo: 1123456789)</small>
          </div>

          {/* Detalles Adicionales */}
          <div className="form-group">
            <label>Detalles adicionales (opcional)</label>
            <textarea
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="Ej: 'Quiero un diseño especial'"
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}

          <button
            type="submit"
            className="submit-button"
            disabled={!selectedOption || !validatePhone()}
          >
            Enviar Pedido por WhatsApp
          </button>
        </form>
      )}
    </div>
  );
};

export default Compra;