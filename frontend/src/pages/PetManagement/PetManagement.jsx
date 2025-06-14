import React, { useState, useEffect, useRef } from 'react';
import { getPets, createPet, updatePetLostStatus, getScanHistory, updateUserLocation, generateLostPoster } from '../../services/api';
import PetList from '../../components/PetList/PetList';
import HeatMapComponent from '../../components/HeatMapComponent/HeatMapComponent';
import './PetManagement.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { API_URL } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
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

      const existingCluster = locationClusters.find((cluster) =>
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

    const sortedLocations = locationClusters.sort((a, b) => b.scans.length - a.scans.length);
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

      const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

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
          <ul className="space-y-2">
            {scanHistory.map((scan, index) => (
              <li key={index} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                <span>{new Date(scan.timestamp).toLocaleString()}</span>
                <a
                  href={`https://www.google.com/maps?q=${scan.latitude},${scan.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-eggplant hover:text-shell"
                >
                  Ver en Google Maps
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-4 text-eggplant">Mapa de Calor de Escaneos</h3>
            <HeatMapComponent scanHistory={scanHistory} />
          </div>

          {frequentLocations.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold text-eggplant">Ubicaciones Frecuentes:</h4>
              <ul className="space-y-1">
                {frequentLocations.map((loc, idx) => (
                  <li key={idx}>
                    Visto {loc.scans.length} veces cerca de:{' '}
                    <a
                      href={`https://www.google.com/maps?q=${loc.center.lat},${loc.center.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-eggplant hover:text-shell"
                    >
                      Lat: {loc.center.lat.toFixed(4)}, Lng: {loc.center.lng.toFixed(4)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {pattern && <p className="mt-4 italic text-gray-600">{pattern.message}</p>}
        </>
      ) : (
        <p className="text-eggplant">No hay escaneos registrados para {pet.name}.</p>
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
  const alertRadius = 5;
  const navigate = useNavigate();

  useEffect(() => {
    fetchPets();
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    if (navigator.permissions) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
        setLocationPermission(permissionStatus.state);
        if (permissionStatus.state === 'granted') {
          updateLocation();
        } else if (permissionStatus.state === 'prompt') {
          setShowLocationPrompt(true);
        } else if (permissionStatus.state === 'denied') {
          setError('El permiso de ubicación está denegado. Habilítalo en la configuración de tu navegador para enviar alertas.');
        }

        permissionStatus.onchange = () => {
          setLocationPermission(permissionStatus.state);
          if (permissionStatus.state === 'granted') {
            updateLocation();
            setShowLocationPrompt(false);
          } else if (permissionStatus.state === 'denied') {
            setError('El permiso de ubicación fue denegado. Habilítalo en la configuración de tu navegador para enviar alertas.');
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
            setError('El permiso de ubicación fue denegado. Habilítalo en la configuración de tu navegador para enviar alertas.');
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
      setError('Error al cargar las mascotas: ' + (err.detail || err.message || err));
      console.error('Error en fetchPets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleLost = async (petId, currentStatus) => {
    if (!currentStatus && !userLocation) {
      setError('Se necesita tu ubicación para enviar alertas. Por favor, otorga permiso de geolocalización.');
      setShowLocationPrompt(true);
      return;
    }

    try {
      const updatedPet = await updatePetLostStatus(petId, !currentStatus);
      setPets(pets.map((pet) => (pet.id === petId ? updatedPet : pet)));

      if (!currentStatus) {
        await sendLostNotification(petId);
        const petToNavigate = pets.find(pet => pet.id === petId) || updatedPet;
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

  const generateLostPosterLocal = async (pet) => {
    const poster = document.createElement('div');
    poster.style.width = '210mm';
    poster.style.height = '297mm';
    poster.style.background = '#fff';
    poster.style.fontFamily = 'Poppins, sans-serif';
    poster.style.padding = '10mm';
    poster.style.boxSizing = 'border-box';
    poster.style.border = '1px solid #000000';

    poster.innerHTML = `
      <div style="text-align: center; background: #ff9800; padding: 10mm; color: #ffffff;">
        <h1 style="margin: 0; font-size: 36px; text-transform: uppercase;">¡Mascota Perdida!</h1>
        <div style="height: 40px; margin-top: 10px;">
          <span style="font-size: 14px; opacity: 0.8;">[CollarMascotaQR - Próximamente Logo]</span>
        </div>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; padding: 10mm;">
        <img src="${pet.photo || 'https://via.placeholder.com/300'}" alt="Foto de ${pet.name}" style="width: 150mm; height: 150mm; object-fit: cover; border-radius: 5px; border: 1px solid #000000;" />
        <div style="margin-top: 10mm; text-align: center; width: 100%;">
          <p style="font-size: 24px; color: #000000; margin: 5px 0;"><strong>Nombre:</strong> ${pet.name}</p>
          <p style="font-size: 20px; color: #000000; margin: 5px 0;"><strong>Raza:</strong> ${pet.breed || 'No especificada'}</p>
          <p style="font-size: 20px; color: #000000; margin: 5px 0;"><strong>Edad:</strong> ${pet.age} años</p>
          <p style="font-size: 20px; color: #000000; margin: 5px 0;"><strong>Última vez vista:</strong> ${pet.last_seen_date ? new Date(pet.last_seen_date).toLocaleString() : new Date().toLocaleString()}</p>
          <p style="font-size: 20px; color: #000000; margin: 5px 0;"><strong>Contacto:</strong> ${pet.phone || 'No disponible'}</p>
        </div>
        <div style="margin-top: 10mm;">
          <img src="${pet.qr_code}" alt="QR de ${pet.name}" style="width: 60mm; height: 60mm;" />
          <p style="font-size: 16px; color: #000000; margin-top: 5px;">Escanea el QR para más información</p>
        </div>
      </div>
      <div style="position: absolute; bottom: 10mm; width: 100%; text-align: center; font-size: 12px; color: #000000;">
        <p>© 2025 CollarMascotaQR - Ayúdanos a encontrar a ${pet.name}</p>
      </div>
    `;

    document.body.appendChild(poster);
    const canvas = await html2canvas(poster, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
    const pdfData = pdf.output('datauristring');
    document.body.removeChild(poster);
    pdf.save(`mascota_perdida_${pet.name}.pdf`);

    return { imgData, pdfData };
  };

  const uploadPosterToBackend = async (petId, posterUrl) => {
    try {
      const { imgData, pdfData } = posterUrl;
      const response = await generateLostPoster(petId, {
        posterImage: imgData,
        posterPdf: pdfData,
      });
      setSuccessMessage('Poster subido exitosamente');
      setTimeout(() => setSuccessMessage(''), 5000);
      return response;
    } catch (err) {
      setError('Error al subir el poster: ' + (err.message || err));
      console.error('Error en uploadPosterToBackend:', err);
      throw err;
    }
  };

  const sendLostNotification = async (petId) => {
    if (!userLocation) {
      setError('Se necesita tu ubicación para enviar alertas. Por favor, otorga permiso de geolocalización.');
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

  const viewSharedPoster = async (posterId) => {
    try {
      const response = await fetch(`${API_URL}/poster/${posterId}/`, {
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      window.open(data.poster.imageUrl, '_blank');
    } catch (err) {
      setError('Error al ver el poster compartido: ' + (err.message || err));
      console.error('Error en viewSharedPoster:', err);
    }
  };

  return (
    <div className="pet-management-container">
      <div className="pet-management-content">
        <div className="pet-management-header">
          <h2>Gestión de Mascotas</h2>
        </div>

        {showLocationPrompt && (
          <div className="location-prompt">
            <p className="mb-2 text-eggplant">
              Necesitamos tu ubicación para enviar alertas sobre mascotas perdidas. ¿Nos das permiso?
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={updateLocation}
                className="location-button grant-button"
                aria-label="Otorgar permiso de ubicación"
              >
                Otorgar Permiso
              </button>
              <button
                onClick={() => setShowLocationPrompt(false)}
                className="location-button deny-button"
                aria-label="Rechazar permiso de ubicación"
              >
                No, gracias
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="loading-message">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eggplant"></div>
            <p className="text-eggplant">Cargando mascotas...</p>
          </div>
        ) : (
          <>
            <PetList
              pets={pets}
              onToggleLost={handleToggleLost}
              onShowHistory={fetchScanHistory}
            />
            {selectedPetId && (
              <div className="scan-history">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-eggplant">Historial de Escaneos</h3>
                  <button
                    onClick={() => {
                      setSelectedPetId(null);
                      setScanHistory([]);
                      setError('');
                    }}
                    className="text-eggplant hover:text-shell"
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
          <div className="error-message">
            <span className="text-white">{error}</span>
          </div>
        )}
        {successMessage && (
          <div className="success-message">
            <span className="text-eggplant">{successMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PetManagement;