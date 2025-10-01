import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPetByUuid, notifyOwner, sendCommunityNotification, checkQRStatus } from '../../services/api';
import './PetPage.css';

const BASE_URL = import.meta.env.VITE_BASE_URL;

const PetIntro = ({ name, isLost }) => (
  <div className="pet-intro">
    <p className="intro-text">
      {isLost
        ? `¡Hola! Soy ${name} y me he perdido. Gracias por escanear mi collar EncuéntraME y ayudarme a volver con mi familia.`
        : `¡Hola! Soy ${name}. Gracias por escanear mi collar EncuéntraME. Mi familia y yo estamos muy agradecidos.`}
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

  const logoUrl = 'src/img/logo.png';
  const mascotaImage = 'src/img/personaje2.png';

  useEffect(() => {
    const fetchPetData = async () => {
      try {
        setIsLoading(true);
        const qrStatus = await checkQRStatus(uuid);
        if (!qrStatus.is_assigned) {
          navigate(`/register-pet/${uuid}`);
          return;
        }
        const petData = await getPetByUuid(uuid);
        setPet(petData);
        setIsLoading(false);
      } catch (err) {
        setError('No se pudo obtener la información de la mascota. Por favor, intenta de nuevo.');
        setIsLoading(false);
      }
    };
    fetchPetData();
  }, [uuid, navigate]);

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
          } catch {
            setLocationError('No se pudieron enviar las notificaciones de ubicación.');
          }
        },
        () => {
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
      <div className="pet-page-wrapper">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando información de la mascota...</p>
        </div>
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="pet-page-wrapper">
        <div className="error-container">
          <span className="error-icon">⚠️</span>
          <h2>Error</h2>
          <p>{error || 'No se encontró la mascota.'}</p>
        </div>
      </div>
    );
  }

  const petPhotoUrl = pet.photo?.startsWith('http') ? pet.photo : `${BASE_URL}${pet.photo}`;

  return (
    <div className="pet-page-wrapper">
      {/* Header con branding fuerte */}
      <header className={`pet-header ${pet.is_lost ? 'lost-header' : 'normal-header'}`}>
        <div className="pattern-bg"></div>
        <div className="header-content">
          <div className="brand-section">
            <img src={logoUrl} alt="EncuéntraME Logo" className="brand-logo" />
            <div className="brand-info">
              <h1 className="brand-name">ENCUÉNTRAME</h1>
              <p className="brand-tagline">Mascotas seguras, familias tranquilas</p>
            </div>
          </div>
          <img src={mascotaImage} alt="Mascota EncuentraME" className="header-mascot" />
        </div>
      </header>

      <main className="pet-content">
        {/* Alerta de mascota perdida */}
        {pet.is_lost && (
          <div className="pet-alert">
            <div>
              <strong>¡Mascota perdida!</strong>
              <div>Si encontraste a {pet.name}, sigue los pasos para ayudarlo a volver a casa.</div>
            </div>
            <button className="alert-btn" onClick={requestLocation}>
              Activar alerta
            </button>
          </div>
        )}

        {/* Hero de la mascota */}
        <section className="pet-hero">
          <div className="pet-photo-container">
            <img 
              src={petPhotoUrl} 
              alt={`Foto de ${pet.name}`} 
              className="pet-photo" 
            />
            {pet.is_lost && <div className="lost-badge">Perdido</div>}
          </div>
          <div className="pet-basic-info">
            <h2 className="pet-name">{pet.name}</h2>
            <div className="pet-details">
              {pet.breed}, {pet.gender === 'M' ? 'Macho' : 'Hembra'}, {pet.age} años
            </div>
            <PetIntro name={pet.name} isLost={pet.is_lost} />
          </div>
          <div className="pet-actions">
            <button className="action-btn">Editar perfil</button>
            <a href={`tel:${pet.phone}`} className="action-btn secondary">Llamar dueño</a>
            <a href={`mailto:${pet.email}`} className="action-btn secondary">Mensaje dueño</a>
          </div>
        </section>

        {/* Tabs */}
        <div className="pet-tabs">
          <button className="pet-tab active">Información básica</button>
          <button className="pet-tab">Salud</button>
          <button className="pet-tab">Dueño y veterinario</button>
        </div>

        {/* Información básica */}
        <section className="pet-section">
          <div className="pet-section-title">Basic Information</div>
          <div className="pet-info-grid">
            <div className="info-card">
              <div className="info-label">Breed</div>
              <div className="info-value">{pet.breed}</div>
            </div>
            <div className="info-card">
              <div className="info-label">Gender</div>
              <div className="info-value">{pet.gender === 'M' ? 'Male' : 'Female'}</div>
            </div>
            <div className="info-card">
              <div className="info-label">Age</div>
              <div className="info-value">{pet.age} years</div>
            </div>
            <div className="info-card">
              <div className="info-label">Weight</div>
              <div className="info-value">{pet.weight || '-'}</div>
            </div>
            <div className="info-card">
              <div className="info-label">Color</div>
              <div className="info-value">{pet.color || '-'}</div>
            </div>
            <div className="info-card">
              <div className="info-label">Microchip ID</div>
              <div className="info-value">{pet.microchip || '-'}</div>
            </div>
          </div>
        </section>

        {/* Información de salud */}
        <section className="pet-section">
          <div className="pet-section-title">Health Information</div>
          <div className="pet-info-grid">
            <div className="info-card">
              <div className="info-label">Vaccination Status</div>
              <div className="info-value">{pet.vaccines || 'Up to date'}</div>
            </div>
            <div className="info-card">
              <div className="info-label">Last Vet Visit</div>
              <div className="info-value">{pet.last_vet_visit || '-'}</div>
            </div>
            <div className="info-card">
              <div className="info-label">Allergies</div>
              <div className="info-value">{pet.allergies || 'None'}</div>
            </div>
            <div className="info-card">
              <div className="info-label">Medications</div>
              <div className="info-value">{pet.medications || 'None'}</div>
            </div>
          </div>
        </section>

        {/* Información del dueño y veterinario */}
        <section className="pet-section">
          <div className="pet-section-title">Owner & Vet Information</div>
          <div className="pet-info-grid">
            <div className="info-card">
              <div className="info-label">Owner Name</div>
              <div className="info-value">{pet.owner || '-'}</div>
            </div>
            <div className="info-card">
              <div className="info-label">Contact Number</div>
              <div className="info-value">{pet.phone || '-'}</div>
            </div>
            <div className="info-card">
              <div className="info-label">Address</div>
              <div className="info-value">{pet.address || '-'}</div>
            </div>
            <div className="info-card">
              <div className="info-label">Vet Name</div>
              <div className="info-value">{pet.vet_name || '-'}</div>
            </div>
            <div className="info-card">
              <div className="info-label">Clinic Name</div>
              <div className="info-value">{pet.vet_clinic || '-'}</div>
            </div>
            <div className="info-card">
              <div className="info-label">Vet Contact</div>
              <div className="info-value">{pet.vet_phone || '-'}</div>
            </div>
          </div>
        </section>

        {/* Notas especiales */}
        <section className="pet-section">
          <div className="pet-section-title">Special Notes</div>
          <div className="pet-notes">{pet.notes || 'No special notes.'}</div>
        </section>

        {/* Compartir perfil */}
        <section className="share-section">
          <div className="share-title">Share {pet.name}'s Profile</div>
          <div className="share-desc">
            Share {pet.name}'s profile with friends, family, or pet sitters to keep everyone informed about his care and needs.
          </div>
          <button className="share-btn">Share Profile</button>
        </section>
      </main>

      {/* Footer */}
      <footer className="pet-footer">
        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact Us</a>
        </div>
        <div className="footer-text">
          © 2024 EncuéntraME. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
};

export default PetPage;