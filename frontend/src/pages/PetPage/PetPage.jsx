import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPetByUuid, notifyOwner, sendCommunityNotification, checkQRStatus } from '../../services/api';
import './PetPage.css';

const BASE_URL = import.meta.env.VITE_BASE_URL;

// Logo de EncuentraME - Reemplazar con la URL real de tu logo cuando esté disponible
const logoUrl = '/logo_principal.png'; // Asumiendo que el logo está en la carpeta public

// Nuevo componente PetIntro
const PetIntro = ({ name, isLost }) => (
  <div className="pet-intro">
    <p className="intro-text">
      {isLost
        ? `¡Hola! Soy ${name} y me he perdido. Gracias por escanear mi collar y ayudarme a volver con mi familia.`
        : `¡Hola! Soy ${name}. Gracias por escanear mi collar de EncuentraME.`}
    </p>
  </div>
);

const PetPage = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [pet, setPet] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [locationRequested, setLocationRequested] = useState(false);
  const [locationShared, setLocationShared] = useState(false);

  useEffect(() => {
    const fetchPetData = async () => {
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
        setIsLoading(false);
      } catch (err) {
        console.error('Error al obtener datos de la mascota:', err);
        setError('No se pudo obtener la información de la mascota. Por favor, intenta de nuevo.');
        setIsLoading(false);
      }
    };

    fetchPetData();
  }, [uuid, navigate]);

  // Función para solicitar geolocalización explícitamente
  const requestLocation = () => {
    setLocationRequested(true);
    
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
            setLocationError('');
            setLocationShared(true);
          } catch (notificationError) {
            console.error('Error en notificaciones:', notificationError);
            setLocationError('No se pudieron enviar las notificaciones de ubicación.');
          }
        },
        (geoError) => {
          console.error('Geolocalización denegada:', geoError);
          setLocationError('No se pudo obtener la ubicación para enviar notificaciones.');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setLocationError('Geolocalización no soportada por el navegador.');
    }
  };

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
      {/* Encabezado con Branding */}
      <header className={`pet-page-header ${pet.is_lost ? 'lost' : 'found'}`}>
        <div className="brand-container">
          <img src={logoUrl} alt="EncuentraME Logo" className="brand-logo" />
          <div className="brand-text">
            <h1 className="brand-name">EncuentraME</h1>
            <p className="brand-slogan">Un escaneo, un reencuentro</p>
          </div>
        </div>
      </header>

      <main className="pet-profile" role="main">
        {/* Alerta de Mascota Perdida (si aplica) */}
        {pet.is_lost && (
          <div className="lost-alert" role="alert">
            <h2>🚨 ¡{pet.name} está perdido! 🚨</h2>
            <p>Por favor, ayúdanos a devolver a {pet.name} con su familia.</p>
          </div>
        )}

        {/* Solicitud de Ubicación */}
        {!locationRequested && pet.is_lost && (
          <div className="location-request-banner">
            <p>Ayúdanos a notificar al dueño de {pet.name} compartiendo tu ubicación.</p>
            <button 
              className="location-request-button" 
              onClick={requestLocation}
              aria-label="Compartir mi ubicación"
            >
              📍 Compartir mi ubicación
            </button>
          </div>
        )}

        {locationShared && (
          <div className="location-success-banner" role="status">
            <p>¡Gracias por compartir tu ubicación! El dueño ha sido notificado.</p>
          </div>
        )}

        {locationError && (
          <div className="location-error-banner" role="status">
            <p>{locationError}</p>
            <button 
              className="location-retry-button" 
              onClick={requestLocation}
              aria-label="Reintentar compartir ubicación"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Sección Héroe con Foto */}
        <section className="pet-hero" aria-labelledby="pet-name">
          <div className="pet-photo-container">
            <img 
              src={petPhotoUrl} 
              alt={`Foto de ${pet.name}`} 
              className="pet-photo" 
              loading="lazy" 
            />
          </div>
          <h2 id="pet-name" className="pet-name">{pet.name}</h2>
          <PetIntro name={pet.name} isLost={pet.is_lost} />
        </section>

        {/* Tarjetas de Información */}
        <section className="pet-info-cards">
          {/* Información Básica */}
          <div className="info-card">
            <h3>Información Básica</h3>
            <div className="info-content">
              {pet.breed && (
                <div className="info-item">
                  <span className="info-label">Raza</span>
                  <span className="info-value">{pet.breed}</span>
                </div>
              )}
              {pet.age && (
                <div className="info-item">
                  <span className="info-label">Edad</span>
                  <span className="info-value">{pet.age} años</span>
                </div>
              )}
              <div className="info-item">
                <span className="info-label">Género</span>
                <span className="info-value">{pet.gender === 'M' ? 'Macho' : 'Hembra'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Esterilizado</span>
                <span className="info-value">{pet.is_sterilized ? 'Sí' : 'No'}</span>
              </div>
            </div>
          </div>

          {/* Información de Salud (si existe) */}
          {(pet.medical_conditions || pet.allergies) && (
            <div className="info-card">
              <h3>Información de Salud</h3>
              <div className="info-content">
                {pet.medical_conditions && (
                  <div className="info-item">
                    <span className="info-label">Condiciones médicas</span>
                    <span className="info-value">{pet.medical_conditions}</span>
                  </div>
                )}
                {pet.allergies && (
                  <div className="info-item">
                    <span className="info-label">Alergias</span>
                    <span className="info-value">{pet.allergies}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Información del Dueño */}
          <div className="info-card owner-info">
            <h3>Información del Dueño</h3>
            <div className="info-content">
              <div className="info-item">
                <span className="info-label">Nombre</span>
                <span className="info-value">{pet.owner || 'No especificado'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Dirección</span>
                <span className="info-value">{pet.address || 'No especificada'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Botones de Contacto */}
        <section className="contact-section">
          <h3>Contactar al Dueño</h3>
          <div className="contact-buttons">
            <a
              href={`tel:${pet.phone}`}
              className="contact-button primary"
              aria-label={`Llamar al dueño de ${pet.name}`}
            >
              <span className="button-icon">📞</span>
              <span className="button-text">Llamar</span>
            </a>
            
            {pet.phone && (
              <a
                href={`https://wa.me/549${pet.phone.replace(/^0/, '').replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Hola, encontré a ${pet.name} y me gustaría ayudarte a que vuelva a casa.`
                )}`}
                className="contact-button whatsapp"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Enviar mensaje de WhatsApp al dueño de ${pet.name}`}
              >
                <span className="button-icon">💬</span>
                <span className="button-text">WhatsApp</span>
              </a>
            )}
            
            {pet.email && (
              <a
                href={`mailto:${pet.email}`}
                className="contact-button secondary"
                aria-label={`Enviar email al dueño de ${pet.name}`}
              >
                <span className="button-icon">✉️</span>
                <span className="button-text">Email</span>
              </a>
            )}
          </div>
        </section>

        {/* Veterinario (si existe información) */}
        {(pet.vet_name || pet.vet_phone || pet.vet_address) && (
          <section className="vet-section">
            <h3>Información del Veterinario</h3>
            <div className="vet-info">
              {pet.vet_name && (
                <div className="info-item">
                  <span className="info-label">Nombre</span>
                  <span className="info-value">{pet.vet_name}</span>
                </div>
              )}
              {pet.vet_address && (
                <div className="info-item">
                  <span className="info-label">Dirección</span>
                  <span className="info-value">{pet.vet_address}</span>
                </div>
              )}
              {pet.vet_phone && (
                <div className="contact-buttons vet-contact">
                  <a
                    href={`tel:${pet.vet_phone}`}
                    className="contact-button secondary"
                    aria-label={`Llamar al veterinario de ${pet.name}`}
                  >
                    <span className="button-icon">🩺</span>
                    <span className="button-text">Llamar al Veterinario</span>
                  </a>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Notas Especiales (si existen) */}
        {pet.notes && (
          <section className="notes-section">
            <h3>Notas Especiales</h3>
            <p className="pet-notes">{pet.notes}</p>
          </section>
        )}

        {/* Banner de Marketing */}
        <section className="marketing-section">
          <div className="marketing-content">
            <h3>Protege a tu mascota con EncuentraME</h3>
            <p>Identifica a tu mascota con nuestra tecnología QR y asegura su regreso a casa si alguna vez se pierde.</p>
            <a href="/register" className="cta-button" aria-label="Registrarse en EncuentraME">
              Consigue tu EncuentraME
            </a>
          </div>
        </section>
      </main>

      
    </div>
  );
};

export default PetPage;
