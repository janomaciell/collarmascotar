import React from "react";
import './Subscriptions.css';

const Subscriptions = () => {
  return (
    <div className="subscriptions-container">
      <h1>Planes y Suscripciones</h1>
      
      <div className="plans-container">
        <div className="plan-card">
          <h2>Plan Básico</h2>
          <p className="price">$9.99/mes</p>
          <ul>
            <li>1 mascota</li>
            <li>QR básico</li>
            <li>Notificaciones básicas</li>
          </ul>
          <button className="subscribe-btn">Suscribirse</button>
        </div>

        <div className="plan-card featured">
          <h2>Plan Premium</h2>
          <p className="price">$19.99/mes</p>
          <ul>
            <li>Hasta 3 mascotas</li>
            <li>QR personalizado</li>
            <li>Notificaciones avanzadas</li>
            <li>Soporte 24/7</li>
          </ul>
          <button className="subscribe-btn">Suscribirse</button>
        </div>
      </div>
    </div>
  );
};

export default Subscriptions; // Agregamos la exportación por defecto