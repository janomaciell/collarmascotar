import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPetByUuid } from '../../services/api';
import './PetPage.css';

const PetPage = () => {
  const { uuid } = useParams();
  const [pet, setPet] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPet = async () => {
      try {
        setIsLoading(true);
        const data = await getPetByUuid(uuid);
        setPet(data);
      } catch (err) {
        setError('No se pudo encontrar la información de esta mascota.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPet();
  }, [uuid]);

  if (isLoading) {
    return <div className="loading">Cargando información de la mascota...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  if (!pet) {
    return <div className="not-found">Mascota no encontrada</div>;
  }

  return (
    <div className="pet-page-container">
      <div className="pet-profile">
        <h1>¡Has encontrado a {pet.name}!</h1>
        
        <div className="pet-details">
          <div className="detail-group">
            <h2>Información de la Mascota</h2>
            <p><strong>Nombre:</strong> {pet.name}</p>
            <p><strong>Edad:</strong> {pet.age} años</p>
            {pet.breed && <p><strong>Raza:</strong> {pet.breed}</p>}
          </div>
          
          <div className="detail-group">
            <h2>Contacto del Dueño</h2>
            <p><strong>Dirección:</strong> {pet.address}</p>
            <p><strong>Teléfono:</strong> <a href={`tel:${pet.phone}`}>{pet.phone}</a></p>
          </div>
          
          {pet.notes && (
            <div className="detail-group">
              <h2>Notas Adicionales</h2>
              <p>{pet.notes}</p>
            </div>
          )}
        </div>
        
        <div className="contact-buttons">
          <a href={`tel:${pet.phone}`} className="call-button">
            Llamar al Dueño
          </a>
        </div>
      </div>
    </div>
  );
};

export default PetPage; 