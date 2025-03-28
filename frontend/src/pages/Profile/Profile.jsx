import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import NotificationSettings from '../../components/NotificationSettings';
import { getUserPoints, getPets, updateUserLocation, logout } from '../../services/api'; // Añade más funciones de API según necesites
import './Profile.css';
import { API_URL } from '../../services/api';

const Profile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [pets, setPets] = useState([]);
  const [points, setPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pointsHistory, setPointsHistory] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { state: { message: 'Por favor inicia sesión para ver tu perfil' } });
      return;
    }

    fetchUserData();
    fetchPets();
    fetchPoints();
    fetchPointsHistory();
    updateLocation();
  }, [navigate]);

  const fetchUserData = async () => {
    try {
      // Suponiendo que tienes un endpoint para obtener datos del usuario
      const response = await fetch(`${API_URL}/users/me/`, {
        headers: { 'Authorization': `Token ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      setUserData(data);
    } catch (err) {
      setError('Error al cargar datos del usuario');
    }
  };

  const fetchPets = async () => {
    try {
      const data = await getPets();
      setPets(data);
    } catch (err) {
      setError('Error al cargar mascotas');
    } finally {
      setLoading(false);
    }
  };

  const fetchPoints = async () => {
    try {
      const data = await getUserPoints();
      setPoints(data);
    } catch (err) {
      setError('Error al cargar puntos');
    }
  };

  const fetchPointsHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/users/points-history/`, {
        headers: { 'Authorization': `Token ${localStorage.getItem('token')}` },
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Historial de puntos:', data); // Depura la respuesta
      setPointsHistory(data);
    } catch (err) {
      setError('Error al cargar historial de puntos: ' + err.message);
      console.error(err);
    }
  };

  const updateLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            radiusKm: 50, // Valor por defecto
          };
          await updateUserLocation(location);
        },
        (err) => setError('Error al obtener ubicación: ' + err.message)
      );
    }
  };

  const handleLogout = () => {
    logout(); // Función para cerrar sesión
    navigate('/login');
  };

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Mi Perfil</h1>
        <button className="logout-btn" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt"></i> Cerrar Sesión
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="profile-content">
        {/* Información del usuario */}
        <div className="profile-section card">
          <h2><i className="fas fa-user"></i> Información Personal</h2>
          {userData && (
            <>
              <p><strong>Usuario:</strong> {userData.username}</p>
              <p><strong>Email:</strong> {userData.email}</p>
              <p><strong>Nombre:</strong> {userData.first_name} {userData.last_name}</p>
              <button className="edit-btn">Editar Perfil</button>
            </>
          )}
        </div>

        {/* Estadísticas */}
        <div className="profile-section card">
          <h2><i className="fas fa-star"></i> Mis Puntos</h2>
          {points && (
            <>
              <p><strong>Puntos Totales:</strong> {points.total_points}</p>
              <p><strong>Mascotas Ayudadas:</strong> {points.total_pets_helped}</p>
              {pointsHistory.length > 0 && (
                <div className="points-history">
                  <h3>Historial de Puntos</h3>
                  <ul>
                    {pointsHistory.map((record) => (
                      <li key={record.id}>
                        <span>{record.reason}</span>
                        <span className={`points ${record.points > 0 ? 'positive' : 'negative'}`}>
                          {record.points > 0 ? '+' : ''}{record.points}
                        </span>
                        <span className="date">{new Date(record.timestamp).toLocaleDateString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <Link to="/points-history" className="link">Ver Historial Completo</Link>
            </>
          )}
        </div>

        {/* Mascotas */}
        <div className="profile-section card">
          <h2><i className="fas fa-paw"></i> Mis Mascotas</h2>
          {pets.length > 0 ? (
            <ul className="pet-list">
              {pets.map((pet) => (
                <li key={pet.id}>
                  <img src={pet.photo || 'https://via.placeholder.com/50'} alt={pet.name} className="pet-photo" />
                  <span>{pet.name} {pet.is_lost && <span className="lost-tag">(Perdida)</span>}</span>
                  <Link to={`/pet/${pet.qr_uuid}`} className="link">Ver QR</Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>No tienes mascotas registradas.</p>
          )}
          <button className="add-pet-btn" onClick={() => navigate('/pet-management')}>
            Añadir Mascota
          </button>
        </div>

        {/* Configuración de notificaciones */}
        <div className="profile-section card">
          <h2><i className="fas fa-bell"></i> Notificaciones</h2>
          <NotificationSettings />
        </div>

        {/* Suscripciones */}
        <div className="profile-section card">
          <h2><i className="fas fa-crown"></i> Mi Suscripción</h2>
          <p>Plan actual: Básico (próximamente más detalles)</p>
          <Link to="/subscriptions" className="link">Gestionar Suscripción</Link>
        </div>
      </div>
    </div>
  );
};

export default Profile;