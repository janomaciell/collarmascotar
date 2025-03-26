import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPetByUuid, notifyOwner, sendCommunityNotification } from '../../services/api';
import './PetPage.css';

const BASE_URL = import.meta.env.VITE_BASE_URL;

const PetPage = () => {
  const { uuid } = useParams();
  const [pet, setPet] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPetAndNotify = async () => {
      try {
        setIsLoading(true);
        const data = await getPetByUuid(uuid);
        setPet(data);
        console.log("Imagen de la mascota:", data.photo);

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };
              await notifyOwner(uuid, location); // Notificar al dueño
              await sendCommunityNotification(uuid, location, 50); // Notificar a la comunidad (50 km)
            },
            (err) => {
              console.error('Geolocalización denegada:', err);
              setError('No se pudo obtener la ubicación del escáner.');
            },
            { enableHighAccuracy: true, timeout: 5000 }
          );
        } else {
          setError('Geolocalización no soportada por el navegador.');
        }
      } catch (err) {
        setError('No se pudo encontrar la información de esta mascota: ' + (err.detail || err.message));
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPetAndNotify();
  }, [uuid]);

  if (isLoading) return <div className="loading">Cargando información de la mascota...</div>;
  if (error) return <div className="error-container">{error}</div>;
  if (!pet) return <div className="not-found">Mascota no encontrada</div>;

  const petPhotoUrl = pet.photo?.startsWith("http") ? pet.photo : `${BASE_URL}${pet.photo}`;

  return (
    <div className="pet-page-container">
      <div className="pet-profile">
        {pet.is_lost && (
          <div className="lost-alert">
            <h2>¡Estoy perdido! Por favor, ayuda a contactar a mi dueño</h2>
          </div>
        )}

        {pet.photo && (
          <div className="pet-photo">
            <img src={petPhotoUrl} alt={pet.name} />
          </div>
        )}

        <h1>¡Has encontrado a {pet.name}!</h1>
        
        <div className="pet-details">
          <div className="detail-group">
            <h2>Información Básica</h2>
            <p><strong>Nombre:</strong> {pet.name}</p>
            <p><strong>Edad:</strong> {pet.age} años</p>
            {pet.breed && <p><strong>Raza:</strong> {pet.breed}</p>}
            <p><strong>Género:</strong> {pet.gender === 'M' ? 'Macho' : 'Hembra'}</p>
            <p><strong>Esterilizado:</strong> {pet.is_sterilized ? 'Sí' : 'No'}</p>
            {pet.sterilization_date && (
              <p><strong>Fecha de esterilización:</strong> {new Date(pet.sterilization_date).toLocaleDateString()}</p>
            )}
          </div>
          
          <div className="detail-group">
            <h2>Información de Salud</h2>
            {pet.medical_conditions && (
              <div className="health-info">
                <h3>Condiciones Médicas</h3>
                <p>{pet.medical_conditions}</p>
              </div>
            )}
            {pet.allergies && (
              <div className="health-info">
                <h3>Alergias</h3>
                <p>{pet.allergies}</p>
              </div>
            )}
          </div>

          <div className="detail-group">
            <h2>Información del Veterinario</h2>
            {pet.vet_name && <p><strong>Veterinario:</strong> {pet.vet_name}</p>}
            {pet.vet_phone && (
              <p>
                <strong>Teléfono del Veterinario:</strong>{' '}
                <a href={`tel:${pet.vet_phone}`}>{pet.vet_phone}</a>
              </p>
            )}
          </div>
          
          <div className="detail-group">
            <h2>Contacto del Dueño</h2>
            <p><strong>Dirección:</strong> {pet.address}</p>
            <p>
              <strong>Teléfono:</strong>{' '}
              <a href={`tel:${pet.phone}`}>{pet.phone}</a>
            </p>
            {pet.email && (
              <p>
                <strong>Email:</strong>{' '}
                <a href={`mailto:${pet.email}`}>{pet.email}</a>
              </p>
            )}
          </div>
          
          {pet.notes && (
            <div className="detail-group">
              <h2>Notas Adicionales</h2>
              <p>{pet.notes}</p>
            </div>
          )}
        </div>
        
        <div className="contact-buttons">
          <a href={`tel:${pet.phone}`} className="call-button primary">
            Llamar al Dueño
          </a>
          {pet.vet_phone && (
            <a href={`tel:${pet.vet_phone}`} className="call-button secondary">
              Llamar al Veterinario
            </a>
          )}
          {pet.email && (
            <a href={`mailto:${pet.email}`} className="email-button">
              Enviar Email
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default PetPage;