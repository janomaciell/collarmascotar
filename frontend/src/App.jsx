import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import Register from './pages/Register/Register';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import PetPage from './pages/PetPage/PetPage';
import PetManagement from './pages/PetManagement/PetManagement';
import Profile from './pages/Profile/Profile';
import Subscriptions from './pages/Subscriptions/Subscriptions';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import PrivateRoute from './components/PrivateRoute/PrivateRoute';
import About from './pages/About/About';
import Support from './pages/Support/Support';
import NotificationPromptModal from './components/NotificationPromptModal/NotificationPromptModal'; // Importamos el modal
import './App.css';
import Analytics from "./components/Analytics";
import EditProfile from './pages/EditProfile/EditProfile';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar si el usuario está autenticado al cargar la app
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token); // Si hay token, el usuario está autenticado

    // Escuchar cambios en el token (por ejemplo, al iniciar/cerrar sesión)
    const handleStorageChange = () => {
      const newToken = localStorage.getItem('token');
      setIsAuthenticated(!!newToken);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <Router>
      <Analytics />
      <div className="App">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/support" element={<Support />} />
            <Route path="/about" element={<About />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route
              path="/pets"
              element={
                <PrivateRoute>
                  <PetManagement />
                </PrivateRoute>
              }
            />
            <Route path="/pet/:uuid" element={<PetPage />} />
            <Route
              path="/subscriptions"
              element={
                <PrivateRoute>
                  <Subscriptions />
                </PrivateRoute>
              }
            />
            <Route path="/edit-profile" element={<EditProfile />} />
          </Routes>
        </main>
        <Footer />
        {/* Mostrar el modal solo si el usuario está autenticado */}
        {isAuthenticated && <NotificationPromptModal />}
      </div>
    </Router>
  );
}

export default App;