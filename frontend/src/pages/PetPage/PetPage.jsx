import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPetByUuid, notifyOwner, sendCommunityNotification } from '../../services/api';
import './PetPage.css';
import { API_URL } from '../../services/api';

const BASE_URL = import.meta.env.VITE_BASE_URL;

const PetPage = () => {
  const { uuid } = useParams();
  const [pet, setPet] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchPetAndNotify = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_URL}/users/me/`, {
          headers: { Authorization: `Token ${localStorage.getItem('token')}` },
        });
        const data = await response.json();
        setUserData(data);

        const petData = await getPetByUuid(uuid);
        setPet(petData);
        setError('');
        console.log("Datos del dueño:", data.user); // Agregar este log
        console.log("Imagen de la mascota:", data.photo);

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };
              await notifyOwner(uuid, location);
              await sendCommunityNotification(uuid, location, 50);
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
      {/* Header con branding */}
      <header className="pet-page-header">
        <div className="logo">
          <h1>CollarMascotaQR</h1>
        </div>
      </header>

      {/* Sección principal */}
      <main className="pet-profile">
        {/* Alerta si la mascota está perdida */}
        {pet.is_lost && (
          <div className="lost-alert">
            <h2>🚨 ¡Estoy perdido! Ayúdame a volver a casa 🚨</h2>
          </div>
        )}

        {/* Sección Héroe (Foto y mensaje principal) */}
        <section className="pet-hero">
          {pet.photo && (
            <div className="pet-photo">
              <img src={petPhotoUrl} alt={pet.name} />
            </div>
          )}
          <h1>¡Hola! Soy {pet.name}</h1>
          <p className="intro-text">
            {pet.is_lost
              ? "Me he perdido y necesito tu ayuda para volver con mi familia. ¡Gracias por escanear mi collar!"
              : "Gracias por escanear mi collar. Aquí tienes toda mi información para que me conozcas mejor."}
          </p>
        </section>

        <section className="pet-details">
          {/* Tarjeta: Información Básica */}
          <div className="detail-card">
            <h2>🐾 Sobre mí</h2>
            <ul>
              <li><strong>Nombre:</strong> {pet.name}</li>
              <li><strong>Edad:</strong> {pet.age} años</li>
              {pet.breed && <li><strong>Raza:</strong> {pet.breed}</li>}
              <li><strong>Género:</strong> {pet.gender === 'M' ? 'Macho' : 'Hembra'}</li>
              <li><strong>Esterilizado:</strong> {pet.is_sterilized ? 'Sí' : 'No'}</li>
              {pet.sterilization_date && (
                <li><strong>Fecha de esterilización:</strong> {new Date(pet.sterilization_date).toLocaleDateString()}</li>
              )}
            </ul>
          </div>

          {/* Tarjeta: Información de Salud */}
          {(pet.medical_conditions || pet.allergies) && (
            <div className="detail-card">
              <h2>🏥 Mi salud</h2>
              <ul>
                {pet.medical_conditions && (
                  <li><strong>Condiciones médicas:</strong> {pet.medical_conditions}</li>
                )}
                {pet.allergies && <li><strong>Alergias:</strong> {pet.allergies}</li>}
              </ul>
            </div>
          )}

          {/* Tarjeta: Información del Veterinario */}
          {(pet.vet_name || pet.vet_phone) && (
            <div className="detail-card">
              <h2>👩‍⚕️ Mi veterinario</h2>
              <ul>
                {pet.vet_name && <li><strong>Nombre:</strong> {pet.vet_name}</li>}
                {pet.vet_phone && (
                  <li>
                    <strong>Teléfono:</strong>{' '}
                    <a href={`tel:${pet.vet_phone}`}>{pet.vet_phone}</a>
                  </li>
                )}
                {pet.vet_address && <li><strong>Dirección:</strong> {pet.vet_address}</li>}
              </ul>
            </div>
          )}

          {/* Tarjeta: Contacto del Dueño */}
          <div className="detail-card">
            <h2>🏡 Mi familia</h2>
            <ul>
              <li><strong>Dirección:</strong> {pet.address}</li>
              <li>
                <strong>Teléfono:</strong>{' '}
                <a href={`tel:${pet.phone}`}>{pet.phone}</a>
              </li>
              {pet.email && (
                <li>
                  <strong>Email:</strong>{' '}
                  <a href={`mailto:${pet.email}`}>{pet.email}</a>
                </li>
              )}
            </ul>
          </div>

          {/* Tarjeta: Notas Adicionales */}
          {pet.notes && (
            <div className="detail-card">
              <h2>📝 Notas especiales</h2>
              <p>{pet.notes}</p>
            </div>
          )}
        </section>

        <section className="contact-buttons">
          <a href={`tel:${pet.phone}`} className="call-button primary">
            📞 Llamar al dueño
          </a>
          {pet.vet_phone && (
            <a href={`tel:${pet.vet_phone}`} className="call-button secondary">
              🩺 Llamar al veterinario
            </a>
          )}
          {pet.email && (
            <a href={`mailto:${pet.email}`} className="email-button">
              ✉️ Enviar email
            </a>
          )}
          {pet.phone && userData && (
            <a
              href={`https://wa.me/549${pet.phone.replace(/^0/, '').replace(/\D/g, '')}?text=${encodeURIComponent(
                `Hola ${userData.first_name}, encontré a ${pet.name} y me gustaría ayudarte a que vuelva a casa. ¿Cómo puedo ayudarte?`
              )}`}
              className="call-button primary"              
              target="_blank"
              rel="noopener noreferrer"
            >
              💬 Enviar WhatsApp al dueño
            </a>
          )}
        </section>

        <section className="marketing-banner">
          <h2>¿Quieres proteger a tu mascota como a {pet.name}?</h2>
          <p>
            Con CollarMascotaQR, tu mejor amigo siempre estará seguro. Escanea, conecta y protege con un solo clic.
          </p>
          <a href="/register" className="cta-button">
            ¡Consigue tu collar ahora!
          </a>
        </section>
      </main>

      <footer className="pet-page-footer">
        <p>© 2025 CollarMascotaQR. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default PetPage;