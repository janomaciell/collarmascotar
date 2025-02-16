import React, { useState, useEffect } from 'react';
import { getPets, createPet } from '../../services/api';
import PetForm from '../../components/PetForm/PetForm';
import PetList from '../../components/PetList/PetList';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const [pets, setPets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

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
      setError('Error al cargar las mascotas. Por favor intente nuevamente.');
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
      setError('Error al crear la mascota. Por favor intente nuevamente.');
      console.error(err);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Mi Panel de Control</h2>
        <Link to="/pets" className="add-pet-button">
          Gestionar Mascotas
        </Link>
      </div>
      
      {error && <p className="error-message">{error}</p>}
      
      {showForm && (
        <div className="pet-form-container">
          <h3>Añadir Nueva Mascota</h3>
          <PetForm onSubmit={handleCreatePet} />
        </div>
      )}
      
      {isLoading ? (
        <p className="loading-message">Cargando mascotas...</p>
      ) : (
        <div className="pets-container">
          <h3>Mis Mascotas</h3>
          <PetList pets={pets} />
        </div>
      )}
    </div>
  );
};

export default Dashboard; 