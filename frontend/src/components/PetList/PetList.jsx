import React from 'react';
import './PetList.css';
import { FaEdit } from 'react-icons/fa';

const PetList = ({ pets, onToggleLost, onShowHistory, onEdit }) => {
  return (
    <div className="pet-list">
      {pets.length === 0 ? (
        <p className="no-pets-message">No tienes mascotas registradas aún.</p>
      ) : (
        pets.map((pet) => (
          <div key={pet.id} className="pet-card">
            <div className="pet-card-content">
              <div className="pet-info">
                <h3>{pet.name}</h3>
                <p><strong>Edad:</strong> {pet.age} años</p>
                {pet.breed && <p><strong>Raza:</strong> {pet.breed}</p>}
                <p><strong>Teléfono:</strong> {pet.phone}</p>
              </div>
              
              <div className="pet-actions">
                <button
                  className="edit-btn"
                  onClick={() => onEdit(pet)}
                >
                  <FaEdit /> Editar
                </button>
                
                <button
                  className={`toggle-lost-btn ${pet.is_lost ? 'is-lost' : ''}`}
                  onClick={() => onToggleLost(pet.id, pet.is_lost)}
                >
                  {pet.is_lost ? 'Marcar como encontrada' : 'Marcar como perdida'}
                </button>
                
                <button
                  className="history-btn"
                  onClick={() => onShowHistory(pet.id)}
                >
                  Ver Historial
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default PetList;