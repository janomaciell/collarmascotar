import React from 'react';
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
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
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
            <Route path="/pet/:uuid" element={<PetPage />} /> {/* Pública */}
            <Route
              path="/subscriptions"
              element={
                <PrivateRoute>
                  <Subscriptions />
                </PrivateRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;