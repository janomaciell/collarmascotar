import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPetByUuid, notifyOwner, sendCommunityNotification, checkQRStatus } from '../../services/api';
import './PetPage.css';

const BASE_URL = import.meta.env.VITE_BASE_URL;

const PetPage = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [pet, setPet] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPetAndNotify = async () => {
      try {
        setIsLoading(true);

        // Verificar si el QR está asignado
        const qrStatus = await checkQRStatus(uuid);
        if (!qrStatus.is_assigned) {
          navigate(`/register-pet/${uuid}`);
          return;
        }

        // Obtener datos de la mascota
        const petData = await getPetByUuid(uuid);
        setPet(petData);

        // Notificar al dueño y a la comunidad si hay geolocalización
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };
              try {
                await notifyOwner(uuid, location);
                await sendCommunityNotification(uuid, location, 50);
              } catch (notificationError) {
                console.error('Error en notificaciones:', notificationError);
                setError('Mascota encontrada, pero no se pudo enviar notificaciones.');
              }
            },
            (geoError) => {
              console.error('Geolocalización denegada:', geoError);
              setError('No se pudo obtener la ubicación para enviar notificaciones.');
            },
            { enableHighAccuracy: true, timeout: 5000 }
          );
        } else {
          setError('Geolocalización no soportada por el navegador.');
        }
      } catch (err) {
        console.error('Error en el proceso:', err);
        setError('No se pudo obtener la información de la mascota. Por favor, intenta de nuevo.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPetAndNotify();
  }, [uuid, navigate]);

  if (isLoading) {
    return (
      <div className="loading-container" role="status" aria-live="polite">
        <div className="spinner"></div>
        <p>Cargando información de la mascota...</p>
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="error-container" role="alert">
        {error || 'No se encontró la mascota.'}
      </div>
    );
  }

  const petPhotoUrl = pet.photo?.startsWith('http') ? pet.photo : `${BASE_URL}${pet.photo}`;

  return (
    <div className="pet-page-container">
      <header className="pet-page-header">
        <div className="logo">
          <h1>{pet.is_lost ? "MASCOTA PERDIDA" : `ENCONTRASTE A ${pet.name}`}</h1>
        </div>
      </header>

      <main className="pet-profile" role="main">
        {pet.is_lost && (
          <div className="lost-alert" role="alert">
            <h2>🚨 ¡{pet.name} está perdido! 🚨</h2>
            <p>Por favor, ayúdanos a devolver a {pet.name} con su familia. Contacta al dueño lo antes posible.</p>
          </div>
        )}

        <section className="pet-hero" aria-labelledby="pet-name">
          {pet.photo && (
            <div className="pet-photo">
              <img src={petPhotoUrl} alt={`Foto de ${pet.name}`} loading="lazy" />
            </div>
          )}
          <h1 id="pet-name">¡Hola! Soy {pet.name}</h1>
          <p className="intro-text">
            {pet.is_lost
              ? 'Me he perdido y necesito tu ayuda para volver con mi familia. ¡Gracias por escanear mi collar!'
              : 'Gracias por escanear mi collar. Aquí tienes toda mi información para que me conozcas mejor.'}
          </p>
        </section>

        <section className="pet-details" aria-label="Detalles de la mascota">
          <div className="detail-card" aria-labelledby="about-me">
            <h2 id="about-me">🐾 Sobre mí</h2>
            <ul>
              <li><strong>Nombre:</strong> {pet.name}</li>
              <li><strong>Edad:</strong> {pet.age} años</li>
              {pet.breed && <li><strong>Raza:</strong> {pet.breed}</li>}
              <li><strong>Género:</strong> {pet.gender === 'M' ? 'Macho' : 'Hembra'}</li>
              <li><strong>Esterilizado:</strong> {pet.is_sterilized ? 'Sí' : 'No'}</li>
              {pet.sterilization_date && (
                <li>
                  <strong>Fecha de esterilización:</strong>{' '}
                  {new Date(pet.sterilization_date).toLocaleDateString()}
                </li>
              )}
            </ul>
          </div>

          {(pet.medical_conditions || pet.allergies) && (
            <div className="detail-card" aria-labelledby="health">
              <h2 id="health">🏥 Mi salud</h2>
              <ul>
                {pet.medical_conditions && (
                  <li><strong>Condiciones médicas:</strong> {pet.medical_conditions}</li>
                )}
                {pet.allergies && <li><strong>Alergias:</strong> {pet.allergies}</li>}
              </ul>
            </div>
          )}

          {(pet.vet_name || pet.vet_phone || pet.vet_address) && (
            <div className="detail-card" aria-labelledby="vet">
              <h2 id="vet">👩‍⚕️ Mi veterinario</h2>
              <ul>
                {pet.vet_name && <li><strong>Nombre:</strong> {pet.vet_name}</li>}
                {pet.vet_phone && (
                  <li>
                    <strong>Teléfono:</strong>{' '}
                    <a href={`tel:${pet.vet_phone}`} aria-label={`Llamar al veterinario al ${pet.vet_phone}`}>
                      {pet.vet_phone}
                    </a>
                  </li>
                )}
                {pet.vet_address && <li><strong>Dirección:</strong> {pet.vet_address}</li>}
              </ul>
            </div>
          )}

          <div className="detail-card" aria-labelledby="family">
            <h2 id="family">🏡 Mi familia</h2>
            <ul>
              <li><strong>Dirección:</strong> {pet.address}</li>
              <li>
                <strong>Teléfono:</strong>{' '}
                <a href={`tel:${pet.phone}`} aria-label={`Llamar al dueño al ${pet.phone}`}>
                  {pet.phone}
                </a>
              </li>
              {pet.email && (
                <li>
                  <strong>Email:</strong>{' '}
                  <a href={`mailto:${pet.email}`} aria-label={`Enviar email a ${pet.email}`}>
                    {pet.email}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {pet.notes && (
            <div className="detail-card" aria-labelledby="notes">
              <h2 id="notes">📝 Notas especiales</h2>
              <p>{pet.notes}</p>
            </div>
          )}
        </section>

        <section className="contact-buttons" aria-label="Opciones de contacto">
          <a
            href={`tel:${pet.phone}`}
            className="call-button primary"
            aria-label={`Llamar al dueño de ${pet.name}`}
          >
            📞 Llamar al dueño
          </a>
          {pet.vet_phone && (
            <a
              href={`tel:${pet.vet_phone}`}
              className="call-button secondary"
              aria-label={`Llamar al veterinario de ${pet.name}`}
            >
              🩺 Llamar al veterinario
            </a>
          )}
          {pet.email && (
            <a
              href={`mailto:${pet.email}`}
              className="email-button"
              aria-label={`Enviar email al dueño de ${pet.name}`}
            >
              ✉️ Enviar email
            </a>
          )}
          {pet.phone && (
            <a
              href={`https://wa.me/549${pet.phone.replace(/^0/, '').replace(/\D/g, '')}?text=${encodeURIComponent(
                `Hola, encontré a ${pet.name} y me gustaría ayudarte a que vuelva a casa. ¿Cómo puedo ayudarte?`
              )}`}
              className="call-button primary whatsapp"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Enviar mensaje de WhatsApp al dueño de ${pet.name}`}
            >
              💬 Enviar WhatsApp
            </a>
          )}
        </section>

        <section className="marketing-banner" aria-label="Promoción de CollarMascotaQR">
          <h2>¿Quieres proteger a tu mascota como a {pet.name}?</h2>
          <p>
            Con CollarMascotaQR, tu mejor amigo siempre estará seguro. Escanea, conecta y protege con un solo clic.
          </p>
          <a href="/register" className="cta-button" aria-label="Registrarse en CollarMascotaQR">
            ¡Consigue tu collar ahora!
          </a>
        </section>
      </main>

    </div>
  );
};

export default PetPage;