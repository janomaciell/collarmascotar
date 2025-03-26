import React from 'react';
import './PetList.css';

const PetList = ({ pets, onToggleLost, onShowHistory }) => {
  return (
    <div className="pet-list">
      {pets.length === 0 ? (
        <p className="no-pets-message">No tienes mascotas registradas aún.</p>
      ) : (
        pets.map(pet => (
          <div key={pet.id} className="pet-card">
            <div className="pet-card-content">
              <div className="pet-info">
                <h3>{pet.name}</h3>
                <p><strong>Edad:</strong> {pet.age} años</p>
                {pet.breed && <p><strong>Raza:</strong> {pet.breed}</p>}
                <p><strong>Teléfono:</strong> {pet.phone}</p>
              </div>
              <div className="pet-qr">
                {pet.qr_code && (
                  <img 
                    src={pet.qr_code} 
                    alt={`Código QR de ${pet.name}`}
                    className="qr-image"
                  />
                )}
                <a 
                  href={pet.qr_code} 
                  download={`qr_${pet.name}.png`}
                  className="download-button"
                >
                  Descargar QR
                </a>
              </div>
              <button onClick={() => onToggleLost(pet.id, pet.is_lost)}>
                {pet.is_lost ? 'Marcar como encontrada' : 'Marcar como perdida'}
              </button>
              <button onClick={() => onShowHistory(pet.id)}>Ver Historial</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default PetList; 