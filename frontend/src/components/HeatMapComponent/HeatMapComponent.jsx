import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.heat/dist/leaflet-heat.js';
import 'leaflet/dist/leaflet.css';
import './HeatMapComponent.css';

const HeatMapComponent = ({ scanHistory }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const heatLayerRef = useRef(null);
  const [mapId] = useState(`map-${Math.random().toString(36).substr(2, 9)}`);

  const calculateCenter = () => {
    if (!scanHistory || scanHistory.length === 0) {
      return [-37.0, -57.13]; // Centro por defecto si no hay datos
    }
    const sum = scanHistory.reduce(
      (acc, scan) => ({
        lat: acc.lat + parseFloat(scan.latitude),
        lng: acc.lng + parseFloat(scan.longitude),
      }),
      { lat: 0, lng: 0 }
    );
    return [sum.lat / scanHistory.length, sum.lng / scanHistory.length];
  };

  const heatmapPoints = (scanHistory || [])
    .map(scan => [
      parseFloat(scan.latitude),
      parseFloat(scan.longitude),
      1,
    ])
    .filter(point => !isNaN(point[0]) && !isNaN(point[1]));

  // Limpiar completamente y recrear el mapa
  useEffect(() => {
    // Limpiar mapa anterior si existe
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Si no hay datos, no creamos mapa
    if (!scanHistory || scanHistory.length === 0) {
      return;
    }

    // Aseguramos que el contenedor esté limpio
    if (mapContainerRef.current) {
      mapContainerRef.current.innerHTML = '';
    }

    // Crear nuevo div para el mapa
    const mapDiv = document.createElement('div');
    mapDiv.id = mapId;
    mapDiv.style.height = '500px';
    mapDiv.style.width = '100%';
    mapDiv.style.borderRadius = '10px';
    
    // Añadir el div al contenedor
    if (mapContainerRef.current) {
      mapContainerRef.current.appendChild(mapDiv);
      
      // Crear mapa
      const center = calculateCenter();
      mapInstanceRef.current = L.map(mapId).setView(center, 14);
      
      // Añadir capa base
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);
      
      // Añadir capa de calor si hay puntos
      if (heatmapPoints.length > 0) {
        heatLayerRef.current = L.heatLayer(heatmapPoints, {
          radius: 25,
          max: 1.0,
          minOpacity: 0.1,
          maxOpacity: 0.8,
          blur: 15,
        }).addTo(mapInstanceRef.current);
      }
    }

    // Limpiar al desmontar
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [scanHistory, mapId]);

  return (
    <div className="heatmap-container">
      {(!scanHistory || scanHistory.length === 0) ? (
        <div className="no-data-message">
          No hay datos de escaneo disponibles para mostrar el mapa de calor.
        </div>
      ) : (
        <div 
          ref={mapContainerRef} 
          className="leaflet-container-wrapper"
        />
      )}
    </div>
  );
};

export default HeatMapComponent;