import React, { useState, useEffect } from 'react';
import { getPets, createPet, updatePetLostStatus, getScanHistory } from '../../services/api';
import PetForm from '../../components/PetForm/PetForm';
import PetList from '../../components/PetList/PetList';
import './PetManagement.css';

const PetManagement = () => {
  const [pets, setPets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);

  useEffect(() => {
    fetchPets();
  }, []);

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
      </div>
    </div>
  );
};

export default PetManagement;