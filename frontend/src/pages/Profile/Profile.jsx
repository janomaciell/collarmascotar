import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPets, updateUserLocation, logout } from '../../services/api';
import EditProfileModal from '../EditProfile/EditProfile';
import './Profile.css';
import { API_URL } from '../../services/api';

const Profile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { state: { message: 'Por favor inicia sesión para ver tu perfil' } });
      return;
    }

    const fetchData = async () => {
      try {
        await Promise.all([
          fetchUserData(),
          fetchPets(),
          updateLocation(),
        ]);
      } catch (err) {
        setError('Error al cargar los datos. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const fetchUserData = async () => {
    const response = await fetch(`${API_URL}/users/me/`, {
      headers: { Authorization: `Token ${localStorage.getItem('token')}` },
    });
    if (!response.ok) throw new Error('Error al cargar datos del usuario');
    const data = await response.json();
    setUserData(data);
  };

  const fetchPets = async () => {
    const data = await getPets();
    setPets(data);
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRetry = () => {
    setLoading(true);
    setError('');
    fetchUserData();
    fetchPets();
    updateLocation();
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    fetchUserData(); // Refrescar datos tras editar
  };

  if (loading) {
    return (
      <div className="loading flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="profile-container max-w-3xl mx-auto p-4">
      <div className="profile-header flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Mi Perfil</h1>

        
      </div>

      {error && (
        <div className="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={handleRetry}
            className="text-red-700 underline hover:text-red-900"
            aria-label="Reintentar carga de datos"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="profile-content space-y-6">
        {/* Info del usuario */}
        <div className="profile-section card bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            <i className="fas fa-user mr-2"></i> Información Personal
          </h2>
          {userData && (
            <>
              <p className="text-gray-600 mb-2"><strong>Usuario:</strong> {userData.username}</p>
              <p className="text-gray-600 mb-2"><strong>Email:</strong> {userData.email}</p>
              <p className="text-gray-600 mb-2">
                <strong>Nombre:</strong> {userData.first_name} {userData.last_name}
              </p>
              <p className="text-gray-600 mb-4"><strong>Teléfono:</strong> {userData.phone || 'No especificado'}</p>
              <button
                className="edit-btn px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 w-full sm:w-auto"
                onClick={openModal}
                aria-label="Editar perfil"
              >
                Editar Perfil
              </button>
            </>
          )}
        </div>

        {/* Mascotas */}
        <div className="profile-section card bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            <i className="fas fa-paw mr-2"></i> Mis Mascotas
          </h2>
          {pets.length > 0 ? (
            <ul className="pet-list space-y-4">
              {pets.map((pet) => (
                <li key={pet.id} className="flex items-center gap-4">
                  <img
                    src={pet.photo || 'https://via.placeholder.com/50'}
                    alt={`Foto de ${pet.name}`}
                    className="pet-photo-circular"
                  />
                  <span className="text-gray-600">
                    {pet.name}{' '}
                    {pet.is_lost && (
                      <span className="lost-tag text-red-500 text-sm font-semibold">
                        (Perdida)
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No tienes mascotas registradas.</p>
          )}
          <button
            className="add-pet-btn mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 w-full sm:w-auto"
            onClick={() => navigate('/pets')}
            aria-label="Gestionar mascotas"
          >
            Gestionar Mascotas
          </button>
        </div>

        {/* Secciones futuras: Notificaciones y Suscripciones
        <div className="profile-section card bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            <i className="fas fa-bell mr-2"></i> Notificaciones
          </h2>
          <NotificationSettings />
        </div>

        <div className="profile-section card bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            <i className="fas fa-crown mr-2"></i> Mi Suscripción
          </h2>
          <p className="text-gray-600 mb-4">Plan actual: Básico (próximamente más detalles)</p>
          <Link
            to="/subscriptions"
            className="text-blue-500 hover:underline"
            aria-label="Gestionar suscripción"
          >
            Gestionar Suscripción
          </Link>
        </div>
        */}
      </div>

      {isModalOpen && <EditProfileModal onClose={closeModal} />}
    </div>
  );
};

export default Profile;
