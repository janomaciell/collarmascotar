import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPets, updateUserLocation, logout } from '../../services/api';
import EditProfileModal from '../EditProfile/EditProfile';
import './Profile.css';
import { API_URL } from '../../services/api';
import { FaExclamationTriangle, FaUser, FaPaw, FaCog, FaShoppingCart, FaSignOutAlt } from 'react-icons/fa';

const Profile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [pets, setPets] = useState([]);
  const [isLoadingPets, setIsLoadingPets] = useState(true);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const mascotaImage = 'src/img/personaje2.png';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { state: { message: 'Por favor inicia sesión para ver tu perfil' } });
      return;
    }

    fetchData();
  }, [navigate]);

  const fetchUserData = async () => {
    try {
      setIsLoadingUser(true);
      const response = await fetch(`${API_URL}/users/me/`, {
        headers: { 
          Authorization: `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setUserData(data);
      return data;
    } catch (err) {
      console.error('Error en fetchUserData:', err);
      setError('Error al cargar datos del usuario');
      setUserData(null);
      return null;
    } finally {
      setIsLoadingUser(false);
    }
  };

  const fetchPets = async () => {
    try {
      setIsLoadingPets(true);
      const data = await getPets();
      if (!data) throw new Error('No se recibieron datos de mascotas');
      setPets(data);
      return data;
    } catch (err) {
      console.error('Error en fetchPets:', err);
      setError('Error al cargar mascotas');
      setPets([]);
      return [];
    } finally {
      setIsLoadingPets(false);
    }
  };

  const updateLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            radiusKm: 50,
          };
          await updateUserLocation(location);
        },
        () => setError('No se pudo obtener tu ubicación. Verifica los permisos.')
      );
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setIsLoadingUser(true);
      setIsLoadingPets(true);

      const [userResponse, petsResponse] = await Promise.all([
        fetch(`${API_URL}/users/me/`, {
          headers: { Authorization: `Token ${localStorage.getItem('token')}` },
        }),
        getPets()
      ]);

      if (!userResponse.ok) {
        throw new Error('Error al cargar datos del usuario');
      }
      const userData = await userResponse.json();
      setUserData(userData);
      
      setPets(petsResponse || []);

      updateLocation().catch(err => 
        console.warn('Error actualizando ubicación:', err)
      );
    } catch (err) {
      console.error('Error en fetchData:', err);
      setError('Error al cargar los datos. Por favor, intenta de nuevo.');
      setPets([]);
      setUserData(null);
    } finally {
      setLoading(false);
      setIsLoadingUser(false);
      setIsLoadingPets(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRetry = () => {
    setLoading(true);
    setError('');
    Promise.all([
      fetchUserData(),
      fetchPets(),
      updateLocation()
    ]).finally(() => {
      setLoading(false);
    });
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    fetchUserData();
  };

  const memoizedPets = useMemo(() => pets, [pets]);

  if (loading) {
    return (
      <div className="profile-wrapper">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando tu perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-wrapper">
      {/* Hero del perfil */}
      <section className="profile-hero">
        <div className="pattern-bg"></div>
        <div className="hero-content">
          <h1 className="hero-title">MI PERFIL</h1>
          <p className="hero-subtitle">Gestiona tu cuenta y mascotas</p>
        </div>
      </section>

      <div className="profile-container">
        {error && (
          <div className="error-message">
            <span className="error-icon"><FaExclamationTriangle /></span>
            <span>{error}</span>
            <button onClick={handleRetry} className="retry-button">
              Reintentar
            </button>
          </div>
        )}

        <div className="profile-content">
          {/* Información personal */}
          <div className="profile-card">
            <div className="card-header">
              <h2>Información Personal</h2>
              <span className="card-icon"><FaUser /></span>
            </div>
            
            {userData && (
              <div className="card-content">
                <div className="info-item">
                  <span className="info-label">Usuario:</span>
                  <span className="info-value">{userData.username}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{userData.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Nombre y apellido:</span>
                  <span className="info-value">
                    {[userData.first_name ?? '', userData.last_name ?? ''].map(s => (s || '').trim()).filter(Boolean).join(' ') || 'No especificado'}
                  </span>
                </div>
                <div className="info-item info-item-note">
                  <span className="info-note">
                    Este nombre aparecerá como dueño en el cartel de mascota perdida.
                  </span>
                </div>

                <button className="edit-btn" onClick={openModal}>
                  Editar perfil
                </button>
              </div>
            )}
          </div>

          {/* Mis mascotas */}
          <div className="profile-card">
            <div className="card-header">
              <h2>Mis Mascotas</h2>
              <span className="card-icon"><FaPaw /></span>
            </div>
            
            <div className="card-content">
              {isLoadingPets ? (
                <div className="loading-pets">
                  <div className="pet-skeleton"></div>
                  <div className="pet-skeleton"></div>
                </div>
              ) : memoizedPets && memoizedPets.length > 0 ? (
                <div className="pets-list">
                  {memoizedPets.map((pet) => (
                    <div key={pet.id} className="pet-item">
                      <img
                        src={pet.photo}
                        alt={`Foto de ${pet.name}`}
                        className="pet-photo"
                      />
                      <div className="pet-info">
                        <h3>{pet.name}</h3>
                        <p>{pet.breed || 'Sin raza'} • {pet.age} años</p>
                        {pet.is_lost && <span className="lost-badge">Perdida</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-pets">
                  <p>No tienes mascotas registradas</p>
                </div>
              )}
              
              <button
                className="pets-btn"
                onClick={() => navigate('/pets')}
              >
                Gestionar mascotas
              </button>
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="profile-card actions-card">
            <div className="card-header">
              <h2>Acciones</h2>
              <span className="card-icon"><FaCog /></span>
            </div>
            
            <div className="card-content">
              <button
                className="action-btn purchase-btn"
                onClick={() => navigate('/compra')}
              >
                <span className="btn-icon"><FaShoppingCart /></span>
                Comprar collar
              </button>
              
              <button
                className="action-btn logout-btn"
                onClick={handleLogout}
              >
                <span className="btn-icon"><FaSignOutAlt /></span>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && <EditProfileModal onClose={closeModal} />}
    </div>
  );
};

export default Profile;