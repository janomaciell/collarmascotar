import React, { useState, useEffect } from 'react';
import { createReward, getUserPoints, getReward } from '../services/api';

const RewardSystem = ({ petId }) => {
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');
  const [userPoints, setUserPoints] = useState(0);
  const [existingReward, setExistingReward] = useState(null);

  useEffect(() => {
    fetchUserPoints();
    fetchExistingReward();
  }, [petId]);

  const fetchUserPoints = async () => {
    try {
      const points = await getUserPoints();
      setUserPoints(points.total_points);
    } catch (error) {
      console.error('Error fetching points', error);
    }
  };

  const fetchExistingReward = async () => {
    try {
      const reward = await getReward(petId);
      setExistingReward(reward);
      setAmount(reward.amount);
      setDescription(reward.description);
    } catch (error) {
      console.error('No existing reward found or error fetching reward', error);
    }
  };

  const handleCreateReward = async () => {
    try {
      await createReward(petId, { amount, description });
      alert('Recompensa creada exitosamente');
      fetchExistingReward(); // Actualizar después de crear
    } catch (error) {
      console.error('Error creating reward', error);
    }
  };

  return (
    <div>
      <h3>Sistema de Recompensas</h3>
      <p>Tus puntos actuales: {userPoints}</p>
      
      {existingReward && (
        <div>
          <p>Recompensa existente: ${existingReward.amount} - {existingReward.description}</p>
        </div>
      )}
      
      <div>
        <label>Monto de Recompensa ($)</label>
        <input 
          type="number" 
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      
      <div>
        <label>Descripción de Recompensa</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      
      <button onClick={handleCreateReward}>
        {existingReward ? 'Actualizar Recompensa' : 'Crear Recompensa'}
      </button>
    </div>
  );
};

export default RewardSystem;