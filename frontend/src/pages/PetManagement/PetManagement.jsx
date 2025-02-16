import React, { useState, useEffect } from 'react';
import { getPets, createPet } from '../../services/api';
import PetForm from '../../components/PetForm/PetForm';
import PetList from '../../components/PetList/PetList';
import './PetManagement.css';

const PetManagement = () => {
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
    <div className="pet-management-container">
      <h2>Gestión de Mascotas</h2>
      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancelar' : 'Añadir Nueva Mascota'}
      </button>
      
      {showForm && <PetForm onSubmit={handleCreatePet} />}
      
      {isLoading ? (
        <p>Cargando mascotas...</p>
      ) : (
        <PetList pets={pets} />
      )}
      
      {error && <p>{error}</p>}
    </div>
  );
};

export default PetManagement; 