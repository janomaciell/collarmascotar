import React, { useState, useEffect } from 'react';
import { getPets, updatePet, updatePetLostStatus, getScanHistory, updateUserLocation } from '../../services/api';
import PetList from '../../components/PetList/PetList';
import PetForm from '../../components/PetForm/PetForm';
import HeatMapComponent from '../../components/HeatMapComponent/HeatMapComponent';
import './PetManagement.css';
import { API_URL } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const ScanHistoryDetail = ({ scanHistory, userLocation, pet }) => {
  const [frequentLocations, setFrequentLocations] = useState([]);
  const [pattern, setPattern] = useState(null);

  useEffect(() => {
    if (scanHistory.length > 0) {
      analyzeScans();
    } else {
      setFrequentLocations([]);
      setPattern(null);
    }
  }, [scanHistory]);

  const analyzeScans = () => {
    const locationClusters = [];

    scanHistory.forEach((scan) => {
      const lat = parseFloat(scan.latitude);
      const lng = parseFloat(scan.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const existingCluster = locationClusters.find(
        (cluster) =>
          calculateDistance(cluster.center.lat, cluster.center.lng, lat, lng) < 0.1
      );

      if (existingCluster) {
        existingCluster.scans.push(scan);
      } else {
        locationClusters.push({
          center: { lat, lng },
          scans: [scan],
        });
      }
    });

    const sortedLocations = locationClusters.sort(
      (a, b) => b.scans.length - a.scans.length
    );
    setFrequentLocations(sortedLocations.slice(0, 3));

    if (scanHistory.length >= 3) {
      const hourFrequency = {};
      const dayFrequency = {};

      scanHistory.forEach((scan) => {
        const date = new Date(scan.timestamp);
        const hour = date.getHours();
        const day = date.getDay();

        hourFrequency[hour] = (hourFrequency[hour] || 0) + 1;
        dayFrequency[day] = (dayFrequency[day] || 0) + 1;
      });

      let maxHour = 0,
        maxHourCount = 0;
      let maxDay = 0,
        maxDayCount = 0;

      Object.entries(hourFrequency).forEach(([hour, count]) => {
        if (count > maxHourCount) {
          maxHour = parseInt(hour);
          maxHourCount = count;
        }
      });

      Object.entries(dayFrequency).forEach(([day, count]) => {
        if (count > maxDayCount) {
          maxDay = parseInt(day);
          maxDayCount = count;
        }
      });

      const days = [
        'domingo',
        'lunes',
        'martes',
        'miércoles',
        'jueves',
        'viernes',
        'sábado',
      ];

      if (maxHourCount >= 2) {
        setPattern({
          hour: maxHour,
          day: days[maxDay],
          message: `${pet.name} tiende a ser encontrado/a los ${days[maxDay]}s alrededor de las ${maxHour}:00 horas.`,
        });
      }
    }
  };

  return (
    <div className="scan-history-detail">
      {scanHistory.length > 0 ? (
        <>
          <div className="scan-list">
            {scanHistory.map((scan, index) => (
              <div key={index} className="scan-item">
                <div className="scan-info">
                  <span className="scan-date">
                    {new Date(scan.timestamp).toLocaleString()}
                  </span>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${scan.latitude},${scan.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="map-link"
                >
                  Ver ubicación
                </a>
              </div>
            ))}
          </div>

          <div className="heatmap-section">
            <h3>Mapa de ubicaciones</h3>
            <HeatMapComponent scanHistory={scanHistory} />
          </div>

          {frequentLocations.length > 0 && (
            <div className="frequent-locations">
              <h4>Ubicaciones frecuentes</h4>
              <div className="locations-list">
                {frequentLocations.map((loc, idx) => (
                  <div key={idx} className="location-item">
                    <span className="location-count">{loc.scans.length}</span>
                    <div className="location-details">
                      <span>veces cerca de esta ubicación</span>
                      <a
                        href={`https://www.google.com/maps?q=${loc.center.lat},${loc.center.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="location-link"
                      >
                        Ver en mapa
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pattern && (
            <div className="pattern-insight">
              <span className="pattern-icon">💡</span>
              <p>{pattern.message}</p>
            </div>
          )}
        </>
      ) : (
        <div className="no-scans">
          <span className="no-scans-icon">🔍</span>
          <p>No hay escaneos registrados para {pet.name}</p>
        </div>
      )}
    </div>
  );
};

const PetManagement = () => {
  const [pets, setPets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const alertRadius = 5;
  const navigate = useNavigate();

  const mascotaImage = 'src/img/personaje2.png';

  useEffect(() => {
    fetchPets();
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    if (navigator.permissions) {
      try {
        const permissionStatus = await navigator.permissions.query({
          name: 'geolocation',
        });
        setLocationPermission(permissionStatus.state);
        if (permissionStatus.state === 'granted') {
          updateLocation();
        } else if (permissionStatus.state === 'prompt') {
          setShowLocationPrompt(true);
        } else if (permissionStatus.state === 'denied') {
          setError(
            'El permiso de ubicación está denegado. Habilítalo en la configuración de tu navegador para enviar alertas.'
          );
        }

        permissionStatus.onchange = () => {
          setLocationPermission(permissionStatus.state);
          if (permissionStatus.state === 'granted') {
            updateLocation();
            setShowLocationPrompt(false);
          } else if (permissionStatus.state === 'denied') {
            setError(
              'El permiso de ubicación fue denegado. Habilítalo en la configuración de tu navegador para enviar alertas.'
            );
            setShowLocationPrompt(false);
          }
        };
      } catch (err) {
        console.error('Error al verificar permisos de geolocalización:', err);
        setShowLocationPrompt(true);
      }
    } else {
      setShowLocationPrompt(true);
    }
  };

  const updateLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            radiusKm: alertRadius,
          };
          setUserLocation(location);
          setShowLocationPrompt(false);
          setError('');
          try {
            await updateUserLocation(location);
            console.log('User location updated in backend');
            window.gtag('event', 'location_permission_granted', {
              event_category: 'Engagement',
              event_label: 'User granted location permission',
            });
          } catch (err) {
            setError('Error al actualizar la ubicación en el backend: ' + err.message);
          }
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setLocationPermission('denied');
            setError(
              'El permiso de ubicación fue denegado. Habilítalo en la configuración de tu navegador para enviar alertas.'
            );
            window.gtag('event', 'location_permission_denied', {
              event_category: 'Engagement',
              event_label: 'User denied location permission',
            });
          } else {
            setError('Error al obtener la ubicación: ' + err.message);
          }
          setShowLocationPrompt(true);
          console.error('Error al obtener ubicación:', err);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setError('La geolocalización no es compatible con este navegador.');
      setShowLocationPrompt(false);
    }
  };

  const fetchPets = async () => {
    try {
      setIsLoading(true);
      const data = await getPets();
      setPets(data);
      setError('');
    } catch (err) {
      setError(
        'Error al cargar las mascotas: ' + (err.detail || err.message || err)
      );
      console.error('Error en fetchPets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleLost = async (petId, currentStatus) => {
    if (!currentStatus && !userLocation) {
      setError(
        'Se necesita tu ubicación para enviar alertas. Por favor, otorga permiso de geolocalización.'
      );
      setShowLocationPrompt(true);
      return;
    }

    try {
      const updatedPet = await updatePetLostStatus(petId, !currentStatus);
      setPets(pets.map((pet) => (pet.id === petId ? updatedPet : pet)));

      if (!currentStatus) {
        await sendLostNotification(petId);
        const petToNavigate = pets.find((pet) => pet.id === petId) || updatedPet;
        navigate(`/lost-poster/${petToNavigate.qr_uuid}`);
      }
    } catch (err) {
      setError('Error al actualizar estado: ' + (err.message || err));
      console.error('Error en handleToggleLost:', err);
    }
  };

  const fetchScanHistory = async (petId) => {
    try {
      const history = await getScanHistory(petId);
      const sortedHistory = Array.isArray(history)
        ? history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        : [];
      setScanHistory(sortedHistory);
      setSelectedPetId(petId);
      if (sortedHistory.length === 0) {
        setError('No hay escaneos registrados para esta mascota.');
      }
    } catch (err) {
      setError('Error al cargar historial: ' + (err.detail || err.message || err));
      console.error('Error en fetchScanHistory:', err);
    }
  };

  const sendLostNotification = async (petId) => {
    if (!userLocation) {
      setError(
        'Se necesita tu ubicación para enviar alertas. Por favor, otorga permiso de geolocalización.'
      );
      setShowLocationPrompt(true);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/pets/lost/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          pet_id: petId,
          alert_data: {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            radius_km: alertRadius,
          },
        }),
      });

      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonErr) {
          console.error('No se pudo parsear la respuesta de error:', jsonErr);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setSuccessMessage(`¡Alerta enviada! ${data.recipients || 0} personas notificadas.`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setError('Error al enviar notificaciones: ' + (err.message || err));
      console.error('Error en sendLostNotification:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPet = (pet) => {
    setEditingPet(pet);
    setIsEditing(true);
    // Scroll al formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdatePet = async (updatedData) => {
    try {
      setIsLoading(true);
      setError('');
      
      // Crear FormData para enviar todos los campos incluyendo la foto
      const formData = new FormData();
      
      // Agregar todos los campos
      Object.keys(updatedData).forEach(key => {
        if (key === 'photo') {
          // Solo agregar la foto si es un archivo nuevo
          if (updatedData[key] instanceof File) {
            formData.append(key, updatedData[key]);
          }
        } else if (updatedData[key] !== null && updatedData[key] !== undefined && updatedData[key] !== '') {
          formData.append(key, updatedData[key]);
        }
      });

      const response = await updatePet(editingPet.id, formData);
      
      // Actualizar la lista de mascotas
      setPets(pets.map(pet => pet.id === editingPet.id ? response : pet));
      
      setSuccessMessage('¡Mascota actualizada exitosamente!');
      setTimeout(() => setSuccessMessage(''), 5000);
      
      // Cerrar el formulario de edición
      setIsEditing(false);
      setEditingPet(null);
      
    } catch (err) {
      setError('Error al actualizar la mascota: ' + (err.message || err));
      console.error('Error en handleUpdatePet:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingPet(null);
  };

  return (
    <div className="pet-management-wrapper">
      {/* Hero */}
      <section className="pet-hero">
        <div className="pattern-bg"></div>
        <div className="hero-content">
          <img
            src={mascotaImage}
            alt="Mascota EncuentraME"
            className="hero-mascota"
          />
          <h1 className="hero-title">MIS MASCOTAS</h1>
          <p className="hero-subtitle">Gestiona y protege a tus mejores amigos</p>
        </div>
      </section>

      <div className="pet-management-container">
        {/* Formulario de edición */}
        {isEditing && editingPet && (
          <div className="edit-form-container">
            <div className="edit-form-header">
              <h2>✏️ Editar Mascota: {editingPet.name}</h2>
              <button onClick={handleCancelEdit} className="cancel-edit-btn">
                ✕ Cancelar
              </button>
            </div>
            <PetForm
              onSubmit={handleUpdatePet}
              initialData={editingPet}
            />
          </div>
        )}

        {showLocationPrompt && (
          <div className="location-prompt">
            <div className="prompt-content">
              <span className="prompt-icon">📍</span>
              <div className="prompt-text">
                <h3>Permiso de ubicación</h3>
                <p>
                  Necesitamos tu ubicación para enviar alertas sobre mascotas
                  perdidas en tu zona
                </p>
              </div>
              <div className="prompt-actions">
                <button onClick={updateLocation} className="allow-btn">
                  Permitir
                </button>
                <button
                  onClick={() => setShowLocationPrompt(false)}
                  className="deny-btn"
                >
                  Ahora no
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Cargando tus mascotas...</p>
          </div>
        ) : (
          <>
            <PetList
              pets={pets}
              onToggleLost={handleToggleLost}
              onShowHistory={fetchScanHistory}
              onEdit={handleEditPet}
            />

            {selectedPetId && (
              <div className="scan-history-container">
                <div className="history-header">
                  <h3>Historial de escaneos</h3>
                  <button
                    onClick={() => {
                      setSelectedPetId(null);
                      setScanHistory([]);
                      setError('');
                    }}
                    className="close-history-btn"
                  >
                    Cerrar
                  </button>
                </div>
                <ScanHistoryDetail
                  scanHistory={scanHistory}
                  userLocation={userLocation}
                  pet={pets.find((p) => p.id === selectedPetId) || {}}
                />
              </div>
            )}
          </>
        )}

        {error && (
          <div className="message error-message">
            <span className="message-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="message success-message">
            <span className="message-icon">✅</span>
            <span>{successMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PetManagement;