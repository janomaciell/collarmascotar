import React, { useEffect, useState } from 'react';
import { API_URL } from '../../services/api';
import './EditProfile.css';

const EditProfileModal = ({ onClose }) => {
  const [userData, setUserData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const fetchUserData = async () => {
      try {
        const response = await fetch(`${API_URL}/users/me/`, {
          headers: { Authorization: `Token ${token}` },
        });
        if (!response.ok) throw new Error('Error al cargar datos del usuario');
        const data = await response.json();
        setUserData({
          first_name: data.first_name,
          last_name: data.last_name,
        });
      } catch (err) {
        setError('Error al cargar los datos. Intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/users/me/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: userData.first_name,
          last_name: userData.last_name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al actualizar el perfil');
      }

      setSuccess('¡Perfil actualizado con éxito!');
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err.message || 'Error al guardar los cambios.');
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button
          className="close-btn"
          onClick={onClose}
          aria-label="Cerrar modal"
        >
          ✕
        </button>
        <h2>Editar Perfil</h2>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre</label>
            <input
              type="text"
              name="first_name"
              value={userData.first_name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Apellido</label>
            <input
              type="text"
              name="last_name"
              value={userData.last_name}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="submit-btn">
            Guardar Cambios
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;