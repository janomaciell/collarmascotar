import React, { useState } from 'react';
import './Compra.css';
import { FaTag, FaDog, FaCrown, FaCheck, FaWhatsapp, FaArrowRight } from 'react-icons/fa';

const Compra = () => {
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cityOrZone, setCityOrZone] = useState('');

  const purchaseOptions = [
    {
      id: 'chapita',
      name: 'Chapita QR',
      price: 30000,
      oldPrice: 35000,
      available: true,
      description: 'Placa resistente con código QR único',
      icon: FaTag
    },
    {
      id: 'collar-simple',
      name: 'Collar Básico',
      price: 25000,
      oldPrice: 30000,
      available: false,
      description: 'Collar + chapita QR incluida',
      icon: FaDog
    },
    {
      id: 'collar-premium',
      name: 'Collar Premium',
      price: 25000,
      oldPrice: 30000,
      available: false,
      description: 'Collar reforzado + chapita personalizada',
      icon: FaCrown
    },
  ];

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setUserPhone(value);
    }
  };

  const validatePhone = () => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(userPhone);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedOption || !validatePhone()) {
      setError('Por favor elegí un producto y completá tu WhatsApp.');
      return;
    }
    setError('');

    const option = purchaseOptions.find((opt) => opt.id === selectedOption);
    const parts = [
      `¡Hola! Quiero comprar ${quantity > 1 ? quantity + ' ' : ''}*${option.name}*`,
      `Mi WhatsApp: +54 9 ${userPhone}`,
      cityOrZone.trim() ? `Zona/ciudad: ${cityOrZone.trim()}` : '',
      additionalInfo.trim() ? `Detalles: ${additionalInfo.trim()}` : '',
      '¡Espero tu respuesta para coordinar!'
    ].filter(Boolean);

    const message = encodeURIComponent(parts.join('\n'));

    const BUSINESS_WHATSAPP = '5492267405599';
    const whatsappUrl = `https://wa.me/${BUSINESS_WHATSAPP}?text=${message}`;
    const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    if (newWindow) newWindow.opener = null;

    setSuccessMessage('¡Redirigiéndote a WhatsApp para coordinar tu pedido!');
    setTimeout(() => {
      setSelectedOption(null);
      setUserPhone('');
      setAdditionalInfo('');
      setCityOrZone('');
      setQuantity(1);
      setSuccessMessage('');
    }, 3000);
  };

  return (
    <div className="compra-wrapper">
      <section className="compra-hero">
        <div className="hero-content">
          <h1 className="hero-title">¡PROTEGE A TU MEJOR AMIGO!</h1>
          <p className="hero-subtitle">Collar QR que salva vidas</p>
          <div className="hero-badge">
            <span>Tecnología simple, resultados inmediatos</span>
          </div>
        </div>
      </section>

      <div className="compra-container">
        <form onSubmit={handleSubmit} className="compra-form">
          {error && (
            <div className="message error-message">
              <span>{error}</span>
            </div>
          )}

          {/* Opciones de producto */}
          <div className="form-section">
            <div className="section-header">
              <h2>Elige tu producto</h2>
              <p>Todas las opciones incluyen código QR único</p>
            </div>

            <div className="products-grid">
              {purchaseOptions.map((option) => (
                <div
                  key={option.id}
                  className={`product-card ${selectedOption === option.id ? 'selected' : ''} ${!option.available ? 'unavailable' : ''}`}
                  onClick={() => option.available && setSelectedOption(option.id)}
                >
                  <div className="product-icon">{React.createElement(option.icon)}</div>
                  <h3>{option.name}</h3>
                  <p className="product-description">{option.description}</p>
                  <div className="product-price">
                    {option.available ? (
                      <>
                        {option.oldPrice && (
                          <span className="old-price">${option.oldPrice.toLocaleString('es-AR')}</span>
                        )}
                        <span className="price-amount">${option.price.toLocaleString('es-AR')}</span>
                        {option.oldPrice && <span className="launch-badge">Lanzamiento</span>}
                      </>
                    ) : (
                      <span className="coming-soon">Próximamente</span>
                    )}
                  </div>
                  {option.available && <div className="selection-indicator"><FaCheck /></div>}
                </div>
              ))}
            </div>
          </div>

          {/* Cantidad */}
          <div className="form-section">
            <div className="section-header">
              <h2>Cantidad</h2>
              <p>¿Cuántas unidades necesitás?</p>
            </div>
            <div className="quantity-row">
              <button
                type="button"
                className="quantity-btn"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Menos"
              >
                −
              </button>
              <span className="quantity-value">{quantity}</span>
              <button
                type="button"
                className="quantity-btn"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Más"
              >
                +
              </button>
            </div>
          </div>

          {/* Zona/ciudad (opcional) */}
          <div className="form-section">
            <div className="section-header">
              <h2>Zona o ciudad</h2>
              <p>(Opcional) Para coordinar envío o entrega</p>
            </div>
            <input
              type="text"
              value={cityOrZone}
              onChange={(e) => setCityOrZone(e.target.value)}
              placeholder="Ej: CABA, La Plata, Córdoba..."
              className="city-input"
            />
          </div>

          {/* WhatsApp */}
          <div className="form-section">
            <div className="section-header">
              <h2>Tu WhatsApp</h2>
              <p>Te contactamos para coordinar la entrega</p>
            </div>

            <div className="phone-input-container">
              <div className="phone-prefix">+54 9</div>
              <input
                type="tel"
                value={userPhone}
                onChange={handlePhoneChange}
                placeholder="1123456789"
                className="phone-input"
                required
              />
            </div>
            <small className="input-help">Sin 15, solo área + número (ej: 1123456789)</small>
          </div>

          {/* Detalles adicionales */}
          <div className="form-section">
            <div className="section-header">
              <h2>Comentarios</h2>
              <p>(Opcional) Cualquier cosa que quieras aclarar</p>
            </div>

            <textarea
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="Ej: entrega urgente, alguna preferencia..."
              className="details-input"
            />
          </div>

          {successMessage && (
            <div className="message success-message">
              <span className="message-icon"><FaCheck /></span>
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            className="submit-btn"
            disabled={!selectedOption || !validatePhone()}
          >
            <span className="btn-icon"><FaWhatsapp /></span>
            <span>Enviar por WhatsApp</span>
            <span className="btn-arrow"><FaArrowRight /></span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Compra;
