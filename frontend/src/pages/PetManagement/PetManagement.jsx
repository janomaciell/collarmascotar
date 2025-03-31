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
      // Validar y truncar el nombre del archivo si es necesario
      if (petData.photo instanceof File) {
        const originalName = petData.photo.name;
        const extension = originalName.split('.').pop();
        const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
        // Truncar a 90 caracteres máximo para el nombre base (dejando espacio para '.' y extensión)
        const maxBaseLength = 95 - extension.length; // 100 - (1 para '.' + longitud de extensión)
        const truncatedBaseName = baseName.length > maxBaseLength ? baseName.substring(0, maxBaseLength) : baseName;

        // Crear un nuevo objeto File con el nombre truncado
        const truncatedName = `${truncatedBaseName}.${extension}`;
        const newFile = new File([petData.photo], truncatedName, { type: petData.photo.type });
        petData.photo = newFile;

        console.log('Nombre original:', originalName);
        console.log('Nombre truncado:', truncatedName);
        console.log('Longitud del nombre truncado:', truncatedName.length);
      }

      const newPet = await createPet(petData);
      setPets([...pets, newPet]);
      setShowForm(false);
      setSuccessMessage('Mascota creada exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Error al crear la mascota: ' + (err.photo?.[0] || err.detail || err.message || err));
      console.error('Error detallado:', err);
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
    poster.style.width = '210mm';  // Tamaño A4
    poster.style.height = '297mm';
    poster.style.background = '#fff';
    poster.style.fontFamily = 'Arial, sans-serif';
    poster.style.padding = '10mm';
    poster.style.boxSizing = 'border-box';
    poster.style.border = '2px solid #f4b084';
  
    poster.innerHTML = `
      <div style="text-align: center; background: linear-gradient(135deg, #87a8d0, #f4b084); padding: 10mm; color: white;">
        <h1 style="margin: 0; font-size: 36px; text-transform: uppercase;">¡Mascota Perdida!</h1>
        <div style="height: 40px; margin-top: 10px;"> <!-- Espacio para logo futuro -->
          <span style="font-size: 14px; opacity: 0.8;">[CollarMascotaQR - Próximamente Logo]</span>
        </div>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; padding: 10mm;">
        <img src="${pet.photo || 'https://via.placeholder.com/300'}" alt="Foto de ${pet.name}" style="width: 150mm; height: 150mm; object-fit: cover; border-radius: 5px; border: 2px solid #87a8d0;" />
        <div style="margin-top: 10mm; text-align: center; width: 100%;">
          <p style="font-size: 24px; color: #4a3c31; margin: 5px 0;"><strong>Nombre:</strong> ${pet.name}</p>
          <p style="font-size: 20px; color: #666; margin: 5px 0;"><strong>Raza:</strong> ${pet.breed || 'No especificada'}</p>
          <p style="font-size: 20px; color: #666; margin: 5px 0;"><strong>Edad:</strong> ${pet.age} años</p>
          <p style="font-size: 20px; color: #666; margin: 5px 0;"><strong>Última vez vista:</strong> ${pet.last_seen_date ? new Date(pet.last_seen_date).toLocaleString() : new Date().toLocaleString()}</p>
          <p style="font-size: 20px; color: #666; margin: 5px 0;"><strong>Contacto:</strong> ${pet.phone || 'No disponible'}</p>
        </div>
        <div style="margin-top: 10mm;">
          <img src="${pet.qr_code}" alt="QR de ${pet.name}" style="width: 60mm; height: 60mm;" />
          <p style="font-size: 16px; color: #777; margin-top: 5px;">Escanea el QR para más información</p>
        </div>
      </div>
      <div style="position: absolute; bottom: 10mm; width: 100%; text-align: center; font-size: 12px; color: #777;">
        <p>© 2025 CollarMascotaQR - Ayúdanos a encontrar a ${pet.name}</p>
      </div>
    `;
  
    document.body.appendChild(poster);
    const canvas = await html2canvas(poster, { scale: 2 });  // Mayor resolución
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);  // Ajustado a A4
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
            radius_km: 5,  
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



  return (
    <div className="pet-management-container">
      <div className="pet-management-content">
        <h2>Gestión de Mascotas</h2>

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