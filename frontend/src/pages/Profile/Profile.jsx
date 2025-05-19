import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPets, updateUserLocation, logout } from '../../services/api';
import EditProfileModal from '../EditProfile/EditProfile';
import './Profile.css';
import { API_URL } from '../../services/api';

const Profile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [pets, setPets] = useState([]);
  const [isLoadingPets, setIsLoadingPets] = useState(true);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      <div className="loading flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="profile-container max-w-3xl mx-auto p-4">
      <div className="profile-header flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mi Perfil - Encuéntrame</h1>

      </div>

      {error && (
        <div className="error-message px-4 py-3 rounded mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={handleRetry}
            className="underline hover:text-yellow-300"
            aria-label="Reintentar carga de datos"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="profile-content space-y-6">
        {/* Info del usuario */}
        <div className="profile-section card p-6">
          <h2 className="text-xl font-semibold mb-4">
            Información Personal
          </h2>
          {userData && (
            <>
              <p className="mb-2"><strong>Usuario:</strong> {userData.username}</p>
              <p className="mb-2"><strong>Email:</strong> {userData.email}</p>
              <p className="mb-2">
                <strong>Nombre:</strong> {userData.first_name} {userData.last_name}
              </p>
              <p className="mb-4"><strong>Teléfono:</strong> {userData.phone || 'No especificado'}</p>
              <button
                className="edit-btn px-4 py-2 rounded-md w-full sm:w-auto"
                onClick={openModal}
                aria-label="Editar perfil"
              >
                Editar Perfil
              </button>
            </>
          )}
        </div>

        {/* Mascotas */}
        <div className="profile-section card p-6">
          <h2 className="text-xl font-semibold mb-4">
            Mis Mascotas
          </h2>
          {isLoadingPets ? (
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-slate-200 h-10 w-10"></div>
              <div className="flex-1 space-y-6 py-1">
                <div className="h-2 bg-slate-200 rounded"></div>
              </div>
            </div>
          ) : memoizedPets && memoizedPets.length > 0 ? (
            <ul className="pet-list space-y-4">
              {memoizedPets.map((pet) => (
                <li key={pet.id} className="flex items-center gap-4">
                  <img
                    src={pet.photo || 'https://via.placeholder.com/50'}
                    alt={`Foto de ${pet.name}`}
                    className="pet-photo-circular"
                    loading="lazy"
                    width="50"
                    height="50"
                  />
                  <span>
                    {pet.name}{' '}
                    {pet.is_lost && (
                      <span className="lost-tag text-sm font-semibold">
                        (Perdida)
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No tienes mascotas registradas.</p>
          )}
          <button
            className="add-pet-btn mt-4 px-4 py-2 rounded-md w-full sm:w-auto"
            onClick={() => navigate('/pets')}
            aria-label="Gestionar mascotas"
          >
            Gestionar Mascotas
          </button>
        </div>
      </div>

      {isModalOpen && <EditProfileModal onClose={closeModal} />}
    </div>
  );
};

export default Profile;