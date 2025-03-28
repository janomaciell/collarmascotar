import React, { useState, useEffect } from 'react';
import { getPets, createPet, updatePetLostStatus, getScanHistory, updateUserLocation, generateLostPoster } from '../../services/api';
import PetForm from '../../components/PetForm/PetForm';
import PetList from '../../components/PetList/PetList';
import './PetManagement.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { API_URL } from '../../services/api';

const PetManagement = () => {
  const [pets, setPets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [alertRadius, setAlertRadius] = useState(50);

  useEffect(() => {
    fetchPets();
    updateLocation();
  }, []);

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
          try {
            await updateUserLocation(location);
            console.log('User location updated in backend');
          } catch (err) {
            setError('Error updating user location: ' + err.message);
          }
        },
        (err) => {
          setError('Error getting location: ' + err.message);
          console.error('Error al obtener ubicación:', err);
        },
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

      if (!currentStatus) {
        const pet = pets.find((p) => p.id === petId);
        const posterUrl = await generateLostPosterLocal(pet);
        await sendLostNotification(petId);
        const posterResponse = await uploadPosterToBackend(petId, posterUrl);
        if (posterResponse?.id) {
          viewSharedPoster(posterResponse.id);
        }
      }
    } catch (err) {
      setError('Error al actualizar estado: ' + err.message);
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

  const generateLostPosterLocal = async (pet) => {
    const poster = document.createElement('div');
    poster.className = 'lost-poster';
    poster.innerHTML = `
      <h1>¡Mascota Perdida!</h1>
      <img src="${pet.photo || 'https://via.placeholder.com/200'}" alt="Foto de ${pet.name}" />
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
      return response; // Retornamos la respuesta para obtener el ID del poster
    } catch (err) {
      setError('Error al subir el poster: ' + err.message);
      console.error(err);
      throw err;
    }
  };

  const sendLostNotification = async (petId) => {
    if (!userLocation) {
      setError('No se pudo obtener tu ubicación para enviar alertas');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/pets/lost/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('token')}`,
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
      setError('Error al enviar notificaciones: ' + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const viewSharedPoster = async (posterId) => {
    try {
      const response = await fetch(`${API_URL}/poster/${posterId}/`, {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      window.open(data.poster.imageUrl, '_blank');
    } catch (err) {
      setError('Error al ver el poster compartido: ' + err.message);
      console.error(err);
    }
  };

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
                        {new Date(scan.timestamp).toLocaleString()} - Lat: {scan.latitude}, Lon:{' '}
                        {scan.longitude}
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