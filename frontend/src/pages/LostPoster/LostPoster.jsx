import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPetById, sharePosterSocial } from '../../services/api';
import './LostPoster.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Logo de tu marca personal "CollarMascotaQR"
const logoUrl = 'https://m.media-amazon.com/images/I/61k9q-h2jyL._AC_SX679_.jpg';

const LostPoster = () => {
  const { petId } = useParams();
  const [pet, setPet] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareOptions, setShareOptions] = useState(false);
  const [posterUrl, setPosterUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const posterRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPet = async () => {
      try {
        setIsLoading(true);
        const data = await getPetById(petId);
        setPet(data);
        setTimeout(() => generatePosterImage(), 1000); // Genera imagen al cargar
      } catch (err) {
        setError('No se pudo cargar la mascota: ' + (err.detail || err));
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
      const canvas = await html2canvas(posterRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
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
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      // Centrar la imagen en la página A4
      const yOffset = (pdfHeight - imgHeight) / 2;
      pdf.addImage(posterUrl, 'PNG', 0, yOffset, pdfWidth, imgHeight);
      pdf.save(`mascota_perdida_${pet.name}_CollarMascotaQR.pdf`);
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
      const response = await sharePosterSocial(petId, posterUrl, platform);
      switch (platform) {
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(response.shareUrl)}`);
          break;
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(response.shareUrl)}`);
          break;
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(response.shareUrl)}&text=${encodeURIComponent('¡Ayuda a encontrar esta mascota perdida con CollarMascotaQR!')}`);
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

  const lastSeenDate = pet.last_seen_date ? new Date(pet.last_seen_date).toLocaleString() : new Date().toLocaleString();

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
          <div className="poster-header">
            <img src={logoUrl} alt="CollarMascotaQR Logo" className="logo" />
            <h1>¡MASCOTA PERDIDA!</h1>
          </div>

          <div className="poster-content">
            <div className="poster-image">
              <img
                src={pet.photo || 'https://via.placeholder.com/300?text=Sin+Foto'}
                alt={`Foto de ${pet.name}`}
                onError={(e) => (e.target.src = 'https://via.placeholder.com/300?text=Error+de+Imagen')}
              />
            </div>

            <div className="poster-details">
              <h2>{pet.name}</h2>
              <div className="detail-row">
                <span className="detail-label">Raza:</span>
                <span className="detail-value">{pet.breed || 'No especificada'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Edad:</span>
                <span className="detail-value">{pet.age} años</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Última vez visto:</span>
                <span className="detail-value">{lastSeenDate}</span>
              </div>
              {pet.last_location && (
                <div className="detail-row">
                  <span className="detail-label">Lugar:</span>
                  <span className="detail-value">{pet.last_location}</span>
                </div>
              )}
              <div className="contact-info">
                <h3>Si lo encuentras, por favor contacta:</h3>
                <p className="phone">{pet.phone}</p>
                {pet.email && <p className="email">{pet.email}</p>}
              </div>
            </div>
          </div>

          <div className="poster-qr">
            <img src={pet.qr_code} alt={`QR de ${pet.name}`} />
            <p>Escanea este código QR para más información</p>
          </div>

          <div className="poster-footer">
            <p>¡Ayuda a reunir a {pet.name} con su familia!</p>
            <p className="brand">Powered by CollarMascotaQR</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LostPoster;