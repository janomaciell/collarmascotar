import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPetByUuid, notifyOwner, sendCommunityNotification, checkQRStatus } from '../../services/api';
import './PetPage.css';
import mascotaImage from '../../img/personaje2.png';
import { FaExclamationTriangle, FaPhone, FaWhatsapp, FaEnvelope ,FaMapMarkerAlt} from 'react-icons/fa';

const BASE_URL = import.meta.env.VITE_BASE_URL;
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

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
  const [activeTab, setActiveTab] = useState('basic');
  const [locationAttempts, setLocationAttempts] = useState(0);
  const [showHelpButton, setShowHelpButton] = useState(false);
  const locationSentRef = useRef(false); // Para evitar múltiples envíos
  const retryTimeoutRef = useRef(null); // Para limpiar timeouts

  // Referencias para scroll
  const basicRef = useRef(null);
  const healthRef = useRef(null);
  const ownerRef = useRef(null);

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

  // Función para intentar obtener y enviar ubicación
  const attemptLocationRequest = (attemptNumber = 1) => {
    if (isDevelopment) {
      console.log(`[PetPage] Intento ${attemptNumber} de obtener ubicación`);
    }
    
    if (!navigator.geolocation) {
      console.error('[PetPage] Geolocalización no soportada por el navegador');
      setLocationError('Geolocalización no soportada por el navegador.');
      setShowHelpButton(true);
      return;
    }

    setLocationRequested(true);
    
    const geoOptions = {
      enableHighAccuracy: false, // Cambiado a false para mejor compatibilidad
      timeout: 10000, // Aumentado a 10 segundos
      maximumAge: 60000 // Cache de 1 minuto
    };
    
    if (isDevelopment) {
      console.log('[PetPage] Solicitando ubicación con opciones:', geoOptions);
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (isDevelopment) {
          console.log('[PetPage] Ubicación obtenida exitosamente:', position.coords);
        }
        
        // Crear objeto de ubicación limpio
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        
        // Log detallado ANTES de enviar (solo en desarrollo)
        if (isDevelopment) {
          console.log('[PetPage] Objeto location a enviar:', location);
          console.log('[PetPage] JSON.stringify(location):', JSON.stringify(location));
          console.log('[PetPage] Tipo de latitude:', typeof location.latitude);
          console.log('[PetPage] Tipo de longitude:', typeof location.longitude);
        }
        
        try {
          // Enviar notificación al dueño
          if (isDevelopment) {
            console.log('[PetPage] Llamando a notifyOwner...');
          }
          const response = await notifyOwner(uuid, location);
          if (isDevelopment) {
            console.log('[PetPage] Respuesta de notifyOwner:', response);
          }
          
          if (pet?.is_lost) {
            if (isDevelopment) {
              console.log('[PetPage] Enviando notificación a comunidad...');
            }
            const communityResponse = await sendCommunityNotification(uuid, location, 50);
            if (isDevelopment) {
              console.log('[PetPage] Respuesta de comunidad:', communityResponse);
            }
          }
          
          setLocationError('');
          setLocationShared(true);
          setShowHelpButton(false);
          
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
          }
        } catch (err) {
          console.error('[PetPage] Error completo:', err);
          console.error('[PetPage] Error response:', err.response);
          console.error('[PetPage] Error data:', err.response?.data);
          console.error('[PetPage] Error status:', err.response?.status);
          console.error('[PetPage] Error config:', err.config);
          
          setLocationError('No se pudieron enviar las notificaciones de ubicación.');
          setShowHelpButton(true);
        }
      },
      (err) => {
        console.error(`[PetPage] Error obteniendo ubicación (intento ${attemptNumber}):`, err);
        if (isDevelopment) {
          console.error('[PetPage] Tipo de error:', {
            code: err.code,
            message: err.message,
            PERMISSION_DENIED: err.PERMISSION_DENIED,
            POSITION_UNAVAILABLE: err.POSITION_UNAVAILABLE,
            TIMEOUT: err.TIMEOUT
          });
        }
        
        setLocationAttempts(attemptNumber);
        
        // Si es el último intento (3), mostrar el botón de ayuda
        if (attemptNumber >= 3) {
          setLocationError('No se pudo obtener tu ubicación después de varios intentos. Por favor, comparte tu ubicación manualmente para ayudar al dueño.');
          setShowHelpButton(true);
        } else {
          // Intentar de nuevo después de 3 segundos
          setLocationError(`Solicitando ubicación... (Intento ${attemptNumber}/3)`);
          retryTimeoutRef.current = setTimeout(() => {
            attemptLocationRequest(attemptNumber + 1);
          }, 3000);
        }
      },
      geoOptions
    );
  };

  // Efecto para enviar ubicación automáticamente al cargar la página
  useEffect(() => {
    if (isDevelopment) {
      console.log('[PetPage] useEffect ejecutado - Estado:', {
        pet: !!pet,
        isLoading,
        locationSentRef: locationSentRef.current,
        locationShared
      });
    }
    
    // Solo ejecutar si hay datos de mascota, no está cargando, y no se ha enviado ya la ubicación
    if (!pet || isLoading || locationSentRef.current || locationShared) {
      if (isDevelopment) {
        console.log('[PetPage] Condiciones no cumplidas, saliendo del useEffect');
      }
      return;
    }

    if (isDevelopment) {
      console.log('[PetPage] Iniciando solicitud de ubicación automática');
    }
    
    // Marcar que intentamos enviar la ubicación
    locationSentRef.current = true;
    
    // Iniciar primer intento
    attemptLocationRequest(1);

    // Limpiar timeout al desmontar
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [pet, isLoading, uuid, locationShared]);

  const requestLocation = () => {
    // Resetear intentos y ocultar botón de ayuda si se intenta manualmente
    setLocationAttempts(0);
    setShowHelpButton(false);
    setLocationError('');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          try {
            await notifyOwner(uuid, location);
            if (pet?.is_lost) {
              await sendCommunityNotification(uuid, location, 50);
            }
            setLocationError('');
            setLocationShared(true);
            setShowHelpButton(false);
          } catch {
            setLocationError('No se pudieron enviar las notificaciones de ubicación.');
            setShowHelpButton(true);
          }
        },
        () => {
          setLocationError('No se pudo obtener la ubicación para enviar notificaciones.');
          setShowHelpButton(true);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setLocationError('Geolocalización no soportada por el navegador.');
      setShowHelpButton(true);
    }
  };

  // Función para enviar WhatsApp
  const handleWhatsApp = () => {
    if (!pet.phone) return;
    
    // Limpiar el número de teléfono (eliminar espacios, guiones, paréntesis)
    const phoneNumber = pet.phone.replace(/[^\d+]/g, '');
    
    // Mensaje predeterminado
    const message = pet.is_lost 
      ? `Hola, encontré a ${pet.name}. Escaneé su collar EncuéntraME y quiero ayudar a que regrese a casa.`
      : `Hola, escaneé el collar EncuéntraME de ${pet.name}.`;
    
    // URL de WhatsApp con el mensaje
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    // Abrir WhatsApp en una nueva pestaña
    window.open(whatsappUrl, '_blank');
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    let ref;
    if (tab === 'basic') ref = basicRef;
    if (tab === 'health') ref = healthRef;
    if (tab === 'owner') ref = ownerRef;
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
          <span className="error-icon"><FaExclamationTriangle /></span>
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
            <div className="brand-info">
              <h1 className="brand-name">ENCUÉNTRAME</h1>
              <p className="brand-tagline">Mascotas seguras, familias tranquilas</p>
            </div>
          </div>
          <img src={mascotaImage} alt="Mascota EncuentraME" className="header-mascot" />
        </div>
      </header>

      <main className="pet-content">
        {/* Banner de ayuda prominente - aparece después de 3 intentos fallidos */}
        {showHelpButton && !locationShared && (
          <div className="help-banner">
            <div className="help-banner-content">
              <div className="help-banner-icon"><FaMapMarkerAlt /></div>
              <div className="help-banner-text">
                <strong>¡Ayuda a encontrar a {pet.name}!</strong>
                <p>Comparte tu ubicación para notificar al dueño y ayudar a que {pet.name} regrese a casa.</p>
              </div>
              <button className="help-banner-btn" onClick={requestLocation}>
                Compartir ubicación
              </button>
            </div>
          </div>
        )}

        {/* Mensaje de estado de ubicación */}
        {locationError && (
          <div className={`location-status ${showHelpButton ? 'location-status-error' : 'location-status-info'}`}>
            {locationError}
          </div>
        )}

        {/* Mensaje de éxito */}
        {locationShared && (
          <div className="location-status location-status-success">
            ✅ Ubicación compartida exitosamente. El dueño ha sido notificado.
          </div>
        )}

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
        <section className="pet-hero-petpage">
          <div className="pet-photo-container">
            <img 
              src={petPhotoUrl} 
              alt={`Foto de ${pet.name}`} 
              className="pet-photo-petpage" 
            />
            {pet.is_lost && <div className="lost-badge">Perdido</div>}
          </div>
          <div className="pet-basic-info">
            <h2 className="pet-name-petpage" style={{ fontSize: '2.8rem', marginBottom: '0.7rem' }}>{pet.name}</h2>
            <div className="pet-details" style={{
              fontSize: '1.3rem',
              fontWeight: '700',
              color: '#05408F',
              marginBottom: '1.2rem',
              letterSpacing: '0.5px'
            }}>
              {pet.breed} &nbsp;|&nbsp; {pet.gender === 'M' ? 'Macho' : 'Hembra'} &nbsp;|&nbsp; {pet.age} años
            </div>
            <PetIntro name={pet.name} isLost={pet.is_lost} />
          </div>
          <div className="pet-actions" style={{ justifyContent: 'center', gap: '2rem' }}>
            <a href={`tel:${pet.phone}`} className="action-btn call-btn"><FaPhone /> Llamar dueño</a>
            <button onClick={handleWhatsApp} className="action-btn whatsapp-btn"><FaWhatsapp /> WhatsApp</button>
            <a href={`mailto:${pet.email}`} className="action-btn message-btn"><FaEnvelope /> Mensaje dueño</a>
          </div>
        </section>

        {/* Tabs destacados */}
        <div className="pet-tabs">
          <button
            className={`pet-tab ${activeTab === 'basic' ? 'active' : ''}`}
            onClick={() => handleTabClick('basic')}
          >
            Información básica
          </button>
          <button
            className={`pet-tab ${activeTab === 'health' ? 'active' : ''}`}
            onClick={() => handleTabClick('health')}
          >
            Salud
          </button>
          <button
            className={`pet-tab ${activeTab === 'owner' ? 'active' : ''}`}
            onClick={() => handleTabClick('owner')}
          >
            Dueño y veterinario
          </button>
        </div>

        {/* Información básica */}
        <section className="pet-section" ref={basicRef}>
          <div className="pet-section-title">Información básica</div>
          <div className="pet-info-grid">
            <div className="info-card">
              <div className="info-label">Raza</div>
              <div className="info-value">{pet.breed}</div>
            </div>
            <div className="info-card">
              <div className="info-label">Género</div>
              <div className="info-value">{pet.gender === 'M' ? 'Macho' : 'Hembra'}</div>
            </div>
            <div className="info-card">
              <div className="info-label">Edad</div>
              <div className="info-value">{pet.age} años</div>
            </div>
            <div className="info-card">
              <div className="info-label">Peso</div>
              <div className="info-value">{pet.weight || '-'}</div>
            </div>
            <div className="info-card">
              <div className="info-label">Color</div>
              <div className="info-value">{pet.color || '-'}</div>
            </div>
            <div className="info-card">
              <div className="info-label">ID de microchip</div>
              <div className="info-value">{pet.microchip || '-'}</div>
            </div>
          </div>
        </section>

        {/* Información de salud */}
        <section className="pet-section" ref={healthRef}>
          <div className="pet-section-title">Salud</div>
          <div className="pet-info-grid">
            <div className="info-card">
              <div className="info-label">Estado de vacunación</div>
              <div className="info-value">{pet.vaccines || 'Al día'}</div>
            </div>
            <div className="info-card">
              <div className="info-label">Última visita al veterinario</div>
              <div className="info-value">{pet.last_vet_visit || '-'}</div>
            </div>
            <div className="info-card">
              <div className="info-label">Alergias</div>
              <div className="info-value">{pet.allergies || 'Ninguna'}</div>
            </div>
            <div className="info-card">
              <div className="info-label">Medicamentos</div>
              <div className="info-value">{pet.medications || 'Ninguno'}</div>
            </div>
          </div>
        </section>

        {/* Información del dueño y veterinario */}
        <section className="pet-section" ref={ownerRef}>
          <div className="pet-section-title">Dueño y veterinario</div>
          <div className="pet-info-grid">
            <div className="info-card">
              <div className="info-label">Nombre del dueño</div>
              <div className="info-value">{pet.owner || '-'}</div>
            </div>
            <div className="info-card">
              <div className="info-label">Número de contacto</div>
              <div className="info-value">{pet.phone || '-'}</div>
            </div>
            <div className="info-card">
              <div className="info-label">Dirección</div>
              <div className="info-value">{pet.address || '-'}</div>
            </div>
            <div className="info-card">
              <div className="info-label">Nombre del veterinario</div>
              <div className="info-value">{pet.vet_name || '-'}</div>
            </div>
            <div className="info-card">
              <div className="info-label">Nombre de la clínica</div>
              <div className="info-value">{pet.vet_clinic || '-'}</div>
            </div>
            <div className="info-card">
              <div className="info-label">Contacto del veterinario</div>
              <div className="info-value">{pet.vet_phone || '-'}</div>
            </div>
          </div>
        </section>

        {/* Notas especiales */}
        <section className="pet-section">
          <div className="pet-section-title">Notas especiales</div>
          <div className="pet-notes">{pet.notes || 'No hay notas especiales.'}</div>
        </section>
      </main>
    </div>
  );
};

export default PetPage;