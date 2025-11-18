import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import Register from './pages/Register/Register';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import PetPage from './pages/PetPage/PetPage';
import PetManagement from './pages/PetManagement/PetManagement';
import Profile from './pages/Profile/Profile';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import PrivateRoute from './components/PrivateRoute/PrivateRoute';
import About from './pages/About/About';
import Support from './pages/Support/Support';
import HowItWorks from './pages/HowItWorks/HowItWorks';
import NotificationPromptModal from './components/NotificationPromptModal/NotificationPromptModal';
import LostPoster from './pages/LostPoster/LostPoster'; // Import the LostPoster component
import ResetPassword from './pages/ResetPassword/ResetPassword';
import Analytics from './components/Analytics';
import EditProfile from './pages/EditProfile/EditProfile';
import Compra from './components/Compra/Compra';
import QRRegistrationPage from './pages/QRRegistrationPage/QRRegistrationPage';
import QRRedirectPage from './pages/QRRedirectPage/QRRedirectPage';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);

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
            <Route path="/home" element={<Home />} />
            <Route path="/support" element={<Support />} />
            <Route path="/about" element={<About />} />
            <Route path="/como-funciona" element={<HowItWorks />} />
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
            <Route path="/edit-profile" element={<EditProfile />} />
            <Route path="/compra" element={<Compra />} />
            <Route path="/register-pet/:uuid" element={<QRRegistrationPage />} />
            <Route path="/qr/:uuid" element={<QRRedirectPage />} />
            <Route path="/lost-poster/:petId" element={<LostPoster />} /> {/* Add this route */}
            <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
          </Routes>
        </main>
        <Footer />
        {isAuthenticated && <NotificationPromptModal />}
      </div>
    </Router>
  );
}

export default App;