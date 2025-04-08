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
      setError('Error al cargar las mascotas: ' + (err.detail || err));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedPetId) {
      setError('Por favor selecciona una mascota');
      return;
    }

    if (!userPhone) {
      setError('Por favor ingresa tu número de WhatsApp');
      return;
    }

    try {
      const selectedPet = pets.find(pet => pet.id === selectedPetId);
      
      // Formato para mensaje de WhatsApp (URL encoded)
      const message = encodeURIComponent(
        `Hola, quiero comprar un collar QR para mi mascota *${selectedPet.name}*.\n` +
        `Raza: ${selectedPet.breed || 'No especificada'}\n` +
        `Edad: ${selectedPet.age} años\n` +
        `Información adicional: ${additionalInfo || 'No hay información adicional'}\n\n` +
        `Mi número de contacto es: ${userPhone}`
      );
      
      // Número de WhatsApp del administrador (reemplaza con el número real)
      const adminPhone = '5491112345678';
      
      // Abrir WhatsApp
      window.open(`https://wa.me/${adminPhone}?text=${message}`, '_blank');
      
      setSuccessMessage('¡Te estamos redirigiendo a WhatsApp para completar tu pedido!');
      setTimeout(() => setSuccessMessage(''), 5000);
      
      // Limpiar formulario
      setSelectedPetId(null);
      setUserPhone('');
      setAdditionalInfo('');
      
    } catch (err) {
      setError('Error al procesar la solicitud: ' + err.message);
      console.error(err);
    }
  };

  return (
    <div className="compra-container">
      <div className="compra-content">
        <h2>Solicita un Collar QR para tu mascota</h2>
        
        <div className="compra-info">
          <p>Con nuestros collares QR, podrás:</p>
          <ul>
            <li>Identificar a tu mascota de manera moderna y segura</li>
            <li>Recibir alertas si alguien escanea el QR de tu mascota</li>
            <li>Facilitar que cualquier persona que encuentre a tu mascota pueda contactarte</li>
            <li>Activar alertas en caso de pérdida</li>
          </ul>
          
          <div className="collar-tipos">
            <h3>Disponemos de varios modelos</h3>
            <div className="collar-opciones">
              <div className="collar-tipo">
                <h4>Collar Básico</h4>
                <p>Collar resistente con placa QR impresa</p>
                <p className="precio">$2,500</p>
              </div>
              <div className="collar-tipo">
                <h4>Collar Premium</h4>
                <p>Material de alta calidad y QR grabado láser</p>
                <p className="precio">$3,500</p>
              </div>
              <div className="collar-tipo">
                <h4>Placa QR</h4>
                <p>Solo la placa QR para añadir a tu collar actual</p>
                <p className="precio">$1,200</p>
              </div>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="loading-message">
            <i className="fas fa-spinner"></i>
            <p>Cargando mascotas...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="compra-form">
            <div className="form-group">
              <label>Selecciona la mascota para el collar QR:</label>
              
              {pets.length === 0 ? (
                <p className="no-pets-message">No tienes mascotas registradas. Primero debes registrar una mascota.</p>
              ) : (
                <div className="pet-selection">
                  {pets.map(pet => (
                    <div 
                      key={pet.id} 
                      className={`pet-option ${selectedPetId === pet.id ? 'selected' : ''}`}
                      onClick={() => setSelectedPetId(pet.id)}
                    >
                      <div className="pet-option-content">
                        {pet.photo && (
                          <img 
                            src={pet.photo} 
                            alt={pet.name}
                            className="pet-thumbnail"
                          />
                        )}
                        <div className="pet-details">
                          <h4>{pet.name}</h4>
                          <p>{pet.breed || 'Sin raza especificada'}, {pet.age} años</p>
                        </div>
                        <div className="select-indicator">
                          {selectedPetId === pet.id && <i className="fas fa-check-circle"></i>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="userPhone">Tu número de WhatsApp:</label>
              <input
                type="tel"
                id="userPhone"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                placeholder="Ej: 1123456789"
                required
              />
              <small>Te contactaremos por WhatsApp para confirmar los detalles del pedido</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="additionalInfo">Información adicional (opcional):</label>
              <textarea
                id="additionalInfo"
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Tamaño del collar, color preferido, etc."
                rows={3}
              />
            </div>
            
            {error && (
              <div className="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            {successMessage && (
              <div className="success-message bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                {successMessage}
              </div>
            )}
            
            <button 
              type="submit" 
              className="submit-button"
              disabled={!selectedPetId || !userPhone || pets.length === 0}
            >
              Solicitar por WhatsApp
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Compra; 