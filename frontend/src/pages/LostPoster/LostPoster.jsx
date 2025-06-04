import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPetByUuid, generateLostPoster } from '../../services/api';
import './LostPoster.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
const BASE_URL = import.meta.env.VITE_BASE_URL;

// Logo de EncuentraME - Reemplazar con la URL real de tu logo cuando esté disponible
const logoUrl = new URL('../../img/logo_icono_sin_fondo.png', import.meta.url).href; 
// Usando URL para obtener la ruta correcta
const LostPoster = () => {
  const { petId } = useParams(); // Este es el qr_uuid desde la URL
  const [pet, setPet] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareOptions, setShareOptions] = useState(false);
  const [posterUrl, setPosterUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const posterRef = useRef(null);
  const navigate = useNavigate();

  console.log('Pet UUID from URL:', petId);

  useEffect(() => {
    const fetchPet = async () => {
      try {
        console.log('Fetching pet with UUID:', petId);
        setIsLoading(true);
        const data = await getPetByUuid(petId);
        console.log('Pet data received:', data);
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

  const generatePosterImage = async () => {
    if (!posterRef.current) return;

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

      const canvas = await html2canvas(posterRef.current, {
        scale: 3, // Mayor resolución para impresión
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794, // Ancho A4 en píxeles (210mm)
        height: 1123, // Alto A4 en píxeles (297mm)
      });
      const imgData = canvas.toDataURL('image/png', 1.0);
      setPosterUrl(imgData);
    } catch (err) {
      console.error('Error generating poster image:', err);
      setError('Error al generar imagen del cartel');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPdf = async () => {
    if (!posterUrl) await generatePosterImage();

    setIsGenerating(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgProps = pdf.getImageProperties(posterUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(posterUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`mascota_perdida_${pet.name}_ENCUENTRAME.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Error al generar PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareSocial = async (platform) => {
    if (!posterUrl) await generatePosterImage();

    try {
      const response = await generateLostPoster(petId, posterUrl, platform);
      switch (platform) {
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(response.shareUrl)}`);
          break;
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(response.shareUrl)}`);
          break;
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(response.shareUrl)}&text=${encodeURIComponent('¡Ayuda a encontrar esta mascota perdida con ENCUENTRAME!')}`);
          break;
        default:
          navigator.clipboard.writeText(response.shareUrl);
          alert('¡Enlace copiado al portapapeles!');
      }
      setShareOptions(false);
    } catch (err) {
      console.error('Error sharing:', err);
      setError('Error al compartir cartel');
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
        <button onClick={() => setShareOptions(!shareOptions)} className="share-button">
          Compartir
        </button>
        {shareOptions && (
          <div className="share-options">
            <button onClick={() => handleShareSocial('whatsapp')} className="whatsapp-button">WhatsApp</button>
            <button onClick={() => handleShareSocial('facebook')} className="facebook-button">Facebook</button>
            <button onClick={() => handleShareSocial('twitter')} className="twitter-button">Twitter</button>
            <button onClick={() => handleShareSocial('copy')} className="copy-button">Copiar Enlace</button>
          </div>
        )}
      </div>

      <div className="lost-poster-container">
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
          <div className="pet-photo-container">
            <img
              src={pet.photo ? `${BASE_URL}${pet.photo}` : 'https://via.placeholder.com/500x400/94618E/ffffff?text=Sin+Foto'}
              alt={`Foto de ${pet.name}`}
              className="pet-photo"
              crossOrigin="anonymous"
            />
          </div>

          {/* Nombre de la Mascota */}
          <div className="pet-name-container">
            <h2 className="pet-name">{pet.name.toUpperCase()}</h2>
          </div>

          {/* Detalles de la Mascota */}
          <div className="pet-details">
            <div className="detail-row">
              <div className="detail-item">
                <span className="detail-icon">🗓️</span>
                <div className="detail-text">
                  <strong>Última vez visto:</strong>
                  <p>{lastSeenDate}</p>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-icon">🐾</span>
                <div className="detail-text">
                  <strong>Raza:</strong>
                  <p>{pet.breed || 'No especificada'}</p>
                </div>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-item">
                <span className="detail-icon">🏠</span>
                <div className="detail-text">
                  <strong>Dueño:</strong>
                  <p>{pet.owner || 'No especificado'}</p>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-icon">🎂</span>
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

          {/* Sección de Contacto y QR */}
          <div className="contact-qr-section">
            <div className="contact-section">
              <h3>INFORMACIÓN DE CONTACTO</h3>
              <div className="contact-info">
                <div className="contact-item">
                  <span className="contact-icon">📞</span>
                  <strong>{pet.phone}</strong>
                </div>
                {pet.email && (
                  <div className="contact-item">
                    <span className="contact-icon">✉️</span>
                    <strong>{pet.email}</strong>
                  </div>
                )}
              </div>
            </div>
            
          </div>

          {/* Pie de Página con Marca */}
          <div className="poster-footer">
            <p className="footer-text">Póster generado con <strong>EncuentraME</strong> - Collares QR para mascotas</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LostPoster;
