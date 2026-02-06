import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPetByUuid, generateLostPoster } from '../../services/api';
import './LostPoster.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { FaPaw, FaCalendarAlt, FaHome, FaBirthdayCake, FaPhone, FaEnvelope } from 'react-icons/fa';
const BASE_URL = import.meta.env.VITE_BASE_URL;

const logoUrl = new URL('../../img/logo.png', import.meta.url).href;

const fallbackPhotos = [
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1518364538800-6bae3c2ea5fd?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=800&q=80',
];

const getRandomFallbackPhoto = () => {
  const index = Math.floor(Math.random() * fallbackPhotos.length);
  return fallbackPhotos[index];
};

const LostPoster = () => {
  const { petId } = useParams();
  const [pet, setPet] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const posterRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPet = async () => {
      try {
        setIsLoading(true);
        const data = await getPetByUuid(petId);
        setPet(data);
        setTimeout(() => generatePosterImage(), 1000);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('No se pudo cargar la mascota: ' + (err.detail || err.message));
      } finally {
        setIsLoading(false);
      }
    };
    fetchPet();
  }, [petId]);

  const handleImageError = (imgElement) => {
    console.warn('Error loading photo, switching to fallback image');
    if (!imgElement) return;
    imgElement.onerror = null;
    imgElement.src = getRandomFallbackPhoto();
  };

  const generatePosterImage = async () => {
    if (!posterRef.current) return null;

    setIsGenerating(true);
    try {
      const images = posterRef.current.getElementsByTagName('img');
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise((resolve, reject) => {
              if (img.complete) {
                resolve();
              } else {
                img.onload = resolve;
                img.onerror = reject;
              }
            })
        )
      );

      // Dimensiones A4 fijas en píxeles (96 DPI) para que el póster llene toda la hoja sin bordes
      const a4PxWidth = 794;
      const a4PxHeight = 1123;
      const posterElement = posterRef.current;

      // Guardar y forzar estilos para que el póster ocupe exactamente A4 sin bordes
      const originalStyles = {
        width: posterElement.style.width,
        height: posterElement.style.height,
        maxWidth: posterElement.style.maxWidth,
        margin: posterElement.style.margin,
        borderRadius: posterElement.style.borderRadius,
        aspectRatio: posterElement.style.aspectRatio,
      };

      posterElement.style.width = `${a4PxWidth}px`;
      posterElement.style.height = `${a4PxHeight}px`;
      posterElement.style.maxWidth = `${a4PxWidth}px`;
      posterElement.style.margin = '0';
      posterElement.style.borderRadius = '0';
      posterElement.style.aspectRatio = 'none';

      await new Promise((resolve) => requestAnimationFrame(resolve));

      // Capturar sin width/height para que el canvas coincida con el elemento (sin márgenes blancos)
      const canvas = await html2canvas(posterRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: a4PxWidth,
        windowHeight: a4PxHeight,
      });

      // Restaurar estilos originales
      Object.assign(posterElement.style, originalStyles);
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      setPosterUrl(imgData);
      return imgData;
    } catch (err) {
      console.error('Error generating poster image:', err);
      setError('Error al generar imagen del cartel');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPdf = async () => {
    setIsGenerating(true);
    try {
      // Generar la imagen del poster (siempre regenerar para asegurar dimensiones correctas)
      const imageUrl = await generatePosterImage();

      if (!imageUrl) {
        throw new Error('No se pudo generar la imagen del poster');
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imageUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`mascota_perdida_${pet.name}_ENCUENTRAME.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Error al generar PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) return <div className="loading">Cargando cartel...</div>;
  if (error) return <div className="error-container">{error}</div>;
  if (!pet) return <div className="not-found">Mascota no encontrada</div>;

  const lastSeenDate = pet.last_seen_date ? new Date(pet.last_seen_date).toLocaleDateString() : new Date().toLocaleDateString();

  return (
    <div className="lost-poster-page">
      <div className="poster-actions">
        <button onClick={() => navigate(-1)} className="back-button">Volver</button>
        <button onClick={downloadPdf} disabled={isGenerating} className="download-button">
          {isGenerating ? 'Generando...' : 'Descargar Cartel (PDF)'}
        </button>
      </div>

      <div className="lost-poster-container">
        <div className="lost-poster-scale">
          <div ref={posterRef} className="lost-poster">
          {/* Encabezado con Branding */}
          <div className="poster-header">
            <div className="brand-container">
              <div className="brand-logo-section">
                <img src={logoUrl} alt="EncuentraME Logo" className="brand-logo" />
                <div className="brand-text">
                  <h1 className="brand-name">ENCUENTRAME</h1>
                  <p className="brand-slogan">Un escaneo, un reencuentro</p>
                </div>
              </div>
            </div>
            
            <div className="poster-title">
              <h2>MASCOTA PERDIDA</h2>
            </div>
          </div>

          {/* Foto de la Mascota */}
          <div className="pet-photo-container-poster">
            {pet.photo || true ? (
              <img
                src={pet.photo ? `${BASE_URL}${pet.photo}` : getRandomFallbackPhoto()}
                alt={`Foto de ${pet.name}`}
                className="pet-photo-lost-poster"
                crossOrigin="anonymous"
                onError={(event) => handleImageError(event.currentTarget)}
              />
            ) : (
              <div className="no-photo-placeholder">
                <span className="no-photo-icon"><FaPaw /></span>
                <p>Sin foto</p>
              </div>
            )}
          </div>

          {/* Nombre de la Mascota */}
          <div className="pet-name-container">
            <h2 className="pet-name">{pet.name.toUpperCase()}</h2>
          </div>

          {/* Detalles de la Mascota */}
          <div className="pet-details">
            <div className="detail-row">
              <div className="detail-item">
                <span className="detail-icon"><FaCalendarAlt /></span>
                <div className="detail-text">
                  <strong>Última vez visto:</strong>
                  <p>{lastSeenDate}</p>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-icon"><FaPaw /></span>
                <div className="detail-text">
                  <strong>Raza:</strong>
                  <p>{pet.breed || 'No especificada'}</p>
                </div>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-item">
                <span className="detail-icon"><FaHome /></span>
                <div className="detail-text">
                  <strong>Dueño:</strong>
                  <p>{pet.owner || 'No especificado'}</p>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-icon"><FaBirthdayCake /></span>
                <div className="detail-text">
                  <strong>Edad:</strong>
                  <p>{pet.birthday ? `Nacido: ${pet.birthday}` : 'No especificada'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mensaje Motivacional */}
          <div className="motivational-message">
            <p>¡Por favor ayúdame a volver a casa! ¡Mi familia me extraña!</p>
          </div>

          {/* Sección de Contacto */}
          <div className="contact-qr-section">
            <div className="contact-section">
              <h3>INFORMACIÓN DE CONTACTO</h3>
              <div className="contact-info">
                <div className="contact-item">
                  <span className="contact-icon"><FaPhone /></span>
                  <strong>{pet.phone}</strong>
                </div>
                {pet.email && (
                  <div className="contact-item">
                    <span className="contact-icon"><FaEnvelope /></span>
                    <strong>{pet.email}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pie de Página con Marca */}
          <div className="poster-footer">
            <p className="footer-text">Póster generado con <strong>Encuentrame</strong> - Collares QR para mascotas</p>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LostPoster;