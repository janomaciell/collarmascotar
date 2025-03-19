import React, { useState, useEffect } from 'react';
import { getPets, createPet, updatePetLostStatus, getScanHistory } from '../../services/api';
import PetForm from '../../components/PetForm/PetForm';
import PetList from '../../components/PetList/PetList';
import './PetManagement.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const PetManagement = () => {
  const [pets, setPets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [userLocation, setUserLocation] = useState(null); // Almacenar ubicación del dueño
  const [alertRadius, setAlertRadius] = useState(50); // Radio predeterminado de 50km

  useEffect(() => {
    fetchPets();
    getUserLocation(); // Obtener ubicación del usuario
  }, []);

  // Obtener ubicación del dueño
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (err) => console.error('Error al obtener ubicación:', err),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  const fetchPets = async () => {
    try {
      setIsLoading(true);
      const data = await getPets();
      setPets(data);
      setError('');
    } catch (err) {
      setError('Error al cargar las mascotas: ' + (err.detail || err));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePet = async (petData) => {
    try {
      const newPet = await createPet(petData);
      setPets([...pets, newPet]);
      setShowForm(false);
    } catch (err) {
      setError('Error al crear la mascota: ' + (err.detail || err));
      console.error(err);
    }
  };

  const handleToggleLost = async (petId, currentStatus) => {
    try {
      const updatedPet = await updatePetLostStatus(petId, !currentStatus);
      setPets(pets.map((pet) => (pet.id === petId ? updatedPet : pet)));

      // Si se marca como perdida, genera cartel, envía notificaciones y suscribe a alertas
      if (!currentStatus) {
        const pet = pets.find(p => p.id === petId);
        await generateLostPoster(pet);
        await sendLostNotification(petId);
        await subscribeToPetAlerts(petId);
      }
    } catch (err) {
      setError('Error al actualizar estado: ' + (err.detail || err));
      console.error(err);
    }
  };

  const fetchScanHistory = async (petId) => {
    try {
      const history = await getScanHistory(petId);
      setScanHistory(history);
      setSelectedPetId(petId);
    } catch (err) {
      setError('Error al cargar historial: ' + (err.detail || err));
      console.error(err);
    }
  };

  // Generar cartel de mascota perdida
  const generateLostPoster = async (pet) => {
    const poster = document.createElement('div');
    poster.className = 'lost-poster';
    poster.innerHTML = `
      <h1>¡Mascota Perdida!</h1>
      <img src="${pet.photo || 'https://via.placeholder.com/200'}"" alt="Foto de ${pet.name}" />
      <p><strong>Nombre:</strong> ${pet.name}</p>
      <p><strong>Raza:</strong> ${pet.breed || 'No especificada'}</p>
      <p><strong>Edad:</strong> ${pet.age} años</p>
      <p><strong>Última vez vista:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Contacto:</strong> ${pet.phone || 'No disponible'}</p>
      <img src="${pet.qr_code}" alt="QR de ${pet.name}" style="max-width: 150px;" />
    `;

    document.body.appendChild(poster);

    const canvas = await html2canvas(poster);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();
    pdf.addImage(imgData, 'PNG', 10, 10, 180, 0);
    pdf.save(`mascota_perdida_${pet.name}.pdf`);

    // Opcional: compartir en redes sociales (simulación)
    const posterUrl = imgData;
    console.log('Cartel generado, listo para compartir:', posterUrl);

    document.body.removeChild(poster); // Limpiar después de generar
  };

  // Enviar notificación de mascota perdida
  const sendLostNotification = async (petId) => {
    if (!userLocation) {
      console.error('No se pudo obtener la ubicación del dueño');
      setError('No se pudo obtener tu ubicación para enviar alertas');
      return;
    }

    try {
      // Show loading indicator
      setIsLoading(true);
      
      const response = await fetch('/api/notifications/lost-pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petId,
          ownerLocation: userLocation,
          radiusKm: 50, // Radio fijo de 50 km
          petDetails: pets.find(p => p.id === petId) // Enviar detalles completos
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error enviando notificación');
      }
      
      const data = await response.json();
      console.log(`Notificaciones enviadas a ${data.recipients} usuarios cercanos`);
      
      // Show success message
      setSuccessMessage(`¡Alerta enviada! ${data.recipients} personas en un radio de 50 km han sido notificadas.`);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setError('Error al enviar notificaciones: ' + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToPetAlerts = async (petId) => {
    if (!userLocation) {
      setError('No se pudo obtener tu ubicación para las alertas');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await fetch('/api/pets/lost/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`, // Si usas autenticación
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
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al suscribirse a las alertas');
      }

      const data = await response.json();
      setSuccessMessage(`Te has suscrito a las alertas en un radio de ${alertRadius}km`);
      
      setTimeout(() => setSuccessMessage(''), 5000);
      
      return data;
    } catch (err) {
      setError('Error al suscribirse a las alertas: ' + err.message);
      console.error('Error en suscripción:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Agregar control de radio en el formulario
  const renderAlertRadiusControl = () => (
    <div className="alert-radius-control">
      <label htmlFor="alertRadius">Radio de alertas (km):</label>
      <input
        type="range"
        id="alertRadius"
        min="1"
        max="100"
        value={alertRadius}
        onChange={(e) => setAlertRadius(Number(e.target.value))}
      />
      <span>{alertRadius} km</span>
    </div>
  );

  return (
    <div className="pet-management-container">
      <div className="pet-management-content">
        <h2>Gestión de Mascotas</h2>
        {renderAlertRadiusControl()}
        <button className="add-pet-button" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : 'Añadir Nueva Mascota'}
        </button>

        {showForm && <PetForm onSubmit={handleCreatePet} />}
        
        {isLoading ? (
          <div className="loading-message">
            <i className="fas fa-spinner"></i>
            <p>Cargando mascotas...</p>
          </div>
        ) : (
          <>
            <PetList pets={pets} onToggleLost={handleToggleLost} onShowHistory={fetchScanHistory} />
            {selectedPetId && (
              <div className="scan-history">
                <h3>Historial de Escaneos</h3>
                {scanHistory.length > 0 ? (
                  <ul>
                    {scanHistory.map((scan, index) => (
                      <li key={index}>
                        {new Date(scan.timestamp).toLocaleString()} - Lat: {scan.latitude}, Lon: {scan.longitude}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No hay escaneos registrados.</p>
                )}
              </div>
            )}
          </>
        )}
        
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
      </div>
    </div>
  );
};

export default PetManagement;