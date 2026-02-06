import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPetByUuid, notifyOwner, sendCommunityNotification, checkQRStatus } from '../../services/api';
import emailjs from '@emailjs/browser';
import './PetPage.css';
import mascotaImage from '../../img/personaje2.png';
import { FaExclamationTriangle, FaPhone, FaWhatsapp, FaEnvelope, FaMapMarkerAlt, FaInfo, FaCheck, FaTimes } from 'react-icons/fa';

// Inicializar EmailJS
emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY_NOTIFY);

const BASE_URL = import.meta.env.VITE_BASE_URL;
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

const PetIntro = ({ name, isLost }) => (
  <div className="pet-intro">
    <p className="intro-text">
      {isLost
        ? `¡Hola! Soy ${name} y me he perdido. Gracias por escanear mi collar Encuentrame y ayudarme a volver con mi familia.`
        : `¡Hola! Soy ${name}. Gracias por escanear mi collar Encuentrame. Mi familia y yo estamos muy agradecidos.`}
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
  const [locationShared, setLocationShared] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionState, setPermissionState] = useState('prompt');
  const [alertButtonDisabled, setAlertButtonDisabled] = useState(false);
  const [alertCooldown, setAlertCooldown] = useState(0);
  const locationSentRef = useRef(false);
  const retryTimeoutRef = useRef(null);
  const cooldownIntervalRef = useRef(null);

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

  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, []);

  // ✅ Verificar permisos usando Permissions API
  const checkGeolocationPermission = async () => {
    if (!navigator.permissions) return 'prompt';

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      setPermissionState(result.state);
      
      result.addEventListener('change', () => {
        setPermissionState(result.state);
      });

      return result.state;
    } catch (error) {
      return 'prompt';
    }
  };

  const sendEmailNotification = async (petData, location) => {
    try {
      const templateParams = {
        to_email: petData.email || 'janomaciel1@gmail.com',
        pet_name: petData.name,
        scan_time: new Date().toLocaleString('es-AR', {
          dateStyle: 'full',
          timeStyle: 'short',
          timeZone: 'America/Argentina/Buenos_Aires'
        }),
        maps_link: `https://www.google.com/maps?q=${location.latitude},${location.longitude}`,
        latitude: location.latitude.toFixed(6),
        longitude: location.longitude.toFixed(6),
      };

      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID_NOTIFY,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID_NOTIFY,
        templateParams
      );
      return true;
    } catch (error) {
      console.error('[EmailJS] Error:', error);
      return false;
    }
  };

  // ✅ Solicitud de ubicación mejorada
  const attemptLocationRequest = async () => {
    if (!navigator.geolocation) {
      setLocationError('Tu navegador no soporta geolocalización.');
      setShowPermissionModal(true);
      return;
    }

    // Verificar permisos antes de solicitar
    const permState = await checkGeolocationPermission();
    
    if (permState === 'denied') {
      setLocationError('Los permisos de ubicación están bloqueados.');
      setShowPermissionModal(true);
      return;
    }

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };

        try {
          await notifyOwner(uuid, location);
          await sendEmailNotification(pet, location);

          if (pet?.is_lost) {
            try {
              await sendCommunityNotification(uuid, location, 50);
            } catch (err) {
              console.warn('Error notificación comunitaria:', err);
            }
          }

          setLocationError('');
          setLocationShared(true);
          setShowPermissionModal(false);
        } catch (err) {
          console.error('Error procesando ubicación:', err);
          setLocationError('No se pudo procesar la ubicación.');
        }
      },
      async (err) => {
        console.error('Error geolocalización:', err);

        if (err.code === 1) { // PERMISSION_DENIED
          setLocationError('Permiso de ubicación denegado.');
          setShowPermissionModal(true);
          await checkGeolocationPermission();
        } else if (err.code === 2) {
          setLocationError('No se pudo determinar tu ubicación.');
        } else if (err.code === 3) {
          setLocationError('Tiempo de espera agotado.');
        } else {
          setLocationError('Error desconocido.');
        }
      },
      geoOptions
    );
  };

  // Solicitar ubicación al cargar (con delay)
  useEffect(() => {
    if (!pet || isLoading || locationSentRef.current || locationShared) return;

    locationSentRef.current = true;
    setTimeout(() => attemptLocationRequest(), 1000);
  }, [pet, isLoading, locationShared]);

  const requestLocation = () => {
    setLocationError('');
    setShowPermissionModal(false);
    attemptLocationRequest();
  };

  const activateAlert = () => {
    if (alertButtonDisabled) return;
    requestLocation();
    setAlertButtonDisabled(true);
    setAlertCooldown(300);

    cooldownIntervalRef.current = setInterval(() => {
      setAlertCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownIntervalRef.current);
          setAlertButtonDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatCooldown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleWhatsApp = () => {
    if (!pet.phone) return;
    const phoneNumber = pet.phone.replace(/[^\d+]/g, '');
    const message = pet.is_lost 
      ? `Hola, encontré a ${pet.name}. Escaneé su collar Encuentrame y quiero ayudar a que regrese a casa.`
      : `Hola, escaneé el collar Encuentrame de ${pet.name}.`;
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    const refs = { basic: basicRef, health: healthRef, owner: ownerRef };
    refs[tab]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openBrowserSettings = () => {
    const ua = navigator.userAgent.toLowerCase();
    let msg = 'Ve a la configuración de tu navegador y habilita los permisos de ubicación.';

    if (ua.includes('chrome') && !ua.includes('edg')) {
      msg = 'Chrome: Haz clic en 🔒 en la barra de direcciones → Configuración del sitio → Ubicación → Permitir';
    } else if (ua.includes('firefox')) {
      msg = 'Firefox: Haz clic en ⓘ en la barra de direcciones → Permisos → Ubicación → Permitir';
    } else if (ua.includes('safari')) {
      msg = 'Safari: Preferencias → Sitios web → Ubicación → Permitir';
    } else if (ua.includes('edg')) {
      msg = 'Edge: Haz clic en 🔒 → Permisos → Ubicación → Permitir';
    }

    alert(msg);
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

  const petPhotoUrl = pet.photo 
    ? (pet.photo.startsWith('http') 
        ? pet.photo 
        : pet.photo.startsWith('/') 
          ? `${BASE_URL}${pet.photo}` 
          : `${BASE_URL}/media/pet_photos/${pet.photo}`)
    : null;

  return (
    <div className="pet-page-wrapper">
      {/* Modal de permisos */}
      {showPermissionModal && (
        <div className="permission-modal-overlay" onClick={() => setShowPermissionModal(false)}>
          <div className="permission-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowPermissionModal(false)}>
              <FaTimes />
            </button>
            <div className="modal-icon">
              <FaMapMarkerAlt />
            </div>
            <h2 style={{ fontFamily: 'Poppins, sans-serif' }}>
              Permisos de Ubicación Bloqueados
            </h2>
            <p>
              Para ayudar a {pet.name} a volver a casa, necesitamos tu ubicación. 
              Los permisos están bloqueados en tu navegador.
            </p>
            <div className="modal-steps">
              <h3>Cómo habilitarlos:</h3>
              <ol>
                <li>Haz clic en el ícono de <strong>candado 🔒</strong> en la barra de direcciones</li>
                <li>Busca <strong>"Ubicación"</strong> o <strong>"Permisos"</strong></li>
                <li>Cambia a <strong>"Permitir"</strong></li>
                <li>Recarga la página</li>
              </ol>
            </div>
            <div className="modal-actions">
              <button className="modal-btn primary" onClick={openBrowserSettings}>
                Ver instrucciones
              </button>
              <button className="modal-btn secondary" onClick={requestLocation}>
                Intentar de nuevo
              </button>
            </div>
          </div>
        </div>
      )}

      <header className={`pet-header ${pet.is_lost ? 'lost-header' : 'normal-header'}`}>
        <div className="pattern-bg"></div>
        <div className="header-content">
          <div className="brand-section">
            <div className="brand-info">
              <h1 className="brand-name">ENCUENTRAME</h1>
              <p className="brand-tagline">Mascotas seguras, familias tranquilas</p>
            </div>
          </div>
          <img src={mascotaImage} alt="Mascota EncuentraME" className="header-mascot" />
        </div>
      </header>

      <main className="pet-content">
        {locationError && !showPermissionModal && (
          <div className="location-status location-status-error">
            <strong><FaExclamationTriangle /></strong>
            {locationError}
            {permissionState === 'denied' && (
              <button 
                className="location-help-btn"
                onClick={() => setShowPermissionModal(true)}
              >
                ¿Cómo habilitar permisos?
              </button>
            )}
          </div>
        )}

        {locationShared && (
          <div className="location-status location-status-success">
            <FaCheck /> <strong>¡Éxito!</strong> El dueño de {pet.name} ha sido notificado.
            {pet.is_lost && ' La comunidad también ha sido alertada.'}
          </div>
        )}

        {pet.is_lost && (
          <div className="pet-alert">
            <div>
              <strong>¡Mascota perdida!</strong>
              <div>Si encontraste a {pet.name}, sigue los pasos para ayudarlo a volver a casa.</div>
            </div>
            <button 
              className={`alert-btn ${alertButtonDisabled ? 'disabled' : ''}`}
              onClick={activateAlert}
              disabled={alertButtonDisabled}
            >
              {alertButtonDisabled ? `Espera ${formatCooldown(alertCooldown)}` : 'Activar alerta'}
            </button>
          </div>
        )}

        <section className="pet-hero-petpage">
          <div className="pet-photo-container">
            {petPhotoUrl && (
              <img 
                src={petPhotoUrl} 
                alt={`Foto de ${pet.name}`} 
                className="pet-photo-petpage"
                onError={(e) => e.target.style.display = 'none'}
              />
            )}
            {pet.is_lost && <div className="lost-badge">Perdido</div>}
          </div>
          <div className="pet-basic-info">
            <h2 className="pet-name-petpage">{pet.name}</h2>
            <div className="pet-details">
              {pet.breed} | {pet.gender === 'M' ? 'Macho' : 'Hembra'} | {pet.age} años
            </div>
            <PetIntro name={pet.name} isLost={pet.is_lost} />
          </div>
          <div className="pet-actions">
            <a href={`tel:${pet.phone}`} className="action-btn call-btn"><FaPhone /> Llamar</a>
            <button onClick={handleWhatsApp} className="action-btn whatsapp-btn"><FaWhatsapp /> WhatsApp</button>
            <a href={`mailto:${pet.email}`} className="action-btn message-btn"><FaEnvelope /> Email</a>
          </div>
        </section>

        <div className="pet-tabs">
          {['basic', 'health', 'owner'].map(tab => (
            <button
              key={tab}
              className={`pet-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => handleTabClick(tab)}
            >
              {tab === 'basic' ? 'Información básica' : tab === 'health' ? 'Salud' : 'Dueño y vet'}
            </button>
          ))}
        </div>

        <section className="pet-section" ref={basicRef}>
          <div className="pet-section-title">Información básica</div>
          <div className="pet-info-grid">
            {[
              { label: 'Raza', value: pet.breed },
              { label: 'Género', value: pet.gender === 'M' ? 'Macho' : 'Hembra' },
              { label: 'Edad', value: `${pet.age} años` },
              { label: 'Peso', value: pet.weight || '-' },
              { label: 'Color', value: pet.color || '-' },
              { label: 'Microchip', value: pet.microchip || '-' }
            ].map((item, i) => (
              <div key={i} className="info-card">
                <div className="info-label">{item.label}</div>
                <div className="info-value">{item.value}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="pet-section" ref={healthRef}>
          <div className="pet-section-title">Salud</div>
          <div className="pet-info-grid">
            {[
              { label: 'Vacunación', value: pet.vaccines || 'Al día' },
              { label: 'Última visita vet', value: pet.last_vet_visit || '-' },
              { label: 'Alergias', value: pet.allergies || 'Ninguna' },
              { label: 'Medicamentos', value: pet.medications || 'Ninguno' }
            ].map((item, i) => (
              <div key={i} className="info-card">
                <div className="info-label">{item.label}</div>
                <div className="info-value">{item.value}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="pet-section" ref={ownerRef}>
          <div className="pet-section-title">Dueño y veterinario</div>
          <div className="pet-info-grid">
            {[
              { label: 'Dueño', value: pet.owner || '-' },
              { label: 'Teléfono', value: pet.phone || '-' },
              { label: 'Dirección', value: pet.address || '-' },
              { label: 'Veterinario', value: pet.vet_name || '-' },
              { label: 'Clínica', value: pet.vet_clinic || '-' },
              { label: 'Tel. veterinario', value: pet.vet_phone || '-' }
            ].map((item, i) => (
              <div key={i} className="info-card">
                <div className="info-label">{item.label}</div>
                <div className="info-value">{item.value}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="pet-section">
          <div className="pet-section-title">Notas especiales</div>
          <div className="pet-notes">{pet.notes || 'No hay notas especiales.'}</div>
        </section>
      </main>
    </div>
  );
};

export default PetPage;