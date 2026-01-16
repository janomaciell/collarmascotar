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
  const [lostPet, setLostPet] = useState(null);

  const mascotaImage = new URL('../../img/personaje2.png', import.meta.url).href;

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      setIsLoading(true);
      const data = await getPets();
      setPets(data);
      setError('');

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const purchaseOptions = [
    { 
      id: 'chapita', 
      name: 'Chapita QR', 
      price: 25000,
      oldPrice: 30000,
      available: true,
      description: 'Placa resistente con código QR único',
      icon: '🏷️'
    },
    { 
      id: 'collar-simple', 
      name: 'Collar Básico', 
      price: 25000,
      oldPrice: 30000,
      available: false,
      description: 'Collar + chapita QR incluida',
      icon: '🦮'
    },
    { 
      id: 'collar-premium', 
      name: 'Collar Premium', 
      price: 25000,
      oldPrice: 30000,
      available: false,
      description: 'Collar reforzado + chapita personalizada',
      icon: '👑'
    },
  ];

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setUserPhone(value);
    }
  };

  const validatePhone = () => {
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
          setLostPet(null);
        }, 3000);
      }, 100);

    } catch (err) {
      console.error('Error al procesar la solicitud:', err);
      setError('Hubo un error al procesar tu solicitud. Por favor intenta de nuevo.');
    }
  };

  return (
    <div className="compra-wrapper">
      {/* Hero de Compra */}
      <section className="compra-hero">
        <div className="hero-content">
          <h1 className="hero-title">¡PROTEGE A TU MEJOR AMIGO!</h1>
          <p className="hero-subtitle">Collar QR que salva vidas</p>
          <div className="hero-badge">
            <span>Tecnología simple, resultados inmediatos</span>
          </div>
        </div>
      </section>

      <div className="compra-container">
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Cargando tus mascotas...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="compra-form">
            
            {/* Pregunta inicial */}
            <div className="form-section">
              <div className="section-header">
                <h2>¿Perdiste a tu mascota?</h2>
                <p>Ayúdanos a personalizar tu pedido</p>
              </div>
              
              <div className="choice-buttons">
                <button
                  type="button"
                  className={`choice-btn ${lostPet === true ? 'selected' : ''}`}
                  onClick={() => setLostPet(true)}
                >
                  <span className="choice-icon"></span>
                  <span>Sí, la perdí</span>
                </button>
                <button
                  type="button"
                  className={`choice-btn ${lostPet === false ? 'selected' : ''}`}
                  onClick={() => setLostPet(false)}
                >
                  <span className="choice-icon"></span>
                  <span>No, es prevención</span>
                </button>
              </div>
            </div>

            {/* Selección de mascota */}
            {lostPet === true && (
              <div className="form-section">
                <div className="section-header">
                  <h2>¿Cuál de tus mascotas?</h2>
                </div>
                
                {pets.length === 0 ? (
                  <div className="no-pets-message">
                    <p>No tienes mascotas registradas aún.</p>
                    <p>¡No te preocupes! Puedes continuar con tu pedido.</p>
                  </div>
                ) : (
                  <div className="pets-grid">
                    {pets.map((pet) => (
                      <div
                        key={pet.id}
                        className={`pet-card ${selectedPetId === pet.id ? 'selected' : ''}`}
                        onClick={() => setSelectedPetId(pet.id)}
                      >
                        <img src={pet.photo} alt={pet.name} className="pet-photo" />
                        <div className="pet-info">
                          <h3>{pet.name}</h3>
                          <p>{pet.breed || 'Sin raza'} • {pet.age} años</p>
                        </div>
                        <div className="selection-indicator">✓</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Opciones de producto */}
            <div className="form-section">
              <div className="section-header">
                <h2>Elige tu producto</h2>
                <p>Todas las opciones incluyen código QR único</p>
              </div>
              
              <div className="products-grid">
                {purchaseOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`product-card ${selectedOption === option.id ? 'selected' : ''} ${!option.available ? 'unavailable' : ''}`}
                    onClick={() => option.available && setSelectedOption(option.id)}
                  >
                    <div className="product-icon">{option.icon}</div>
                    <h3>{option.name}</h3>
                    <p className="product-description">{option.description}</p>
                    <div className="product-price">
                      {option.available ? (
                        <>
                          {option.oldPrice && (
                            <span className="old-price">${option.oldPrice.toLocaleString('es-AR')}</span>
                          )}
                          <span className="price-amount">${option.price.toLocaleString('es-AR')}</span>
                          {option.oldPrice && <span className="launch-badge">Lanzamiento</span>}
                        </>
                      ) : (
                        <span className="coming-soon">Próximamente</span>
                      )}
                    </div>
                    {option.available && <div className="selection-indicator">✓</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp */}
            <div className="form-section">
              <div className="section-header">
                <h2>Tu WhatsApp</h2>
                <p>Te contactaremos para coordinar la entrega</p>
              </div>
              
              <div className="phone-input-container">
                <div className="phone-prefix">+54 9</div>
                <input
                  type="tel"
                  value={userPhone}
                  onChange={handlePhoneChange}
                  placeholder="1123456789"
                  className="phone-input"
                  required
                />
              </div>
              <small className="input-help">Sin 15, solo área + número (ej: 1123456789)</small>
            </div>

            {/* Detalles adicionales */}
            <div className="form-section">
              <div className="section-header">
                <h2>Detalles especiales</h2>
                <p>(Opcional) Cuéntanos algo más</p>
              </div>
              
              <textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Ej: Quiero grabado especial, color específico, entrega urgente..."
                className="details-input"
              />
            </div>

            
            {successMessage && (
              <div className="message success-message">
                <span className="message-icon">✅</span>
                {successMessage}
              </div>
            )}

            {/* Botón de envío */}
            <button
              type="submit"
              className="submit-btn"
              disabled={!selectedOption || !validatePhone()}
            >
              <span className="btn-icon">📱</span>
              <span>Enviar por WhatsApp</span>
              <span className="btn-arrow">→</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Compra;