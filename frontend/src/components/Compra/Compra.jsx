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
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

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
    { id: 'chapita', name: 'Solo Chapita QR', price: 20000 },
    { id: 'collar-simple', name: 'Collar Básico + QR', price: 27000 },
    { id: 'collar-premium', name: 'Collar Premium + QR', price: 32000 },
  ];

  const colors = ['Negro', 'Azul', 'Rojo', 'Verde', 'Rosa'];
  const sizes = ['Pequeño', 'Mediano', 'Grande'];

  const isCollarSelected = selectedOption && selectedOption !== 'chapita';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPetId || !selectedOption || !userPhone) {
      setError('Por favor completa todos los campos requeridos.');
      return;
    }

    try {
      const selectedPet = pets.find((pet) => pet.id === selectedPetId);
      const option = purchaseOptions.find((opt) => opt.id === selectedOption);
      const message = encodeURIComponent(
        `¡Hola! Quiero comprar un *${option.name}* para mi mascota *${selectedPet.name}*.\n` +
        `Precio: $${option.price} ARS\n` +
        `Raza: ${selectedPet.breed || 'No especificada'}\n` +
        `Edad: ${selectedPet.age} años\n` +
        (isCollarSelected ? `Color: ${color || 'Sin especificar'}\n` : '') +
        (isCollarSelected ? `Tamaño: ${size || 'Sin especificar'}\n` : '') +
        `Detalles: ${additionalInfo || 'Sin detalles adicionales'}\n` +
        `¡Espero tu respuesta para coordinar!`
      );

      const formattedPhone = userPhone.replace(/\D/g, '');
      
      // Usar setTimeout para evitar problemas con el estado de React
      setTimeout(() => {
        const whatsappUrl = `https://wa.me/54${formattedPhone}?text=${message}`;
        const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        
        if (newWindow) {
          newWindow.opener = null;
        }
        
        setSuccessMessage('¡Redirigiéndote a WhatsApp para coordinar tu pedido!');
        
        // Limpiar el formulario después de un pequeño delay
        setTimeout(() => {
          setSelectedPetId(null);
          setSelectedOption(null);
          setColor('');
          setSize('');
          setUserPhone('');
          setAdditionalInfo('');
          setSuccessMessage('');
        }, 3000);
      }, 100);

    } catch (err) {
      console.error('Error al procesar la solicitud:', err);
      setError('Hubo un error al procesar tu solicitud. Por favor intenta de nuevo.');
    }
  };

  return (
    <div className="compra-container">
      <h1>Personaliza tu Collar QR</h1>
      <div className="compra-content">
        <h2>Elige y Personaliza</h2>

        {isLoading ? (
          <div className="loading-message">Cargando...</div>
        ) : (
          <form onSubmit={handleSubmit} className="compra-form">
            {/* Selección de Mascota */}
            <div className="form-group">
              <label>1. ¿Para qué mascota es?</label>
              {pets.length === 0 ? (
                <p>No tienes mascotas registradas. <a href="/register-pet">Registra una aquí</a>.</p>
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

            {/* Selección de Opción de Compra */}
            <div className="form-group">
              <label>2. Elige tu opción</label>
              <div className="options-grid">
                {purchaseOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`option-card ${selectedOption === option.id ? 'selected' : ''}`}
                    onClick={() => setSelectedOption(option.id)}
                  >
                    <h4>{option.name}</h4>
                    <p className="price">${option.price.toLocaleString('es-AR')} ARS</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Personalización (solo si es collar) */}
            {isCollarSelected && (
              <div className="form-group">
                <label>3. Personaliza tu collar</label>
                <div className="customization-options">
                  <select value={color} onChange={(e) => setColor(e.target.value)}>
                    <option value="">Selecciona un color</option>
                    {colors.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <select value={size} onChange={(e) => setSize(e.target.value)}>
                    <option value="">Selecciona un tamaño</option>
                    {sizes.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Teléfono y Detalles */}
            <div className="form-group">
              <label>{isCollarSelected ? '4.' : '3.'} Tu WhatsApp</label>
              <input
                type="tel"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                placeholder="Ej: 1123456789"
                required
              />
            </div>

            <div className="form-group">
              <label>{isCollarSelected ? '5.' : '4.'} Detalles adicionales (opcional)</label>
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
              disabled={!selectedPetId || !selectedOption || !userPhone}
            >
              Enviar Pedido por WhatsApp
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Compra;